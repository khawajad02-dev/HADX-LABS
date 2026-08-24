import { NextResponse } from "next/server";

import {
  consumeOwnerLoginChallenge,
  createOwnerSession,
  hasOwnerAuthConfiguration,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const challenge = typeof body?.challenge === "string" ? body.challenge.trim() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!hasOwnerAuthConfiguration()) {
      return NextResponse.json(
        { error: "Owner login is not configured on this server yet." },
        { status: 503 },
      );
    }

    if (!challenge || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the six-digit sign-in code." }, { status: 400 });
    }

    const email = consumeOwnerLoginChallenge(challenge, code);
    if (!email) {
      return NextResponse.json(
        { error: "That code is invalid or expired. Request a new code and try again." },
        { status: 401 },
      );
    }

    const session = createOwnerSession(email);
    if (!session) {
      return NextResponse.json(
        { error: "Owner login is not configured on this server yet." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      app_session_id: session,
      user: { email, role: "admin" },
      expiresInSeconds: 30 * 24 * 60 * 60,
    });
  } catch (error) {
    console.error("Owner login code verification failed:", error);
    return NextResponse.json(
      { error: "Could not verify the owner sign-in code." },
      { status: 500 },
    );
  }
}
