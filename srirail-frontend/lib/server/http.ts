import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { backendConfig } from "@/lib/server/config";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: {
    "Cache-Control": "private, no-store, max-age=0",
    "Vary": "Cookie, Origin",
    "X-Content-Type-Options": "nosniff",
  } });
}
export function checkOrigin(request: Request) {
  const { origin } = backendConfig();
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "This request must come from this application.");
  }
}
export async function readBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  checkOrigin(request);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "Send an application/json request.");
  }
  // Limit actual streamed bytes, not only the caller-controlled Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "A JSON body is required.");
  const decoder = new TextDecoder();
  let text = "", size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) { await reader.cancel(); throw new ApiError(413, "Request is too large."); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return schema.parse(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) throw new ApiError(400, "Invalid JSON.");
    throw error;
  } finally { reader.releaseLock(); }
}

// Only these intentional database messages may reach the browser; never return raw SQL/errors.
export function databaseError(error: { code?: string; message?: string } | null): never {
  if (error?.code === "23505") throw new ApiError(409, "This seat, reference or train number is already in use. Refresh and try again.");
  if (error?.code === "42501") throw new ApiError(403, "You do not have permission to perform this action.");
  if (error?.code === "P0001" || error?.code === "22023") {
    const message = error.message ?? "";
    // Messages in application RPCs contain no personal data. Restrict to expected text below.
    const known = ["seat", "available", "capacity", "passenger", "journey", "schedule", "fare", "quote", "changed", "booking", "idempotency", "train", "class", "date", "departure", "invalid", "cancel", "authenticated", "payment", "profile"];
    if (message.length < 250 && known.some((word) => message.toLowerCase().includes(word))) {
      throw new ApiError(409, message);
    }
  }
  throw new ApiError(500, "The database request failed. Check that all Supabase migrations are installed.");
}
export function api(handler: () => Promise<Response>) {
  return handler().catch((error: unknown) => {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    if (error instanceof ZodError) return json({ error: error.issues[0]?.message ?? "Invalid request." }, 400);
    if (error instanceof Error && error.message === "BACKEND_NOT_CONFIGURED") {
      return json({ error: "Supabase is not configured. Follow docs/SUPABASE_SETUP.si.md to enable accounts and bookings." }, 503);
    }
    return json({ error: "The request could not be completed. Please try again." }, 500);
  });
}
