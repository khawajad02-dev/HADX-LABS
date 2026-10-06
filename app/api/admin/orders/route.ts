import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";
import { OrderStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function restoreLegacyColor(order: any) {
  if (order.productColor || typeof order.productTitle !== "string") return order;
  const match = order.productTitle.match(/\s·\sColor:\s*(.+)$/i);
  if (!match) return order;
  return {
    ...order,
    productTitle: order.productTitle.slice(0, match.index),
    productColor: match[1].trim(),
  };
}

async function hasProductColorColumn() {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ column_exists: boolean }>>(`
      SELECT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'Order' AND column_name = 'productColor') AS column_exists
    `);
    return Boolean(result[0]?.column_exists);
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  try {
    const statusFilter = new URL(req.url).searchParams.get("status")?.toUpperCase() || "";
    const where: Prisma.OrderWhereInput = {};
    if (statusFilter === "ARCHIVED") {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
      if (statusFilter === "HISTORY") {
        where.orderStatus = OrderStatus.DELIVERED;
      } else if (Object.values(OrderStatus).includes(statusFilter as OrderStatus)) {
        where.orderStatus = statusFilter as OrderStatus;
      } else {
        where.orderStatus = { notIn: [OrderStatus.CANCELLED, OrderStatus.EXPIRED, OrderStatus.DELIVERED] };
      }
    }
    const productColorColumn = await hasProductColorColumn();
    const orders: any[] = productColorColumn
      ? await prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: { product: true },
        })
      : await prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderReference: true,
            fullName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            size: true,
            productId: true,
            productSku: true,
            productTitle: true,
            unitPriceInCents: true,
            quantity: true,
            totalAmountInCents: true,
            currency: true,
            paymentMethod: true,
            paymentStatus: true,
            orderStatus: true,
            stripeIntent: true,
            expiresAt: true,
            confirmedAt: true,
            cancelledAt: true,
            archivedAt: true,
            createdAt: true,
            updatedAt: true,
            product: { select: { id: true, title: true, imageUrl: true, sku: true } },
          },
        });
    const items = orders.map(restoreLegacyColor);
    return NextResponse.json({
      items,
      orders: items,
      total: items.length,
      page: 1,
      pageSize: items.length,
      hasMore: false,
      nextCursor: null,
    });
  } catch (error) {
    console.error("Order list error:", error);
    return NextResponse.json({ error: "Unable to load orders" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    const nextStatus = String(body?.orderStatus || "").toUpperCase();
    if (!id || !nextStatus) {
      return NextResponse.json({ error: "id and orderStatus are required" }, { status: 400 });
    }
    if (!Object.values(OrderStatus).includes(nextStatus as OrderStatus)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }
    const order = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: nextStatus as OrderStatus,
        ...(nextStatus === "CONFIRMED" ? { confirmedAt: new Date(), cancelledAt: null } : {}),
        ...(nextStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return PATCH(req);
}

// This endpoint intentionally remains COD-compatible; no payment gateway is invoked here.
export const runtime = "nodejs";
