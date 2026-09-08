import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 100, 1), 200);
  const reviews = await prisma.productReview.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      rating: true,
      body: true,
      approved: true,
      createdAt: true,
      product: { select: { id: true, sku: true, title: true, imageUrl: true } },
    },
  });
  return NextResponse.json({ items: reviews });
}
