# Supabase RLS Policies for HADX LABS

## Overview
This document outlines the Row Level Security (RLS) policies required for the HADX LABS production environment. All policies must be applied via the Supabase dashboard or SQL migrations.

---

## 1. Products Table RLS

### Policy: Public Read Access (Active Products Only)
```sql
CREATE POLICY "Public can read active products"
ON products
FOR SELECT
USING (status = 'active');
```

### Policy: Service Role Insert/Update/Delete
```sql
CREATE POLICY "Service role can manage products"
ON products
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
```

---

## 2. Orders Table RLS

### Policy: User Read Own Orders
```sql
CREATE POLICY "Users can read their own orders"
ON orders
FOR SELECT
USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
```

### Policy: Service Role Full Access
```sql
CREATE POLICY "Service role can manage orders"
ON orders
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
```

---

## 3. Order Items Table RLS

### Policy: User Read Own Order Items
```sql
CREATE POLICY "Users can read their own order items"
ON order_items
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE auth.uid()::text = user_id
  )
  OR auth.role() = 'service_role'
);
```

### Policy: Service Role Full Access
```sql
CREATE POLICY "Service role can manage order items"
ON order_items
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
```

---

## 4. Digital Assets Storage Bucket

### Bucket Configuration
- **Name:** `digital-assets`
- **Visibility:** `Private`
- **Authentication:** Required

### Policy: Authenticated Users Can Download Paid Orders
```sql
CREATE POLICY "Users can download paid assets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'digital-assets'
  AND (
    storage.foldername(name)[1] = auth.uid()::text
    OR auth.role() = 'service_role'
  )
);
```

### Policy: Service Role Upload/Delete
```sql
CREATE POLICY "Service role can manage assets"
ON storage.objects
FOR ALL
USING (bucket_id = 'digital-assets' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'digital-assets' AND auth.role() = 'service_role');
```

---

## 5. Signed URL Generation for Downloads

### Implementation in Next.js API Route
```typescript
// app/api/download/[orderId]/route.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
  const { orderId } = params;

  // Verify order is paid
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.paymentStatus !== 'COMPLETED') {
    return new Response('Unauthorized', { status: 403 });
  }

  // Generate signed URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from('digital-assets')
    .createSignedUrl(`${order.productSku}/asset.zip`, 3600);

  if (error) {
    return new Response('Download unavailable', { status: 500 });
  }

  return new Response(JSON.stringify({ downloadUrl: data.signedUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## Verification Checklist

- [ ] All RLS policies are enabled on the Supabase database
- [ ] Products table allows public SELECT for active items only
- [ ] Orders table restricts read/write to authenticated users and service role
- [ ] Digital assets bucket is private with signed URL access only
- [ ] Service role key is stored securely in environment variables
- [ ] Signed URLs expire after 1 hour
- [ ] Download endpoint validates order payment status before issuing signed URL
