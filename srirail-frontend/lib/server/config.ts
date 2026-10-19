import "server-only";

export function backendConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const invalid = () => new Error("BACKEND_NOT_CONFIGURED");
  if (!url || !key || !siteUrl || key.includes("replace-") || url.includes("your-project") || key.startsWith("sb_secret_")) {
    throw invalid();
  }
  // Reject legacy service_role keys as well as new secret keys. Every query must use RLS.
  if (key.split(".").length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8"));
      if (payload.role !== "anon") throw invalid();
    } catch { throw invalid(); }
  }
  let site: URL, endpoint: URL;
  try { site = new URL(siteUrl); endpoint = new URL(url); } catch { throw invalid(); }
  for (const address of [site, endpoint]) {
    if (address.pathname !== "/" || address.search || address.hash || address.username || address.password ||
        !["http:", "https:"].includes(address.protocol) ||
        (address.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(address.hostname))) {
      throw invalid();
    }
  }
  return { url, key, origin: site.origin };
}
