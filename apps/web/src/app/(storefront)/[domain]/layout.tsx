import type { Metadata } from "next";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  return {
    title: `${domain} - Powered by eCommerce Sathi`,
    description: `Shop at ${domain}. Powered by eCommerce Sathi.`,
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: StorefrontLayoutProps): Promise<React.ReactElement> {
  const { domain } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a href={`/${domain}`} className="text-xl font-bold tracking-tight">
              {domain}
            </a>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href={`/${domain}`}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Home
              </a>
              <a
                href={`/${domain}/products`}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Products
              </a>
            </nav>

            {/* Cart Icon */}
            <div className="flex items-center gap-4">
              <a
                href={`/${domain}/cart`}
                className="relative inline-flex items-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="Shopping cart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
                  0
                </span>
              </a>

              {/* Mobile menu button */}
              <a
                href={`/${domain}/products`}
                className="md:hidden inline-flex items-center p-2 text-gray-700 hover:text-gray-900"
                aria-label="Menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                {domain}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Quality products, delivered to your doorstep.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                Quick Links
              </h3>
              <ul className="mt-2 space-y-2">
                <li>
                  <a
                    href={`/${domain}`}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href={`/${domain}/products`}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    All Products
                  </a>
                </li>
                <li>
                  <a
                    href={`/${domain}/cart`}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cart
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                Support
              </h3>
              <ul className="mt-2 space-y-2">
                <li>
                  <span className="text-sm text-gray-600">Contact Us</span>
                </li>
                <li>
                  <span className="text-sm text-gray-600">Shipping Policy</span>
                </li>
                <li>
                  <span className="text-sm text-gray-600">Returns &amp; Refunds</span>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                Contact
              </h3>
              <ul className="mt-2 space-y-2">
                <li className="text-sm text-gray-600">support@{domain}</li>
                <li className="text-sm text-gray-600">+91 98765 43210</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8 text-center">
            <p className="text-sm text-gray-500">
              Powered by{" "}
              <span className="font-medium text-indigo-600">eCommerce Sathi</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
