-- Independent Workforce C/TPA application, version 1.
-- Exactly one new record store. No reads, writes, or dependencies on legacy business tables.
-- Existing records are intentionally NOT migrated at this stage.
create table if not exists public.workforce_unified_records (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null,
 kind text not null check (kind ~ '^[a-z][a-z0-9_]{1,63}$'),
 operating_context text not null default 'shared' check (operating_context in ('dot','nondot','shared')),
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 65536),
 created_by uuid,
 updated_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 archived_at timestamptz
);
create index if not exists workforce_unified_tenant_kind_context_idx
 on public.workforce_unified_records (tenant_id,kind,operating_context,updated_at desc)
 where archived_at is null;
create index if not exists workforce_unified_member_lookup_idx
 on public.workforce_unified_records ((data->>'user_id'), tenant_id)
 where kind='membership' and archived_at is null;
create unique index if not exists workforce_unified_org_unique_idx
 on public.workforce_unified_records (tenant_id) where kind='organization' and archived_at is null;
create unique index if not exists workforce_unified_membership_unique_idx
 on public.workforce_unified_records (tenant_id,(data->>'user_id'))
 where kind='membership' and archived_at is null;
alter table public.workforce_unified_records enable row level security;
revoke all on public.workforce_unified_records from public, anon, authenticated;
grant select, insert, update, delete on public.workforce_unified_records to service_role;
-- All access goes through the one authenticated Edge Function.
-- Its verified membership checks ensure tenant and role isolation.
