import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("x-admin-secret");
  const serverSecret = process.env.HADX_ADMIN_SECRET;

  if (!serverSecret || authHeader !== serverSecret) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: true },
    });
    return NextResponse.json({ orders });
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
