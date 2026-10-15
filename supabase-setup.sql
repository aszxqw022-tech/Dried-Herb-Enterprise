-- ============================================================
-- ตั้งค่า Supabase ให้เก็บ รอบเพาะปลูก / รับซื้อดอกสด / บิลขาย
-- วิธีใช้: Supabase → SQL Editor → New query → วางทั้งหมด → Run
-- รันซ้ำได้ ไม่ลบข้อมูลเดิม
-- ============================================================

-- 1) ตารางรอบเพาะปลูก: เพิ่มคอลัมน์ที่ขาด
alter table public.crops add column if not exists crop_cycle int;
alter table public.crops add column if not exists seedling_source text;
alter table public.crops add column if not exists step_progress jsonb default '{}'::jsonb;
alter table public.crops add column if not exists extra jsonb;

-- 2) ตารางรับซื้อดอกสดจากสมาชิก
create table if not exists public.fresh_purchases (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 3) ตารางบิลขาย (REC-...)
create table if not exists public.direct_sales (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 4) สิทธิ์อ่าน/เขียนจากหน้าเว็บ (ใช้คีย์ publishable)
do $$
declare t text;
begin
  foreach t in array array['crops','fresh_purchases','direct_sales'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "web_app_all" on public.%I', t);
    execute format('create policy "web_app_all" on public.%I for all to anon, authenticated using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
  end loop;
end $$;

-- ตรวจผล: ควรเห็น 3 ตาราง
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('crops','fresh_purchases','direct_sales');
