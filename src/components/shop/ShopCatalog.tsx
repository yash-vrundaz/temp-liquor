"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { getAllProducts } from "@/data/products";
import { getCategories } from "@/data/categories";
import { searchProducts } from "@/lib/search";
import { useCatalogStore } from "@/store/catalog";
import { useBranchStore } from "@/store/branch";
import { useInventoryStore } from "@/store/inventory";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { Input } from "@/components/ui/Input";

export function ShopCatalog() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [search, setSearch] = useState("");
  const catalogRevision = useCatalogStore((s) => s.revision);
  const branchId = useBranchStore((s) => s.branchId);
  const isHidden = useInventoryStore((s) => s.isHidden);
  const inventoryRevision = useInventoryStore((s) => s.revision);

  const filtered = useMemo(() => {
    const all = getAllProducts().filter((p) => !isHidden(branchId, p.id));
    const q = search.trim();
    if (!q) return all;
    return searchProducts(q, 0).filter((p) => !isHidden(branchId, p.id));
  }, [search, catalogRevision, branchId, isHidden, inventoryRevision]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize, search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const from = filtered.length ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, filtered.length);
  const queryLabel =
    search.trim().length > 28 ? `${search.trim().slice(0, 28)}…` : search.trim();

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4 sm:py-14 md:px-8 md:py-16">
      <SectionHeading
        eyebrow="Shop"
        title="All collections"
        description="Filter by category or explore the full store catalog."
      />
      <div className="h-scroll h-scroll-wrap -mx-1 mb-6 px-1 md:mb-10 md:gap-2">
        {getCategories().map((c) => (
          <Link
            key={c.slug}
            href={`/shop/${c.slug}`}
            className="shrink-0 rounded-sm border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-muted transition hover:border-(--gold)/40 hover:text-gold"
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mb-4 space-y-3 sm:mb-6">
        <div className="relative w-full">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bottles, brands, notes…"
            aria-label="Search collections"
            className="pl-10 pr-10"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-cream"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-sm text-muted">
            {filtered.length
              ? `Showing ${from}–${to} of ${filtered.length}`
              : "No bottles match"}
            {queryLabel ? (
              <span className="text-cream/80"> for “{queryLabel}”</span>
            ) : (
              " bottles"
            )}
          </p>
          <PageSizeSelect
            className="shrink-0"
            value={pageSize}
            onChange={(size) => {
              setPageSize(size);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>

      {pageItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {pageItems.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <p className="border border-white/10 px-4 py-10 text-center text-sm text-muted">
          No bottles match your search. Try another brand, category, or tasting note.
        </p>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
    </div>
  );
}
