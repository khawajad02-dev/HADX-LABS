import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviews = await prisma.productReview.findMany({
      where: { productId: params.id, approved: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, rating: true, body: true, createdAt: true },
    });
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json();
    const name = clean(payload.name, 60);
    const body = clean(payload.body, 800);
    const rating = Number(payload.rating);
    if (!name || !body || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Name, review, and a rating from 1 to 5 are required." }, { status: 400 });
    }
    const product = await prisma.product.findFirst({ where: { id: params.id, status: "PUBLISHED" }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const review = await prisma.productReview.create({
      data: { productId: product.id, name, body, rating },
      select: { id: true, name: true, rating: true, body: true, createdAt: true },
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save the review right now." }, { status: 500 });
  }
}
