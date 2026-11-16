-- Torus BD Dashboard: database schema (Supabase / Postgres)
-- Run once in the Supabase SQL editor. Safe to re-run: every statement is idempotent.
--
-- PRIVACY: this database never holds patient data. Patient leads are stored only as
-- monthly COUNTS per channel, source and credited partner/event. The IntakeQ export is
-- summarised in the browser; names, IDs, dates of birth, PHQ-9 and insurance never leave it.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Team: only these emails can read or write anything.
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
  email      text primary key check (email = lower(email)),
  name       text not null default '',
  role       text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

create or replace function public.is_team() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members where email = lower(coalesce(auth.jwt() ->> 'email', '')) and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Records
-- ---------------------------------------------------------------------------
create table if not exists public.partners (
  id             text primary key,                       -- P-001
  contact        text not null,
  org            text not null,
  type           text not null default 'Clinical referrer',
  activity       text not null default 'A1',             -- A1..A5 (playbook activities)
  specialty      text not null default '',
  city           text not null default '',
  phone          text not null default '',
  status         text not null default 'Cold'
                 check (status in ('Cold','Warm','Sent materials','Meeting scheduled','Referral made','Active referrer','Not a fit')),
  owner          text not null default '',
  next_follow_up date,
  next_step      text not null default '',
  met_at         text,                                   -- event id where first met
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.touches (
  id         uuid primary key default gen_random_uuid(),
  partner_id text not null references public.partners(id) on delete cascade,
  date       date not null default current_date,
  method     text not null default 'Email',
  done_by    text not null default '',
  outcome    text not null default '',
  note       text not null default '',
  hours      numeric(6,2) not null default 0 check (hours >= 0),
  cost       numeric(10,2) not null default 0 check (cost >= 0),
  created_at timestamptz not null default now()
);
create index if not exists touches_partner_idx on public.touches(partner_id);

create table if not exists public.events (
  id         text primary key,                           -- E-001
  name       text not null,
  type       text not null default 'Community talk',
  activity   text not null default 'A4',
  date       date not null,
  venue_id   text references public.partners(id) on delete set null,
  format     text not null default 'In-person',
  attendees  integer not null default 0 check (attendees >= 0),
  signups    integer not null default 0 check (signups >= 0),
  cost       numeric(10,2) not null default 0 check (cost >= 0),
  hours      numeric(6,2) not null default 0 check (hours >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.partners drop constraint if exists partners_met_at_fkey;
alter table public.partners add constraint partners_met_at_fkey foreign key (met_at) references public.events(id) on delete set null;

-- Monthly aggregate patient-lead counts. No row identifies a patient.
create table if not exists public.lead_counts (
  id         uuid primary key default gen_random_uuid(),
  month      date not null check (extract(day from month) = 1),
  via        text not null,                              -- Discovery form (website), Phone call, ...
  source     text not null,                              -- How they heard about us
  credit_id  text not null default '',                   -- P-### / E-### or '' (digital / direct)
  leads      integer not null default 0 check (leads >= 0),
  consults   integer not null default 0 check (consults >= 0),
  converted  integer not null default 0 check (converted >= 0),
  revenue    numeric(12,2) not null default 0 check (revenue >= 0),
  updated_at timestamptz not null default now(),
  unique (month, via, source, credit_id)
);

create table if not exists public.settings (
  id         integer primary key default 1 check (id = 1),
  open_date  date not null default current_date,
  staff_cost numeric(8,2) not null default 50 check (staff_cost >= 0)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Keep updated_at honest
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists partners_updated on public.partners;
create trigger partners_updated before update on public.partners for each row execute function public.touch_updated_at();
drop trigger if exists events_updated on public.events;
create trigger events_updated before update on public.events for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security: team members only. Admins manage the team list.
-- ---------------------------------------------------------------------------
alter table public.team_members enable row level security;
alter table public.partners     enable row level security;
alter table public.touches      enable row level security;
alter table public.events       enable row level security;
alter table public.lead_counts  enable row level security;
alter table public.settings     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['partners','touches','events','lead_counts','settings'] loop
    execute format('drop policy if exists team_all on public.%I', t);
    execute format('create policy team_all on public.%I for all to authenticated using (public.is_team()) with check (public.is_team())', t);
  end loop;
end $$;

drop policy if exists team_read on public.team_members;
create policy team_read on public.team_members for select to authenticated using (public.is_team());
drop policy if exists admin_write on public.team_members;
create policy admin_write on public.team_members for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Replace the counts for every (month, channel) pair present in an import, in one transaction.
create or replace function public.replace_lead_counts(p_rows jsonb) returns integer
language plpgsql security invoker set search_path = public as $$
declare n integer;
begin
  if not public.is_team() then raise exception 'not on the Torus team'; end if;
  delete from public.lead_counts lc
   using (select distinct (r->>'month')::date as month, r->>'via' as via from jsonb_array_elements(p_rows) r) k
   where lc.month = k.month and lc.via = k.via;
  insert into public.lead_counts (month, via, source, credit_id, leads, consults, converted, revenue)
  select (r->>'month')::date, r->>'via', r->>'source', coalesce(r->>'credit_id', ''),
         coalesce((r->>'leads')::int, 0), coalesce((r->>'consults')::int, 0),
         coalesce((r->>'converted')::int, 0), coalesce((r->>'revenue')::numeric, 0)
    from jsonb_array_elements(p_rows) r;
  get diagnostics n = row_count;
  return n;
end; $$;

-- ---------------------------------------------------------------------------
-- Live updates (Supabase Realtime)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['partners','touches','events','lead_counts','settings'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- FIRST ADMIN: replace with your email, then run this line.
-- ---------------------------------------------------------------------------
-- insert into public.team_members (email, name, role) values ('you@torusmedicine.com', 'Your name', 'admin') on conflict (email) do update set role = 'admin';
