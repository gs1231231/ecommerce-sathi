import type { Metadata } from "next";

interface ProductsPageProps {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}

const ALL_PRODUCTS = [
  {
    id: "1",
    slug: "classic-cotton-tshirt",
    name: "Classic Cotton T-Shirt",
    price: 799,
    originalPrice: 1299,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=T-Shirt",
    category: "Clothing",
    rating: 4.5,
    reviews: 128,
  },
  {
    id: "2",
    slug: "wireless-bluetooth-earbuds",
    name: "Wireless Bluetooth Earbuds",
    price: 1999,
    originalPrice: 3499,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Earbuds",
    category: "Electronics",
    rating: 4.2,
    reviews: 89,
  },
  {
    id: "3",
    slug: "leather-wallet",
    name: "Premium Leather Wallet",
    price: 1499,
    originalPrice: 2499,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Wallet",
    category: "Accessories",
    rating: 4.7,
    reviews: 203,
  },
  {
    id: "4",
    slug: "stainless-steel-bottle",
    name: "Stainless Steel Water Bottle",
    price: 599,
    originalPrice: 999,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Bottle",
    category: "Home",
    rating: 4.3,
    reviews: 67,
  },
  {
    id: "5",
    slug: "running-shoes",
    name: "Lightweight Running Shoes",
    price: 2999,
    originalPrice: 4999,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Shoes",
    category: "Footwear",
    rating: 4.6,
    reviews: 312,
  },
  {
    id: "6",
    slug: "organic-face-cream",
    name: "Organic Face Cream",
    price: 899,
    originalPrice: 1499,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Cream",
    category: "Beauty",
    rating: 4.4,
    reviews: 156,
  },
  {
    id: "7",
    slug: "denim-jacket",
    name: "Classic Denim Jacket",
    price: 2499,
    originalPrice: 3999,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Jacket",
    category: "Clothing",
    rating: 4.1,
    reviews: 74,
  },
  {
    id: "8",
    slug: "smart-watch",
    name: "Smart Fitness Watch",
    price: 3999,
    originalPrice: 6999,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Watch",
    category: "Electronics",
    rating: 4.5,
    reviews: 198,
  },
  {
    id: "9",
    slug: "canvas-backpack",
    name: "Canvas Travel Backpack",
    price: 1799,
    originalPrice: 2999,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Backpack",
    category: "Accessories",
    rating: 4.3,
    reviews: 112,
  },
  {
    id: "10",
    slug: "ceramic-mug-set",
    name: "Ceramic Mug Set (4 pcs)",
    price: 999,
    originalPrice: 1599,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Mugs",
    category: "Home",
    rating: 4.6,
    reviews: 87,
  },
  {
    id: "11",
    slug: "yoga-mat",
    name: "Non-Slip Yoga Mat",
    price: 1299,
    originalPrice: 1999,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Yoga+Mat",
    category: "Footwear",
    rating: 4.8,
    reviews: 245,
  },
  {
    id: "12",
    slug: "hair-serum",
    name: "Argan Oil Hair Serum",
    price: 699,
    originalPrice: 1199,
    image: "https://placehold.co/400x400/e2e8f0/475569?text=Serum",
    category: "Beauty",
    rating: 4.2,
    reviews: 93,
  },
];

const CATEGORIES = [
  "All",
  "Clothing",
  "Electronics",
  "Accessories",
  "Home",
  "Footwear",
  "Beauty",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  return {
    title: `Products - ${domain}`,
    description: `Browse all products at ${domain}.`,
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps): Promise<React.ReactElement> {
  const { domain } = await params;
  const { category, q } = await searchParams;

  let filtered = ALL_PRODUCTS;
  if (category && category !== "All") {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {category && category !== "All" ? category : "All Products"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Search Bar */}
        <form
          action={`/${domain}/products`}
          method="GET"
          className="flex w-full max-w-md"
        >
          {category && category !== "All" && (
            <input type="hidden" name="category" value={category} />
          )}
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search products..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>
        </form>
      </div>

      {/* Category Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = cat === "All" ? !category || category === "All" : category === cat;
          return (
            <a
              key={cat}
              href={
                cat === "All"
                  ? `/${domain}/products${q ? `?q=${encodeURIComponent(q)}` : ""}`
                  : `/${domain}/products?category=${encodeURIComponent(cat)}${q ? `&q=${encodeURIComponent(q)}` : ""}`
              }
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </a>
          );
        })}
      </div>

      {/* Product Grid */}
      {filtered.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <a
              key={product.id}
              href={`/${domain}/products/${product.slug}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-shadow"
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
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-sm text-yellow-500">
                    {renderStars(product.rating)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({product.reviews})
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                </div>
                <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )}
                  % off
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            className="mx-auto h-16 w-16 text-gray-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No products found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search or filter to find what you are looking for.
          </p>
          <a
            href={`/${domain}/products`}
            className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Clear filters
          </a>
        </div>
      )}
    </div>
  );
}
