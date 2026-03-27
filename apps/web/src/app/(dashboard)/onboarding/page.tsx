'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://65.1.110.181/api";

const CATEGORIES = [
  'Fashion',
  'Electronics',
  'Food',
  'Home',
  'Beauty',
  'Sports',
  'Other',
] as const;

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Colombo',
  'Asia/Kathmandu',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
] as const;

interface StoreDetails {
  description: string;
  category: string;
  currency: string;
  timezone: string;
}

interface ProductForm {
  title: string;
  price: string;
  description: string;
  imageUrl: string;
}

type PaymentMethod = 'razorpay' | 'cod' | 'both';

/* ---------- step components ---------- */

function StepWelcome({ onNext }: { onNext: () => void }): React.ReactElement {
  const [storeName, setStoreName] = useState<string>('');

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-indigo-600">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-gray-900">Welcome to eCommerce Sathi!</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
        Your all-in-one platform to launch, manage, and grow your online store.
        We will walk you through a few quick steps to get everything ready.
      </p>

      <div className="mt-8 w-full max-w-sm">
        <label htmlFor="store-name" className="block text-left text-sm font-medium text-gray-700">
          Store Name
        </label>
        <input
          id="store-name"
          type="text"
          placeholder="e.g. My Awesome Store"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <button
        onClick={onNext}
        className="mt-8 rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
      >
        Let&apos;s set up your store
      </button>
    </div>
  );
}

function StepStoreDetails({
  details,
  onChange,
}: {
  details: StoreDetails;
  onChange: (d: StoreDetails) => void;
}): React.ReactElement {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Store Details</h2>
      <p className="mt-1 text-sm text-gray-500">Tell us a bit about your store.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Store Description
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Describe what your store sells..."
            value={details.description}
            onChange={(e) => onChange({ ...details, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            value={details.category}
            onChange={(e) => onChange({ ...details, category: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <select
              id="currency"
              value={details.currency}
              onChange={(e) => onChange({ ...details, currency: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="INR">INR (Indian Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
              Timezone
            </label>
            <select
              id="timezone"
              value={details.timezone}
              onChange={(e) => onChange({ ...details, timezone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepFirstProduct({
  product,
  onChange,
  onSkip,
  submitting,
}: {
  product: ProductForm;
  onChange: (p: ProductForm) => void;
  onSkip: () => void;
  submitting: boolean;
}): React.ReactElement {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Add Your First Product</h2>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a product to your store.</p>
        </div>
        <button
          onClick={onSkip}
          type="button"
          className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="product-title" className="block text-sm font-medium text-gray-700">
            Product Title
          </label>
          <input
            id="product-title"
            type="text"
            placeholder="e.g. Classic Cotton T-Shirt"
            value={product.title}
            onChange={(e) => onChange({ ...product, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="product-price" className="block text-sm font-medium text-gray-700">
            Price (INR)
          </label>
          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="499"
            value={product.price}
            onChange={(e) => onChange({ ...product, price: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="product-desc" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="product-desc"
            rows={3}
            placeholder="Brief product description..."
            value={product.description}
            onChange={(e) => onChange({ ...product, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label htmlFor="product-image" className="block text-sm font-medium text-gray-700">
            Image URL <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="product-image"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={product.imageUrl}
            onChange={(e) => onChange({ ...product, imageUrl: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {submitting && (
        <p className="mt-4 text-sm text-indigo-600">Creating product...</p>
      )}
    </div>
  );
}

function StepPayment({
  method,
  razorpayKey,
  onMethodChange,
  onKeyChange,
  onSkip,
}: {
  method: PaymentMethod;
  razorpayKey: string;
  onMethodChange: (m: PaymentMethod) => void;
  onKeyChange: (k: string) => void;
  onSkip: () => void;
}): React.ReactElement {
  const options: { value: PaymentMethod; label: string; desc: string }[] = [
    { value: 'razorpay', label: 'Razorpay', desc: 'Accept cards, UPI, wallets & more' },
    { value: 'cod', label: 'Cash on Delivery', desc: 'Collect payment on delivery' },
    { value: 'both', label: 'Both', desc: 'Razorpay online + COD option' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment Setup</h2>
          <p className="mt-1 text-sm text-gray-500">Choose how you want to accept payments.</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-colors ${
              method === opt.value
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="payment-method"
              value={opt.value}
              checked={method === opt.value}
              onChange={() => onMethodChange(opt.value)}
              className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
              <p className="mt-0.5 text-xs text-gray-500">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {(method === 'razorpay' || method === 'both') && (
        <div className="mt-5">
          <label htmlFor="razorpay-key" className="block text-sm font-medium text-gray-700">
            Razorpay Key ID <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="razorpay-key"
            type="text"
            placeholder="rzp_live_..."
            value={razorpayKey}
            onChange={(e) => onKeyChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      )}

      <button
        onClick={onSkip}
        type="button"
        className="mt-5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}

function StepDone(): React.ReactElement {
  const tenantSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') ?? '' : '';

  return (
    <div className="flex flex-col items-center text-center">
      {/* confetti dots - CSS only */}
      <div className="relative h-24 w-full overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => {
          const colors = ['bg-indigo-400', 'bg-pink-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400'];
          const color = colors[i % colors.length];
          const size = 6 + (i % 3) * 4;
          const left = (i * 5.2) % 100;
          const delay = (i * 0.15) % 2;
          const duration = 1.5 + (i % 3) * 0.5;
          return (
            <span
              key={i}
              className={`absolute rounded-full ${color}`}
              style={{
                width: size,
                height: size,
                left: `${left}%`,
                top: -10,
                animation: `confetti-fall ${duration}s ease-in ${delay}s infinite`,
                opacity: 0.8,
              }}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-green-600">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="mt-5 text-2xl font-bold text-gray-900">You&apos;re all set!</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
        Your store is ready to go. Start adding products, customize your storefront,
        and begin selling.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </a>
        {tenantSlug && (
          <a
            href={`/${tenantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Your Store
          </a>
        )}
      </div>
    </div>
  );
}

/* ---------- progress bar ---------- */

function ProgressBar({ step, total }: { step: number; total: number }): React.ReactElement {
  const pct = (step / total) * 100;
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-xs font-medium text-gray-500">
        <span>Step {step} of {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- main wizard ---------- */

export default function OnboardingPage(): React.ReactElement {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // step 2 state
  const [storeDetails, setStoreDetails] = useState<StoreDetails>({
    description: '',
    category: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });

  // step 3 state
  const [product, setProduct] = useState<ProductForm>({
    title: '',
    price: '',
    description: '',
    imageUrl: '',
  });

  // step 4 state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('both');
  const [razorpayKey, setRazorpayKey] = useState<string>('');

  const TOTAL_STEPS = 5;

  function goNext(): void {
    setError('');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack(): void {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleProductSubmit(): Promise<void> {
    if (!product.title.trim() || !product.price.trim()) {
      setError('Product title and price are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const body = {
        title: product.title.trim(),
        price: parseFloat(product.price),
        description: product.description.trim() || undefined,
        imageUrl: product.imageUrl.trim() || undefined,
      };

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? 'Failed to create product');
      }

      goNext();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext(): void {
    if (step === 3) {
      void handleProductSubmit();
      return;
    }
    goNext();
  }

  const showBackButton = step > 1 && step < TOTAL_STEPS;
  const showNextButton = step > 1 && step < TOTAL_STEPS;

  function getNextLabel(): string {
    if (step === 3) return submitting ? 'Creating...' : 'Create Product';
    if (step === 4) return 'Finish';
    return 'Next';
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {step < TOTAL_STEPS && (
          <ProgressBar step={step} total={TOTAL_STEPS} />
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {step === 1 && <StepWelcome onNext={goNext} />}
          {step === 2 && <StepStoreDetails details={storeDetails} onChange={setStoreDetails} />}
          {step === 3 && (
            <StepFirstProduct
              product={product}
              onChange={setProduct}
              onSkip={goNext}
              submitting={submitting}
            />
          )}
          {step === 4 && (
            <StepPayment
              method={paymentMethod}
              razorpayKey={razorpayKey}
              onMethodChange={setPaymentMethod}
              onKeyChange={setRazorpayKey}
              onSkip={goNext}
            />
          )}
          {step === 5 && <StepDone />}

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          {showBackButton && showNextButton && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={goBack}
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={submitting}
                type="button"
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {getNextLabel()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
