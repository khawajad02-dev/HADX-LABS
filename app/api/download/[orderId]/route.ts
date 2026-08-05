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

    // Generate signed URL from Supabase storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Storage configuration missing" },
        { status: 500 }
      );
    }

    // Create Supabase client with service role
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Generate signed URL (valid for 60 minutes)
    const { data, error } = await supabase.storage
      .from("digital-assets")
      .createSignedUrl(`${order.productSku}/asset.zip`, 3600);

    if (error) {
      console.error("Signed URL generation failed:", error);
      return NextResponse.json(
        { error: "Download unavailable" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: data.signedUrl,
      expiresIn: 3600,
      fileName: `${order.productTitle}.zip`,
    });
  } catch (error: any) {
    console.error("Download endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
