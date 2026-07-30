import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { userId, items, shippingAddress, totalAmount } = await req.json();

    if (!items || items.length === 0 || !totalAmount) {
      return NextResponse.json(
        { error: "Invalid order payload. Items and totalAmount are required." },
        { status: 400 }
      );
    }

    // 1. Order record insert in orders table
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId || null,
          items,
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Stock inventory decrement logic
    for (const item of items) {
      if (item.id && item.quantity) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.id)
          .single();

        if (product) {
          const updatedStock = Math.max(0, product.stock - item.quantity);
          await supabase
            .from("products")
            .update({ stock: updatedStock })
            .eq("id", item.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order placed successfully.",
      orderId: order.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process checkout." },
      { status: 500 }
    );
  }
}
