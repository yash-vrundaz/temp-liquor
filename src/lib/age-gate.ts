export const AGE_COOKIE = "sams_age_verified";
const AGE_MAX_AGE = 60 * 60 * 24 * 30;

export function readAgeVerified() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((part) => part === `${AGE_COOKIE}=1`);
}

export function setAgeVerified() {
  document.cookie = `${AGE_COOKIE}=1; Path=/; Max-Age=${AGE_MAX_AGE}; SameSite=Lax`;
}

export function clearAgeVerified() {
  document.cookie = `${AGE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
