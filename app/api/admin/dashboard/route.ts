import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [productCount, allOrders, todayOrders] = await Promise.all([
      prisma.product.count(),
      // Do not put optional enum values in SQL. Older production databases may
      // not have the latest OrderStatus migration, so filtering happens below.
      prisma.order.findMany({ select: { orderStatus: true, totalAmountInCents: true, currency: true } }),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { totalAmountInCents: true, currency: true, country: true, orderStatus: true },
      }),
    ]);
    const activeOrders = allOrders.filter((order) => order.orderStatus !== "CANCELLED" && order.orderStatus !== "EXPIRED");
    const sales = { PKR: 0, INR: 0, USD: 0 };
    for (const order of activeOrders) {
      const amount = order.totalAmountInCents / 100;
      if (order.currency === "PKR") sales.PKR += amount;
      else if (order.currency === "INR") sales.INR += amount;
      else sales.USD += amount;
    }
    const todaySales = { PKR: 0, INR: 0, USD: 0 };
    for (const order of todayOrders) {
      if (order.orderStatus === "CANCELLED" || order.orderStatus === "EXPIRED") continue;
      const amount = order.totalAmountInCents / 100;
      if (order.currency === "PKR") todaySales.PKR += amount;
      else if (order.currency === "INR") todaySales.INR += amount;
      else todaySales.USD += amount;
    }
    return NextResponse.json({
      revenueToday: todaySales.PKR || todaySales.INR || todaySales.USD,
      revenueCurrency: todaySales.PKR ? "PKR" : todaySales.INR ? "INR" : "USD",
      revenueByCurrency: sales,
      regionSales: sales,
      activeUsers: 0,
      serverStatus: "Online",
      databaseHealth: "Connected",
      totalOrders: activeOrders.length,
      totalProducts: productCount,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: "Could not load dashboard metrics" }, { status: 500 });
  }
}
