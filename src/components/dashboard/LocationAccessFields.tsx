"use client";

import { accessibleLocations, hasAllLocationAccess } from "@/lib/auth/location-access";
import { getAllLocations } from "@/data/locations";
import type { UserProfile } from "@/types";

type Props = {
  actor: UserProfile;
  role: string;
  value: string[] | null;
  onChange: (ids: string[] | null) => void;
  locked?: boolean;
};

export function LocationAccessFields({ actor, role, value, onChange, locked }: Props) {
  if (role === "owner" || role === "customer") {
    return (
      <p className="text-xs text-muted">
        {role === "owner" ? "Owners can operate every store." : "Customers do not get store operations access."}
      </p>
    );
  }

  const stores = accessibleLocations(actor, getAllLocations());
  const all = value == null || value.length === 0;
  const selected = new Set(value ?? []);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Store access</p>
        <p className="mt-1 text-[12px] text-muted">
          Limit this person to specific stores for inventory, events, and analytics. All stores is the default.
        </p>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm text-cream">
        <input
          type="checkbox"
          className="h-5 w-5 accent-(--gold)"
          checked={all}
          disabled={locked}
          onChange={(event) => onChange(event.target.checked ? null : stores.map((store) => store.id))}
        />
        All stores
        {hasAllLocationAccess(actor) ? null : (
          <span className="text-[11px] text-muted">(only stores you can assign)</span>
        )}
      </label>
      {!all ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {stores.map((store) => (
            <li key={store.id}>
              <label className="flex min-h-11 items-center gap-3 text-sm text-cream">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-(--gold)"
                  checked={selected.has(store.id)}
                  disabled={locked}
                  onChange={() => {
                    const next = new Set(selected);
                    if (next.has(store.id)) next.delete(store.id);
                    else next.add(store.id);
                    const ids = stores.map((item) => item.id).filter((id) => next.has(id));
                    onChange(ids.length ? ids : stores.map((item) => item.id));
                  }}
                />
                {store.shortName}
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
