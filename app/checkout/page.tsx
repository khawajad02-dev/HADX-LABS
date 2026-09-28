import CheckoutEntry from "@/components/CheckoutEntry";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout | HADX LABS", robots: { index: false, follow: false } };

export default function Checkout() {
  return <CheckoutEntry />;
}
