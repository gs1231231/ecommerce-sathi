"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://65.1.110.181/api";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant: string;
}

type PaymentMethod = "upi" | "card" | "cod";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function CheckoutPage(): React.ReactElement {
  const params = useParams<{ domain: string }>();
  const domain = params.domain;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    setCartItems(getCartItems());
  }, []);

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Register guest account
      let authToken: string | null = null;
      try {
        const registerRes = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: crypto.randomUUID(), // temporary guest password
          }),
        });
        if (registerRes.ok) {
          const registerData = await registerRes.json();
          authToken = registerData?.data?.token ?? registerData?.token ?? null;
        }
        // If registration fails (e.g. user already exists), continue without token
      } catch {
        // Silently continue - guest checkout still proceeds
      }

      // Step 2: Create order
      const orderPayload = {
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        paymentMethod,
        domain,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const orderRes = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const errBody = await orderRes.json().catch(() => null);
        throw new Error(
          errBody?.error?.message ?? `Order failed (${orderRes.status})`
        );
      }

      const orderData = await orderRes.json();
      const orderNumber =
        orderData?.data?.orderNumber ??
        orderData?.data?.id ??
        orderData?.orderNumber ??
        orderData?.id ??
        "N/A";

      // Clear cart on success
      localStorage.removeItem("cart");
      setCartItems([]);
      setOrderSuccess(orderNumber);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shippingFee;

  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu & Kashmir", "Ladakh",
  ];

  // Order success screen
  if (orderSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Order Placed Successfully!
        </h1>
        <p className="mt-2 text-gray-600">
          Your order number is{" "}
          <span className="font-semibold text-indigo-600">{orderSuccess}</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          We have sent a confirmation to {formData.email || "your email"}.
        </p>
        <a
          href={`/${domain}`}
          className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <a href={`/${domain}`} className="hover:text-gray-700 transition-colors">
          Home
        </a>
        <span>/</span>
        <a href={`/${domain}/cart`} className="hover:text-gray-700 transition-colors">
          Cart
        </a>
        <span>/</span>
        <span className="text-gray-900">Checkout</span>
      </nav>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Checkout
      </h1>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cartItems.length === 0 && !orderSuccess && (
        <div className="mt-12 text-center">
          <p className="text-gray-500">Your cart is empty.</p>
          <a
            href={`/${domain}`}
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Continue Shopping
          </a>
        </div>
      )}

      {cartItems.length > 0 && (
        <form onSubmit={handleSubmit}>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Address */}
              <section className="rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Shipping Address
                </h2>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="addressLine1"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      id="addressLine1"
                      name="addressLine1"
                      required
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                      placeholder="House/Flat No., Building, Street"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="addressLine2"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      id="addressLine2"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                      placeholder="Landmark, Area (optional)"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700"
                    >
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700"
                    >
                      State *
                    </label>
                    <select
                      id="state"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="pincode"
                      className="block text-sm font-medium text-gray-700"
                    >
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                      placeholder="110001"
                    />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Method
                </h2>

                <div className="mt-6 space-y-3">
                  {/* UPI */}
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                      paymentMethod === "upi"
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === "upi"}
                      onChange={() => setPaymentMethod("upi")}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">UPI</p>
                      <p className="text-xs text-gray-500">
                        Pay using Google Pay, PhonePe, Paytm, or any UPI app
                      </p>
                    </div>
                  </label>

                  {/* Card */}
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                      paymentMethod === "card"
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Credit / Debit Card
                      </p>
                      <p className="text-xs text-gray-500">
                        Visa, Mastercard, RuPay accepted
                      </p>
                    </div>
                  </label>

                  {/* COD */}
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                      paymentMethod === "cod"
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Cash on Delivery
                      </p>
                      <p className="text-xs text-gray-500">
                        Pay when your order is delivered
                      </p>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Summary
                </h2>

                <div className="mt-4 divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.variant} &times; {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">
                      {shippingFee === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatPrice(shippingFee)
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-base font-semibold text-gray-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 block w-full rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Placing Order..." : `Place Order - ${formatPrice(total)}`}
                </button>

                <p className="mt-4 text-center text-xs text-gray-500">
                  By placing this order, you agree to our Terms of Service and
                  Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
