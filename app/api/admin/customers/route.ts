import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim().toLowerCase();
    const where = { orderStatus: { not: "CANCELLED" as const } };
    const [grouped, latestOrders] = await Promise.all([
      prisma.order.groupBy({
        by: ["email", "fullName", "phone"],
        where,
        _count: { _all: true },
        _sum: { totalAmountInCents: true },
        _max: { createdAt: true },
      }),
      prisma.order.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { email: true, phone: true, address: true, city: true, country: true, productTitle: true, size: true },
      }),
    ]);

    const latestByCustomer = new Map<string, (typeof latestOrders)[number]>();
    for (const order of latestOrders) {
      const key = `${order.email}-${order.phone}`;
      if (!latestByCustomer.has(key)) latestByCustomer.set(key, order);
    }

    const items = grouped
      .map((customer) => {
        const latest = latestByCustomer.get(`${customer.email}-${customer.phone}`);
        return {
          id: `${customer.email}-${customer.phone}`,
          name: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          address: latest?.address || null,
          city: latest?.city || null,
          country: latest?.country || null,
          latestProductTitle: latest?.productTitle || null,
          latestSize: latest?.size || null,
          totalOrders: customer._count._all,
          lifetimeValue: (customer._sum.totalAmountInCents || 0) / 100,
          lastOrderDate: customer._max.createdAt,
        };
      })
      .filter((customer) => !query || `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query))
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue);

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error("Customers fetch error:", error);
    return NextResponse.json({ error: "Customer data is temporarily unavailable." }, { status: 500 });
  }
}
