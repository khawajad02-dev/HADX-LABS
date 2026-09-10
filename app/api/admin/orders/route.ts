import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

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
  const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'Order'
        AND column_name = 'productColor'
    ) AS exists
  `);
  return Boolean(result[0]?.exists);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("x-admin-secret");
  const serverSecret = process.env.HADX_ADMIN_SECRET;

  if (!serverSecret || authHeader !== serverSecret) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  try {
    const productColorColumn = await hasProductColorColumn();
    const orders: any[] = productColorColumn
      ? await prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          include: { product: true },
        })
      : await prisma.order.findMany({
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
            createdAt: true,
            updatedAt: true,
            product: { select: { id: true, title: true, imageUrl: true, sku: true } },
          },
        });
    return NextResponse.json({ orders: orders.map(restoreLegacyColor) });
  } catch (error) {
    console.error("Order list error:", error);
    return NextResponse.json({ error: "Unable to load orders" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authHeader = req.headers.get("x-admin-secret");
  const serverSecret = process.env.HADX_ADMIN_SECRET;
  if (!serverSecret || authHeader !== serverSecret) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  try {
    const { id, orderStatus } = await req.json();
    if (!id || !orderStatus) {
      return NextResponse.json({ error: "id and orderStatus are required" }, { status: 400 });
    }
    const order = await prisma.order.update({ where: { id }, data: { orderStatus: orderStatus as OrderStatus } });
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
