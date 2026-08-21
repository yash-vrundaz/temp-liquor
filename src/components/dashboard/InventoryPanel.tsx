"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Package, Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
import { getAllLocations, getLocationById } from "@/data/locations";
import { getCategories } from "@/data/categories";
import { getAllProducts, getProductById } from "@/data/products";
import { useInventoryStore } from "@/store/inventory";
import { useCatalogStore } from "@/store/catalog";
import {
  getCatalogStock,
  REORDER_POINT,
  stockStatus,
} from "@/lib/inventory";
import type { CategorySlug, Product } from "@/types";
import { BottleForm } from "@/components/dashboard/AddBottleForm";
import { CategoriesPanel } from "@/components/dashboard/CategoriesPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { compareValues, MobileSortBar, SortableTh, tableCellClass, tableHeadRowClass, tableRowClass, tableWrapClass, useTableSort } from "@/components/ui/SortableTh";
import { hasPermission } from "@/lib/auth/permissions";
import { useUserStore } from "@/store/user";

type Props = {
  locationId: string | "all";
  onLocationChange?: (id: string | "all") => void;
  locations?: ReturnType<typeof getAllLocations>;
  initialView?: "stock" | "categories";
};

type StockFilter = "all" | "low" | "out" | "ok";
type SortKey = "name" | "status" | "stock";
type InventoryView = "stock" | "categories";

function productImage(product: Product) {
  return product.images?.[0] || "";
}

const selectClass =
  "rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-2.5 text-sm text-cream scheme-dark outline-none focus:border-(--gold)/40 [&_option]:bg-(--bg-elevated)";

function StatusPill({ status }: { status: ReturnType<typeof stockStatus> }) {
  const label =
    status === "out" ? "Out" : status === "low" ? "Low" : "OK";
  const tone =
    status === "out"
      ? "text-red-300"
      : status === "low"
        ? "text-amber-200"
        : "text-(--success)";
  return (
    <span className={`text-[11px] uppercase tracking-[0.14em] ${tone}`}>
      {label}
    </span>
  );
}

function QtyControl({
  value,
  label,
  onSet,
  onAdjust,
  disabled,
}: {
  value: number;
  label: string;
  onSet: (n: number) => void;
  onAdjust: (delta: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center border border-white/15 bg-black/35">
      <button
        type="button"
        className="min-h-10 min-w-10 text-muted disabled:opacity-30"
        disabled={disabled || value <= 0}
        onClick={() => onAdjust(-1)}
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <input
        type="number"
        min={0}
        value={value}
        readOnly={disabled}
        onChange={(e) => {
          if (disabled) return;
          const next = Number(e.target.value);
          if (Number.isFinite(next) && next >= 0) onSet(Math.floor(next));
        }}
        className="w-14 bg-transparent py-2 text-center text-base tabular-nums text-cream outline-none disabled:opacity-50 sm:text-sm"
        aria-label={label}
        disabled={disabled}
      />
      <button
        type="button"
        className="min-h-10 min-w-10 text-muted disabled:opacity-30"
        disabled={disabled}
        onClick={() => onAdjust(1)}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}

export function InventoryPanel({
  locationId,
  onLocationChange,
  locations,
  initialView = "stock",
}: Props) {
  const profile = useUserStore((s) => s.profile);
  const canAdjust = hasPermission(profile, "inventory.adjust");
  const canRestock = hasPermission(profile, "inventory.restock");
  const canReset = hasPermission(profile, "inventory.reset");
  const canAddBottle = hasPermission(profile, "catalog.create");
  const canEditBottle = hasPermission(profile, "catalog.edit");
  const canDeleteBottle = hasPermission(profile, "catalog.delete");
  const canManageCategories =
    hasPermission(profile, "catalog.create") ||
    hasPermission(profile, "catalog.edit") ||
    hasPermission(profile, "catalog.delete");
  const stocks = useInventoryStore((s) => s.stocks);
  const ledger = useInventoryStore((s) => s.ledger);
  const setOnHand = useInventoryStore((s) => s.setOnHand);
  const adjust = useInventoryStore((s) => s.adjust);
  const resetToCatalog = useInventoryStore((s) => s.resetToCatalog);
  const catalogRevision = useCatalogStore((s) => s.revision);
  const removeBottle = useCatalogStore((s) => s.removeBottle);
  const custom = useCatalogStore((s) => s.custom);

  const [view, setView] = useState<InventoryView>(
    initialView === "categories" && canManageCategories ? "categories" : "stock",
  );
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const { sortKey, sortDir, toggleSort } = useTableSort<SortKey>("status");
  const [showLedger, setShowLedger] = useState(false);
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const stores = locations?.length ? locations : getAllLocations();

  // Always one store tab — never list the same SKU across all branches
  const storeId =
    locationId !== "all" && stores.some((loc) => loc.id === locationId)
      ? locationId
      : stores[0]?.id ?? getAllLocations()[0]!.id;

  useEffect(() => {
    if (locationId === "all" || !stores.some((loc) => loc.id === locationId)) {
      onLocationChange?.(storeId);
    }
  }, [locationId, storeId, onLocationChange, stores]);

  const activeLocation = getLocationById(storeId) ?? stores[0] ?? getAllLocations()[0]!;

  const rows = useMemo(() => {
    const catalog = getAllProducts();
    const q = query.trim().toLowerCase();
    const list: {
      product: Product;
      onHand: number;
      seed: number;
      status: ReturnType<typeof stockStatus>;
    }[] = [];

    for (const product of catalog) {
      if (category !== "all" && product.category !== category) continue;
      const onHand =
        stocks[`${storeId}:${product.id}`] ??
        getCatalogStock(storeId, product.id);
      const seed = getCatalogStock(storeId, product.id);
      const status = stockStatus(onHand);
      if (stockFilter === "low" && status !== "low") continue;
      if (stockFilter === "out" && status !== "out") continue;
      if (stockFilter === "ok" && status !== "ok") continue;
      if (
        q &&
        !`${product.name} ${product.brand} ${product.category}`
          .toLowerCase()
          .includes(q)
      ) {
        continue;
      }
      list.push({ product, onHand, seed, status });
    }

    const rank = { out: 0, low: 1, ok: 2 };
    return list.sort((a, b) => {
      if (sortKey === "status") return compareValues(rank[a.status], rank[b.status], sortDir);
      if (sortKey === "stock") return compareValues(a.onHand, b.onHand, sortDir);
      return compareValues(a.product.name, b.product.name, sortDir);
    });
  }, [storeId, stocks, query, stockFilter, category, sortKey, sortDir, catalogRevision]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, rows.length);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [storeId, query, stockFilter, category, sortKey, sortDir, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const stats = useMemo(() => {
    const catalog = getAllProducts();
    let totalUnits = 0;
    let skuCount = 0;
    let low = 0;
    let out = 0;
    let value = 0;
    for (const product of catalog) {
      const onHand =
        stocks[`${storeId}:${product.id}`] ??
        getCatalogStock(storeId, product.id);
      skuCount += 1;
      totalUnits += onHand;
      value += onHand * product.price;
      const status = stockStatus(onHand);
      if (status === "low") low += 1;
      if (status === "out") out += 1;
    }
    return { totalUnits, skuCount, low, out, value };
  }, [storeId, stocks, catalogRevision]);

  const recentLedger = ledger
    .filter((e) => e.locationId === storeId || e.locationId === "all")
    .slice(0, 8);

  const restockLowOut = () => {
    for (const { product, onHand, seed } of rows) {
      if (onHand > REORDER_POINT) continue;
      const target = Math.max(seed, 12, REORDER_POINT + 5);
      if (onHand < target) setOnHand(storeId, product.id, target, "restock");
    }
  };

  const selectStore = (id: string) => onLocationChange?.(id);
  const showCategories = view === "categories" && canManageCategories;

  return (
    <section className="mt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl text-cream sm:text-3xl">
            Inventory
          </h2>
          <p className="mt-1 text-sm text-muted">
            {showCategories
              ? "Shop collections used when adding and filtering bottles"
              : "One store at a time · each bottle listed once"}
          </p>
        </div>
        {!showCategories ? (
          <div className="flex flex-wrap gap-2">
            {canAddBottle && !editor && (
              <Button size="sm" onClick={() => setEditor("new")}>
                Add bottle
              </Button>
            )}
            {canReset && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => resetToCatalog(storeId)}
              >
                <RotateCcw size={14} />
                Reset store
              </Button>
            )}
            {canRestock && (
              <Button size="sm" variant="secondary" onClick={restockLowOut}>
                Restock low / out
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {canManageCategories ? (
        <div
          className="mt-5 -mx-3 h-scroll border-b border-white/10 px-3 sm:mx-0 sm:px-0"
          role="tablist"
          aria-label="Inventory sections"
        >
          <div className="flex min-w-max gap-1">
            {(
              [
                { id: "stock" as const, label: "Stock" },
                { id: "categories" as const, label: "Categories" },
              ] as const
            ).map((tab) => {
              const active = view === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(tab.id)}
                  className={`relative min-h-11 px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] transition ${
                    active ? "text-cream" : "text-muted hover:text-cream"
                  }`}
                >
                  {tab.label}
                  {active ? (
                    <span className="absolute inset-x-2 bottom-0 h-px bg-(--gold)" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {showCategories ? <CategoriesPanel embedded /> : null}

      {!showCategories ? (
        <>
      {/* Store picker — select on mobile, tabs on sm+ */}
      <div className="mt-5 sm:hidden">
        <label className="block text-xs text-muted">
          Store
          <select
            value={storeId}
            onChange={(e) => selectStore(e.target.value)}
            className={`${selectClass} mt-1 w-full min-h-11`}
            aria-label="Store inventory"
          >
            {stores.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.shortName} · {loc.city}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="mt-5 -mx-3 hidden h-scroll border-b border-white/10 px-3 sm:mx-0 sm:flex sm:px-0"
        role="tablist"
        aria-label="Store inventory"
      >
        {stores.map((loc) => {
          const active = storeId === loc.id;
          return (
            <button
              key={loc.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectStore(loc.id)}
              className={`border-b-2 px-3 py-3 text-sm uppercase tracking-[0.14em] transition-colors sm:px-4 ${
                active
                  ? "border-(--gold) text-cream"
                  : "border-transparent text-muted hover:text-cream"
              }`}
            >
              {loc.shortName}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-lg text-cream sm:text-xl">
            {activeLocation.name}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {activeLocation.address}, {activeLocation.city}
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-muted">SKUs</dt>
            <dd className="tabular-nums text-cream">{stats.skuCount}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">On hand</dt>
            <dd className="tabular-nums text-cream">{stats.totalUnits}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Low</dt>
            <dd className="tabular-nums text-amber-200">{stats.low}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Out</dt>
            <dd className="tabular-nums text-red-300">{stats.out}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Value</dt>
            <dd className="tabular-nums text-cream">
              ${Math.round(stats.value).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Filters — one row */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <Input
            className="py-2.5 pl-9"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search inventory"
          />
        </div>
        <select
          className={selectClass}
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as CategorySlug | "all")
          }
          aria-label="Category"
        >
          <option value="all">All categories</option>
          {getCategories().map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as StockFilter)}
          aria-label="Stock status"
        >
          <option value="all">Any status</option>
          <option value="ok">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {rows.length === 0
            ? "No products"
            : `Showing ${from}–${to} of ${rows.length}`}
          {` · ${activeLocation.shortName}`}
        </p>
        <PageSizeSelect
          className="shrink-0"
          value={pageSize}
          options={[5, 10, 15, 25, 50]}
          onChange={setPageSize}
        />
      </div>

      <MobileSortBar
        className="mt-3 lg:hidden"
        columns={[
          { key: "name", label: "Bottle" },
          { key: "status", label: "Status" },
          { key: "stock", label: "On hand" },
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
      />

      {/* Desktop / tablet table */}
      <div className={`mt-3 hidden lg:block ${tableWrapClass}`}>
        <table className="w-full min-w-160 text-left text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <SortableTh
                label="Bottle"
                column="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                label="Status"
                column="status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                label="On hand"
                column="stock"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 text-right font-medium">Quick</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted">
                  No bottles match these filters.
                </td>
              </tr>
            ) : (
              pageRows.map(({ product, onHand, status }) => {
                const img = productImage(product);
                return (
                  <tr key={product.id} className={tableRowClass}>
                    <td className={tableCellClass}>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-9 shrink-0 overflow-hidden bg-black/30">
                          {img ? (
                            <Image
                              src={img}
                              alt=""
                              fill
                              className="object-contain p-0.5"
                              sizes="36px"
                              unoptimized={img.startsWith("data:") || img.startsWith("/uploads/")}
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-cream">{product.name}</p>
                          <p className="truncate text-[11px] text-muted">
                            {product.brand} · {product.category} · $
                            {product.price.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <StatusPill status={status} />
                    </td>
                    <td className={tableCellClass}>
                      <QtyControl
                        value={onHand}
                        label={`${product.name} at ${activeLocation.shortName}`}
                        disabled={!canAdjust}
                        onSet={(n) => setOnHand(storeId, product.id, n)}
                        onAdjust={(d) =>
                          adjust(
                            storeId,
                            product.id,
                            d,
                            d > 0 ? "restock" : "adjustment",
                          )
                        }
                      />
                    </td>
                    <td className={`${tableCellClass} text-right`}>
                      <div className="inline-flex flex-nowrap items-center justify-end gap-1">
                        {canEditBottle ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5"
                            onClick={() => setEditor(product)}
                          >
                            <Pencil size={13} />
                            Edit
                          </Button>
                        ) : null}
                        {canRestock ? (
                          <button
                            type="button"
                            className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted hover:text-cream"
                            onClick={() =>
                              adjust(storeId, product.id, 12, "restock")
                            }
                          >
                            +12
                          </button>
                        ) : !canEditBottle ? (
                          <span className="text-[11px] text-muted">View only</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <ul className="mt-3 space-y-0 divide-y divide-white/10 lg:hidden">
        {pageRows.length === 0 ? (
          <li className="py-10 text-center text-sm text-muted">
            No bottles match these filters.
          </li>
        ) : (
          pageRows.map(({ product, onHand, status }) => {
            const img = productImage(product);
            return (
              <li key={product.id} className="py-4">
                <div className="flex gap-3">
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden bg-black/30">
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-contain p-0.5"
                        sizes="40px"
                        unoptimized={img.startsWith("data:") || img.startsWith("/uploads/")}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-cream">{product.name}</p>
                        <p className="text-[11px] text-muted">{product.brand}</p>
                      </div>
                      <StatusPill status={status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <QtyControl
                        value={onHand}
                        label={`${product.name} count`}
                        disabled={!canAdjust}
                        onSet={(n) => setOnHand(storeId, product.id, n)}
                        onAdjust={(d) =>
                          adjust(
                            storeId,
                            product.id,
                            d,
                            d > 0 ? "restock" : "adjustment",
                          )
                        }
                      />
                      {canRestock && (
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center px-3 text-[11px] uppercase tracking-wider text-muted"
                          onClick={() =>
                            adjust(storeId, product.id, 12, "restock")
                          }
                        >
                          +12
                        </button>
                      )}
                      {canEditBottle ? (
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center gap-1 px-3 text-[11px] uppercase tracking-wider text-muted hover:text-cream"
                          onClick={() => setEditor(product)}
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <Pagination
        className="mt-6"
        page={safePage}
        totalPages={totalPages}
        onChange={setPage}
      />

      {/* Custom bottles */}
      {custom.length > 0 && (
        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
            Owner-added ({custom.length})
          </p>
          <ul className="mt-3 space-y-2">
            {custom.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-cream">
                  {p.name}
                  <span className="text-muted"> · {p.brand}</span>
                </span>
                {canDeleteBottle ? (
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 text-[11px] uppercase tracking-wider text-muted hover:text-red-300"
                    onClick={() => removeBottle(p.id)}
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ledger */}
      {recentLedger.length > 0 && (
        <div className="mt-8 border-t border-white/10 pt-5">
          <button
            type="button"
            className="text-[10px] uppercase tracking-[0.18em] text-gold hover:text-cream"
            onClick={() => setShowLedger((v) => !v)}
          >
            {showLedger ? "Hide" : "Show"} recent movements
          </button>
          {showLedger && (
            <ul className="mt-3 space-y-2 text-xs text-muted">
              {recentLedger.map((entry) => {
                const product = getProductById(entry.productId);
                const loc = getAllLocations().find((l) => l.id === entry.locationId);
                return (
                  <li key={entry.id} className="flex items-start gap-2">
                    <Package size={12} className="mt-0.5 shrink-0 text-gold" />
                    <span>
                      <span className="capitalize text-cream">
                        {entry.reason}
                      </span>
                      {product
                        ? ` · ${product.name}`
                        : entry.productId === "*"
                          ? " · all SKUs"
                          : ""}
                      {loc ? ` @ ${loc.shortName}` : ""}
                      {entry.delta !== 0
                        ? ` · ${entry.delta > 0 ? "+" : ""}${entry.delta}`
                        : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor === "new" ? "Add bottle" : "Edit bottle"}
        subtitle="Photos, price, and copy appear on the shop and product page."
        className="sm:max-w-xl"
      >
        <BottleForm
          key={editor === "new" ? "new" : editor?.id ?? "closed"}
          product={editor && editor !== "new" ? editor : undefined}
          defaultLocationId={storeId}
          onSaved={() => setEditor(null)}
          onClose={() => setEditor(null)}
        />
      </Modal>
        </>
      ) : null}
    </section>
  );
}
