import type { Metadata } from "next";
import SeoPageShell, { SeoPanel } from "@/components/SeoPageShell";

export const metadata: Metadata = { title: "About HADX LABS | Pop Culture Streetwear Atelier", description: "HADX LABS designs and prints heavyweight tees across Marvel, DC, Anime, GTA, Tekken, movies, gaming, cinematic universes, and custom artwork." };

export default function AboutPage() {
  return <SeoPageShell eyebrow="THE ATELIER / ABOUT HADX LABS" title="Every universe. One signal." intro="HADX LABS designs and prints heavyweight tees across Pop Culture, Gaming, and Cinematic universes—including Marvel, DC, Anime, GTA, Tekken, movies, and custom artwork." ><SeoPanel title="Built across pop culture"><p>From character-led graphics to cinematic references and gaming icons, every HADX piece starts as a visual idea and becomes a focused production run.</p><p>Explore the current <a className="text-amber-100 underline" href="/catalog">graphic tee collection</a> for sizing, color variants, and availability.</p></SeoPanel><SeoPanel title="What is coming next"><p>Hoodies, printed trousers, and coordinated streetwear sets are launching soon as HADX expands the atelier beyond heavyweight tees.</p><p>Our standard remains clear product information, secure checkout, regional pricing, and a direct connection to the people behind each release.</p></SeoPanel></SeoPageShell>;
}
