import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { bookingSchema, calendarDate, profileSchema, registerSchema, trainSchema, travelDate } from "../lib/server/validation";
import { api, ApiError, checkOrigin, databaseError, json, readBody } from "../lib/server/http";
import { allTrains } from "../data/trains";
import { dateOffset, today } from "../lib/format";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test-placeholder";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
const passenger = { id:"p1", fullName:"Sample Passenger", identity:"200012345678", mobile:"0771234567", email:"test@example.com", type:"Adult", gender:"Not specified" };
const request = {trainId:allTrains[0].id,from:allTrains[0].departureStation,to:allTrains[0].arrivalStation,date:dateOffset(1),count:1,classId:"first",passengers:[passenger],seats:["1A"],method:"card",idempotencyKey:"11111111-1111-4111-8111-111111111111",quotedPrice:1000,quotedDepartureTime:"09:00",quotedArrivalTime:"12:00"};
function post(body: unknown, headers: Record<string,string> = {}) {
  return new Request("http://localhost:3000/api/bookings",{method:"POST",headers:{origin:"http://localhost:3000","content-type":"application/json",...headers},body:JSON.stringify(body)});
}
test("booking schema accepts the UI request shape and rejects forged prices/status/owner fields",()=>{
  assert.equal(bookingSchema.parse(request).count,1);
  for (const extra of [{total:1},{userId:"other"},{status:"Confirmed"},{payment:{status:"paid"}},{cardNumber:"4111111111111111"}]) {
    assert.equal(bookingSchema.safeParse({...request,...extra}).success,false);
  }
});
test("booking schema rejects duplicate seats, count mismatch, invalid identity, date, payment and UUID",()=>{
  for (const patch of [
    {seats:["1A","1A"]}, {count:2}, {count:0}, {count:7}, {date:"2026-02-30"}, {date:dateOffset(91)},
    {passengers:[{...passenger,identity:"bad"}]}, {passengers:[{...passenger,mobile:"123"}]},
    {method:"paid"}, {idempotencyKey:"replay-me"}, {seats:["0A"]}, {quotedDepartureTime:"25:00"},
  ]) assert.equal(bookingSchema.safeParse({...request,...patch}).success,false,JSON.stringify(patch));
});
test("calendar checks reject normalization and use Colombo booking horizon",()=>{
  assert.equal(calendarDate.safeParse("2024-02-29").success,true);
  assert.equal(calendarDate.safeParse("2025-02-29").success,false);
  assert.equal(travelDate.safeParse(today()).success,true);
  assert.equal(travelDate.safeParse(dateOffset(90)).success,true);
  assert.equal(travelDate.safeParse(dateOffset(-1)).success,false);
});
test("profile validation prevents role/email mutation and normalizes phone input",()=>{
  const profile = {fullName:"Sample Name",identity:"200012345678",mobile:"+94 77 123 4567"};
  assert.equal(profileSchema.parse(profile).mobile,"+94771234567");
  assert.equal(profileSchema.safeParse({...profile,role:"admin"}).success,false);
  assert.equal(profileSchema.safeParse({...profile,email:"new@example.com"}).success,false);
  assert.equal(registerSchema.safeParse({...profile,email:"user@example.com",password:"short"}).success,false);
});
test("all existing sample trains match the server admin contract",()=>{
  for (const train of allTrains) assert.doesNotThrow(()=>trainSchema.parse(train),train.id);
});
test("CSRF guard accepts exact configured origin and rejects cross-site/missing/untrusted host",()=>{
  assert.doesNotThrow(()=>checkOrigin(post({})));
  assert.throws(()=>checkOrigin(post({},{origin:"https://attacker.example"})),ApiError);
  assert.throws(()=>checkOrigin(post({},{"sec-fetch-site":"cross-site"})),ApiError);
  assert.throws(()=>checkOrigin(new Request("http://localhost:3000/api/bookings",{method:"POST"})),ApiError);
  assert.throws(()=>checkOrigin(post({},{origin:"https://attacker.example",host:"attacker.example"})),ApiError);
});
test("JSON parser validates body and rejects invalid content types, malformed JSON and oversized stream",async()=>{
  assert.deepEqual(await readBody(post({value:1}),z.object({value:z.number()}).strict()),{value:1});
  await assert.rejects(readBody(post({},{"content-type":"text/plain"}),z.object({})),(e:unknown)=>e instanceof ApiError && e.status===415);
  await assert.rejects(readBody(new Request("http://localhost:3000",{method:"POST",headers:{origin:"http://localhost:3000","content-type":"application/json"},body:"{"}),z.object({})),(e:unknown)=>e instanceof ApiError && e.status===400);
  await assert.rejects(readBody(post({value:"x".repeat(33000)}),z.object({})),(e:unknown)=>e instanceof ApiError && e.status===413);
});
test("error response strips unexpected database details and marks user data no-store",async()=>{
  const response = await api(async()=>{ databaseError({code:"XX000",message:"internal password=secret"}); });
  assert.equal(response.status,500);
  assert.equal(JSON.stringify(await response.json()).includes("secret"),false);
  assert.match(response.headers.get("cache-control")!,/no-store/);
  assert.equal(json({ok:true}).headers.get("vary"),"Cookie, Origin");
});
test("database seat conflicts and permissions map to actionable HTTP status",async()=>{
  assert.equal((await api(async()=>databaseError({code:"23505"}))).status,409);
  assert.equal((await api(async()=>databaseError({code:"42501"}))).status,403);
  const response = await api(async()=>{ throw new Error("BACKEND_NOT_CONFIGURED"); });
  assert.equal(response.status,503);
});

test("configuration rejects secret/service-role keys and unsafe callback origins",async()=>{
  const { backendConfig } = await import("../lib/server/config");
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    for (const key of ['sb_secret_example',`x.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.x`]) {
      process.env.SUPABASE_PUBLISHABLE_KEY=key;
      assert.throws(backendConfig,/BACKEND_NOT_CONFIGURED/);
    }
    process.env.SUPABASE_PUBLISHABLE_KEY=originalKey;
    for (const site of ['https://example.com/path','http://example.com','https://user:password@example.com','not a url']) {
      process.env.NEXT_PUBLIC_SITE_URL=site;
      assert.throws(backendConfig,/BACKEND_NOT_CONFIGURED/);
    }
  } finally {
    process.env.SUPABASE_PUBLISHABLE_KEY=originalKey;
    process.env.NEXT_PUBLIC_SITE_URL=originalSite;
  }
});
