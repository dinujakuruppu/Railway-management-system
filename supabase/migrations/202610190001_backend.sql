-- SriRail educational demo. These records and payments never reserve real railway seats.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  identity text not null default '' check (identity = '' or identity ~ '^(\d{12}|\d{9}[vVxX]|[A-Za-z]{1,2}\d{6,9})$'),
  email text not null default '' check (char_length(email) <= 254),
  mobile text not null default '' check (mobile = '' or mobile ~ '^(0|\+94|94)7[0-9]{8}$'),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'passenger' check (role in ('passenger', 'admin'))
);

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;

-- The role always comes from this protected table, never signup metadata or a JWT user_metadata field.
create function private.sync_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.profiles (id, full_name, email, identity, mobile)
      values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), coalesce(new.email, ''),
        case when trim(coalesce(new.raw_user_meta_data->>'identity','')) ~ '^(\d{12}|\d{9}[vVxX]|[A-Za-z]{1,2}\d{6,9})$'
          then trim(new.raw_user_meta_data->>'identity') else '' end,
        case when regexp_replace(coalesce(new.raw_user_meta_data->>'mobile',''),'[[:space:]()-]','','g') ~ '^(0|\+94|94)7[0-9]{8}$'
          then regexp_replace(new.raw_user_meta_data->>'mobile','[[:space:]()-]','','g') else '' end);
    insert into public.user_roles(user_id, role) values (new.id, 'passenger');
  else
    update public.profiles set email = coalesce(new.email, ''), updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.sync_auth_user();
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function private.sync_auth_user();
insert into public.profiles(id, full_name, email)
  select id, left(coalesce(raw_user_meta_data ->> 'full_name', ''),120), coalesce(email,'') from auth.users on conflict do nothing;
insert into public.user_roles(user_id) select id from auth.users on conflict do nothing;

create table public.stations (
  id text primary key check (id ~ '^[A-Z0-9-]{2,12}$'),
  name text not null unique check (char_length(name) between 2 and 100),
  province text not null check (char_length(province) between 2 and 100)
);
create table public.trains (
  id text primary key check (id ~ '^[a-zA-Z0-9-]{1,80}$'),
  train_number text not null unique check (train_number ~ '^[0-9]{3,6}$'),
  name text not null check (char_length(name) between 2 and 120),
  type text not null check (type in ('Intercity', 'Express', 'Commuter')),
  stops jsonb not null check (jsonb_typeof(stops) = 'array' and jsonb_array_length(stops) between 2 and 100),
  facilities text[] not null default '{}',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.train_classes (
  train_id text not null references public.trains(id) on delete cascade,
  class_id text not null check (class_id in ('first', 'second-reserved', 'third-reserved', 'second', 'third')),
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  price integer not null check (price between 20 and 1000000),
  reserved boolean not null,
  capacity integer not null check (capacity between 1 and 1000),
  primary key (train_id, class_id),
  check (reserved = (class_id in ('first','second-reserved','third-reserved'))),
  check (not reserved or (capacity <= 200 and capacity % 4 = 0))
);
create table public.schedules (
  id text primary key check (char_length(id) between 1 and 120),
  train_id text not null unique references public.trains(id) on delete cascade,
  days text not null default 'Daily' check (days in ('Daily', 'Weekdays', 'Weekends')),
  active boolean not null default true
);
create table public.notices (
  id text primary key check (char_length(id) between 1 and 120),
  title text not null check (char_length(title) between 3 and 200),
  date date not null default ((now() at time zone 'Asia/Colombo')::date),
  category text not null check (category in ('Service update', 'Special service', 'Schedule change', 'Announcement')),
  description text not null check (char_length(description) between 3 and 5000),
  published boolean not null default false
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('DEMO-' || upper(replace(gen_random_uuid()::text, '-', ''))),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key uuid not null,
  request_payload jsonb not null,
  train_id text not null references public.trains(id),
  travel_date date not null,
  class_id text not null,
  journey jsonb not null,
  class_name text not null,
  coach text not null,
  booked_seats text[] not null default '{}',
  passenger_count integer not null check (passenger_count between 1 and 6),
  unit_price integer not null check (unit_price > 0),
  fare integer not null check (fare > 0),
  service_fee integer not null check (service_fee >= 0),
  total integer not null check (total > 0),
  status text not null default 'Confirmed' check (status in ('Confirmed', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique(user_id, request_key),
  foreign key(train_id, class_id) references public.train_classes(train_id,class_id),
  check (fare = unit_price * passenger_count and service_fee = 50 * passenger_count and total = fare + service_fee)
);
create index bookings_owner_created on public.bookings(user_id, created_at desc);
create index bookings_capacity on public.bookings(train_id, travel_date, class_id) where status = 'Confirmed';
create table public.booking_passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  position integer not null check (position between 1 and 6),
  full_name text not null check (char_length(trim(full_name)) between 3 and 120),
  identity text not null check (identity ~ '^(\d{12}|\d{9}[vVxX]|[A-Za-z]{1,2}\d{6,9})$'),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  mobile text not null check (mobile ~ '^(0|\+94|94)7[0-9]{8}$'),
  type text not null check (type in ('Adult', 'Child', 'Senior Citizen')),
  gender text not null check (gender in ('Not specified', 'Female', 'Male')),
  unique(booking_id, position)
);
-- Run-wide allocation is deliberately conservative: a seat cannot be sold twice on different segments.
create table public.booking_seats (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  train_id text not null,
  travel_date date not null,
  class_id text not null,
  seat_number text not null check (seat_number ~ '^[1-9][0-9]*[ABCD]$'),
  primary key(train_id, travel_date, class_id, seat_number),
  unique(booking_id, seat_number),
  foreign key(train_id, class_id) references public.train_classes(train_id,class_id)
);
create index booking_seats_booking on public.booking_seats(booking_id);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  method text not null check (method in ('card', 'lankaqr', 'mobile')),
  amount integer not null check (amount > 0),
  status text not null default 'simulated' check (status = 'simulated'),
  paid_at timestamptz not null default now()
);
comment on table public.payments is 'Simulation only. Never store PAN/card numbers, CVCs, payment tokens, or real payment details.';

create function private.profile_timestamp() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profile_updated before update on public.profiles for each row execute function private.profile_timestamp();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.stations enable row level security;
alter table public.trains enable row level security;
alter table public.train_classes enable row level security;
alter table public.schedules enable row level security;
alter table public.notices enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_passengers enable row level security;
alter table public.booking_seats enable row level security;
alter table public.payments enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy roles_read on public.user_roles for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy stations_read on public.stations for select to anon, authenticated using (true);
create policy trains_read on public.trains for select to anon, authenticated using (active or (select private.is_admin()));
create policy classes_read on public.train_classes for select to anon, authenticated using (exists (select 1 from public.trains t where t.id = train_id));
create policy schedules_read on public.schedules for select to anon, authenticated using ((active and exists(select 1 from public.trains t where t.id = train_id and t.active)) or (select private.is_admin()));
create policy schedules_admin on public.schedules for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy notices_read on public.notices for select to anon, authenticated using (published or (select private.is_admin()));
create policy notices_admin on public.notices for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy bookings_read on public.bookings for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy passengers_read on public.booking_passengers for select to authenticated using (exists(select 1 from public.bookings b where b.id = booking_id));
create policy seats_read on public.booking_seats for select to authenticated using (exists(select 1 from public.bookings b where b.id = booking_id));
create policy payments_read on public.payments for select to authenticated using (exists(select 1 from public.bookings b where b.id = booking_id));

-- Revoke Supabase's broad default table privileges. Only checked RPCs can mutate bookings and inventory.
revoke all on public.profiles, public.user_roles, public.stations, public.trains, public.train_classes, public.schedules, public.notices,
  public.bookings, public.booking_passengers, public.booking_seats, public.payments from anon, authenticated;
grant select on public.stations, public.trains, public.train_classes, public.schedules, public.notices to anon, authenticated;
grant select on public.profiles, public.user_roles, public.bookings, public.booking_passengers, public.booking_seats, public.payments to authenticated;
grant update(full_name, identity, mobile) on public.profiles to authenticated;
grant insert, update, delete on public.schedules, public.notices to authenticated;

create function private.minutes(p_time text) returns integer language sql immutable strict set search_path = '' as $$
  select split_part(p_time, ':', 1)::integer * 60 + split_part(p_time, ':', 2)::integer;
$$;
create function private.train_json(p_id text) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', t.id, 'trainNumber', t.train_number, 'name', t.name, 'type', t.type,
    'departureStation', t.stops->0->>'station', 'arrivalStation', t.stops->-1->>'station',
    'departureTime', t.stops->0->>'time', 'arrivalTime', t.stops->-1->>'time',
    'duration', ((private.minutes(t.stops->-1->>'time') - private.minutes(t.stops->0->>'time') + 1440) % 1440 / 60)::text || 'h ' ||
      ((private.minutes(t.stops->-1->>'time') - private.minutes(t.stops->0->>'time') + 1440) % 60)::text || 'm',
    'stops', t.stops, 'facilities', to_jsonb(t.facilities), 'active', t.active,
    'classes', coalesce((select jsonb_agg(jsonb_build_object('id', c.class_id, 'name', c.name, 'description', c.description,
      'price', c.price, 'reserved', c.reserved, 'capacity', c.capacity) order by array_position(array['first','second-reserved','third-reserved','second','third'],c.class_id))
      from public.train_classes c where c.train_id = t.id),'[]'::jsonb))
  from public.trains t where t.id = p_id;
$$;
create function private.catalog() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'stations', coalesce((select jsonb_agg(to_jsonb(s) order by s.name) from public.stations s),'[]'::jsonb),
    'trains', coalesce((select jsonb_agg(private.train_json(t.id) order by t.id) from public.trains t where t.active or private.is_admin()),'[]'::jsonb),
    'schedules', coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'trainId',s.train_id,'days',s.days,'active',s.active) order by s.id)
      from public.schedules s join public.trains t on t.id=s.train_id where (s.active and t.active) or private.is_admin()),'[]'::jsonb),
    'notices', coalesce((select jsonb_agg(to_jsonb(n) order by n.date desc,n.id) from public.notices n where n.published or private.is_admin()),'[]'::jsonb));
$$;
create function public.catalog() returns jsonb language sql stable security invoker set search_path = '' as $$ select private.catalog(); $$;

create function private.booking_json(p_id uuid) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id',b.id,'reference',b.reference,'journey',b.journey,'classId',b.class_id,'className',b.class_name,'coach',b.coach,
    'seats',to_jsonb(b.booked_seats),
    'passengers',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'fullName',p.full_name,'identity',p.identity,
      'email',p.email,'mobile',p.mobile,'type',p.type,'gender',p.gender) order by p.position) from public.booking_passengers p where p.booking_id=b.id),'[]'::jsonb),
    'fare',b.fare,'serviceFee',b.service_fee,'total',b.total,'status',b.status,'createdAt',b.created_at,
    'payment',(select jsonb_build_object('id',p.id,'method',p.method,'amount',p.amount,'status',p.status,'paidAt',p.paid_at)
      from public.payments p where p.booking_id=b.id)) from public.bookings b where b.id=p_id;
$$;
create function private.get_bookings(p_own_only boolean default true) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(private.booking_json(b.id) order by b.created_at desc),'[]'::jsonb)
    from public.bookings b where b.user_id=auth.uid() or (not p_own_only and private.is_admin());
$$;
create function public.get_bookings(p_own_only boolean default true) returns jsonb language sql stable security invoker set search_path = '' as $$ select private.get_bookings(p_own_only); $$;

create function private.get_availability(p_train_id text,p_date date,p_class_id text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c public.train_classes; v_seats jsonb; v_used integer;
begin
  if p_date < (now() at time zone 'Asia/Colombo')::date or p_date > (now() at time zone 'Asia/Colombo')::date + 90 then
    raise exception 'Choose a date within the next 90 days.' using errcode='22023';
  end if;
  select cl.* into c from public.train_classes cl join public.trains t on t.id=cl.train_id
    join public.schedules s on s.train_id=t.id where cl.train_id=p_train_id and cl.class_id=p_class_id and t.active and s.active
    and (s.days='Daily' or (s.days='Weekdays' and extract(isodow from p_date)<6) or (s.days='Weekends' and extract(isodow from p_date)>5));
  if not found then raise exception 'This train or class is unavailable.' using errcode='22023'; end if;
  select coalesce(jsonb_agg(seat_number order by seat_number),'[]'::jsonb) into v_seats
    from public.booking_seats where train_id=p_train_id and travel_date=p_date and class_id=p_class_id;
  select coalesce(sum(passenger_count),0)::integer into v_used from public.bookings
    where train_id=p_train_id and travel_date=p_date and class_id=p_class_id and status='Confirmed';
  return jsonb_build_object('seats',v_seats,'available',greatest(0,c.capacity-v_used));
end;
$$;
create function public.get_availability(p_train_id text,p_date date,p_class_id text) returns jsonb
  language sql stable security invoker set search_path = '' as $$ select private.get_availability(p_train_id,p_date,p_class_id); $$;

create function private.create_booking(p_request jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_key uuid; v_existing public.bookings; v_train public.trains; v_class public.train_classes;
  v_schedule public.schedules; v_date date; v_count integer; v_from integer; v_to integer; v_start text; v_end text;
  v_total_minutes integer; v_part_minutes integer; v_price integer; v_fare integer; v_used integer; v_booking uuid;
  v_train_json jsonb; v_journey jsonb; v_passenger jsonb; v_seat text; v_index integer; v_seat_index integer;
begin
  if v_user is null then raise exception 'Sign in before booking.' using errcode='42501'; end if;
  if jsonb_typeof(p_request) is distinct from 'object' or octet_length(p_request::text)>20000 then
    raise exception 'Invalid booking request.' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_object_keys(p_request) k where k not in
    ('idempotencyKey','trainId','from','to','date','count','classId','passengers','seats','paymentMethod','quotedPrice','quotedDepartureTime','quotedArrivalTime')) then
    raise exception 'Unknown booking fields are not accepted.' using errcode='22023';
  end if;
  if not (p_request ?& array['idempotencyKey','trainId','from','to','date','count','classId','passengers','seats','paymentMethod','quotedPrice','quotedDepartureTime','quotedArrivalTime']) then
    raise exception 'The booking request is incomplete.' using errcode='22023';
  end if;
  if exists(select 1 from unnest(array['idempotencyKey','trainId','from','to','date','classId','paymentMethod','quotedDepartureTime','quotedArrivalTime']) k
    where jsonb_typeof(p_request->k) is distinct from 'string') or jsonb_typeof(p_request->'count') is distinct from 'number'
    or jsonb_typeof(p_request->'quotedPrice') is distinct from 'number'
    or (p_request->>'count') !~ '^[1-6]$' or (p_request->>'quotedPrice') !~ '^[0-9]{1,7}$'
    or (p_request->>'date') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Invalid booking field types.' using errcode='22023';
  end if;
  begin v_key := (p_request->>'idempotencyKey')::uuid; v_date := (p_request->>'date')::date;
    exception when invalid_text_representation or datetime_field_overflow then raise exception 'Invalid booking key or date.' using errcode='22023'; end;
  v_count := (p_request->>'count')::integer;
  -- All retries of one user/key serialize before either inspecting or inserting a booking.
  perform pg_advisory_xact_lock(hashtextextended('booking-key:'||v_user::text||':'||v_key::text,0));
  select * into v_existing from public.bookings where user_id=v_user and request_key=v_key;
  if found then
    if v_existing.request_payload is distinct from (p_request-'idempotencyKey') then
      raise exception 'This booking key has already been used for a different request.' using errcode='22023';
    end if;
    return private.booking_json(v_existing.id);
  end if;
  if v_date < (now() at time zone 'Asia/Colombo')::date or v_date > (now() at time zone 'Asia/Colombo')::date+90 then
    raise exception 'Choose a date within the next 90 days.' using errcode='22023';
  end if;
  if jsonb_typeof(p_request->'passengers') is distinct from 'array' or jsonb_typeof(p_request->'seats') is distinct from 'array' then
    raise exception 'Passengers and seats must be arrays.' using errcode='22023';
  end if;
  if jsonb_array_length(p_request->'passengers')<>v_count or jsonb_array_length(p_request->'seats')>6 then
    raise exception 'Passenger or seat count does not match.' using errcode='22023';
  end if;
  if (p_request->>'paymentMethod') not in ('card','lankaqr','mobile') then raise exception 'Choose a simulated payment method.' using errcode='22023'; end if;
  for v_passenger in select value from jsonb_array_elements(p_request->'passengers') loop
    if jsonb_typeof(v_passenger) is distinct from 'object' then raise exception 'Invalid passenger.' using errcode='22023'; end if;
    if exists(select 1 from unnest(array['fullName','identity','email','mobile','type','gender']) k where jsonb_typeof(v_passenger->k) is distinct from 'string')
      or exists(select 1 from jsonb_object_keys(v_passenger) k where k not in ('id','fullName','identity','email','mobile','type','gender')) then
      raise exception 'Passenger details are incomplete.' using errcode='22023';
    end if;
    if char_length(trim(v_passenger->>'fullName')) not between 3 and 120
      or trim(v_passenger->>'identity') !~ '^(\d{12}|\d{9}[vVxX]|[A-Za-z]{1,2}\d{6,9})$'
      or char_length(v_passenger->>'email')>254 or trim(v_passenger->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      or regexp_replace(v_passenger->>'mobile','[[:space:]()-]','','g') !~ '^(0|\+94|94)7[0-9]{8}$'
      or (v_passenger->>'type') not in ('Adult','Child','Senior Citizen')
      or (v_passenger->>'gender') not in ('Not specified','Female','Male') then
      raise exception 'Please provide valid passenger details.' using errcode='22023';
    end if;
  end loop;
  select * into v_train from public.trains where id=p_request->>'trainId' and active for share;
  if not found then raise exception 'This train is unavailable.' using errcode='22023'; end if;
  select * into v_schedule from public.schedules where train_id=v_train.id and active for share;
  if not found or not (v_schedule.days='Daily' or (v_schedule.days='Weekdays' and extract(isodow from v_date)<6)
    or (v_schedule.days='Weekends' and extract(isodow from v_date)>5)) then
    raise exception 'This train is not scheduled on the selected date.' using errcode='22023';
  end if;
  select * into v_class from public.train_classes where train_id=v_train.id and class_id=p_request->>'classId' for share;
  if not found then raise exception 'This travel class is unavailable.' using errcode='22023'; end if;
  select ordinality::integer-1 into v_from from jsonb_array_elements(v_train.stops) with ordinality where value->>'station'=p_request->>'from';
  select ordinality::integer-1 into v_to from jsonb_array_elements(v_train.stops) with ordinality where value->>'station'=p_request->>'to';
  if v_from is null or v_to is null or v_to<=v_from then raise exception 'Choose a valid route for this train.' using errcode='22023'; end if;
  v_start := v_train.stops->v_from->>'time'; v_end := v_train.stops->v_to->>'time';
  -- The supplied date is the boarding date at the selected departure station, in Sri Lanka time.
  if ((v_date::text||' '||v_start)::timestamp at time zone 'Asia/Colombo')<=now() then
    raise exception 'The selected departure has already passed.' using errcode='22023';
  end if;
  v_total_minutes := (private.minutes(v_train.stops->-1->>'time')-private.minutes(v_train.stops->0->>'time')+1440)%1440;
  v_part_minutes := (private.minutes(v_end)-private.minutes(v_start)+1440)%1440;
  v_price := (round(v_class.price*greatest(0.3, v_part_minutes::numeric/nullif(v_total_minutes,0))/10)*10)::integer;
  if v_price is null then raise exception 'The train timetable is invalid.' using errcode='22023'; end if;
  if (p_request->>'quotedPrice')::integer<>v_price or p_request->>'quotedDepartureTime'<>v_start or p_request->>'quotedArrivalTime'<>v_end then
    raise exception 'Train times or fares have changed. Search again before payment.' using errcode='22023';
  end if;
  if v_class.reserved and jsonb_array_length(p_request->'seats')<>v_count then raise exception 'Choose one seat per passenger.' using errcode='22023'; end if;
  if not v_class.reserved and jsonb_array_length(p_request->'seats')<>0 then raise exception 'Open seating classes do not accept reserved seats.' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(p_request->'seats') s where jsonb_typeof(s) is distinct from 'string')
    or (select count(distinct value) from jsonb_array_elements(p_request->'seats'))<>jsonb_array_length(p_request->'seats') then
    raise exception 'Seat choices must be unique seat numbers.' using errcode='22023';
  end if;
  for v_seat in select jsonb_array_elements_text(p_request->'seats') loop
    if v_seat !~ '^[1-9][0-9]?[ABCD]$' then raise exception 'Invalid seat number.' using errcode='22023'; end if;
    v_seat_index := (left(v_seat,length(v_seat)-1)::integer-1)*4+strpos('ABCD',right(v_seat,1));
    if v_seat_index>v_class.capacity then raise exception 'Seat number is outside this coach.' using errcode='22023'; end if;
  end loop;
  -- This transaction lock protects capacity and seat selection across simultaneous bookings and cancellations.
  perform pg_advisory_xact_lock(hashtextextended('inventory:'||v_train.id||':'||v_date::text||':'||v_class.class_id,0));
  select coalesce(sum(passenger_count),0)::integer into v_used from public.bookings
    where train_id=v_train.id and travel_date=v_date and class_id=v_class.class_id and status='Confirmed';
  if v_used+v_count>v_class.capacity then raise exception 'There are not enough places in this class.' using errcode='P0001'; end if;
  if exists(select 1 from public.booking_seats where train_id=v_train.id and travel_date=v_date and class_id=v_class.class_id
    and seat_number in (select jsonb_array_elements_text(p_request->'seats'))) then
    raise exception 'A selected seat was just reserved. Choose seats again.' using errcode='P0001';
  end if;
  v_train_json := private.train_json(v_train.id);
  v_train_json := v_train_json || jsonb_build_object('departureStation',p_request->>'from','arrivalStation',p_request->>'to',
    'departureTime',v_start,'arrivalTime',v_end,'duration',(v_part_minutes/60)::text||'h '||(v_part_minutes%60)::text||'m',
    'stops',(select jsonb_agg(value order by ordinality) from jsonb_array_elements(v_train.stops) with ordinality where ordinality between v_from+1 and v_to+1),
    'classes',(select jsonb_agg(value||jsonb_build_object('price',(round((value->>'price')::numeric*greatest(0.3,v_part_minutes::numeric/v_total_minutes)/10)*10)::integer)) from jsonb_array_elements(v_train_json->'classes')));
  v_journey := jsonb_build_object('from',p_request->>'from','to',p_request->>'to','date',v_date,'count',v_count,'train',v_train_json);
  v_fare := v_price*v_count;
  insert into public.bookings(user_id,request_key,request_payload,train_id,travel_date,class_id,journey,class_name,coach,booked_seats,passenger_count,unit_price,fare,service_fee,total)
    values(v_user,v_key,p_request-'idempotencyKey',v_train.id,v_date,v_class.class_id,v_journey,v_class.name,
      case v_class.class_id when 'first' then 'A' when 'second-reserved' then 'B' when 'third-reserved' then 'C' else 'Open seating' end,
      array(select jsonb_array_elements_text(p_request->'seats')),v_count,v_price,v_fare,v_count*50,v_fare+v_count*50) returning id into v_booking;
  v_index := 0;
  for v_passenger in select value from jsonb_array_elements(p_request->'passengers') loop
    v_index := v_index+1;
    insert into public.booking_passengers(booking_id,position,full_name,identity,email,mobile,type,gender)
      values(v_booking,v_index,trim(v_passenger->>'fullName'),trim(v_passenger->>'identity'),trim(v_passenger->>'email'),
        regexp_replace(v_passenger->>'mobile','[[:space:]()-]','','g'),v_passenger->>'type',v_passenger->>'gender');
  end loop;
  insert into public.booking_seats(booking_id,train_id,travel_date,class_id,seat_number)
    select v_booking,v_train.id,v_date,v_class.class_id,jsonb_array_elements_text(p_request->'seats');
  insert into public.payments(booking_id,method,amount) values(v_booking,p_request->>'paymentMethod',v_fare+v_count*50);
  return private.booking_json(v_booking);
end;
$$;
create function public.create_booking(p_request jsonb) returns jsonb language sql security invoker set search_path = '' as $$ select private.create_booking(p_request); $$;

create function private.cancel_booking(p_booking_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_booking public.bookings;
begin
  if auth.uid() is null then raise exception 'Sign in before cancelling.' using errcode='42501'; end if;
  select * into v_booking from public.bookings where id=p_booking_id and (user_id=auth.uid() or private.is_admin()) for update;
  if not found then raise exception 'Booking not found.' using errcode='42501'; end if;
  if v_booking.status='Cancelled' then return private.booking_json(p_booking_id); end if;
  if v_booking.status<>'Confirmed' then raise exception 'This booking cannot be cancelled.' using errcode='22023'; end if;
  if ((v_booking.travel_date::text||' '||(v_booking.journey->'train'->>'departureTime'))::timestamp at time zone 'Asia/Colombo')<=now() then
    raise exception 'This departure has already passed.' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('inventory:'||v_booking.train_id||':'||v_booking.travel_date::text||':'||v_booking.class_id,0));
  update public.bookings set status='Cancelled',cancelled_at=now() where id=p_booking_id;
  delete from public.booking_seats where booking_id=p_booking_id;
  return private.booking_json(p_booking_id);
end;
$$;
create function public.cancel_booking(p_booking_id uuid) returns jsonb language sql security invoker set search_path = '' as $$ select private.cancel_booking(p_booking_id); $$;

create function private.upsert_train(p_train jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_stop jsonb; v_class jsonb; v_id text; v_last integer := -1; v_mins integer; v_seen text[] := '{}'; v_facilities text[];
begin
  if not private.is_admin() then raise exception 'Administrator access is required.' using errcode='42501'; end if;
  if jsonb_typeof(p_train) is distinct from 'object' or octet_length(p_train::text)>50000 then raise exception 'Invalid train.' using errcode='22023'; end if;
  if exists(select 1 from unnest(array['id','trainNumber','name','type']) k where jsonb_typeof(p_train->k) is distinct from 'string')
    or jsonb_typeof(p_train->'active') is distinct from 'boolean' or jsonb_typeof(p_train->'stops') is distinct from 'array'
    or jsonb_typeof(p_train->'classes') is distinct from 'array' or jsonb_typeof(p_train->'facilities') is distinct from 'array' then
    raise exception 'Train details are incomplete.' using errcode='22023';
  end if;
  if jsonb_array_length(p_train->'stops') not between 2 and 100 or jsonb_array_length(p_train->'classes') not between 1 and 5
    or jsonb_array_length(p_train->'facilities')>20 then raise exception 'Invalid number of stops, classes or facilities.' using errcode='22023'; end if;
  for v_stop in select value from jsonb_array_elements(p_train->'stops') loop
    if jsonb_typeof(v_stop) is distinct from 'object' or jsonb_typeof(v_stop->'station') is distinct from 'string'
      or jsonb_typeof(v_stop->'time') is distinct from 'string' or (v_stop->>'time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or not exists(select 1 from public.stations where name=v_stop->>'station') or v_stop->>'station'=any(v_seen) then
      raise exception 'Choose unique known stations and valid times.' using errcode='22023';
    end if;
    v_seen := array_append(v_seen,v_stop->>'station'); v_mins := private.minutes(v_stop->>'time');
    -- The demo timetable supports one same-day run; overnight services must be modelled explicitly before adding them.
    if v_mins<=v_last then raise exception 'Stop times must increase on the same day.' using errcode='22023'; end if;
    v_last := v_mins;
  end loop;
  if exists(select 1 from jsonb_array_elements(p_train->'facilities') f where jsonb_typeof(f) is distinct from 'string' or char_length(f#>>'{}') not between 1 and 100) then
    raise exception 'Invalid facility descriptions.' using errcode='22023';
  end if;
  select array_agg(value) into v_facilities from jsonb_array_elements_text(p_train->'facilities');
  v_id := p_train->>'id';
  -- Train row locks coordinate edits with booking's FOR SHARE timetable/price snapshot.
  perform 1 from public.trains where id=v_id for update;
  insert into public.trains(id,train_number,name,type,stops,facilities,active)
    values(v_id,trim(p_train->>'trainNumber'),trim(p_train->>'name'),p_train->>'type',p_train->'stops',coalesce(v_facilities,'{}'),(p_train->>'active')::boolean)
    on conflict(id) do update set train_number=excluded.train_number,name=excluded.name,type=excluded.type,stops=excluded.stops,
      facilities=excluded.facilities,active=excluded.active,updated_at=now();
  if (select count(distinct value->>'id') from jsonb_array_elements(p_train->'classes'))<>jsonb_array_length(p_train->'classes') then
    raise exception 'Travel classes must be unique.' using errcode='22023';
  end if;
  -- Existing bookings keep immutable snapshots. Referenced classes cannot be removed or shrink below sold inventory.
  if exists(select 1 from public.train_classes c where c.train_id=v_id and c.class_id not in (select value->>'id' from jsonb_array_elements(p_train->'classes'))
    and exists(select 1 from public.bookings b where b.train_id=c.train_id and b.class_id=c.class_id)) then
    raise exception 'A class with booking history cannot be removed.' using errcode='22023';
  end if;
  for v_class in select value from jsonb_array_elements(p_train->'classes') loop
    if jsonb_typeof(v_class) is distinct from 'object' or exists(select 1 from unnest(array['id','name','description']) k where jsonb_typeof(v_class->k) is distinct from 'string')
      or jsonb_typeof(v_class->'price') is distinct from 'number' or jsonb_typeof(v_class->'capacity') is distinct from 'number'
      or jsonb_typeof(v_class->'reserved') is distinct from 'boolean' or (v_class->>'price') !~ '^[0-9]{1,7}$' or (v_class->>'capacity') !~ '^[0-9]{1,4}$' then
      raise exception 'Invalid travel class fields.' using errcode='22023';
    end if;
    if exists(select 1 from public.bookings b where b.train_id=v_id and b.class_id=v_class->>'id' and b.status='Confirmed'
      and b.travel_date >= (now() at time zone 'Asia/Colombo')::date group by b.travel_date having sum(b.passenger_count)>(v_class->>'capacity')::integer)
      or exists(select 1 from public.booking_seats s where s.train_id=v_id and s.class_id=v_class->>'id'
        and s.travel_date >= (now() at time zone 'Asia/Colombo')::date
        and (left(s.seat_number,length(s.seat_number)-1)::integer-1)*4+strpos('ABCD',right(s.seat_number,1))>(v_class->>'capacity')::integer) then
      raise exception 'Capacity cannot be reduced below existing reservations.' using errcode='22023';
    end if;
    insert into public.train_classes(train_id,class_id,name,description,price,reserved,capacity)
      values(v_id,v_class->>'id',v_class->>'name',v_class->>'description',(v_class->>'price')::integer,(v_class->>'reserved')::boolean,(v_class->>'capacity')::integer)
      on conflict(train_id,class_id) do update set name=excluded.name,description=excluded.description,price=excluded.price,reserved=excluded.reserved,capacity=excluded.capacity;
  end loop;
  delete from public.train_classes where train_id=v_id and class_id not in(select value->>'id' from jsonb_array_elements(p_train->'classes'));
  insert into public.schedules(id,train_id,days,active)
    values('schedule-'||v_id,v_id,'Daily',true) on conflict(train_id) do nothing;
  return private.train_json(v_id);
end;
$$;
create function public.upsert_train(p_train jsonb) returns jsonb language sql security invoker set search_path = '' as $$ select private.upsert_train(p_train); $$;

-- Functions are not executable by PUBLIC. Expose only the narrow approved RPC surface.
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.catalog(),public.get_bookings(boolean),public.get_availability(text,date,text),public.create_booking(jsonb),public.cancel_booking(uuid),public.upsert_train(jsonb) from public,anon,authenticated;
grant execute on function private.is_admin(),private.catalog(),private.get_availability(text,date,text) to anon, authenticated;
grant execute on function public.catalog(),public.get_availability(text,date,text) to anon,authenticated;
grant execute on function private.get_bookings(boolean),private.create_booking(jsonb),private.cancel_booking(uuid),private.upsert_train(jsonb) to authenticated;
grant execute on function public.get_bookings(boolean),public.create_booking(jsonb),public.cancel_booking(uuid),public.upsert_train(jsonb) to authenticated;

commit;
