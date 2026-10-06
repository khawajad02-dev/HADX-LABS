import "server-only";

export type NewOrderAlert = {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  currency: string;
  totalAmountInCents: number;
  paymentMethod: string;
  paymentStatus: string;
  items: Array<{
    title: string;
    quantity: number;
    size?: string;
    color?: string;
  }>;
};

function formatOrderMessage(order: NewOrderAlert) {
  const amount = (order.totalAmountInCents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const lines = order.items.map((item) => {
    const options = [item.color, item.size ? `size ${item.size}` : undefined].filter(Boolean).join(", ");
    return `- ${item.title}${options ? ` (${options})` : ""} x${item.quantity}`;
  });
  return [
    `NEW ORDER: ${order.orderNumber}`,
    `Customer: ${order.customerName}`,
    `Email: ${order.email}`,
    `Phone: ${order.phone}`,
    "Items:",
    ...lines,
    `Total: ${order.currency} ${amount}`,
    `Payment: ${order.paymentMethod} / ${order.paymentStatus}`,
  ].join("\n").slice(0, 3900);
}

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) {
    console.error("Telegram new-order alert failed with HTTP status", response.status);
  }
}

async function sendExpoPush(tokens: string[], order: NewOrderAlert) {
  const uniqueTokens = Array.from(new Set(tokens)).filter((token) => token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["));
  if (!uniqueTokens.length) return;

  const payload = uniqueTokens.map((to) => ({
    to,
    title: "New HADX LABS order",
    body: `${order.orderNumber} · ${order.currency} ${(order.totalAmountInCents / 100).toFixed(2)}`,
    sound: "default",
    data: { orderNumber: order.orderNumber, orderId: order.orderNumber },
  }));
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) {
    console.error("Expo push delivery failed with HTTP status", response.status);
  }
}

/**
 * Sends owner notifications independently. Delivery failures never affect the
 * already-committed order or the customer's checkout response.
 */
export async function notifyOwnerNewOrder(order: NewOrderAlert, deviceTokens: string[] = []) {
  const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  const tasks: Promise<unknown>[] = [];
  if (telegramConfigured) tasks.push(sendTelegram(formatOrderMessage(order)));
  if (deviceTokens.length) tasks.push(sendExpoPush(deviceTokens, order));
  if (!tasks.length) return;

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "rejected") {
      const reason = result.reason;
      console.error("Owner order alert delivery failed:", reason instanceof Error ? reason.message : "unknown delivery error");
    }
  }
}
