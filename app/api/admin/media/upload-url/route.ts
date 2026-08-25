import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { isAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

function safeFileName(value: unknown) {
  const raw = typeof value === "string" ? value : "upload";
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || "upload";
}

export async function POST(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    // The HADX Supabase project URL is public; keep an env override for future migrations.
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://bzrmiuslxlcghyajgsyu.supabase.co").trim();
    // Accept the earlier dashboard name while the canonical name is adopted.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ROLE_KEY?.trim();
    const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    const storageKey = serviceRoleKey || publicAnonKey;
    const bucket = process.env.SUPABASE_MEDIA_BUCKET?.trim() || "product-media";
    if (!supabaseUrl || !storageKey) {
      return NextResponse.json({ code: "MEDIA_STORAGE_CONFIGURATION", error: "Media storage is not configured on this server." }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const fileName = safeFileName(body?.fileName);
    const contentType = typeof body?.contentType === "string" ? body.contentType.toLowerCase() : "";
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Only supported image and video files can be uploaded." }, { status: 400 });
    }

    const extension = fileName.includes(".") ? fileName.split(".").pop() : contentType.split("/").pop();
    const path = `products/${Date.now()}-${crypto.randomUUID()}.${extension || "bin"}`;
    const supabase = createClient(supabaseUrl, storageKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    if (serviceRoleKey) {
      const bucketOptions = {
        public: true,
        // Supabase projects can enforce a lower global file-size limit. Keep the
        // bucket at the common 50 MB ceiling so bucket creation itself succeeds.
        fileSizeLimit: "50MB",
        allowedMimeTypes: Array.from(ALLOWED_TYPES),
      };
      const { data: existingBucket, error: bucketLookupError } = await supabase.storage.getBucket(bucket);
      if (!existingBucket && bucketLookupError) {
        const { error: bucketCreateError } = await supabase.storage.createBucket(bucket, bucketOptions);
        if (bucketCreateError && !bucketCreateError.message.toLowerCase().includes("already exists")) {
          console.error("Product media bucket error:", bucketCreateError.message);
          return NextResponse.json({ error: "Product media storage is not ready on this server. Try a file under 50 MB." }, { status: 503 });
        }
      } else if (existingBucket) {
        const { error: bucketUpdateError } = await supabase.storage.updateBucket(bucket, bucketOptions);
        if (bucketUpdateError) {
          console.warn("Product media bucket settings could not be updated:", bucketUpdateError.message);
        }
      }
    }

    const storage = supabase.storage.from(bucket);
    const { data, error } = await storage.createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.signedUrl || !data.token) {
      console.error("Signed media upload URL error:", error?.message || "no signed URL returned");
      return NextResponse.json({ error: "Media storage could not create an upload URL." }, { status: 502 });
    }

    const { data: publicData } = storage.getPublicUrl(path);
    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: publicData.publicUrl,
      contentType,
    });
  } catch (error) {
    console.error("Media upload URL error:", error);
    return NextResponse.json({ error: "Media upload is temporarily unavailable." }, { status: 500 });
  }
}
