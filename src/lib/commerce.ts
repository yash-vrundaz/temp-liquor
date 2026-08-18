export const COUPONS: Record<string, number> = {
  SAMS10: 0.1,
  GOLD15: 0.15,
  WELCOME20: 0.2,
};

export function getCouponDiscount(code: string | null | undefined, subtotal: number) {
  if (!code) return 0;
  const key = code.toUpperCase();
  // Own-property check avoids matching inherited keys like "constructor".
  if (!Object.hasOwn(COUPONS, key)) return 0;
  const rate = COUPONS[key];
  if (!rate) return 0;
  return Math.round(subtotal * rate * 100) / 100;
}
