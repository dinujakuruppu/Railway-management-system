/** Runs the actual migrations and permission/RPC checks in WASM PostgreSQL.
 * The small auth shim models JWT identity and signup triggers; it does not test
 * the hosted Supabase Auth service or simultaneous physical DB connections.
 */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../srirail-frontend/package.json', import.meta.url));
const { PGlite } = require('@electric-sql/pglite');
const db = new PGlite();
let checks = 0;
const scalar = async (sql, params = []) => (await db.query(sql, params)).rows[0]?.value;
const check = (value, message) => { assert.ok(value, message); checks++; };
async function rejects(action, pattern, label) {
  await assert.rejects(action, error => pattern.test(error.message), label);
  checks++;
}
async function asUser(id, role = 'authenticated') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']);
  await db.exec(`set role ${role}`);
}
async function postgres() { await db.exec('reset role'); }
const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';
const key = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const rpc = async (name, request) => scalar(`select public.${name}($1::jsonb) as value`, [JSON.stringify(request)]);
try {
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
    $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
  `);
  const migrationDir = new URL('../migrations/', import.meta.url);
  for (const file of (await readdir(migrationDir)).filter(name => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file,migrationDir),'utf8'));
    console.log(`Applied ${file}`);
  }
  await db.query(`insert into auth.users(id,email,raw_user_meta_data) values
    ($1,'a@example.test','{"full_name":"Demo Passenger A","identity":"200012345678","mobile":"077 123 4567","role":"admin","is_admin":true}'),
    ($2,'b@example.test','{"full_name":"Demo Passenger B","identity":"invalid","mobile":"invalid"}'),
    ($3,'admin@example.test','{"full_name":"Demo Admin"}')`, [userA,userB,admin]);
  await db.query("update public.user_roles set role='admin' where user_id=$1",[admin]);
  check(await scalar('select count(*)=18 as value from public.trains'),'18 illustrative trains seeded');
  check(await scalar('select count(*)=90 as value from public.train_classes'),'90 train classes seeded');
  check(await scalar("select identity='200012345678' and mobile='0771234567' as value from public.profiles where id=$1",[userA]),'Safe metadata populates profile');
  check(await scalar("select identity='' and mobile='' as value from public.profiles where id=$1",[userB]),'Invalid metadata does not break Auth signup');
  const date = await scalar("select ((now() at time zone 'Asia/Colombo')::date+1)::text as value");
  const passenger = { id: 'client-id-is-not-trusted', fullName: 'Demo Passenger', identity: '200012345678', email: 'demo@example.test', mobile: '0771234567', type: 'Adult', gender: 'Not specified' };
  const request = (n, overrides={}) => ({ idempotencyKey:key(n), trainId:'intercity-1015', from:'Colombo Fort', to:'Kandy', date,
    count:1, classId:'first', passengers:[passenger], seats:['1A'], paymentMethod:'card', quotedPrice:1750, quotedDepartureTime:'07:00',quotedArrivalTime:'09:35',...overrides });

  await asUser(null,'anon');
  const publicCatalog = await scalar('select public.catalog() as value');
  check(publicCatalog.trains.length===18 && publicCatalog.stations.length===13,'Anonymous catalog reads');
  await rejects(()=>db.query('select * from public.profiles'),/permission denied/,'Anonymous cannot read profiles');
  await rejects(()=>rpc('create_booking',request(1)),/permission denied/,'Anonymous cannot book');

  await asUser(userA);
  check(await scalar("select role='passenger' as value from public.user_roles where user_id=$1",[userA]),'Signup metadata cannot promote admin');
  check(await scalar('select count(*)=1 as value from public.profiles'),'Profile RLS isolates users');
  await rejects(()=>db.query("update public.user_roles set role='admin' where user_id=$1",[userA]),/permission denied/,'Role column cannot be changed');
  await rejects(()=>db.query("update public.profiles set email='spoof@example.test' where id=$1",[userA]),/permission denied/,'Profile email is Auth managed');
  await db.query("update public.profiles set full_name='Updated Passenger' where id=$1",[userA]);
  check(await scalar("select full_name='Updated Passenger' as value from public.profiles where id=$1",[userA]),'Own safe profile update allowed');
  await rejects(()=>db.query("insert into public.notices(id,title,category,description) values('bad','Bad notice','Announcement','Unauthorized')"),/row-level security/,'Passenger cannot write notices');
  await rejects(()=>rpc('upsert_train',publicCatalog.trains[0]),/Administrator/,'Passenger cannot edit trains');
  await rejects(()=>rpc('create_booking',request(2,{quotedPrice:1})),/fares have changed/,'Price tampering is rejected');
  await rejects(()=>rpc('create_booking',request(3,{quotedDepartureTime:'08:00'})),/fares have changed/,'Timetable tampering is rejected');
  await rejects(()=>rpc('create_booking',request(4,{passengers:[{...passenger,type:'Invented'}]})),/valid passenger/,'Passenger enum is validated inside SQL');
  await rejects(()=>rpc('create_booking',request(5,{passengers:[{...passenger,identity:'bad'}]})),/valid passenger/,'Passenger identity is validated inside SQL');
  await rejects(()=>rpc('create_booking',request(6,{seats:['99D']})),/outside this coach/,'Out-of-range seat rejected');
  await rejects(()=>rpc('create_booking',request(7,{count:2,passengers:[passenger,passenger],seats:['1A','1A']})),/unique seat/,'Duplicate seat selection rejected');
  await rejects(()=>rpc('create_booking',request(8,{date:'2099-01-01'})),/90 days/,'Booking horizon enforced in SQL');
  await rejects(()=>rpc('create_booking',request(9,{from:'Kandy',to:'Colombo Fort'})),/valid route/,'Reverse segment injection rejected');
  await rejects(()=>rpc('create_booking',request(10,{cardNumber:'4242424242424242'})),/Unknown booking fields/,'Card fields never accepted by booking RPC');

  const bookingA = await rpc('create_booking',request(11));
  check(bookingA.total===1800 && bookingA.fare===1750 && bookingA.serviceFee===50,'Price/fees computed by database');
  check(bookingA.payment.status==='simulated' && bookingA.reference.startsWith('DEMO-'),'Demo payment and reference explicit');
  check(bookingA.passengers[0].id!=='client-id-is-not-trusted','Passenger ID generated by database');
  const replay = await rpc('create_booking',request(11));
  check(replay.id===bookingA.id,'Identical idempotent retry returns same booking');
  await rejects(()=>rpc('create_booking',request(11,{seats:['1B']})),/different request/,'Changed idempotent replay rejected');
  await rejects(()=>db.query('update public.bookings set total=1'),/permission denied/,'Booking direct write denied');
  await rejects(()=>db.query('delete from public.booking_seats'),/permission denied/,'Seat direct write denied');
  await rejects(()=>db.query('update public.payments set amount=1'),/permission denied/,'Payment direct write denied');

  await asUser(userB);
  check((await scalar('select public.get_bookings(false) as value')).length===0,'Passenger cannot use admin list parameter');
  check(await scalar('select count(*)=0 as value from public.bookings'),'Booking table RLS isolates owner');
  check(await scalar('select count(*)=0 as value from public.booking_passengers'),'Passenger PII RLS isolates owner');
  check(await scalar('select count(*)=0 as value from public.payments'),'Payment table RLS isolates owner');
  await rejects(()=>scalar('select public.cancel_booking($1::uuid) as value',[bookingA.id]),/Booking not found/,'Other user cannot cancel');
  await rejects(()=>rpc('create_booking',request(12)),/seat was just reserved/,'Competing booking cannot reuse an allocated seat');
  const availability = await scalar('select public.get_availability($1,$2::date,$3) as value',['intercity-1015',date,'first']);
  check(availability.available===31 && availability.seats.includes('1A'),'Availability reveals inventory without passenger PII');
  const bookingB = await rpc('create_booking',request(13,{seats:['1B'],paymentMethod:'lankaqr'}));
  check(bookingB.id!==bookingA.id,'Different user can reserve another seat');

  await asUser(userA);
  const cancelled = await scalar('select public.cancel_booking($1::uuid) as value',[bookingA.id]);
  check(cancelled.status==='Cancelled' && cancelled.seats[0]==='1A','Cancellation preserves historical ticket seat');
  check((await scalar('select public.cancel_booking($1::uuid) as value',[bookingA.id])).status==='Cancelled','Cancellation is idempotent');
  const rebook = await rpc('create_booking',request(14));
  check(rebook.status==='Confirmed','Cancellation releases inventory for reuse');

  // The primary key is an additional guard independent of advisory locking.
  await postgres();
  await rejects(()=>db.query(`insert into public.booking_seats(booking_id,train_id,travel_date,class_id,seat_number)
    values($1,'intercity-1015',$2::date,'first','1B')`,[rebook.id,date]),/duplicate key/,'Allocation PK independently prevents duplicates');
  await db.query("update public.schedules set days=$1 where train_id='intercity-1015'",[(new Date(`${date}T12:00:00+05:30`).getUTCDay()===0||new Date(`${date}T12:00:00+05:30`).getUTCDay()===6)?'Weekdays':'Weekends']);
  await asUser(userA);
  await rejects(()=>rpc('create_booking',request(15,{seats:['1C']})),/not scheduled/,'Non-running schedule day rejected');
  await postgres();
  await db.exec("update public.schedules set days='Daily' where train_id='intercity-1015'");
  // Restrict an open-seating class to one place, fill it, then check overselling.
  await db.exec("update public.train_classes set capacity=1 where train_id='intercity-1015' and class_id='third'");
  await asUser(userA);
  await rpc('create_booking',request(16,{classId:'third',seats:[],quotedPrice:350}));
  await asUser(userB);
  await rejects(()=>rpc('create_booking',request(17,{classId:'third',seats:[],quotedPrice:350})),/not enough places/,'Open-seating capacity cannot be oversold');

  await asUser(admin);
  check((await scalar('select public.get_bookings(true) as value')).length===0,'Admin own list excludes other users');
  check((await scalar('select public.get_bookings(false) as value')).length===4,'Admin list includes all bookings');
  await db.exec("insert into public.notices(id,title,category,description,published) values('draft','Private draft','Announcement','Admin-only draft',false)");
  const train = publicCatalog.trains.find(t=>t.id==='intercity-1015');
  const edited = await rpc('upsert_train',{...train,name:'Updated demo express'});
  check(edited.name==='Updated demo express','Admin can update train through validated RPC');
  await rpc('create_booking',request(18,{seats:['8D']}));
  await rejects(()=>rpc('upsert_train',{...edited,stops:[edited.stops[0],{station:'Invented Station',time:'12:00'}]}),/known stations/,'Unknown train station rejected in SQL');
  await rejects(()=>rpc('upsert_train',{...edited,stops:[{station:'Colombo Fort',time:'12:00'},{station:'Kandy',time:'11:00'}]}),/times must increase/,'Invalid timetable rejected in SQL');
  await rejects(()=>rpc('upsert_train',{...edited,classes:edited.classes.map(c=>c.id==='first'?{...c,capacity:4}:c)}),/existing reservations/,'Admin cannot remove sold seat by reducing capacity');
  await rejects(()=>rpc('upsert_train',{...edited,classes:edited.classes.map(c=>c.id==='first'?{...c,price:10}:c)}),/check constraint/,'Admin fare must remain above the safe prorating floor');
  const lowFareTrain=await rpc('upsert_train',{...edited,classes:edited.classes.map(c=>c.id==='first'?{...c,price:20}:c)});
  check(lowFareTrain.classes.find(c=>c.id==='first').price===20,'Minimum supported full-route fare is accepted');
  const partial=await rpc('create_booking',request(19,{to:'Maradana',seats:['1D'],quotedPrice:10,quotedArrivalTime:'07:08'}));
  check(partial.fare===10 && partial.total===60,'Short segment minimum fare rounds positively and adds server fee');
  await rpc('upsert_train',{...edited,id:'test-new-train',trainNumber:'999900'});
  check(await scalar("select days='Daily' and active as value from public.schedules where train_id='test-new-train'"),'New train receives a default Daily schedule');
  await rejects(()=>rpc('upsert_train',{...edited,id:'test-duplicate-number',trainNumber:'999900'}),/duplicate key/,'Train-number uniqueness enforced in PostgreSQL');
  await asUser(null,'anon');
  check(!(await scalar('select public.catalog() as value')).notices.some(n=>n.id==='draft'),'Unpublished notices hidden from public');
  console.log(`Passed ${checks} PostgreSQL migration, RLS, validation, booking and admin checks.`);
} finally { await db.close(); }
