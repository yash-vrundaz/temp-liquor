"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useCartStore, getCouponDiscount } from "@/store/cart";
import { useBranchStore } from "@/store/branch";
import { useUserStore } from "@/store/user";
import { getPriceForLocation, getAllLocations } from "@/data/locations";
import { getProductById } from "@/data/products";
import { analyzeCartAvailability } from "@/lib/cart-availability";
import { calculateShipping, calculateTax, formatPrice } from "@/lib/utils";
import { useInventoryStore } from "@/store/inventory";
import type { Order } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BranchAvailabilityPanel } from "@/components/cart/BranchAvailabilityPanel";
import { isDbConnected } from "@/lib/runtime-data";
import { apiPlaceOrder } from "@/lib/api-mutations";

const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  address: z.string().optional(),
  card: z.string().min(12).max(19),
});

export default function CheckoutPage() {
  const router = useRouter();
  const { items, coupon, fulfillment, clear, setFulfillment, removeItem } =
    useCartStore();
  const branchId = useBranchStore((s) => s.branchId);
  const setBranch = useBranchStore((s) => s.setBranch);
  const branch = getAllLocations().find((l) => l.id === branchId) ?? getAllLocations()[0];
  const { isLoggedIn, profile, addOrder } = useUserStore();
  const inventoryRevision = useInventoryStore((s) => s.revision);
  const getOnHand = useInventoryStore((s) => s.getOnHand);
  const [guest, setGuest] = useState(true);
  const [email, setEmail] = useState(profile.email);
  const [name, setName] = useState(profile.name);
  const [address, setAddress] = useState(profile.addresses[0]?.line1 ?? "");
  const [card, setCard] = useState("4242424242424242");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availability = analyzeCartAvailability(items, branchId);
  void inventoryRevision;

  const billableItems = items.filter((i) => {
    const stock = getOnHand(branchId, i.productId);
    return stock >= i.quantity;
  });

  const subtotal = billableItems.reduce((n, i) => {
    const p = getProductById(i.productId);
    if (!p) return n;
    return n + getPriceForLocation(branchId, p.id) * i.quantity;
  }, 0);
  const discount = getCouponDiscount(coupon, subtotal);
  const shipping = calculateShipping(subtotal - discount, fulfillment);
  const tax = calculateTax(subtotal - discount);
  const total = subtotal - discount + shipping + tax;

  const placeOrder = async () => {
    const latest = analyzeCartAvailability(
      useCartStore.getState().items,
      useBranchStore.getState().branchId,
    );
    if (latest.hasConflicts) {
      setError(
        "Some bottles are not available at this store. Switch location or remove them to continue.",
      );
      return;
    }
    const parsed = checkoutSchema.safeParse({
      email,
      name,
      address: fulfillment === "delivery" ? address : "pickup",
      card: card.replace(/\s/g, ""),
    });
    if (!parsed.success) {
      setError("Please check email, name, and card details.");
      return;
    }
    if (fulfillment === "delivery" && !address.trim()) {
      setError("Delivery address required.");
      return;
    }
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }
    if (isDbConnected()) {
      setSubmitting(true);
      setError("");
      try {
        const result = await apiPlaceOrder({
          email,
          name,
          userId: isLoggedIn ? profile.id : undefined,
          locationId: branchId,
          fulfillment,
          coupon,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });
        useInventoryStore
          .getState()
          .syncFromServer(result.inventory.stocks, result.inventory.seats);
        addOrder(result.order, { loyaltyPoints: result.loyaltyPoints });
        clear();
        setConfirmed(result.order.id);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not place the order. Check stock and try again.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const orderId = `ORD-${Math.floor(Math.random() * 90000 + 10000)}`;
    const deducted = useInventoryStore.getState().deductOrder(
      branchId,
      items,
      orderId,
    );
    if (!deducted.ok) {
      setError(
        "Stock changed while you were checking out. Update quantities and try again.",
      );
      return;
    }
    const orderItems = items
      .map((i) => {
        const product = getProductById(i.productId);
        if (!product) return null;
        return {
          productId: i.productId,
          quantity: i.quantity,
          price: getPriceForLocation(branchId, product.id),
        };
      })
      .filter(Boolean) as Order["items"];
    const order: Order = {
      id: orderId,
      date: new Date().toISOString().slice(0, 10),
      status: fulfillment === "pickup" ? "ready" : "processing",
      items: orderItems,
      total,
      fulfillment,
      locationId: branchId,
      tracking:
        fulfillment === "delivery"
          ? `1Z${Math.floor(Math.random() * 1e12)
              .toString()
              .padStart(12, "0")}`
          : undefined,
    };
    addOrder(order);
    clear();
    setConfirmed(orderId);
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
          Order confirmed
        </p>
        <h1 className="mt-4 font-display text-4xl text-cream">Thank you</h1>
        <p className="mt-4 text-muted">
          Order <span className="text-gold">{confirmed}</span> is{" "}
          {fulfillment === "pickup" ? "preparing for pickup" : "being packed for delivery"}{" "}
          from {branch.shortName}. Bottle quantities at this branch have been updated.
        </p>
        <Button className="mt-8" onClick={() => router.push("/shop")}>
          Continue shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4 sm:py-14 md:px-8 md:py-16">
      <h1 className="font-display text-3xl text-cream sm:text-4xl">Checkout</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              variant={guest ? "primary" : "secondary"}
              onClick={() => setGuest(true)}
            >
              Guest checkout
            </Button>
            <Link href="/login?next=/checkout" className="w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto"
                variant={!guest ? "primary" : "secondary"}
                type="button"
                onClick={() => setGuest(false)}
              >
                {isLoggedIn ? "Logged in" : "Sign in"}
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-gold">
              Fulfillment
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="w-full sm:w-auto"
                variant={fulfillment === "delivery" ? "primary" : "secondary"}
                onClick={() => setFulfillment("delivery")}
              >
                Delivery
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant={fulfillment === "pickup" ? "primary" : "secondary"}
                onClick={() => setFulfillment("pickup")}
              >
                Pickup
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-gold">
              Branch
            </p>
            <div className="space-y-2">
              {getAllLocations().map((loc) => {
                const cover = analyzeCartAvailability(items, loc.id);
                const ok = !cover.hasConflicts && items.length > 0;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setBranch(loc.id)}
                    className={`block w-full border p-3 text-left text-sm ${
                      branchId === loc.id
                        ? "border-(--gold)/50 bg-(--gold)/10"
                        : "border-white/10"
                    }`}
                  >
                    <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                      <span className="min-w-0 text-cream wrap-break-word">{loc.shortName}</span>
                      {items.length > 0 && (
                        <span
                          className={`shrink-0 text-[10px] uppercase tracking-wider ${
                            ok ? "text-(--success)" : "text-(--danger)"
                          }`}
                        >
                          {ok
                            ? "Full cart OK"
                            : `${cover.unavailable.length} missing`}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      Pickup {loc.pickupAvailable ? "available" : "unavailable"} ·
                      Delivery {loc.deliveryRadiusKm}km
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <BranchAvailabilityPanel compact />

          {fulfillment === "delivery" && (
            <Input
              placeholder="Delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          )}

          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-gold">
              Payment (Stripe demo)
            </p>
            <Input
              placeholder="Card number"
              value={card}
              onChange={(e) => setCard(e.target.value)}
            />
            <p className="mt-2 text-xs text-muted">
              Use test card 4242… — no real charges.
            </p>
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button
            size="lg"
            className="w-full"
            onClick={() => void placeOrder()}
            disabled={!items.length || availability.hasConflicts || submitting}
          >
            {availability.hasConflicts
              ? "Resolve stock to continue"
              : submitting
                ? "Placing order…"
                : `Place order · ${formatPrice(total)}`}
          </Button>
        </div>

        <aside className="glass h-fit space-y-4 p-4 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
            Order · {branch.shortName}
          </p>
          <ul className="space-y-3 text-sm">
            {items.map((i) => {
              const p = getProductById(i.productId);
              if (!p) return null;
              const price = getPriceForLocation(branchId, p.id);
              const stock = getOnHand(branchId, p.id);
              const ok = stock >= i.quantity;
              return (
                <li
                  key={i.productId}
                  className={`flex items-start justify-between gap-3 border-b border-white/5 pb-3 ${
                    ok ? "" : "opacity-80"
                  }`}
                >
                  <div className="min-w-0">
                    <span className={ok ? "text-muted" : "text-(--danger)"}>
                      {p.name} × {i.quantity}
                    </span>
                    {!ok && (
                      <button
                        type="button"
                        className="mt-1 block text-[10px] uppercase tracking-wider text-muted hover:text-red-300"
                        onClick={() => removeItem(i.productId)}
                      >
                        Remove from order
                      </button>
                    )}
                  </div>
                  <span className={ok ? "" : "text-(--danger) line-through"}>
                    {formatPrice(price * i.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="space-y-2 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Discount</span>
              <span>−{formatPrice(discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tax</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Total</span>
              <span className="text-gold">{formatPrice(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
