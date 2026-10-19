import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { backendConfig } from "@/lib/server/config";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({request});
  try {
    const {url,key} = backendConfig();
    const client = createServerClient(url,key,{
      cookieOptions:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV === "production",path:"/"},
      cookies:{
        getAll:()=>request.cookies.getAll(),
        setAll(values) {
          values.forEach(({name,value})=>request.cookies.set(name,value));
          response = NextResponse.next({request});
          values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
        },
      },
    });
    await client.auth.getUser();
  } catch { /* Protected layouts and APIs fail closed when unavailable. */ }
  response.headers.set("Cache-Control","private, no-store");
  return response;
}
export const config = {matcher:["/dashboard/:path*","/admin/:path*","/reset-password"]};
