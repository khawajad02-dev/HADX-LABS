import { NextResponse } from "next/server";

import { validateDrop } from "@/lib/drop";
import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type RouteContext = { params: { id: string } };

function makeSlug(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "drop";
}

function productIdsFrom(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const ids = input.filter((id): id is string => typeof id === "string" && id.trim().length > 0).map((id) => id.trim());
  return ids.filter((id, index) => ids.indexOf(id) === index);
}

export async function PUT(req: Request, { params }: RouteContext) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Access Denied" }, { status: 401 });

  try {
    const body = await req.json();
    const current = await prisma.dropRelease.findUnique({ where: { id: params.id }, include: { products: { select: { id: true } } } });
    if (!current) return NextResponse.json({ error: "Drop not found." }, { status: 404 });

    const title = typeof body?.title === "string" ? body.title.trim() : current.title;
    const startsAt = body?.startsAt === undefined ? current.startsAt : body.startsAt === null ? new Date(Number.NaN) : new Date(body.startsAt);
    const endsAt = body?.endsAt === undefined ? current.endsAt : body.endsAt === null ? new Date(Number.NaN) : new Date(body.endsAt);
    const validationError = validateDrop({ title, startsAt, endsAt });
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const productIds = productIdsFrom(body?.productIds);

    const updated = await prisma.$transaction(async (tx) => {
      if (productIds && productIds.length && (await tx.product.count({ where: { id: { in: productIds } } })) !== productIds.length) {
        throw new Error("PRODUCTS_NOT_FOUND");
      }
      const baseSlug = makeSlug(typeof body?.slug === "string" ? body.slug : current.slug);
      const slug = baseSlug === current.slug ? current.slug : `${baseSlug}-${Date.now().toString(36)}`;
      const drop = await tx.dropRelease.update({
        where: { id: current.id },
        data: {
          title,
          slug,
          tagline: body?.tagline === undefined ? current.tagline : (typeof body.tagline === "string" && body.tagline.trim() ? body.tagline.trim() : null),
          startsAt,
          endsAt,
          isActive: typeof body?.isActive === "boolean" ? body.isActive : current.isActive,
          sellAfterEnd: typeof body?.sellAfterEnd === "boolean" ? body.sellAfterEnd : current.sellAfterEnd,
        },
      });
      if (productIds) {
        await tx.product.updateMany({ where: { dropId: current.id, id: { notIn: productIds } }, data: { dropId: null, dropOrder: 0 } });
        await Promise.all(productIds.map((id, dropOrder) => tx.product.update({ where: { id }, data: { dropId: current.id, dropOrder } })));
      }
      return drop;
    });

    return NextResponse.json({ message: "Drop updated", drop: updated });
  } catch (error: any) {
    if (error?.message === "PRODUCTS_NOT_FOUND") return NextResponse.json({ error: "One or more selected products no longer exist." }, { status: 400 });
    if (error?.code === "P2025") return NextResponse.json({ error: "Drop not found." }, { status: 404 });
    if (error?.code === "P2002") return NextResponse.json({ error: "That drop slug is already in use." }, { status: 409 });
    console.error("Drop update error:", error);
    return NextResponse.json({ error: "Drop could not be updated." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  try {
    await prisma.dropRelease.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Drop deleted" });
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Drop not found." }, { status: 404 });
    console.error("Drop delete error:", error);
    return NextResponse.json({ error: "Drop could not be deleted." }, { status: 500 });
  }
}
