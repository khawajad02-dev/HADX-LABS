import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [productCount, orderCount, revenue] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmountInCents: true },
        where: {
          createdAt: { gte: startOfToday },
          paymentStatus: "COMPLETED",
        },
      }),
    ]);

    return NextResponse.json({
      revenueToday: Number(((revenue._sum.totalAmountInCents ?? 0) / 100).toFixed(2)),
      activeUsers: 0,
      serverStatus: "Online",
      databaseHealth: "Connected",
      totalOrders: orderCount,
      totalProducts: productCount,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      { error: "Could not load dashboard metrics" },
      { status: 500 },
    );
  }
}
