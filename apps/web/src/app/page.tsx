import Link from "next/link";

const features = [
  {
    icon: "🤖",
    title: "AI Store Builder",
    desc: "Describe your business in one sentence. AI builds your entire store — theme, products, content.",
  },
  {
    icon: "🇮🇳",
    title: "India-Native",
    desc: "UPI, COD with OTP verification, GST invoicing, Delhivery/Shiprocket shipping — all built-in.",
  },
  {
    icon: "💬",
    title: "WhatsApp Commerce",
    desc: "Take orders, send updates, and run campaigns directly on WhatsApp Business API.",
  },
  {
    icon: "📊",
    title: "Smart Analytics",
    desc: "Revenue trends, top products, customer segments, conversion funnels — real-time insights.",
  },
  {
    icon: "🎨",
    title: "Drag & Drop Editor",
    desc: "Visual page builder with 12+ block types. No coding needed. AI can edit blocks for you.",
  },
  {
    icon: "🚀",
    title: "Multi-Channel",
    desc: "Web storefront, WhatsApp, POS, B2B wholesale, marketplace — sell everywhere from one dashboard.",
  },
];

const stats = [
  { value: "32", label: "API Modules" },
  { value: "100+", label: "Endpoints" },
  { value: "14", label: "DB Tables" },
  { value: "8", label: "Languages" },
];

export default function HomePage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <span className="text-xl font-bold text-gray-900">eCommerce Sathi</span>
          </div>
          <div className="hidden items-center gap-8 sm:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a>
            <Link href="/api/docs" className="text-sm font-medium text-gray-600 hover:text-gray-900">API Docs</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Login</Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
            </span>
            Now Live — Start building your store today
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Build your online store
            <br />
            <span className="text-indigo-600">with AI in 60 seconds</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
            India&apos;s smartest eCommerce platform. AI-powered store builder, built-in UPI &amp; COD payments,
            GST compliance, WhatsApp commerce — everything you need to sell online.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:shadow-xl"
            >
              Create Your Store — Free
            </Link>
            <Link
              href="/api/docs"
              className="rounded-xl border border-gray-300 px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View API Docs
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-indigo-600">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Everything you need to sell online in India</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              No plugins, no integrations headache. Every feature is built-in and works out of the box.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                <span className="text-4xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Simple, transparent pricing</h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: "Free", desc: "For trying out", features: ["1 Store", "50 Products", "Basic Analytics", "Email Support"] },
              { name: "Growth", price: "₹999/mo", desc: "For growing businesses", features: ["3 Stores", "Unlimited Products", "WhatsApp Commerce", "Priority Support", "AI Store Builder", "Custom Domain"], popular: true },
              { name: "Pro", price: "₹2,499/mo", desc: "For scaling brands", features: ["Unlimited Stores", "Marketplace Mode", "B2B Wholesale", "API Access", "Dedicated Support", "White Label"] },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.popular
                    ? "border-2 border-indigo-600 bg-white shadow-xl relative"
                    : "border border-gray-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.desc}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to build your store?</h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join thousands of Indian merchants selling online with eCommerce Sathi.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 shadow-lg hover:bg-indigo-50 transition-colors"
          >
            Start Free — No Credit Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <span className="font-semibold text-gray-900">eCommerce Sathi</span>
            </div>
            <p className="text-sm text-gray-500">Build with AI. Ship for India.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
