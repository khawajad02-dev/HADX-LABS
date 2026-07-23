import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const expiredOrders = await tx.order.findMany({
        where: {
          orderStatus: "RESERVED",
          expiresAt: { lt: now },
        },
        select: { id: true },
      });

      let purgedHoldsCount = 0;
      let expiredOrdersCount = 0;

      if (expiredOrders.length > 0) {
        const expiredOrderIds = expiredOrders.map((o) => o.id);

        const deletedHolds = await tx.inventoryHold.deleteMany({
          where: {
            orderId: { in: expiredOrderIds },
          },
        });
        purgedHoldsCount = deletedHolds.count;

        const updatedOrders = await tx.order.updateMany({
          where: {
            id: { in: expiredOrderIds },
            orderStatus: "RESERVED",
          },
          data: {
            orderStatus: "EXPIRED",
            paymentStatus: "EXPIRED",
            cancelledAt: now,
          },
        });
        expiredOrdersCount = updatedOrders.count;
      }

      const prunedEvents = await tx.stripeEvent.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
        },
      });

      return {
        purgedHoldsCount,
        expiredOrdersCount,
        prunedStripeEventsCount: prunedEvents.count,
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      metrics: result,
    });
  } catch (error) {
    console.error("Cron Purge Execution Error:", error);
    return NextResponse.json({ error: "Cron execution failed" }, { status: 500 });
  }
}
