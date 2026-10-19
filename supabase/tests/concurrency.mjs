/** Opt-in integration smoke test against a dedicated, seeded Supabase TEST project.
 * Never use real passenger details. No tokens, passwords or passenger records are logged.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../srirail-frontend/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');

if (process.env.RUN_SUPABASE_SMOKE !== 'true') {
  console.log('Skipped hosted concurrency test. Use a dedicated test project and set RUN_SUPABASE_SMOKE=true to opt in.');
  process.exit(0);
}
const required = ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','TEST_USER_A_EMAIL','TEST_USER_A_PASSWORD','TEST_USER_B_EMAIL','TEST_USER_B_PASSWORD'];
for (const name of required) assert.ok(process.env[name], `Missing ${name}`);
assert.notEqual(process.env.TEST_USER_A_EMAIL.toLowerCase(),process.env.TEST_USER_B_EMAIL.toLowerCase(),'Use two distinct verified test accounts.');
const clients = [0,1].map(()=>createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,
  {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}));
const created = [];
const requestKeys = [];
let testFailed = false;
try {
  const sessions = await Promise.all(clients.map((client,index)=>client.auth.signInWithPassword({
    email:process.env[index===0?'TEST_USER_A_EMAIL':'TEST_USER_B_EMAIL'],
    password:process.env[index===0?'TEST_USER_A_PASSWORD':'TEST_USER_B_PASSWORD'],
  })));
  sessions.forEach((session,index)=>assert.ok(!session.error && session.data.user,`Test user ${index===0?'A':'B'} could not sign in. Confirm the dedicated test account is verified.`));
  assert.notEqual(sessions[0].data.user.id,sessions[1].data.user.id,'Use distinct test users.');
  const catalog = await clients[0].rpc('catalog');
  assert.ok(!catalog.error && catalog.data,'Could not load migrated test catalog.');
  const dateFormatter = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit'});
  const localToday = dateFormatter.format(new Date());
  const tomorrow = new Date(`${localToday}T12:00:00+05:30`);
  tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  const date = dateFormatter.format(tomorrow);
  let choice;
  for (const train of catalog.data.trains.filter(t=>t.active && catalog.data.schedules.some(s=>s.trainId===t.id&&s.active&&s.days==='Daily'))) {
    for (const travelClass of train.classes.filter(c=>c.reserved)) {
      const availability = await clients[0].rpc('get_availability',{p_train_id:train.id,p_date:date,p_class_id:travelClass.id});
      if (availability.error || availability.data.available<2) continue;
      const seat = Array.from({length:travelClass.capacity},(_,index)=>`${Math.floor(index/4)+1}${'ABCD'[index%4]}`)
        .find(number=>!availability.data.seats.includes(number));
      if (seat) { choice={train,travelClass,seat}; break; }
    }
    if (choice) break;
  }
  assert.ok(choice,'Need an active Daily reserved class with two free places tomorrow in the seeded test project.');
  const passenger = {fullName:'Demo Test Passenger',identity:'200012345678',email:'demo@example.test',mobile:'0771234567',type:'Adult',gender:'Not specified'};
  const payload = {trainId:choice.train.id,from:choice.train.departureStation,to:choice.train.arrivalStation,date,count:1,
    classId:choice.travelClass.id,passengers:[passenger],seats:[choice.seat],paymentMethod:'lankaqr',
    quotedPrice:Math.round(choice.travelClass.price/10)*10,quotedDepartureTime:choice.train.departureTime,quotedArrivalTime:choice.train.arrivalTime};
  // Independent authenticated clients issue overlapping HTTP requests for one exact inventory key.
  requestKeys.push(randomUUID(),randomUUID());
  const settled = await Promise.allSettled(clients.map((client,index)=>client.rpc('create_booking',{p_request:{...payload,idempotencyKey:requestKeys[index]}})));
  const outcomes = settled.map(result=>result.status==='fulfilled'?result.value:{data:null,error:{message:'The booking request did not return a response.'}});
  outcomes.forEach((result,index)=>{if (!result.error && result.data?.id) created.push({client:clients[index],id:result.data.id});});
  const winners = outcomes.filter(result=>!result.error);
  const losers = outcomes.filter(result=>result.error);
  assert.equal(winners.length,1,'Exactly one simultaneous booking must succeed.');
  assert.equal(losers.length,1,'Exactly one simultaneous booking must be rejected.');
  assert.match(losers[0].error.message,/seat was just reserved/i,'The competing request must fail because the seat is occupied.');
  assert.equal(winners[0].data.payment.status,'simulated','The test must create only a simulated payment.');
  console.log('PASS: one of two concurrent bookings succeeded; the other was rejected for the same reserved seat.');
} catch (error) {
  testFailed=true;
  console.error(error instanceof Error ? error.message : 'Hosted concurrency test failed.');
} finally {
  // A dropped HTTP response can hide a committed booking. Recover by the exact
  // random idempotency keys, through the test user's own RLS-scoped table read.
  for (let index=0;index<requestKeys.length;index++) {
    try {
      const result=await clients[index].from('bookings').select('id').eq('request_key',requestKeys[index]);
      if (result.error) { testFailed=true; console.error('Could not verify test booking cleanup. Check the dedicated test project dashboard.'); }
      else for (const row of result.data) if (!created.some(booking=>booking.id===row.id)) created.push({client:clients[index],id:row.id});
    } catch { testFailed=true; console.error('Could not verify test booking cleanup. Check the dedicated test project dashboard.'); }
  }
  for (const booking of created) {
    try {
      const result = await booking.client.rpc('cancel_booking',{p_booking_id:booking.id});
      if (result.error) { testFailed=true; console.error('Test reservation cleanup failed. Cancel the test booking in the dedicated test project dashboard.'); }
    } catch { testFailed=true; console.error('Test reservation cleanup failed. Cancel the test booking in the dedicated test project dashboard.'); }
  }
  await Promise.allSettled(clients.map(client=>client.auth.signOut()));
  if (created.length>0 && !testFailed) console.log('PASS: test bookings cancelled and inventory released.');
}
if (testFailed) process.exitCode=1;
