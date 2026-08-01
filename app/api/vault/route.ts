import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lazy initialization to avoid build-time errors when env vars are missing
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials missing");
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(req: Request) {
  try {
    const { userId, productId, active } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: "Missing required fields: userId and productId are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (active) {
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
    console.error("Vault API Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
