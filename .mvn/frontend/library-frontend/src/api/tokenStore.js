const TOKEN_KEY = "library.jwt";

export const createTokenStore = (storage) => ({
  get: () => storage?.getItem(TOKEN_KEY) ?? null,
  set: (token) => storage?.setItem(TOKEN_KEY, token),
  clear: () => storage?.removeItem(TOKEN_KEY),
});

export const tokenStore = createTokenStore(
  typeof window === "undefined" ? null : window.sessionStorage,
);
