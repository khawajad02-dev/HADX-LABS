import { NextResponse } from "next/server";
export async function POST(req: Request) {
  return NextResponse.json(
    { error: "Vault sync is disabled until authenticated Supabase RLS is enabled." },
    { status: 503 },
  );
}
