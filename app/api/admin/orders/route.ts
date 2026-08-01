import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
