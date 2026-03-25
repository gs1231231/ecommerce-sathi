import type { Metadata } from "next";

interface ProductDetailPageProps {
  params: Promise<{ domain: string; slug: string }>;
}

interface ProductVariant {
  label: string;
  options: string[];
}

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number;
  images: string[];
  category: string;
  description: string;
  rating: number;
  reviews: number;
  variants: ProductVariant[];
  features: string[];
  inStock: boolean;
}

const PRODUCTS: Record<string, Product> = {
  "classic-cotton-tshirt": {
    id: "1",
    slug: "classic-cotton-tshirt",
    name: "Classic Cotton T-Shirt",
    price: 799,
    originalPrice: 1299,
    images: [
      "https://placehold.co/600x600/e2e8f0/475569?text=T-Shirt+Front",
      "https://placehold.co/600x600/e2e8f0/475569?text=T-Shirt+Back",
      "https://placehold.co/600x600/e2e8f0/475569?text=T-Shirt+Detail",
    ],
    category: "Clothing",
    description:
      "A premium quality cotton t-shirt crafted from 100% organic cotton. Soft, breathable, and perfect for everyday wear. Features a relaxed fit and reinforced stitching for durability.",
    rating: 4.5,
    reviews: 128,
    variants: [
      { label: "Size", options: ["S", "M", "L", "XL", "XXL"] },
      { label: "Color", options: ["White", "Black", "Navy", "Grey"] },
    ],
    features: [
      "100% organic cotton",
      "Pre-shrunk fabric",
      "Reinforced stitching",
      "Machine washable",
    ],
    inStock: true,
  },
  "wireless-bluetooth-earbuds": {
    id: "2",
    slug: "wireless-bluetooth-earbuds",
    name: "Wireless Bluetooth Earbuds",
    price: 1999,
    originalPrice: 3499,
    images: [
      "https://placehold.co/600x600/e2e8f0/475569?text=Earbuds+Front",
      "https://placehold.co/600x600/e2e8f0/475569?text=Earbuds+Case",
    ],
    category: "Electronics",
    description:
      "High-quality wireless earbuds with active noise cancellation, 24-hour battery life, and premium sound quality. IPX5 water-resistant for workouts.",
    rating: 4.2,
    reviews: 89,
    variants: [
      { label: "Color", options: ["Black", "White", "Blue"] },
    ],
    features: [
      "Active noise cancellation",
      "24-hour battery life",
      "IPX5 water resistant",
      "Bluetooth 5.3",
    ],
    inStock: true,
  },
  "leather-wallet": {
    id: "3",
    slug: "leather-wallet",
    name: "Premium Leather Wallet",
    price: 1499,
    originalPrice: 2499,
    images: [
      "https://placehold.co/600x600/e2e8f0/475569?text=Wallet+Front",
      "https://placehold.co/600x600/e2e8f0/475569?text=Wallet+Inside",
    ],
    category: "Accessories",
    description:
      "Handcrafted genuine leather wallet with RFID blocking technology. Features multiple card slots, a coin pocket, and a slim bifold design.",
    rating: 4.7,
    reviews: 203,
    variants: [
      { label: "Color", options: ["Brown", "Black", "Tan"] },
    ],
    features: [
      "Genuine leather",
      "RFID blocking",
      "8 card slots",
      "Slim bifold design",
    ],
    inStock: true,
  },
};

function getProduct(slug: string): Product {
  return (
    PRODUCTS[slug] ?? {
      id: "0",
      slug,
      name: slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      price: 999,
      originalPrice: 1499,
      images: [`https://placehold.co/600x600/e2e8f0/475569?text=${encodeURIComponent(slug)}`],
      category: "General",
      description:
        "A high-quality product crafted with care. Check back soon for more details.",
      rating: 4.0,
      reviews: 0,
      variants: [
        { label: "Size", options: ["Standard"] },
      ],
      features: ["Premium quality", "Fast shipping"],
      inStock: true,
    }
  );
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}): Promise<Metadata> {
  const { domain, slug } = await params;
  const product = getProduct(slug);
  return {
    title: `${product.name} - ${domain}`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps): Promise<React.ReactElement> {
  const { domain, slug } = await params;
  const product = getProduct(slug);
  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <a
          href={`/${domain}`}
          className="hover:text-gray-700 transition-colors"
        >
          Home
        </a>
        <span>/</span>
        <a
          href={`/${domain}/products`}
          className="hover:text-gray-700 transition-colors"
        >
          Products
        </a>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Product Section */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden rounded-lg bg-gray-100 border-2 border-transparent hover:border-indigo-500 cursor-pointer transition-colors"
                >
                  <img
                    src={image}
                    alt={`${product.name} - View ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
            {product.category}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg text-yellow-500">
              {renderStars(product.rating)}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {product.rating}
            </span>
            <span className="text-sm text-gray-500">
              ({product.reviews} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            <span className="text-lg text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              {discount}% off
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Inclusive of all taxes</p>

          {/* Variants */}
          {product.variants.map((variant) => (
            <div key={variant.label} className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">
                {variant.label}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {variant.options.map((option, idx) => (
                  <span
                    key={option}
                    className={`inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      idx === 0
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {option}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Add to Cart */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!product.inStock}
            >
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none transition-colors"
            >
              Buy Now
            </button>
          </div>

          {/* Stock Status */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                product.inStock ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600">
              {product.inStock ? "In stock - Ships within 2-3 days" : "Out of stock"}
            </span>
          </div>

          {/* Description */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {product.description}
            </p>
          </div>

          {/* Features */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900">Features</h3>
            <ul className="mt-3 space-y-2">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4 text-green-500 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Info */}
          <div className="mt-8 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-gray-400 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
              Free delivery on orders above ₹999
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-gray-400 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
              7-day easy returns
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-gray-400 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                />
              </svg>
              Cash on Delivery available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
