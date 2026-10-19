import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { backendConfig } from "@/lib/server/config";

// A fresh client for each request; no global user/session state or service-role key.
export async function createClient() {
  const { url, key } = backendConfig();
  const store = await cookies();
  return createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components are read-only. proxy.ts handles their token refresh.
        }
      },
    },
  });
}
