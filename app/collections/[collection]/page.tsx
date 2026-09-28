import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SeoPageShell, { SeoPanel } from "@/components/SeoPageShell";

const collectionData = {
  marvel: { label: "MARVEL UNIVERSE", title: "Marvel graphics for the next rotation.", description: "Explore HADX LABS heavyweight graphic tees inspired by the energy, characters, and visual language of the Marvel Universe." },
  dc: { label: "DC UNIVERSE", title: "DC signal. HADX silhouette.", description: "Discover HADX LABS graphic streetwear built around the darker, sharper world of DC Universe characters and cinematic culture." },
  anime: { label: "ANIME ARCHIVE", title: "Anime energy, heavyweight form.", description: "Find HADX LABS anime-inspired graphic tees with premium drop-shoulder and oversized fits made for everyday rotation." },
  gaming: { label: "GAMING ARCHIVE", title: "Insert coin. Change the silhouette.", description: "Explore HADX LABS gaming graphics spanning iconic worlds, characters, and the visual culture of gaming." },
} as const;
type CollectionKey = keyof typeof collectionData;
export function generateStaticParams() { return Object.keys(collectionData).map((collection) => ({ collection })); }
export async function generateMetadata({ params }: { params: { collection: string } }): Promise<Metadata> { const data = collectionData[params.collection as CollectionKey]; return data ? { title: `${data.label} | HADX LABS`, description: data.description } : { title: "Collection Not Found | HADX LABS" }; }
export default function CollectionPage({ params }: { params: { collection: string } }) { const data = collectionData[params.collection as CollectionKey]; if (!data) notFound(); return <SeoPageShell eyebrow={`COLLECTIONS / ${data.label}`} title={data.title} intro={data.description}><SeoPanel title="Premium drop-shoulder and oversized fits"><p>HADX LABS designs and prints heavyweight tees across Marvel, DC, Anime, Gaming, and cinematic culture. Hoodies and printed trousers are launching soon.</p><Link href="/catalog" className="liquid-ui mt-3 inline-flex rounded-full px-5 py-3 text-xs font-mono uppercase tracking-[0.2em] text-amber-100">Browse available drops</Link></SeoPanel><SeoPanel title="Looking for a specific character?"><p>If a character or design is not currently available, send the reference image or brief to our <Link href="/custom-graphics" className="text-amber-100 underline">custom graphics channel</Link> and we can discuss a custom premium garment.</p></SeoPanel></SeoPageShell>; }
