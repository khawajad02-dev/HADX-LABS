import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side initialization (No API keys exposed to client)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { userId, productId, active } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: "Missing required fields: userId and productId are required." },
        { status: 400 }
      );
    }

    if (active) {
      // Add item to user_vault table
      const { data, error } = await supabase
        .from("user_vault")
        .upsert(
          [{ user_id: userId, product_id: productId, added_at: new Date().toISOString() }],
          { onConflict: "user_id,product_id" }
        );

      if (error) throw error;

      return NextResponse.json({
        success: true,
        status: "saved",
        message: "Item stashed in Vault successfully.",
        data,
      });
    } else {
      // Remove item from user_vault table
      const { data, error } = await supabase
        .from("user_vault")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        status: "removed",
        message: "Item removed from Vault.",
        data,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
