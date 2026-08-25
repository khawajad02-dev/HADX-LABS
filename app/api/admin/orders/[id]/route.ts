import { NextResponse } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: params.id },
        select: { id: true, orderReference: true, orderStatus: true, productId: true, quantity: true },
      });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.orderStatus !== "CANCELLED" && order.orderStatus !== "EXPIRED") {
        throw new Error("ONLY_CANCELLED_OR_EXPIRED");
      }

      if (order.productId) {
        await tx.product.update({ where: { id: order.productId }, data: { stockQuantity: { increment: order.quantity } } });
      }
      await tx.inventoryHold.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });
      return order;
    });

    return NextResponse.json({ message: "Cancelled test order deleted", orderReference: deleted.orderReference });
  } catch (error: any) {
    if (error?.message === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (error?.message === "ONLY_CANCELLED_OR_EXPIRED") return NextResponse.json({ error: "Only cancelled or expired orders can be deleted." }, { status: 400 });
    console.error("Order delete error:", error);
    return NextResponse.json({ error: "Order could not be deleted." }, { status: 500 });
  }
}

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
