import type { Metadata } from "next";
import SeoPageShell, { SeoPanel } from "@/components/SeoPageShell";

export const metadata: Metadata = { title: "Size Guide | Signature Drop-Shoulder and Oversized Tees | HADX LABS", description: "Find your HADX LABS fit with guidance for signature drop-shoulder, oversized, and boxy heavyweight graphic tees." };

export default function SizeGuidePage() { return <SeoPageShell eyebrow="FITMENT DATA / SIZE GUIDE" title="Drop-shoulder. Oversized. Intentional." intro="All HADX LABS tees feature a Signature Drop-Shoulder & Oversized Boxy Fit, designed for a relaxed premium streetwear silhouette."><SeoPanel title="Choose your standard fit"><p>For the intended oversized look, order your regular standard size.</p><p>For a more standard, closer fit, order one size down.</p><p>Every piece is designed around the HADX LABS drop-shoulder and oversized boxy fit language, so the silhouette stays relaxed without relying on numeric measurements.</p></SeoPanel><SeoPanel title="Need personal sizing advice?"><p>Unsure about your fit? Send us a DM on Instagram for personal sizing advice before ordering.</p></SeoPanel></SeoPageShell>; }
