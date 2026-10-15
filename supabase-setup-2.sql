-- ============================================================
-- ส่วนที่ 2: สำรองคลังสินค้า / ล็อตอบแห้ง / ล็อตแปรรูป / รายการขาย
-- วิธีใช้: Supabase → SQL Editor → New query → วางทั้งหมด → Run
-- รันซ้ำได้ ไม่ลบข้อมูลเดิม
-- ============================================================
create table if not exists public.app_store (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.app_store enable row level security;
drop policy if exists "web_app_all" on public.app_store;
create policy "web_app_all" on public.app_store for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on public.app_store to anon, authenticated;

-- ตรวจผล: ควรเห็น app_store
select table_name from information_schema.tables where table_schema = 'public' and table_name = 'app_store';
