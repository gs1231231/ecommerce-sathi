"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  variant: string;
  quantity: number;
  slug: string;
}

const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: "1",
    name: "Classic Cotton T-Shirt",
    price: 799,
    originalPrice: 1299,
    image: "https://placehold.co/120x120/e2e8f0/475569?text=T-Shirt",
    variant: "Size: M, Color: White",
    quantity: 2,
    slug: "classic-cotton-tshirt",
  },
  {
    id: "2",
    name: "Wireless Bluetooth Earbuds",
    price: 1999,
    originalPrice: 3499,
    image: "https://placehold.co/120x120/e2e8f0/475569?text=Earbuds",
    variant: "Color: Black",
    quantity: 1,
    slug: "wireless-bluetooth-earbuds",
  },
  {
    id: "3",
    name: "Premium Leather Wallet",
    price: 1499,
    originalPrice: 2499,
    image: "https://placehold.co/120x120/e2e8f0/475569?text=Wallet",
    variant: "Color: Brown",
    quantity: 1,
    slug: "leather-wallet",
  },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CartPage(): React.ReactElement {
  const params = useParams<{ domain: string }>();
  const domain = params.domain;
  const [items, setItems] = useState<CartItem[]>(INITIAL_CART_ITEMS);

  function updateQuantity(id: string, delta: number): void {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(id: string): void {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalOriginal = items.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0
  );
  const savings = totalOriginal - subtotal;
  const shippingFee = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shippingFee;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Shopping Cart
      </h1>

      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            className="mx-auto h-20 w-20 text-gray-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-medium text-gray-900">
            Your cart is empty
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Looks like you have not added anything to your cart yet.
          </p>
          <a
            href={`/${domain}/products`}
            className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="divide-y divide-gray-200 rounded-xl border border-gray-200">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 sm:p-6">
                  {/* Product Image */}
                  <a
                    href={`/${domain}/products/${item.slug}`}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-32 sm:w-32"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </a>

                  {/* Item Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <a
                            href={`/${domain}/products/${item.slug}`}
                            className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                          >
                            {item.name}
                          </a>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.variant}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18 18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center rounded-lg border border-gray-300">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors rounded-l-lg"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="flex h-8 w-10 items-center justify-center border-x border-gray-300 text-sm font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors rounded-r-lg"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.originalPrice > item.price && (
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice(item.originalPrice * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={`/${domain}/products`}
              className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              &larr; Continue Shopping
            </a>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount</span>
                    <span className="font-medium text-green-600">
                      -{formatPrice(savings)}
                    </span>
                  </div>
                )}
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
                {shippingFee > 0 && (
                  <p className="text-xs text-gray-500">
                    Add {formatPrice(999 - subtotal)} more for free shipping
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-base font-semibold text-gray-900">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <a
                href={`/${domain}/checkout`}
                className="mt-6 block w-full rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none transition-colors"
              >
                Proceed to Checkout
              </a>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
                Secure checkout
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
