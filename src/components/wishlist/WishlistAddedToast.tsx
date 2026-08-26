"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { useWishlistFeedbackStore } from "@/store/wishlist-feedback";
import { useCartFeedbackStore } from "@/store/cart-feedback";
import { getProductById } from "@/data/products";
import { Button } from "@/components/ui/Button";

export function WishlistAddedToast() {
  const notice = useWishlistFeedbackStore((s) => s.notice);
  const dismiss = useWishlistFeedbackStore((s) => s.dismiss);
  const pathname = usePathname();
  const product =
    notice?.kind === "added" ? getProductById(notice.productId) : null;
  const loginHref = `/login?next=${encodeURIComponent(pathname || "/wishlist")}`;

  useEffect(() => {
    if (!notice) return;
    useCartFeedbackStore.getState().dismiss();
    const timer = window.setTimeout(() => dismiss(), 4200);
    return () => window.clearTimeout(timer);
  }, [notice, dismiss]);

  return (
    <AnimatePresence>
      {notice ? (
        <motion.div
          key={notice.id}
          initial={{ opacity: 0, y: 16, x: 12 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-3 z-[90] w-[min(22rem,calc(100vw-1.5rem))] border border-white/10 bg-(--bg-elevated) p-3 shadow-[0_16px_48px_rgba(0,0,0,0.55)] sm:right-6"
          role="status"
          aria-live="polite"
        >
          {notice.kind === "auth" ? (
            <>
              <div className="flex items-start gap-3">
                <div className="flex h-16 w-12 shrink-0 items-center justify-center bg-white/5 text-gold">
                  <Heart size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
                    Sign in required
                  </p>
                  <p className="mt-1 font-display text-lg leading-tight text-cream">
                    Save bottles to your wishlist
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Your list stays with your account — and clears when you sign out.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-sm p-1 text-muted hover:bg-white/5 hover:text-cream"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mt-3">
                <Link href={loginHref} className="block" onClick={dismiss}>
                  <Button size="sm" className="w-full">
                    Sign in
                  </Button>
                </Link>
              </div>
            </>
          ) : product ? (
            <>
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-12 shrink-0 bg-white/5">
                  <Image
                    src={product.images[0]}
                    alt=""
                    fill
                    className="object-contain p-1"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
                    Added to wishlist
                  </p>
                  <p className="mt-1 truncate font-display text-lg leading-tight text-cream">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{product.brand}</p>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-sm p-1 text-muted hover:bg-white/5 hover:text-cream"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mt-3">
                <Link href="/wishlist" className="block" onClick={dismiss}>
                  <Button size="sm" variant="secondary" className="w-full">
                    <Heart size={14} />
                    View wishlist
                  </Button>
                </Link>
              </div>
            </>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
