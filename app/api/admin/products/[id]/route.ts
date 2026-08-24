import { NextResponse } from "next/server";
import { ProductStatus } from "@prisma/client";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: RouteContext) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }
    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json({ error: "Product could not be loaded." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : undefined;
    const price = body?.price === undefined ? undefined : Number(body.price);
    const stockQuantity = body?.stockQuantity === undefined ? undefined : Number(body.stockQuantity);
    if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
      return NextResponse.json({ error: "Price must be a positive number." }, { status: 400 });
    }
    if (stockQuantity !== undefined && (!Number.isFinite(stockQuantity) || stockQuantity < 0)) {
      return NextResponse.json({ error: "Stock must be zero or a positive number." }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(title ? { title } : {}),
        ...(body?.description !== undefined ? { description: String(body.description || "").trim() || null } : {}),
        ...(body?.sku ? { sku: String(body.sku).trim() } : {}),
        ...(price !== undefined ? { priceInCents: Math.round(price * 100) } : {}),
        ...(body?.imageUrl !== undefined ? { imageUrl: String(body.imageUrl || "").trim() || null } : {}),
        ...(body?.category !== undefined ? { category: String(body.category || "").trim() || null } : {}),
        ...(body?.status === ProductStatus.PUBLISHED || body?.status === ProductStatus.DRAFT ? { status: body.status } : {}),
        ...(stockQuantity !== undefined ? { stockQuantity: Math.floor(stockQuantity) } : {}),
      },
    });

    return NextResponse.json({ message: "Product updated successfully", product });
  } catch (error: any) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: error?.code === "P2025" ? "Product not found." : "Product could not be updated." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Product could not be deleted." }, { status: 500 });
  }
}
