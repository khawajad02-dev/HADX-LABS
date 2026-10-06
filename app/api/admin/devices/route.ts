import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const EXPO_TOKEN = /^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_+=/-]+\]$/;

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!EXPO_TOKEN.test(token)) {
    return NextResponse.json({ error: "A valid Expo push token is required." }, { status: 400 });
  }

  try {
    await prisma.ownerDevice.upsert({
      where: { token },
      create: { token },
      update: {},
      select: { id: true },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Owner device registration failed:", error);
    return NextResponse.json({ error: "Device could not be registered." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!EXPO_TOKEN.test(token)) {
    return NextResponse.json({ error: "A valid Expo push token is required." }, { status: 400 });
  }

  try {
    await prisma.ownerDevice.deleteMany({ where: { token } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Owner device removal failed:", error);
    return NextResponse.json({ error: "Device could not be removed." }, { status: 500 });
  }
}
