import { NextResponse } from "next/server";

import { dropState, validateDrop } from "@/lib/drop";
import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function makeSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "drop";
}

function productIdsFrom(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const ids = input.filter((id): id is string => typeof id === "string" && id.trim().length > 0).map((id) => id.trim());
  return ids.filter((id, index) => ids.indexOf(id) === index);
}

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Access Denied" }, { status: 401 });

  try {
    const drops = await prisma.dropRelease.findMany({
      include: { products: { orderBy: [{ dropOrder: "asc" }, { title: "asc" }], select: { id: true, title: true, sku: true, dropOrder: true } } },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    });
    const items = drops.map((drop) => ({
      ...drop,
      status: drop.isActive ? dropState(drop) : "off",
      productCount: drop.products.length,
    }));
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error("Drop list error:", error);
    return NextResponse.json({ error: "Drops could not be loaded." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Access Denied" }, { status: 401 });

  try {
    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const startsAt = body?.startsAt == null ? new Date(Number.NaN) : new Date(body.startsAt);
    const endsAt = body?.endsAt == null ? new Date(Number.NaN) : new Date(body.endsAt);
    const validationError = validateDrop({ title, startsAt, endsAt });
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const productIds = productIdsFrom(body?.productIds);

    const created = await prisma.$transaction(async (tx) => {
      if (productIds.length && (await tx.product.count({ where: { id: { in: productIds } } })) !== productIds.length) {
        throw new Error("PRODUCTS_NOT_FOUND");
      }
      const baseSlug = makeSlug(typeof body?.slug === "string" ? body.slug : title);
      let slug = baseSlug;
      if (await tx.dropRelease.findUnique({ where: { slug } })) slug = `${baseSlug}-${Date.now().toString(36)}`;
      const drop = await tx.dropRelease.create({
        data: {
          slug,
          title,
          tagline: typeof body?.tagline === "string" && body.tagline.trim() ? body.tagline.trim() : null,
          startsAt,
          endsAt,
          isActive: body?.isActive !== false,
          sellAfterEnd: body?.sellAfterEnd === true,
        },
      });
      await Promise.all(productIds.map((id, dropOrder) => tx.product.update({ where: { id }, data: { dropId: drop.id, dropOrder } })));
      return drop;
    });

    return NextResponse.json({ message: "Drop created", drop: created }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "PRODUCTS_NOT_FOUND") return NextResponse.json({ error: "One or more selected products no longer exist." }, { status: 400 });
    console.error("Drop create error:", error);
    return NextResponse.json({ error: "Drop could not be created." }, { status: 500 });
  }
}
