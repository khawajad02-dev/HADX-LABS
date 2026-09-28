import type { Metadata } from "next";
import SeoPageShell, { SeoPanel } from "@/components/SeoPageShell";
import InstagramDMButton from "@/components/InstagramDMButton";

export const metadata: Metadata = { title: "Custom Graphic Tees | HADX LABS", description: "Send HADX LABS any custom design, character brief, or reference through Instagram DM and bring it to life on premium garments." };

export default function CustomGraphicsPage() {
  return <SeoPageShell eyebrow="HADX ATELIER / CUSTOM WORK" title="Bring any idea. We build the signal." intro="Send HADX LABS any custom design, character brief, or reference directly through Instagram DM, and we will help bring it to life on premium garments."><SeoPanel title="Send your custom brief"><p>Share the subject, character, mood, color direction, garment preference, or visual reference. Whether it is an original concept, a gaming icon, a cinematic idea, or a completely custom design, clear references help us understand the intended result.</p></SeoPanel><SeoPanel title="Start the conversation"><p>Custom prints are discussed and confirmed directly through Instagram before production. After confirmation, we produce the approved design on the premium garment selected for the project.</p><InstagramDMButton label="SEND CUSTOM IDEA" /></SeoPanel></SeoPageShell>;
}
