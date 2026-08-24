import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    const [orders, topProducts, topCustomers] = await Promise.all([
      prisma.order.findMany({
        where: { orderStatus: { not: "CANCELLED" } },
        select: { createdAt: true, totalAmountInCents: true },
        orderBy: { createdAt: "asc" },
        take: 2000,
      }),
      prisma.order.groupBy({
        by: ["productTitle"],
        where: { orderStatus: { not: "CANCELLED" } },
        _sum: { quantity: true },
      }),
      prisma.order.groupBy({
        by: ["email", "fullName"],
        where: { orderStatus: { not: "CANCELLED" } },
        _sum: { totalAmountInCents: true },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmountInCents, 0) / 100;
    const averageOrderValue = orders.length ? totalRevenue / orders.length : 0;

    const dailyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const month = order.createdAt.toISOString().slice(0, 7);
      const amount = order.totalAmountInCents / 100;
      dailyMap.set(day, (dailyMap.get(day) || 0) + amount);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + amount);
    }

    return NextResponse.json({
      totalRevenue,
      averageOrderValue,
      conversionRate: null,
      dailyRevenue: Array.from(dailyMap, ([date, amount]) => ({ date, amount })),
      monthlyRevenue: Array.from(monthlyMap, ([month, amount]) => ({ month, amount })),
      topProducts: topProducts
        .map((entry) => ({ name: entry.productTitle, sales: entry._sum.quantity || 0 }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 8),
      topCustomers: topCustomers
        .map((entry) => ({ name: entry.fullName || entry.email, spent: (entry._sum.totalAmountInCents || 0) / 100 }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 8),
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Analytics are temporarily unavailable." }, { status: 500 });
  }
}
