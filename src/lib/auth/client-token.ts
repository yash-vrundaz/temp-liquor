/** In-memory access JWT for the browser tab (refresh stays httpOnly). */

let accessToken: string | null = null;

export function getClientAccessToken() {
  return accessToken;
}

export function setClientAccessToken(token: string | null) {
  accessToken = token;
}

export function clearClientAccessToken() {
  accessToken = null;
}
