"use client";

import { useCartStore } from "@/store/cart";
import { useCartFeedbackStore } from "@/store/cart-feedback";

export function addToCart(productId: string, qty = 1) {
  const result = useCartStore.getState().addItem(productId, qty);
  if (result.ok) {
    useCartFeedbackStore.getState().notify(productId, result.added, result.quantity);
  }
  return result;
}
