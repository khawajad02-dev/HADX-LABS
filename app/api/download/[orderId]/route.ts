import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    // Verify order exists and is paid
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentStatus !== "COMPLETED") {
      return NextResponse.json(
        { error: "Order has not been paid" },
        { status: 403 }
      );
    }

    // In production, generate a signed URL from Supabase storage
    // For now, return a placeholder response
    const downloadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/digital-assets/${order.product.sku}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresIn: 3600, // 1 hour
    });
  } catch (error: any) {
    console.error("Download endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
