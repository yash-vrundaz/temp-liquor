"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartAddedToast } from "@/components/cart/CartAddedToast";
import { WishlistAddedToast } from "@/components/wishlist/WishlistAddedToast";
import { AgeGate } from "@/components/layout/AgeGate";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname === "/prototype" || pathname.startsWith("/prototype/");
  const immersive = pathname.startsWith("/virtual-store");
  const isDashboard = pathname.startsWith("/dashboard");

  if (bare) {
    return (
      <main id="main" className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main
        id="main"
        className={
          immersive
            ? "flex min-h-[100dvh] flex-col pt-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4.25rem+env(safe-area-inset-top,0px))]"
            : "min-h-[100dvh] pt-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4.5rem+env(safe-area-inset-top,0px))]"
        }
      >
        {children}
      </main>
      {!immersive && !isDashboard && <Footer />}
      <CartAddedToast />
      <WishlistAddedToast />
      <AgeGate />
    </>
  );
}
