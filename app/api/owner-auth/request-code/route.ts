import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";

import {
  createOwnerLoginChallenge,
  hasOwnerAuthConfiguration,
  isAllowedOwnerEmail,
  normalizeOwnerEmail,
} from "@/lib/admin-auth";
import { resend } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = normalizeOwnerEmail(body?.email);

    if (!hasOwnerAuthConfiguration()) {
      return NextResponse.json(
        { error: "Owner login is not configured on this server yet." },
        { status: 503 },
      );
    }

    if (!email || !isAllowedOwnerEmail(email)) {
      return NextResponse.json(
        { error: "This email is not registered as the HADX LABS owner." },
        { status: 403 },
      );
    }

    const code = String(randomInt(100000, 1000000));
    const challenge = createOwnerLoginChallenge(email, code);
    if (!challenge) {
      return NextResponse.json(
        { error: "Owner login is not configured on this server yet." },
        { status: 503 },
      );
    }

    await resend.emails.send({
      from: "orders@hadx-labs.com",
      to: email,
      subject: "Your HADX LABS owner sign-in code",
      html: `
        <div style="background:#050505;color:#fff;font-family:Arial,sans-serif;padding:32px;line-height:1.5">
          <p style="color:#d4af37;font-size:12px;letter-spacing:3px">HADX LABS OWNER ACCESS</p>
          <h1 style="font-size:24px;margin:0 0 16px">Your sign-in code</h1>
          <p>Use this one-time code in the HADX LABS Owner App. It expires in 10 minutes.</p>
          <p style="font-size:34px;font-weight:700;letter-spacing:10px;color:#d4af37;margin:28px 0">${code}</p>
          <p style="color:#a3a3a3;font-size:13px">If you did not request this code, you can ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ challenge, expiresInSeconds: 600 });
  } catch (error) {
    console.error("Owner login code request failed:", error);
    return NextResponse.json(
      { error: "Could not send the owner sign-in code." },
      { status: 500 },
    );
  }
}
