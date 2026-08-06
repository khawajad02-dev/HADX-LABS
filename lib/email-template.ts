export function getHADXOrderEmailHTML(orderData: {
  orderReference: string;
  fullName: string;
  productTitle: string;
  quantity: number;
  unitPriceInCents: number;
  totalAmountInCents: number;
  orderId: string;
}): string {
  const unitPrice = (orderData.unitPriceInCents / 100).toLocaleString();
  const totalPrice = (orderData.totalAmountInCents / 100).toLocaleString();
  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://hadx-labs.com"}/api/download/${orderData.orderId}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0A0A0A; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; border-bottom: 2px solid #FFD700; }
          .header h1 { font-size: 32px; font-weight: 700; letter-spacing: 2px; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #999; letter-spacing: 1px; }
          .content { padding: 40px 30px; }
          .order-header { margin-bottom: 30px; }
          .order-header h2 { font-size: 18px; margin-bottom: 10px; }
          .order-header p { font-size: 14px; color: #ccc; }
          .order-details { background-color: #0A0A0A; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 3px solid #FFD700; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #333; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #999; font-weight: 600; }
          .detail-value { color: #fff; text-align: right; }
          .items-section { margin-bottom: 30px; }
          .items-section h3 { font-size: 14px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; color: #FFD700; }
          .item { background-color: #0A0A0A; padding: 15px; border-radius: 6px; margin-bottom: 10px; }
          .item-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .item-meta { display: flex; justify-content: space-between; font-size: 12px; color: #999; }
          .total-section { background-color: #0A0A0A; padding: 20px; border-radius: 6px; border-top: 2px solid #FFD700; margin-bottom: 30px; }
          .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; }
          .cta-button { display: inline-block; background-color: #FFD700; color: #000; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 30px; }
          .cta-button:hover { background-color: #FFC700; }
          .footer { background-color: #0A0A0A; padding: 30px; text-align: center; border-top: 1px solid #333; font-size: 12px; color: #666; }
          .footer a { color: #FFD700; text-decoration: none; }
          .footer a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HADX LABS</h1>
            <p>Order Confirmation</p>
          </div>

          <div class="content">
            <div class="order-header">
              <h2>Thank you for your purchase, ${orderData.fullName}!</h2>
              <p>Your order has been confirmed and is ready for download.</p>
            </div>

            <div class="order-details">
              <div class="detail-row">
                <span class="detail-label">Order ID</span>
                <span class="detail-value">${orderData.orderReference}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Date</span>
                <span class="detail-value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value" style="color: #4CAF50;">PAID</span>
              </div>
            </div>

            <div class="items-section">
              <h3>Items Purchased</h3>
              <div class="item">
                <div class="item-title">${orderData.productTitle}</div>
                <div class="item-meta">
                  <span>Quantity: ${orderData.quantity}</span>
                                    <span>PKR ${unitPrice}</span>
                </div>
              </div>
            </div>

            <div class="total-section">
              <div class="total-row">
                <span>Total Amount</span>
                <span>PKR ${totalPrice}</span>
              </div>
            </div>

            <a href="${downloadUrl}" class="cta-button">[CLAIM DROP]</a>

            <p style="font-size: 12px; color: #999; margin-bottom: 20px;">
              The download link above is valid for 60 minutes. If you need another copy, please contact us.
            </p>

            <p style="font-size: 12px; color: #999;">
              Have questions? Reach out to us on <a href="https://www.instagram.com/hadx_labs.io.official?igsh=ODR3MWE3czRjbm9l" style="color: #FFD700;">Instagram DM</a>.
            </p>
          </div>

          <div class="footer">
            <p>&copy; 2024 HADX LABS. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
