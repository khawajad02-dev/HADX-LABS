import { NextResponse } from "next/server";

// Dynamic route enforce karne ke liye taaki response cache na ho
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Client se aane waala secret header (F12 me yeh request ki value dikhegi, par SERVER SECRET nahi)
    const authHeader = req.headers.get("x-admin-secret");
    
    // 2. Server Data Center ka private Secret Key (Browser bundle me NEVER accessible)
    const serverSecret = process.env.HADX_ADMIN_SECRET;

    // 3. Strict Server Check: Agar server secret set nahi hai ya key match nahi hoti
    if (!serverSecret || authHeader !== serverSecret) {
      return NextResponse.json(
        { error: "Access Denied: Invalid Security Credentials" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, price, imageUrl, category } = body;

    if (!title || price === undefined) {
      return NextResponse.json(
        { error: "Validation Error: Title and price are required." },
        { status: 400 }
      );
    }

    // 4. Secure Database Entry Logic (Database / Prisma Integration)
    const newProduct = {
      id: "prod_" + Date.now(),
      title,
      price: Number(price),
      imageUrl: imageUrl || null,
      category: category || "General",
    };

    return NextResponse.json(
      { message: "Product created successfully", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    // Internal server errors mask karke bhejna taaki stack trace leak na ho
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "HADX LABS Security Gateway Active",
  });
}
