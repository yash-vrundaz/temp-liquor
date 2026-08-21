"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCartStore, getCouponDiscount } from "@/store/cart";
import { useBranchStore } from "@/store/branch";
import { getProductById } from "@/data/products";
import { getAllLocations, getPriceForLocation } from "@/data/locations";
import { analyzeCartAvailability } from "@/lib/cart-availability";
import { useInventoryStore } from "@/store/inventory";
import { calculateShipping, calculateTax, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { BranchAvailabilityPanel } from "@/components/cart/BranchAvailabilityPanel";
import { OtherBranchStock } from "@/components/inventory/OtherBranchStock";
import { LocationStockStrip } from "@/components/inventory/LocationStockStrip";

export default function CartPage() {
  const {
    items,
    savedForLater,
    coupon,
    fulfillment,
    setQuantity,
    removeItem,
    saveForLater,
    moveToCart,
    applyCoupon,
    setFulfillment,
    clear,
  } = useCartStore();
  const branchId = useBranchStore((s) => s.branchId);
  const setBranch = useBranchStore((s) => s.setBranch);
  const branch = getAllLocations().find((l) => l.id === branchId) ?? getAllLocations()[0];
  const [code, setCode] = useState(coupon ?? "");
  const [confirmClear, setConfirmClear] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const inventoryRevision = useInventoryStore((s) => s.revision);
  const getOnHand = useInventoryStore((s) => s.getOnHand);

  const availability = analyzeCartAvailability(items, branchId);
  void inventoryRevision;

  const lines = items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      const price = getPriceForLocation(branchId, product.id);
      const stock = getOnHand(branchId, product.id);
      const inStock = stock >= item.quantity;
      return { item, product, price, lineTotal: price * item.quantity, stock, inStock };
    })
    .filter(Boolean) as {
    item: (typeof items)[0];
    product: NonNullable<ReturnType<typeof getProductById>>;
    price: number;
    lineTotal: number;
    stock: number;
    inStock: boolean;
  }[];

  const checkoutLines = lines.filter((l) => l.inStock);
  const subtotal = checkoutLines.reduce((n, l) => n + l.lineTotal, 0);
  const discount = getCouponDiscount(coupon, subtotal);
  const shipping = calculateShipping(subtotal - discount, fulfillment);
  const tax = calculateTax(subtotal - discount);
  const total = subtotal - discount + shipping + tax;
  const canCheckout = lines.length > 0 && !availability.hasConflicts;

  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4 sm:py-14 md:px-8 md:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-display text-3xl text-cream sm:text-4xl md:text-5xl">Your Cart</h1>
        {lines.length > 0 ? (
          <Button variant="outline" size="sm" onClick={() => setConfirmClear(true)}>
            Clear cart
          </Button>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-gold">
          Shopping at
        </p>
        <div className="flex flex-wrap gap-2">
          {getAllLocations().map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => setBranch(loc.id)}
              className={`border px-3 py-2 text-sm transition ${
                branchId === loc.id
                  ? "border-(--gold)/50 bg-(--gold)/10 text-cream"
                  : "border-white/10 text-muted hover:border-white/25"
              }`}
            >
              {loc.shortName}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Prices and stock update for {branch.shortName}.
        </p>
      </div>

      <div className="mt-8">
        <BranchAvailabilityPanel />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          {!lines.length && (
            <p className="text-muted">
              Cart is empty.{" "}
              <Link href="/shop" className="text-gold">
                Browse collections
              </Link>
            </p>
          )}
          <ul className="space-y-4">
            {lines.map(({ item, product, price, lineTotal, stock, inStock }) => (
              <li
                key={product.id}
                className={`flex flex-col gap-4 border p-3 sm:flex-row sm:gap-4 sm:p-4 ${
                  inStock ? "border-white/5" : "border-(--danger)/35 bg-[#1a1010]/40"
                }`}
              >
                <div className="flex gap-3 sm:contents">
                <Link
                  href={`/products/${product.slug}`}
                  className="relative h-24 w-16 shrink-0 bg-white/5 sm:h-28 sm:w-20"
                >
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                  />
                </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-display text-lg text-cream wrap-break-word hover:text-gold sm:text-xl"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-muted">{formatPrice(price)}</p>
                    <p
                      className={`mt-1 text-xs ${
                        inStock ? "text-muted" : "text-(--danger)"
                      }`}
                    >
                      {inStock
                        ? `${stock} in stock at ${branch.shortName}`
                        : stock === 0
                          ? `0 at ${branch.shortName}`
                          : `Only ${stock} at ${branch.shortName} (you have ${item.quantity})`}
                    </p>
                    <LocationStockStrip
                      className="mt-2"
                      productId={product.id}
                      needed={item.quantity}
                      compact
                    />
                    {(!inStock || item.quantity >= stock) && (
                      <OtherBranchStock
                        className="mt-2"
                        productId={product.id}
                        branchId={branchId}
                        quantity={item.quantity + (item.quantity >= stock ? 1 : 0)}
                        localStock={stock}
                        compact
                      />
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex items-center border border-white/10">
                        <button
                          className="min-h-10 px-3.5 py-2 text-muted touch-manipulation"
                          onClick={() => setQuantity(product.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-8 px-2 text-center text-sm">{item.quantity}</span>
                        <button
                          className="min-h-10 px-3.5 py-2 text-muted touch-manipulation disabled:opacity-30"
                          onClick={() => setQuantity(product.id, item.quantity + 1)}
                          disabled={item.quantity >= stock}
                          title={
                            item.quantity >= stock
                              ? "This store is at max — switch branch below to add more"
                              : undefined
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="min-h-10 px-2 py-2 text-xs text-muted touch-manipulation hover:text-cream"
                        onClick={() => saveForLater(product.id)}
                      >
                        Save for later
                      </button>
                      <button
                        className="min-h-10 px-2 py-2 text-xs text-muted touch-manipulation hover:text-red-300"
                        onClick={() => removeItem(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 self-start text-gold sm:ml-0">
                    {formatPrice(lineTotal)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {savedForLater.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl text-cream">Saved for later</h2>
              <ul className="mt-4 space-y-3">
                {savedForLater.map((id) => {
                  const p = getProductById(id);
                  if (!p) return null;
                  const savedStock = getOnHand(branchId, id);
                  return (
                    <li
                      key={id}
                      className="flex flex-col gap-3 border border-white/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <Link href={`/products/${p.slug}`} className="text-cream hover:text-gold">
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted">
                          {savedStock} at {branch.shortName}
                        </p>
                        <LocationStockStrip
                          className="mt-2"
                          productId={id}
                          needed={1}
                          compact
                        />
                        {savedStock <= 0 && (
                          <OtherBranchStock
                            className="mt-2"
                            productId={id}
                            branchId={branchId}
                            quantity={1}
                            localStock={savedStock}
                            compact
                          />
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full shrink-0 sm:w-auto"
                        disabled={savedStock <= 0}
                        onClick={() => moveToCart(id)}
                      >
                        {savedStock <= 0 ? "Unavailable" : "Move to cart"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <aside className="glass-gold h-fit p-4 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Summary</p>
          <p className="mt-2 text-xs text-muted">Branch: {branch.shortName}</p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFulfillment("delivery")}
              className={`flex-1 py-2 text-xs uppercase tracking-wider ${
                fulfillment === "delivery"
                  ? "bg-gold text-black"
                  : "border border-white/10 text-muted"
              }`}
            >
              Delivery
            </button>
            <button
              onClick={() => setFulfillment("pickup")}
              className={`flex-1 py-2 text-xs uppercase tracking-wider ${
                fulfillment === "pickup"
                  ? "bg-gold text-black"
                  : "border border-white/10 text-muted"
              }`}
            >
              Pickup
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Coupon code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (couponMessage) setCouponMessage("");
              }}
            />
            <Button
              variant="secondary"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => {
                const ok = applyCoupon(code.trim() || null);
                if (!code.trim()) {
                  setCouponMessage("Coupon cleared.");
                } else if (ok) {
                  setCode(code.trim().toUpperCase());
                  setCouponMessage("Coupon applied.");
                } else {
                  setCouponMessage("That code is not valid. Try SAMS10, GOLD15, or WELCOME20.");
                }
              }}
            >
              Apply
            </Button>
          </div>
          {couponMessage ? (
            <p className={`mt-2 text-[10px] ${couponMessage.includes("not valid") ? "text-red-300" : "text-gold"}`}>
              {couponMessage}
            </p>
          ) : (
            <p className="mt-2 text-[10px] text-muted">Try SAMS10, GOLD15, WELCOME20</p>
          )}
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Discount</dt>
              <dd>−{formatPrice(discount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Tax</dt>
              <dd>{formatPrice(tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-lg">
              <dt className="text-cream">Total</dt>
              <dd className="text-gold">{formatPrice(total)}</dd>
            </div>
          </dl>
          {availability.hasConflicts && (
            <p className="mt-4 text-xs leading-relaxed text-(--danger)">
              Resolve stock conflicts above before checkout — switch store or remove
              unavailable bottles.
            </p>
          )}
          <Link
            href={canCheckout ? "/checkout" : "#"}
            className="mt-6 block"
            onClick={(e) => {
              if (!canCheckout) e.preventDefault();
            }}
            aria-disabled={!canCheckout}
          >
            <Button className="w-full" size="lg" disabled={!canCheckout}>
              Checkout
            </Button>
          </Link>
        </aside>
      </div>

      <Modal
        open={confirmClear}
        title="Clear your cart?"
        subtitle="This removes every bottle from the bag. Saved-for-later items stay."
        onClose={() => setConfirmClear(false)}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setConfirmClear(false)}>
            Keep items
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clear();
              setConfirmClear(false);
            }}
          >
            Clear cart
          </Button>
        </div>
      </Modal>
    </div>
  );
}
