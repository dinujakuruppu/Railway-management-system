/** Production route smoke checks with no live Supabase dependency.
 * The reserved .invalid endpoint and absent cookies ensure no real account/data is touched.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const origin = 'http://localhost:3199';
const server = spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3199'],{
  env:{...process.env,SUPABASE_URL:'https://railway-test.invalid',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_smoke-placeholder',NEXT_PUBLIC_SITE_URL:origin},
  stdio:['ignore','pipe','pipe'],
});
let output = '';
server.stdout.on('data',chunk=>{output+=chunk;});
server.stderr.on('data',chunk=>{output+=chunk;});
const target = 'http://127.0.0.1:3199';
try {
  for (let attempt=0;attempt<80;attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try { await fetch(`${target}/login`); break; } catch { await new Promise(resolve=>setTimeout(resolve,100)); }
  }
  const cases = [
    ['/api/bookings',{},401],
    ['/api/admin/trains',{method:'PUT',headers:{origin,'content-type':'application/json'},body:'{}'},401],
    ['/api/auth/login',{method:'POST',headers:{origin:'https://other.example','content-type':'application/json'},body:'{}'},403],
    ['/api/auth/login',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'},400],
    ['/api/auth/login',{method:'POST',headers:{origin,'content-type':'text/plain'},body:'{}'},415],
    ['/api/auth/unknown',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'},404],
    ['/api/bookings',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{broken'},400],
    ['/api/bookings',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({extra:'x'.repeat(33000)})},413],
    ['/api/availability?trainId=test&classId=first&date=2026-02-30',{},400],
    ['/api/bookings/11111111-1111-4111-8111-111111111111/cancel',{method:'POST',headers:{origin:'https://other.example'}},403],
  ];
  let checks=0;
  for (const [path,options,status] of cases) {
    const response = await fetch(`${target}${path}`,options);
    assert.equal(response.status,status,path);
    assert.match(response.headers.get('cache-control') ?? '',/no-store/,path);
    const body = await response.json();
    assert.equal(typeof body.error,'string',path);
    checks++;
  }
  for (const path of ['/dashboard','/admin','/admin/trains']) {
    const response = await fetch(`${target}${path}`,{redirect:'manual'});
    if (response.status === 307) assert.equal(response.headers.get('location'),'/login',path);
    else {
      // App Router can stream its loading shell before an async layout redirects.
      assert.equal(response.status,200,path);
      assert.match(await response.text(),/http-equiv="refresh"[^>]+url=\/?login/i,path);
    }
    checks++;
  }
  const callback = await fetch(`${target}/auth/callback?next=https://other.example`,{redirect:'manual'});
  assert.equal(callback.status,307);
  assert.equal(callback.headers.get('location'),`${origin}/login?error=callback`);
  checks++;
  console.log(`PASS ${checks} production HTTP checks (no live Supabase credentials).`);
} finally {
  server.kill('SIGTERM');
  if (server.exitCode === null) await once(server,'exit');
}
