"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { getCategories } from "@/data/categories";
import { getAllProducts } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import type { CategorySlug } from "@/types";
import { useBranchStore } from "@/store/branch";
import { useInventoryStore } from "@/store/inventory";
import { useCatalogStore } from "@/store/catalog";

export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const category = params.category as CategorySlug;
  const meta = getCategories().find((c) => c.slug === category);

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [country, setCountry] = useState("all");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minRating, setMinRating] = useState(0);
  const [minAbv, setMinAbv] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const branchId = useBranchStore((s) => s.branchId);
  const getOnHand = useInventoryStore((s) => s.getOnHand);
  const inventoryRevision = useInventoryStore((s) => s.revision);
  const catalogRevision = useCatalogStore((s) => s.revision);

  const base = useMemo(
    () =>
      getAllProducts().filter(
        (p) =>
          p.category === category ||
          (category === "whiskey" && ["scotch", "bourbon"].includes(p.category)),
      ),
    [category, catalogRevision],
  );

  const brands = [...new Set(base.map((p) => p.brand))];
  const countries = [...new Set(base.map((p) => p.country))];

  const filtered = useMemo(() => {
    let list = base.filter((p) => {
      if (search && !`${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (brand !== "all" && p.brand !== brand) return false;
      if (country !== "all" && p.country !== country) return false;
      if (p.price > maxPrice) return false;
      if (p.rating < minRating) return false;
      if (p.abv < minAbv) return false;
      if (inStockOnly && getOnHand(branchId, p.id) <= 0) return false;
      return true;
    });

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "abv") list = [...list].sort((a, b) => b.abv - a.abv);
    return list;
  }, [
    base,
    search,
    brand,
    country,
    maxPrice,
    minRating,
    minAbv,
    sort,
    inStockOnly,
    branchId,
    getOnHand,
    inventoryRevision,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [
    category,
    search,
    brand,
    country,
    maxPrice,
    minRating,
    minAbv,
    sort,
    inStockOnly,
    branchId,
    pageSize,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const from = filtered.length ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, filtered.length);

  if (!meta) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4 sm:py-14 md:px-8 md:py-16">
      <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
        {meta.tagline}
      </p>
      <h1 className="mt-2 font-display text-3xl text-cream sm:text-4xl md:text-6xl">
        {meta.name}
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted sm:text-base">{meta.description}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
        <div>
          <button
            type="button"
            className="mb-3 flex w-full items-center justify-between rounded-sm border border-white/10 px-4 py-3 text-left text-sm text-cream lg:hidden"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <span>Filters & sort</span>
            <span className="text-gold">{filtersOpen ? "Hide" : "Show"}</span>
          </button>
          <aside
            className={`glass h-fit p-4 ${filtersOpen ? "block" : "hidden"} lg:block`}
          >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Input
            className="sm:col-span-2 lg:col-span-1"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter by name"
          />
          <label className="block text-xs text-muted">
            Brand
            <select
              className="mt-1 w-full rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-2 text-sm text-cream scheme-dark [&_option]:bg-(--bg-elevated) [&_option]:text-cream"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option value="all">All</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted">
            Country
            <select
              className="mt-1 w-full rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-2 text-sm text-cream scheme-dark [&_option]:bg-(--bg-elevated) [&_option]:text-cream"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="all">All</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted">
            Max price ${maxPrice}
            <input
              type="range"
              min={10}
              max={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-2 w-full accent-gold"
            />
          </label>
          <label className="block text-xs text-muted">
            Min rating {minRating}+
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="mt-2 w-full accent-gold"
            />
          </label>
          <label className="block text-xs text-muted">
            Min ABV {minAbv}%
            <input
              type="range"
              min={0}
              max={50}
              value={minAbv}
              onChange={(e) => setMinAbv(Number(e.target.value))}
              className="mt-2 w-full accent-gold"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            In stock at this branch
          </label>
          <label className="block text-xs text-muted">
            Sort
            <select
              className="mt-1 w-full rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-2 text-sm text-cream scheme-dark [&_option]:bg-(--bg-elevated) [&_option]:text-cream"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="rating">Rating</option>
              <option value="abv">ABV</option>
            </select>
          </label>
          </div>
        </aside>
        </div>

        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {filtered.length
                ? `Showing ${from}–${to} of ${filtered.length} bottle${filtered.length === 1 ? "" : "s"}`
                : "0 bottles"}
            </p>
            <PageSizeSelect
              value={pageSize}
              onChange={(size) => {
                setPageSize(size);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 md:gap-6">
            {pageItems.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          {!filtered.length && (
            <p className="text-muted">No bottles match these filters.</p>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(next) => {
              setPage(next);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>
    </div>
  );
}
