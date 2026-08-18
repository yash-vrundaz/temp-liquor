"use client";

import { useState } from "react";
import { getCategories } from "@/data/categories";
import { getAllLocations } from "@/data/locations";
import type { CategorySlug, Product } from "@/types";
import { useCatalogStore, type NewBottleInput } from "@/store/catalog";
import { Button } from "@/components/ui/Button";
import { CoverImageUpload, GalleryImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";

type FormState = {
  name: string;
  brand: string;
  category: CategorySlug;
  price: string;
  compareAtPrice: string;
  abv: string;
  volumeMl: string;
  origin: string;
  country: string;
  description: string;
  brandStory: string;
  imageUrl: string;
  images: string[];
  tastingNotes: string;
  foodPairings: string;
  isPremium: boolean;
  isImported: boolean;
  initialStock: string;
};

const emptyForm = (): FormState => ({
  name: "",
  brand: "",
  category: "whiskey",
  price: "35",
  compareAtPrice: "",
  abv: "40",
  volumeMl: "750",
  origin: "",
  country: "USA",
  description: "",
  brandStory: "",
  imageUrl: "",
  images: [],
  tastingNotes: "",
  foodPairings: "",
  isPremium: false,
  isImported: false,
  initialStock: "12",
});

function fromProduct(product: Product): FormState {
  return {
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
    abv: String(product.abv),
    volumeMl: String(product.volumeMl),
    origin: product.origin,
    country: product.country,
    description: product.description,
    brandStory: product.brandStory,
    imageUrl: product.images[0] ?? "",
    images: product.images.slice(1),
    tastingNotes: product.tastingNotes.join(", "),
    foodPairings: product.foodPairings.join(", "),
    isPremium: product.isPremium,
    isImported: product.isImported,
    initialStock: "0",
  };
}

type Props = {
  product?: Product;
  onSaved?: (productId: string) => void;
  defaultLocationId?: string;
  onClose?: () => void;
};

export function BottleForm({ product, onSaved, defaultLocationId, onClose }: Props) {
  const addBottle = useCatalogStore((s) => s.addBottle);
  const updateBottle = useCatalogStore((s) => s.updateBottle);
  const editing = Boolean(product);
  const [form, setForm] = useState<FormState>(() => (product ? fromProduct(product) : emptyForm()));
  const [stockScope, setStockScope] = useState<"all" | "one">(defaultLocationId ? "one" : "all");
  const [stockLocationId, setStockLocationId] = useState(
    defaultLocationId ?? getAllLocations()[0]?.id ?? "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((current) => ({ ...current, [key]: value }));

  const payload = (): NewBottleInput => {
    const compare = Number(form.compareAtPrice);
    return {
      name: form.name,
      brand: form.brand,
      category: form.category,
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice.trim() && compare > 0 ? compare : null,
      abv: Number(form.abv) || 0,
      volumeMl: Number(form.volumeMl) || 0,
      origin: form.origin,
      country: form.country,
      description: form.description,
      brandStory: form.brandStory,
      imageUrl: form.imageUrl,
      images: form.images,
      tastingNotes: form.tastingNotes,
      foodPairings: form.foodPairings,
      isPremium: form.isPremium,
      isImported: form.isImported,
      initialStock: Number(form.initialStock) || 0,
      stockLocationIds:
        !editing && stockScope === "one" && stockLocationId ? [stockLocationId] : undefined,
    };
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = payload();
      const result = product
        ? await updateBottle(product.id, body)
        : await addBottle(body);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSaved?.(result.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <CoverImageUpload
        className="sm:col-span-2"
        label="Bottle photo"
        hint="Shown on the shop, product page, and inventory. JPG or PNG."
        fit="contain"
        value={form.imageUrl}
        onChange={set("imageUrl")}
      />
      <GalleryImageUpload
        className="sm:col-span-2"
        label="Extra photos"
        hint="Optional gallery for the product page. Up to 6."
        value={form.images}
        onChange={set("images")}
        max={6}
      />
      <label className="block text-xs text-muted sm:col-span-2">
        Bottle name
        <Input
          className="mt-1"
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          placeholder="e.g. Highland Reserve 12"
          required
        />
      </label>
      <label className="block text-xs text-muted">
        Brand
        <Input
          className="mt-1"
          value={form.brand}
          onChange={(e) => set("brand")(e.target.value)}
          placeholder="e.g. Macallan"
          required
        />
      </label>
      <label className="block text-xs text-muted">
        Category
        <select
          className="mt-1 w-full rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-3 text-sm text-cream scheme-dark [&_option]:bg-(--bg-elevated)"
          value={form.category}
          onChange={(e) => set("category")(e.target.value as CategorySlug)}
        >
          {getCategories().map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted">
        Price (USD)
        <Input
          className="mt-1"
          type="number"
          min={1}
          step={0.01}
          value={form.price}
          onChange={(e) => set("price")(e.target.value)}
          required
        />
      </label>
      <label className="block text-xs text-muted">
        Compare-at price
        <Input
          className="mt-1"
          type="number"
          min={0}
          step={0.01}
          value={form.compareAtPrice}
          onChange={(e) => set("compareAtPrice")(e.target.value)}
          placeholder="Optional"
        />
      </label>
      <label className="block text-xs text-muted">
        ABV %
        <Input
          className="mt-1"
          type="number"
          min={0.1}
          max={80}
          step={0.1}
          value={form.abv}
          onChange={(e) => set("abv")(e.target.value)}
        />
      </label>
      <label className="block text-xs text-muted">
        Volume (ml)
        <Input
          className="mt-1"
          type="number"
          min={50}
          step={50}
          value={form.volumeMl}
          onChange={(e) => set("volumeMl")(e.target.value)}
        />
      </label>
      <label className="block text-xs text-muted">
        Origin
        <Input
          className="mt-1"
          value={form.origin}
          onChange={(e) => set("origin")(e.target.value)}
          placeholder="e.g. Speyside, Scotland"
        />
      </label>
      <label className="block text-xs text-muted">
        Country
        <Input
          className="mt-1"
          value={form.country}
          onChange={(e) => set("country")(e.target.value)}
        />
      </label>
      <label className="block text-xs text-muted sm:col-span-2">
        Description
        <textarea
          className="mt-1 min-h-[88px] w-full rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-2 text-sm text-cream outline-none"
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="Short tasting description for the product page"
        />
      </label>
      <label className="block text-xs text-muted sm:col-span-2">
        Brand story
        <textarea
          className="mt-1 min-h-[72px] w-full rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-2 text-sm text-cream outline-none"
          value={form.brandStory}
          onChange={(e) => set("brandStory")(e.target.value)}
          placeholder="Optional background for the product page"
        />
      </label>
      <label className="block text-xs text-muted sm:col-span-2">
        Tasting notes (comma-separated)
        <Input
          className="mt-1"
          value={form.tastingNotes}
          onChange={(e) => set("tastingNotes")(e.target.value)}
          placeholder="Vanilla, Oak, Honey"
        />
      </label>
      <label className="block text-xs text-muted sm:col-span-2">
        Food pairings (comma-separated)
        <Input
          className="mt-1"
          value={form.foodPairings}
          onChange={(e) => set("foodPairings")(e.target.value)}
          placeholder="BBQ ribs, Dark chocolate"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={form.isPremium}
          onChange={(e) => set("isPremium")(e.target.checked)}
        />
        Premium
      </label>
      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={form.isImported}
          onChange={(e) => set("isImported")(e.target.checked)}
        />
        Imported
      </label>
      {!editing ? (
        <>
          <label className="block text-xs text-muted sm:col-span-2">
            Initial stock count
            <Input
              className="mt-1"
              type="number"
              min={0}
              value={form.initialStock}
              onChange={(e) => set("initialStock")(e.target.value)}
            />
          </label>
          <div className="space-y-2 text-xs text-muted sm:col-span-2">
            <p>Seed stock at</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStockScope("all")}
                className={`border px-3 py-2 uppercase tracking-[0.12em] ${
                  stockScope === "all"
                    ? "border-(--gold)/50 bg-(--gold)/10 text-cream"
                    : "border-white/10 text-muted hover:text-cream"
                }`}
              >
                All stores
              </button>
              <button
                type="button"
                onClick={() => setStockScope("one")}
                className={`border px-3 py-2 uppercase tracking-[0.12em] ${
                  stockScope === "one"
                    ? "border-(--gold)/50 bg-(--gold)/10 text-cream"
                    : "border-white/10 text-muted hover:text-cream"
                }`}
              >
                One store
              </button>
            </div>
            {stockScope === "one" ? (
              <select
                className="mt-1 w-full rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-3 text-sm text-cream scheme-dark [&_option]:bg-(--bg-elevated)"
                value={stockLocationId}
                onChange={(e) => setStockLocationId(e.target.value)}
              >
                {getAllLocations().map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </>
      ) : null}
      {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
      <div className="modal-actions border-t border-white/10 pt-4 sm:col-span-2">
        <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save bottle" : "Add bottle"}
        </Button>
      </div>
    </form>
  );
}

/** @deprecated Use BottleForm in a modal. Kept so older imports still type-check. */
export function AddBottleForm(props: Props & { alwaysOpen?: boolean; onCreated?: (id: string) => void }) {
  return (
    <BottleForm
      product={props.product}
      defaultLocationId={props.defaultLocationId}
      onSaved={props.onSaved ?? props.onCreated}
      onClose={props.onClose}
    />
  );
}
