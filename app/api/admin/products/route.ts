import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Currency, ProductStatus } from "@prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { error: "Access Denied: Invalid Security Credentials" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, price, imageUrl, category, sku, stockQuantity, status } = body;

    if (!title || price === undefined || !sku) {
      return NextResponse.json(
        { error: "Validation Error: Title, price, and SKU are required." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        sku,
        priceInCents: Math.round(Number(price) * 100),
        currency: "USD" as Currency,
        imageUrl,
        category,
        status: (status === "PUBLISHED" ? "PUBLISHED" : "DRAFT") as ProductStatus,
        stockQuantity: Number(stockQuantity) || 0,
      },
    });

    return NextResponse.json(
      { message: "Product created successfully", product },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { error: "Access Denied" },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
