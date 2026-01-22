import pkg from "../package.json" with { type: "json" };

/**
 * Fetch wrapper that adds defaults like User-Agent header.
 */
export default function (url: string | URL, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "User-Agent": `${pkg.name}/${pkg.version} (${pkg.homepage})`,
    },
  });
}
