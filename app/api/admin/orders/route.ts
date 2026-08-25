import { NextResponse } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_PAGE_SIZE = 50;

export async function GET(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedPageSize = Number(url.searchParams.get("pageSize") || 20);
    const pageSize = Number.isFinite(requestedPageSize)
      ? Math.min(Math.max(Math.floor(requestedPageSize), 1), MAX_PAGE_SIZE)
      : 20;
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    const cursor = url.searchParams.get("cursor") || undefined;
    const query = url.searchParams.get("q")?.trim();
    const statusParam = url.searchParams.get("status")?.toUpperCase();

    const where: Prisma.OrderWhereInput = {};
    if (query) {
      where.OR = [
        { orderReference: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { country: { contains: query, mode: "insensitive" } },
        { size: { contains: query, mode: "insensitive" } },
        { productTitle: { contains: query, mode: "insensitive" } },
      ];
    }
    if (statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
      where.orderStatus = statusParam as OrderStatus;
    }

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: pageSize + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          product: {
            select: { id: true, title: true, imageUrl: true, sku: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const hasMore = rows.length > pageSize;
    const items = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Orders are temporarily unavailable." }, { status: 500 });
  }
}
