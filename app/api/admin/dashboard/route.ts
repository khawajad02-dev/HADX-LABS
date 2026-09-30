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
    const [productCount, orderCount, todayOrders] = await Promise.all([
      prisma.product.count(),
      // Keep the live dashboard compatible while the optional DELIVERED enum
      // migration is still propagating across production database instances.
      prisma.order.count({ where: { orderStatus: { notIn: ["CANCELLED", "EXPIRED"] } } }),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfToday }, orderStatus: { not: "CANCELLED" } },
        select: { totalAmountInCents: true, currency: true },
      }),
    ]);
    const revenueByCurrency = todayOrders.reduce<Record<string, number>>((result, order) => {
      result[order.currency] = (result[order.currency] || 0) + order.totalAmountInCents / 100;
      return result;
    }, {});
    const revenueCurrency = revenueByCurrency.PKR ? "PKR" : revenueByCurrency.USD ? "USD" : Object.keys(revenueByCurrency)[0] || "USD";
    return NextResponse.json({
      revenueToday: revenueByCurrency[revenueCurrency] || 0,
      revenueCurrency,
      revenueByCurrency,
      activeUsers: 0,
      serverStatus: "Online",
      databaseHealth: "Connected",
      totalOrders: orderCount,
      totalProducts: productCount,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: "Could not load dashboard metrics" }, { status: 500 });
  }
}
