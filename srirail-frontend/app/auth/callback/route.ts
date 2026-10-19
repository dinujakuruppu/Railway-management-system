import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { backendConfig } from "@/lib/server/config";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const next = params.get("next") === "/reset-password" ? "/reset-password" : "/dashboard";
  try {
    const {origin} = backendConfig();
    if (code) {
      const client = await createClient();
      const {error} = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`, {headers:{"Cache-Control":"private, no-store"}});
    }
    return NextResponse.redirect(`${origin}/login?error=callback`, {headers:{"Cache-Control":"private, no-store"}});
  } catch {
    return new NextResponse("Authentication is not configured. Follow the Supabase setup guide.",{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
