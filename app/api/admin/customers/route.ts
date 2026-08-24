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
    const grouped = await prisma.order.groupBy({
      by: ["email", "fullName", "phone"],
      where: { orderStatus: { not: "CANCELLED" } },
      _count: { _all: true },
      _sum: { totalAmountInCents: true },
      _max: { createdAt: true },
    });

    const items = grouped
      .map((customer) => ({
        id: `${customer.email}-${customer.phone}`,
        name: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        totalOrders: customer._count._all,
        lifetimeValue: (customer._sum.totalAmountInCents || 0) / 100,
        lastOrderDate: customer._max.createdAt,
      }))
      .filter((customer) => !query || `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query))
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue);

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error("Customers fetch error:", error);
    return NextResponse.json({ error: "Customer data is temporarily unavailable." }, { status: 500 });
  }
}
