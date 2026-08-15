import CatalogGrid from "@/components/CatalogGrid";

export default function CatalogPage() {
  return (
    <main className="relative min-h-screen bg-transparent text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Product Catalog</h1>
      <CatalogGrid products={[]} />
    </main>
  );
}
