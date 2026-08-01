import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Currency } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-admin-secret");
    const serverSecret = process.env.HADX_ADMIN_SECRET;

    if (!serverSecret || authHeader !== serverSecret) {
      return NextResponse.json(
        { error: "Access Denied: Invalid Security Credentials" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, price, imageUrl, category, sku, stockQuantity } = body;

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
        currency: Currency.USD,
        imageUrl,
        category,
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
    const authHeader = req.headers.get("x-admin-secret");
    const serverSecret = process.env.HADX_ADMIN_SECRET;

    if (!serverSecret || authHeader !== serverSecret) {
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
