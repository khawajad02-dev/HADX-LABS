import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, OrderStatus, PaymentStatus } from "@prisma/client";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      productId, 
      fullName, 
      email, 
      phone, 
      address, 
      quantity = 1,
      paymentMethod = "COD" 
    } = body;

    if (!productId || !fullName || !email || !address) {
      return NextResponse.json(
        { error: "Missing required fields: productId, fullName, email, address" },
        { status: 400 }
      );
    }

    // 1. Fetch product to get details and check stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.stockQuantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const totalAmountInCents = product.priceInCents * quantity;
    const orderId = randomUUID();
    const orderReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Use transaction to create order and update stock
    const result = await prisma.$transaction(async (tx) => {
      // Create Order
      const order = await tx.order.create({
        data: {
          id: orderId,
          orderReference,
          fullName,
          email,
          phone: phone || "",
          address,
          productId: product.id,
          productSku: product.sku,
          productTitle: product.title,
          unitPriceInCents: product.priceInCents,
          quantity,
          totalAmountInCents,
          currency: product.currency,
          paymentMethod: paymentMethod as PaymentMethod,
          paymentStatus: PaymentStatus.PENDING_PAYMENT,
          orderStatus: OrderStatus.CONFIRMED, // Auto confirm for now
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
        },
      });

      // Update Stock
      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: {
            decrement: quantity,
          },
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully.",
      orderId: result.id,
      orderReference: result.orderReference,
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process checkout." },
      { status: 500 }
    );
  }
}
