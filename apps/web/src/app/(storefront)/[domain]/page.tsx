import type { Metadata } from "next";

interface StorefrontPageProps {
  params: Promise<{ domain: string }>;
}

const FEATURED_PRODUCTS = [
  {
    id: "1",
    slug: "classic-cotton-tshirt",
    name: "Classic Cotton T-Shirt",
    price: 799,
    originalPrice: 1299,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=T-Shirt",
    category: "Clothing",
  },
  {
    id: "2",
    slug: "wireless-bluetooth-earbuds",
    name: "Wireless Bluetooth Earbuds",
    price: 1999,
    originalPrice: 3499,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Earbuds",
    category: "Electronics",
  },
  {
    id: "3",
    slug: "leather-wallet",
    name: "Premium Leather Wallet",
    price: 1499,
    originalPrice: 2499,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Wallet",
    category: "Accessories",
  },
  {
    id: "4",
    slug: "stainless-steel-bottle",
    name: "Stainless Steel Water Bottle",
    price: 599,
    originalPrice: 999,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Bottle",
    category: "Home",
  },
  {
    id: "5",
    slug: "running-shoes",
    name: "Lightweight Running Shoes",
    price: 2999,
    originalPrice: 4999,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Shoes",
    category: "Footwear",
  },
  {
    id: "6",
    slug: "organic-face-cream",
    name: "Organic Face Cream",
    price: 899,
    originalPrice: 1499,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Cream",
    category: "Beauty",
  },
];

const CATEGORIES = [
  { name: "Clothing", count: 42, icon: "👕" },
  { name: "Electronics", count: 28, icon: "🎧" },
  { name: "Accessories", count: 35, icon: "👜" },
  { name: "Home", count: 19, icon: "🏠" },
  { name: "Footwear", count: 23, icon: "👟" },
  { name: "Beauty", count: 31, icon: "✨" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  return {
    title: `${domain} - Home`,
    description: `Welcome to ${domain}. Discover amazing products.`,
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default async function StorefrontPage({
  params,
}: StorefrontPageProps): Promise<React.ReactElement> {
  const { domain } = await params;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Welcome to {domain}
            </h1>
            <p className="mt-6 text-lg text-indigo-100 sm:text-xl">
              Discover our curated collection of premium products. Quality
              you can trust, prices you will love.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={`/${domain}/products`}
                className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
              >
                Shop Now
              </a>
              <a
                href={`/${domain}/products`}
                className="inline-flex items-center rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Browse Categories
              </a>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      </section>

      {/* Categories Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Shop by Category
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => (
            <a
              key={category.name}
              href={`/${domain}/products?category=${encodeURIComponent(category.name)}`}
              className="group flex flex-col items-center rounded-xl border border-gray-200 p-6 text-center hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <span className="text-3xl">{category.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {category.name}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {category.count} products
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Featured Products
          </h2>
          <a
            href={`/${domain}/products`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            View all &rarr;
          </a>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_PRODUCTS.map((product) => (
            <a
              key={product.id}
              href={`/${domain}/products/${product.slug}`}
              className="group overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-indigo-600">
                  {product.category}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {product.name}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    {Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                        100
                    )}
                    % off
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Free shipping on orders above ₹999
          </h2>
          <p className="mt-4 text-gray-300">
            Cash on Delivery available. Easy 7-day returns.
          </p>
          <a
            href={`/${domain}/products`}
            className="mt-8 inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Start Shopping
          </a>
        </div>
      </section>
    </div>
  );
}
