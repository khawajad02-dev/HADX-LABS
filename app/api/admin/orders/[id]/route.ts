import { NextResponse } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const nextStatus = String(body?.orderStatus || "").toUpperCase();
    if (!Object.values(OrderStatus).includes(nextStatus as OrderStatus)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }

    const data: Prisma.OrderUpdateInput = {
      orderStatus: nextStatus as OrderStatus,
      ...(nextStatus === "CONFIRMED" ? { confirmedAt: new Date(), cancelledAt: null } : {}),
      ...(nextStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
    };

    const order = await prisma.order.update({ where: { id: params.id }, data });
    return NextResponse.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Order status could not be updated." }, { status: 500 });
  }
}
