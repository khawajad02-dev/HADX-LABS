import prisma from "@/lib/prisma";
import Link from "next/link";

// Force dynamic server rendering taaki Hamesha fresh DB data aaye
export const revalidate = 0;

export default async function HomePage() {
  // Admin Dashboard se daale gaye products database se fetch ho rahe hain
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Luxury Navigation Header */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/60 border-b border-white/10 px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-500">
          HADX LABS
        </h1>
        <div className="flex gap-6 text-sm tracking-wider font-light text-neutral-400">
          <Link href="/catalog" className="hover:text-white transition-colors">COLLECTION</Link>
          <Link href="/admin" className="hover:text-white transition-colors">ADMIN</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-8 text-center max-w-4xl mx-auto">
        <span className="text-xs font-mono tracking-[0.3em] uppercase text-neutral-500 block mb-3">
          Architecture Phase // Operational
        </span>
        <h2 className="text-4xl md:text-6xl font-light tracking-tight mb-6 leading-tight">
          ARCHITECTURAL LUXURY <br /> & PRECISION ENGINEERING
        </h2>
      </section>

      {/* Dynamic Products Grid (Connected to Admin / Prisma DB) */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        {products.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-2xl p-16 text-center">
            <p className="text-neutral-500 tracking-wider text-sm font-mono uppercase mb-4">
              [ Database Connected • No Live Inventory ]
            </p>
            <p className="text-neutral-400 text-xs">
              Admin Dashboard (`/admin`) se pehla product post karo, wo yahan live dikhna shuru ho jayega.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="group relative border border-neutral-800 bg-neutral-950/50 p-4 rounded-xl hover:border-neutral-600 transition-all duration-300"
              >
                <div className="aspect-square bg-neutral-900 rounded-lg overflow-hidden mb-4 relative">
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <h3 className="text-lg font-medium tracking-wide mb-1">{product.title}</h3>
                <p className="text-sm font-mono text-neutral-400">${product.price}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
