-- =========================================================================
-- สคริปต์สร้างตารางและบรรจุข้อมูลทั้งหมดเข้า Supabase (DDL & Complete Seed)
-- สำหรับ: วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านศรีดอนมูล
-- URL: https://vqoyvedycwyqjpfbuaxw.supabase.co
-- Key: sb_publishable_rwjQGqAeYDS-IwRAi2tKBQ_5bWxbKrt
-- =========================================================================

-- 1. ตารางข้อมูลวิสาหกิจชุมชน (Enterprise Profile)
CREATE TABLE IF NOT EXISTS public.enterprise_profile (
    id BIGINT PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL DEFAULT 'วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านศรีดอนมูล',
    village TEXT DEFAULT 'หมู่ที่ 12',
    subdistrict TEXT DEFAULT 'ศรีดอนมูล',
    district TEXT DEFAULT 'เชียงแสน',
    province TEXT DEFAULT 'เชียงราย',
    zipcode TEXT DEFAULT '57150',
    phone TEXT DEFAULT '061-139-1105',
    email TEXT DEFAULT 'sridonmun.driedherbs@gmail.com',
    chairman TEXT DEFAULT 'นายวีรวัฒน์ ปินทรายมูล',
    description TEXT,
    committee JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางชนิดพืชสมุนไพร (Herbs Catalog)
CREATE TABLE IF NOT EXISTS public.herbs_catalog (
    herb_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    icon TEXT,
    standard_ratio NUMERIC DEFAULT 8.0,
    fresh_buying_price NUMERIC DEFAULT 50,
    dry_selling_price_kg NUMERIC DEFAULT 250,
    jar_selling_price_50g NUMERIC DEFAULT 150,
    growth_days INT DEFAULT 90,
    dry_loss_pct NUMERIC DEFAULT 87.5,
    baseline_price_fresh NUMERIC DEFAULT 50,
    baseline_price_dry NUMERIC DEFAULT 250,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางสมาชิกวิสาหกิจ (Members - 33 ท่าน)
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    village_number TEXT,
    join_date DATE,
    house_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางแปลงเพาะปลูก (Plots - 32 แปลง ชื่อสะอาดไม่มีวงเล็บต่อท้าย)
CREATE TABLE IF NOT EXISTS public.plots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    member_ids JSONB DEFAULT '[]'::jsonb,
    size_rai INT DEFAULT 0,
    size_ngan INT DEFAULT 0,
    size_sq_wah NUMERIC DEFAULT 0,
    plant_type TEXT,
    lat NUMERIC,
    lng NUMERIC,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางรอบการเพาะปลูก (Crops / Planting Cycles)
CREATE TABLE IF NOT EXISTS public.crops (
    id TEXT PRIMARY KEY,
    plot_id TEXT NOT NULL,
    plant_date DATE,
    cost NUMERIC DEFAULT 0,
    crop_year INT DEFAULT 2569,
    crop_cycle INT DEFAULT 1,
    harvest_date_est DATE,
    fert_date_est DATE,
    harvest_date_actual DATE,
    seedling_count INT DEFAULT 0,
    seedling_source TEXT,
    yield NUMERIC,
    status TEXT DEFAULT 'growing',
    note TEXT,
    is_processed BOOLEAN DEFAULT FALSE,
    drying_date DATE,
    fresh_used NUMERIC,
    dry_weight NUMERIC,
    harvest_note TEXT,
    fertilizing_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางสต็อกสินค้า/การอบแห้ง (Inventory)
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    crop_id TEXT,
    herb_type TEXT,
    dry_stock_kg NUMERIC DEFAULT 0,
    processed_date DATE,
    dry_date DATE,
    quality_grade TEXT DEFAULT 'A',
    cost_per_kg NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'available',
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ตารางแคตตาล็อกสินค้าสำเร็จรูป (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'กก.',
    stock NUMERIC DEFAULT 0,
    category TEXT,
    updated_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ตารางลูกค้าและคู่ค้า (Customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    customer_type TEXT,
    phone TEXT,
    line_id TEXT,
    facebook TEXT,
    address TEXT,
    contact_channel TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ตารางประวัติการขาย (Sales)
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    inventory_id TEXT,
    crop_id TEXT,
    customer_id TEXT,
    customer_name TEXT,
    quantity_kg NUMERIC DEFAULT 0,
    price_per_kg NUMERIC DEFAULT 0,
    total_price NUMERIC DEFAULT 0,
    sale_date DATE,
    buyer_phone TEXT,
    invoice_no TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ตารางเตาอบแห้ง (Drying Batches)
CREATE TABLE IF NOT EXISTS public.drying_batches (
    id TEXT PRIMARY KEY,
    herb_type TEXT,
    total_fresh_available_kg NUMERIC,
    fresh_weight_kg NUMERIC,
    dry_weight_kg NUMERIC,
    ratio_actual TEXT,
    processed_date DATE,
    note TEXT,
    crop_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ตารางการบรรจุภัณฑ์ (Packaging Batches)
CREATE TABLE IF NOT EXISTS public.packaging_batches (
    id TEXT PRIMARY KEY,
    herb_type TEXT,
    dry_used_kg NUMERIC,
    package_size TEXT,
    jars_produced INT,
    processed_date DATE,
    product_id TEXT,
    product_name TEXT,
    operator_name TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- การตั้งค่าความปลอดภัย Row Level Security (RLS) เพื่ออนุญาตการอ่าน-เขียน
-- =========================================================================
ALTER TABLE public.enterprise_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.herbs_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drying_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_batches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow anon enterprise_profile" ON public.enterprise_profile;
    CREATE POLICY "Allow anon enterprise_profile" ON public.enterprise_profile FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon herbs_catalog" ON public.herbs_catalog;
    CREATE POLICY "Allow anon herbs_catalog" ON public.herbs_catalog FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon members" ON public.members;
    CREATE POLICY "Allow anon members" ON public.members FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon plots" ON public.plots;
    CREATE POLICY "Allow anon plots" ON public.plots FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon crops" ON public.crops;
    CREATE POLICY "Allow anon crops" ON public.crops FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon inventory" ON public.inventory;
    CREATE POLICY "Allow anon inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon products" ON public.products;
    CREATE POLICY "Allow anon products" ON public.products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon customers" ON public.customers;
    CREATE POLICY "Allow anon customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon sales" ON public.sales;
    CREATE POLICY "Allow anon sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon drying_batches" ON public.drying_batches;
    CREATE POLICY "Allow anon drying_batches" ON public.drying_batches FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon packaging_batches" ON public.packaging_batches;
    CREATE POLICY "Allow anon packaging_batches" ON public.packaging_batches FOR ALL USING (true) WITH CHECK (true);
END $$;

-- =========================================================================
-- บรรจุข้อมูลเริ่มต้น (SEED DATA)
-- =========================================================================

-- 1. ข้อมูลวิสาหกิจ
INSERT INTO public.enterprise_profile (id, name, village, subdistrict, district, province, zipcode, phone, email, chairman, description, committee)
VALUES (
    1,
    'วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านศรีดอนมูล',
    'หมู่ที่ 12',
    'ศรีดอนมูล',
    'เชียงแสน',
    'เชียงราย',
    '57150',
    '061-139-1105',
    'sridonmun.driedherbs@gmail.com',
    'นายวีรวัฒน์ ปินทรายมูล',
    'กลุ่มเกษตรกรผลิตและแปรรูปสมุนไพรอบแห้งปลอดสารพิษเพื่อความยั่งยืน เก๊กฮวย คาโมมายล์ และสมุนไพรพื้นบ้าน',
    '{
        "president": { "name": "นายวีรวัฒน์ ปินทรายมูล", "phone": "061-139-1105" },
        "vicePresident": { "name": "นางแหม่ม สุตินกาศ", "phone": "089-765-4321" },
        "treasurer": { "name": "นายมานะ รักเกษตร", "phone": "081-234-5699" },
        "secretary": { "name": "นางสมศรี มีวิถี", "phone": "081-234-5604" },
        "board": [
            { "role": "ฝ่ายแปรรูปและเตาอบ", "name": "นายวิชัย ปัญญาดี", "phone": "081-234-5605" },
            { "role": "ฝ่ายคลังสินค้าและบรรจุภัณฑ์", "name": "นางนภา สุขสบาย", "phone": "081-234-5606" },
            { "role": "ฝ่ายการตลาดและจัดจำหน่าย", "name": "นายดำรง รักชาติ", "phone": "081-234-5607" }
        ]
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    village = EXCLUDED.village,
    subdistrict = EXCLUDED.subdistrict,
    district = EXCLUDED.district,
    province = EXCLUDED.province,
    zipcode = EXCLUDED.zipcode,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    chairman = EXCLUDED.chairman,
    description = EXCLUDED.description,
    committee = EXCLUDED.committee,
    updated_at = NOW();

-- 2. แคตตาล็อกสมุนไพร
INSERT INTO public.herbs_catalog (herb_id, name, category, icon, standard_ratio, fresh_buying_price, dry_selling_price_kg, jar_selling_price_50g, growth_days, dry_loss_pct, baseline_price_fresh, baseline_price_dry, description, is_active)
VALUES
('HRB-001', 'เก๊กฮวย', 'ชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ', '🌼', 8.0, 50, 250, 150, 90, 87.5, 50, 250, 'พืชสมุนไพรเด่น ดอกสีเหลืองทอง กลิ่นหอม บำรุงตับ ดับพิษร้อน ปลูกง่าย ผลผลิตคุ้มค่า', true),
('HRB-002', 'คาโมมายล์', 'ชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ', '🌼', 6.0, 70, 450, 100, 90, 83.3, 70, 450, 'สมุนไพรพรีเมียม กลิ่นหอมผ่อนคลาย ช่วยการนอนหลับ และคลายความตึงเครียด', true)
ON CONFLICT (herb_id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    standard_ratio = EXCLUDED.standard_ratio,
    fresh_buying_price = EXCLUDED.fresh_buying_price,
    dry_selling_price_kg = EXCLUDED.dry_selling_price_kg,
    jar_selling_price_50g = EXCLUDED.jar_selling_price_50g,
    growth_days = EXCLUDED.growth_days,
    dry_loss_pct = EXCLUDED.dry_loss_pct,
    baseline_price_fresh = EXCLUDED.baseline_price_fresh,
    baseline_price_dry = EXCLUDED.baseline_price_dry,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 3. สมาชิก 33 ท่าน
INSERT INTO public.members (id, name, role, phone, status, village_number, join_date, house_number)
VALUES
('MEM-001', 'นายวีรวัฒน์ ปินทรายมูล', 'ประธานกลุ่ม', '061-139-1105', 'active', 'หมู่ 12', '2024-01-10', '12/4'),
('MEM-002', 'นางแหม่ม สุตินกาศ', 'รองประธาน', '089-765-4321', 'active', 'หมู่ 12', '2024-01-15', '12/5'),
('MEM-003', 'นายมานะ รักเกษตร', 'เหรัญญิก', '081-234-5699', 'active', 'หมู่ 7', '2024-01-15', '45/1'),
('MEM-004', 'นางสมศรี มีวิถี', 'เลขานุการ', '081-234-5604', 'active', 'หมู่ 1', '2024-01-20', '18'),
('MEM-005', 'นายวิชัย ปัญญาดี', 'กรรมการ', '081-234-5605', 'active', 'หมู่ 7', '2024-02-01', '99/2'),
('MEM-006', 'นางนภา สุขสบาย', 'กรรมการ', '081-234-5606', 'active', 'หมู่ 1', '2024-02-05', '24/1'),
('MEM-007', 'นายดำรง รักชาติ', 'กรรมการ', '081-234-5607', 'active', 'หมู่ 7', '2024-02-10', '55'),
('MEM-008', 'นางสมปอง สุขสำราญ', 'สมาชิกทั่วไป', '081-234-5608', 'active', 'หมู่ 1', '2024-02-10', '102'),
('MEM-009', 'นายบุญมี ทองคำ', 'สมาชิกทั่วไป', '081-234-5609', 'active', 'หมู่ 7', '2024-02-12', '7/3'),
('MEM-010', 'นางประกาย แสงทอง', 'สมาชิกทั่วไป', '081-234-5610', 'active', 'หมู่ 7', '2024-02-15', '88'),
('MEM-011', 'นายสุรพล เด่นดี', 'สมาชิกทั่วไป', '081-234-5611', 'active', 'หมู่ 1', '2024-02-20', '14/2'),
('MEM-012', 'นางวิมล รุ่งเรือง', 'สมาชิกทั่วไป', '081-234-5612', 'active', 'หมู่ 7', '2024-02-22', '33'),
('MEM-013', 'นายเกรียงไกร ใฝ่ดี', 'สมาชิกทั่วไป', '081-234-5613', 'active', 'หมู่ 1', '2024-03-01', '61/4'),
('MEM-014', 'นางนงนุช สุดสวย', 'สมาชิกทั่วไป', '081-234-5614', 'active', 'หมู่ 7', '2024-03-05', '40'),
('MEM-015', 'นายทวีลาภ ลาภดี', 'สมาชิกทั่วไป', '081-234-5615', 'active', 'หมู่ 1', '2024-03-10', '115'),
('MEM-016', 'นางพิศมัย ใจธรรม', 'สมาชิกทั่วไป', '081-234-5616', 'active', 'หมู่ 7', '2024-03-12', '29'),
('MEM-017', 'นายอดุลย์ อบอุ่น', 'สมาชิกทั่วไป', '081-234-5617', 'active', 'หมู่ 1', '2024-03-15', '82/1'),
('MEM-018', 'นางสาวสุดา ชาเขียว', 'สมาชิกทั่วไป', '081-234-5618', 'active', 'หมู่ 7', '2024-03-18', '19'),
('MEM-019', 'นายสมหมาย มั่นคง', 'สมาชิกทั่วไป', '081-234-5619', 'active', 'หมู่ 1', '2024-03-20', '104'),
('MEM-020', 'นางอรอนงค์ โฉมงาม', 'สมาชิกทั่วไป', '081-234-5620', 'active', 'หมู่ 7', '2024-03-22', '73/2'),
('MEM-021', 'นายประจักษ์ รักสงบ', 'สมาชิกทั่วไป', '081-234-5621', 'active', 'หมู่ 1', '2024-03-25', '51'),
('MEM-022', 'นางสาวรุ่งทิวา แสงดาว', 'สมาชิกทั่วไป', '081-234-5622', 'active', 'หมู่ 7', '2024-04-01', '95'),
('MEM-023', 'นายประเสริฐ ดีเลิศ', 'สมาชิกทั่วไป', '081-234-5623', 'active', 'หมู่ 1', '2024-04-05', '37/1'),
('MEM-024', 'นางสาวกมลวรรณ ชื่นใจ', 'สมาชิกทั่วไป', '081-234-5624', 'active', 'หมู่ 7', '2024-04-10', '6/2'),
('MEM-025', 'นายพิชัย ชูชาติ', 'สมาชิกทั่วไป', '081-234-5625', 'active', 'หมู่ 1', '2024-04-12', '128'),
('MEM-026', 'นางชลลดา ปันแก้ว', 'สมาชิกทั่วไป', '081-234-5626', 'active', 'หมู่ 7', '2024-04-15', '84'),
('MEM-027', 'นายธวัชชัย ยอดดี', 'สมาชิกทั่วไป', '081-234-5627', 'active', 'หมู่ 1', '2024-04-20', '111/3'),
('MEM-028', 'นางมธุรส หอมกลิ่น', 'สมาชิกทั่วไป', '081-234-5628', 'active', 'หมู่ 7', '2024-04-22', '48'),
('MEM-029', 'นายเสนาะ ร้องเพราะ', 'สมาชิกทั่วไป', '081-234-5629', 'inactive', 'หมู่ 1', '2024-04-25', '15/1'),
('MEM-030', 'นางอัญชลี รื่นรมย์', 'สมาชิกทั่วไป', '081-234-5630', 'active', 'หมู่ 7', '2024-04-28', '67'),
('MEM-031', 'นายอุดม ศรีทอง', 'สมาชิกทั่วไป', '081-234-5631', 'active', 'หมู่ 1', '2024-05-01', '2/1'),
('MEM-032', 'นางรักษ์ชนก อุดมดี', 'สมาชิกทั่วไป', '081-234-5632', 'active', 'หมู่ 7', '2024-05-05', '93'),
('MEM-033', 'นายพชรพล อิ่มเอม', 'สมาชิกทั่วไป', '081-234-5633', 'active', 'หมู่ 1', '2024-05-10', '58/2')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    village_number = EXCLUDED.village_number,
    join_date = EXCLUDED.join_date,
    house_number = EXCLUDED.house_number;

-- 4. แปลงเพาะปลูก 32 แปลง (ชื่อแปลงสะอาด)
INSERT INTO public.plots (id, name, member_ids, size_rai, size_ngan, size_sq_wah, plant_type, lat, lng, status)
VALUES
('P - 001', 'แปลงสวนหน้าบ้าน', '["MEM-001"]'::jsonb, 3, 1, 50, 'เก๊กฮวย', 20.3112, 99.9964, 'active'),
('P - 002', 'แปลงริมคลองส่งน้ำ', '["MEM-002"]'::jsonb, 2, 2, 20, 'คาโมมายล์', 20.3125, 99.9948, 'active'),
('P - 003', 'แปลงเชิงเขาม่อนแก้ว', '["MEM-003"]'::jsonb, 4, 0, 80, 'เก๊กฮวย', 20.3402, 100.0185, 'active'),
('P - 004', 'แปลงทุ่งรวงทอง', '["MEM-005"]'::jsonb, 2, 3, 0, 'เก๊กฮวย', 20.3395, 100.0168, 'active'),
('P - 005', 'แปลงหนองบัวงาม', '["MEM-007"]'::jsonb, 3, 1, 40, 'เก๊กฮวย', 20.3418, 100.0192, 'active'),
('P - 006', 'แปลงม่อนแสงจันทร์', '["MEM-009"]'::jsonb, 3, 0, 50, 'เก๊กฮวย', 20.3384, 100.0210, 'active'),
('P - 007', 'แปลงสวนเกสรทอง', '["MEM-010"]'::jsonb, 1, 2, 80, 'เก๊กฮวย', 20.3425, 100.0174, 'active'),
('P - 008', 'แปลงดอนมูลพัฒนา', '["MEM-012"]'::jsonb, 2, 1, 60, 'เก๊กฮวย', 20.3408, 100.0225, 'active'),
('P - 009', 'แปลงสวนสมุนไพรทวีสุข', '["MEM-014"]'::jsonb, 2, 3, 10, 'เก๊กฮวย', 20.3432, 100.0159, 'active'),
('P - 010', 'แปลงเนินดินทอง', '["MEM-016"]'::jsonb, 3, 2, 0, 'เก๊กฮวย', 20.3376, 100.0188, 'active'),
('P - 011', 'แปลงชาเขียวเกสร', '["MEM-018"]'::jsonb, 2, 0, 45, 'เก๊กฮวย', 20.3441, 100.0205, 'active'),
('P - 012', 'แปลงสวนงามตา', '["MEM-020"]'::jsonb, 1, 3, 50, 'เก๊กฮวย', 20.3390, 100.0238, 'active'),
('P - 013', 'แปลงแสงดาวสว่าง', '["MEM-022"]'::jsonb, 2, 1, 20, 'เก๊กฮวย', 20.3415, 100.0146, 'active'),
('P - 014', 'แปลงชื่นใจสมุนไพร', '["MEM-024"]'::jsonb, 3, 0, 0, 'เก๊กฮวย', 20.3381, 100.0171, 'active'),
('P - 015', 'แปลงแก้วตาปันสุข', '["MEM-026"]'::jsonb, 2, 2, 30, 'เก๊กฮวย', 20.3429, 100.0218, 'active'),
('P - 016', 'แปลงหอมกลิ่นดอกไม้', '["MEM-028"]'::jsonb, 1, 3, 80, 'เก๊กฮวย', 20.3400, 100.0245, 'active'),
('P - 017', 'แปลงรื่นรมย์สมถะ', '["MEM-030"]'::jsonb, 2, 0, 15, 'เก๊กฮวย', 20.3438, 100.0182, 'active'),
('P - 018', 'แปลงอุดมสุขทรัพย์', '["MEM-032"]'::jsonb, 3, 1, 0, 'เก๊กฮวย', 20.3368, 100.0162, 'active'),
('P - 019', 'แปลงใกล้หอประชุม', '["MEM-004"]'::jsonb, 1, 3, 50, 'คาโมมายล์', 20.3572, 100.0018, 'active'),
('P - 020', 'แปลงสวนดอนแก้ว', '["MEM-006"]'::jsonb, 2, 1, 40, 'คาโมมายล์', 20.3561, 100.0035, 'active'),
('P - 021', 'แปลงร่มไม้ชายทุ่ง', '["MEM-008"]'::jsonb, 3, 0, 0, 'คาโมมายล์', 20.3585, 100.0004, 'active'),
('P - 022', 'แปลงห้วยน้ำริน', '["MEM-011"]'::jsonb, 2, 2, 25, 'คาโมมายล์', 20.3548, 100.0022, 'active'),
('P - 023', 'แปลงสันป่าเปา', '["MEM-013"]'::jsonb, 3, 1, 0, 'คาโมมายล์', 20.3592, 100.0041, 'active'),
('P - 024', 'แปลงลาภดีมีสุข', '["MEM-015"]'::jsonb, 1, 2, 70, 'คาโมมายล์', 20.3556, 99.9992, 'active'),
('P - 025', 'แปลงอบอุ่นใจ', '["MEM-017"]'::jsonb, 2, 0, 50, 'คาโมมายล์', 20.3578, 100.0053, 'active'),
('P - 026', 'แปลงมั่นคงถาวร', '["MEM-019"]'::jsonb, 3, 2, 10, 'คาโมมายล์', 20.3540, 100.0010, 'active'),
('P - 027', 'แปลงสงบร่มเย็น', '["MEM-021"]'::jsonb, 2, 1, 35, 'คาโมมายล์', 20.3568, 99.9981, 'active'),
('P - 028', 'แปลงเลิศรสสมุนไพร', '["MEM-023"]'::jsonb, 1, 3, 80, 'คาโมมายล์', 20.3589, 100.0028, 'active'),
('P - 029', 'แปลงชูชาติเกษตร', '["MEM-025"]'::jsonb, 2, 3, 0, 'คาโมมายล์', 20.3550, 100.0048, 'active'),
('P - 030', 'แปลงยอดดีพัฒนา', '["MEM-027"]'::jsonb, 3, 0, 60, 'คาโมมายล์', 20.3601, 100.0015, 'active'),
('P - 031', 'แปลงศรีทองพืชผล', '["MEM-031"]'::jsonb, 2, 2, 40, 'คาโมมายล์', 20.3564, 100.0060, 'active'),
('P - 032', 'แปลงอิ่มเอมใจ', '["MEM-033"]'::jsonb, 1, 3, 20, 'คาโมมายล์', 20.3580, 99.9998, 'active')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    member_ids = EXCLUDED.member_ids,
    size_rai = EXCLUDED.size_rai,
    size_ngan = EXCLUDED.size_ngan,
    size_sq_wah = EXCLUDED.size_sq_wah,
    plant_type = EXCLUDED.plant_type,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    status = EXCLUDED.status;

-- 5. แคตตาล็อกสินค้า 7 รายการ
INSERT INTO public.products (id, name, price, unit, stock, category, updated_date)
VALUES
('PRD-001', 'ดอกเก๊กฮวยอบแห้ง (1 กก.)', 250, 'กก.', 25.0, 'เก๊กฮวย', '2026-06-07'),
('PRD-002', 'ดอกคาโมมายล์อบแห้ง (1 กก.)', 450, 'กก.', 15.0, 'คาโมมายล์', '2026-06-20'),
('PRD-003', 'เก๊กฮวยกระป๋อง (50 G)', 150, 'กระป๋อง', 100, 'เก๊กฮวย', '2026-07-01'),
('PRD-004', 'คาโมมายล์กระป๋อง (50 G)', 100, 'กระป๋อง', 50, 'คาโมมายล์', '2026-07-01'),
('PRD-005', 'ชาเก๊กฮวยแบบกระป๋อง', 95, 'กระป๋อง', 80, 'เก๊กฮวย', '2026-07-05'),
('PRD-006', 'เก๊กฮวยกระป๋อง (100 กรัม)', 280, 'กระป๋อง', 0, 'เก๊กฮวย', '2026-07-05'),
('PRD-007', 'คาโมมายล์กระป๋อง (100 กรัม)', 180, 'กระป๋อง', 0, 'คาโมมายล์', '2026-07-05')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    unit = EXCLUDED.unit,
    stock = EXCLUDED.stock,
    category = EXCLUDED.category,
    updated_date = EXCLUDED.updated_date;

-- 6. ลูกค้า 6 ราย
INSERT INTO public.customers (id, name, customer_type, phone, line_id, facebook, address, contact_channel)
VALUES
('CUST-001', 'ร้านชาสมุนไพรม่อนแจ่ม', 'ร้านคาเฟ่/ร้านขายของฝาก', '081-998-1122', '@monchamtea', 'ม่อนแจ่ม ชาสมุนไพรแท้', '99 ม.7 ต.แม่แรม อ.แม่ริม จ.เชียงใหม่ 50180', 'Line: @monchamtea'),
('CUST-002', 'กลุ่มท่องเที่ยวแม่ริม', 'ตัวแทนจำหน่าย', '089-776-5544', 'maerim_tour', 'กลุ่มท่องเที่ยวแม่ริม Maerim Travel', '15/2 ถ.โชตนา ต.ริมใต้ อ.แม่ริม จ.เชียงใหม่ 50180', 'FB: MaerimTravelGroup'),
('CUST-003', 'คุณสมหญิง อารีย์พร', 'ลูกค้าทั่วไป', '084-332-1100', 'somying.a', 'Somying Areephon', '108 ม.2 ต.ศรีดอนมูล อ.เชียงแสน จ.เชียงราย 57150', 'โทรศัพท์'),
('CUST-004', 'โรงงานเวชสำอางสมุนไพรล้านนา', 'ซื้อส่งโรงงาน', '053-219-880', '@lannaherb_factory', 'โรงงานสมุนไพรล้านนาแล็บ', '45/1 นิคมอุตสาหกรรมภาคเหนือ ต.บ้านกลาง อ.เมือง จ.ลำพูน 51000', 'Line: @lannaherb_factory'),
('CUST-005', 'ร้านคาเฟ่บ้านชาดอนมูล', 'ร้านคาเฟ่/ร้านขายของฝาก', '082-555-8901', '@donmun_tea', 'บ้านชาดอนมูล Organic Cafe', '22 ม.3 ต.ศรีดอนมูล อ.เชียงแสน จ.เชียงราย 57150', 'Line: @donmun_tea'),
('CUST-006', 'คุณนภาพร วงศ์สว่าง', 'ลูกค้าทั่วไป', '086-444-2211', 'naphaporn.w', 'Naphaporn Wongsawang', '55/9 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900', 'FB: Naphaporn Wongsawang')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    customer_type = EXCLUDED.customer_type,
    phone = EXCLUDED.phone,
    line_id = EXCLUDED.line_id,
    facebook = EXCLUDED.facebook,
    address = EXCLUDED.address,
    contact_channel = EXCLUDED.contact_channel;

-- 7. สต็อกการอบแห้ง (Inventory)
INSERT INTO public.inventory (id, crop_id, herb_type, dry_stock_kg, processed_date, dry_date, quality_grade, cost_per_kg, status)
VALUES
('INV-001', '2568/P001-R1', 'เก๊กฮวย', 15.0, '2026-06-07', '2026-06-07', 'A', 50, 'available'),
('INV-002', '2568/P002-R1', 'คาโมมายล์', 10.0, '2026-06-20', '2026-06-20', 'A', 70, 'available')
ON CONFLICT (id) DO UPDATE SET
    crop_id = EXCLUDED.crop_id,
    herb_type = EXCLUDED.herb_type,
    dry_stock_kg = EXCLUDED.dry_stock_kg,
    processed_date = EXCLUDED.processed_date,
    dry_date = EXCLUDED.dry_date,
    quality_grade = EXCLUDED.quality_grade,
    cost_per_kg = EXCLUDED.cost_per_kg,
    status = EXCLUDED.status;

-- 8. ประวัติการขาย (Sales)
INSERT INTO public.sales (id, inventory_id, crop_id, customer_id, customer_name, quantity_kg, price_per_kg, total_price, sale_date, buyer_phone, invoice_no)
VALUES
('SALE-001', 'INV-001', '2568/P001-R1', 'CUST-001', 'ร้านชาสมุนไพรม่อนแจ่ม', 5.0, 250, 1250, '2026-06-15', '081-998-1122', 'INV-001'),
('SALE-002', 'INV-002', '2568/P002-R1', 'CUST-002', 'กลุ่มท่องเที่ยวแม่ริม', 5.0, 450, 2250, '2026-06-25', '089-776-5544', 'INV-002')
ON CONFLICT (id) DO UPDATE SET
    inventory_id = EXCLUDED.inventory_id,
    crop_id = EXCLUDED.crop_id,
    customer_id = EXCLUDED.customer_id,
    customer_name = EXCLUDED.customer_name,
    quantity_kg = EXCLUDED.quantity_kg,
    price_per_kg = EXCLUDED.price_per_kg,
    total_price = EXCLUDED.total_price,
    sale_date = EXCLUDED.sale_date,
    buyer_phone = EXCLUDED.buyer_phone,
    invoice_no = EXCLUDED.invoice_no;

-- 9. เตาอบแห้งและบรรจุภัณฑ์
INSERT INTO public.drying_batches (id, herb_type, total_fresh_available_kg, fresh_weight_kg, dry_weight_kg, ratio_actual, processed_date, note, crop_ids)
VALUES
('DRY-6901', 'เก๊กฮวย', 150.0, 150.0, 15.0, '10.00', '2026-06-07', 'อบแห้งเตาพลังงานแสงอาทิตย์ ตู้อบ 1 (อัตราส่วนมาตรฐาน 10:1 สด 150 kg ได้แห้ง 15 kg)', '["2568/P001-R1"]'::jsonb),
('DRY-6902', 'คาโมมายล์', 100.0, 100.0, 10.0, '10.00', '2026-06-20', 'อบแห้งเตาลมร้อน ตู้อบ 2 (อัตราส่วนมาตรฐาน 10:1 สด 100 kg ได้แห้ง 10 kg)', '["2568/P002-R1"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    herb_type = EXCLUDED.herb_type,
    total_fresh_available_kg = EXCLUDED.total_fresh_available_kg,
    fresh_weight_kg = EXCLUDED.fresh_weight_kg,
    dry_weight_kg = EXCLUDED.dry_weight_kg,
    ratio_actual = EXCLUDED.ratio_actual,
    processed_date = EXCLUDED.processed_date,
    note = EXCLUDED.note,
    crop_ids = EXCLUDED.crop_ids;

INSERT INTO public.packaging_batches (id, herb_type, dry_used_kg, package_size, jars_produced, processed_date, product_id, product_name, operator_name, note)
VALUES
('PACK-6901', 'เก๊กฮวย', 5.00, '50 G', 100, '2026-07-01', 'PRD-003', 'เก๊กฮวยกระป๋อง (50 G)', 'นายวีรวัฒน์ ปินทรายมูล', 'บรรจุกระป๋องมาตรฐาน 50 G (150 บาท/กป.)'),
('PACK-6902', 'คาโมมายล์', 2.50, '50 G', 50, '2026-07-01', 'PRD-004', 'คาโมมายล์กระป๋อง (50 G)', 'นางแหม่ม สุตินกาศ', 'บรรจุกระป๋องมาตรฐาน 50 G (100 บาท/กป.)')
ON CONFLICT (id) DO UPDATE SET
    herb_type = EXCLUDED.herb_type,
    dry_used_kg = EXCLUDED.dry_used_kg,
    package_size = EXCLUDED.package_size,
    jars_produced = EXCLUDED.jars_produced,
    processed_date = EXCLUDED.processed_date,
    product_id = EXCLUDED.product_id,
    product_name = EXCLUDED.product_name,
    operator_name = EXCLUDED.operator_name,
    note = EXCLUDED.note;

-- 10. รอบเพาะปลูก (Crops) ปี 2569 รอบที่ 1 ทั้ง 32 แปลง + รอบ 2568
INSERT INTO public.crops (id, plot_id, plant_date, cost, crop_year, crop_cycle, harvest_date_est, fert_date_est, seedling_count, seedling_source, status, note, fertilizing_log)
VALUES
('2569/P001-R1', 'P - 001', '2026-08-27', 4500, 2569, 1, '2026-11-27', '2026-09-10', 800, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวยแปลงสวนหน้าบ้าน เตรียมดินด้วยปุ๋ยหมักชีวภาพ', '[{"date": "2026-08-27", "type": "ปุ๋ยหมักชีวภาพสูตรเตรียมดิน", "amount": "30 กิโลกรัม", "cost": 450, "note": "รองพื้นก่อนลงกล้า"}, {"date": "2026-09-10", "type": "น้ำหมักชีวภาพสูตรบำรุงต้นและใบ", "amount": "20 ลิตร", "cost": 350, "note": "บำรุงต้นรอบ 1"}]'::jsonb),
('2569/P002-R1', 'P - 002', '2026-08-28', 3200, 2569, 1, '2026-11-28', '2026-09-12', 500, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงริมคลองส่งน้ำ', '[{"date": "2026-08-28", "type": "ปุ๋ยคอกมูลไก่หมัก", "amount": "25 กิโลกรัม", "cost": 300, "note": "บำรุงต้นกล้าเริ่มต้น"}, {"date": "2026-09-12", "type": "น้ำหมักปลาชีวภาพเร่งราก", "amount": "15 ลิตร", "cost": 280, "note": "บำรุงต้นรอบ 1"}]'::jsonb),
('2569/P003-R1', 'P - 003', '2026-08-29', 5500, 2569, 1, '2026-11-29', '2026-09-15', 1200, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงเชิงเขาม่อนแก้ว', '[{"date": "2026-08-29", "type": "ปุ๋ยหมักชีวภาพรองพื้น", "amount": "40 กิโลกรัม", "cost": 500, "note": "เตรียมดินรองก้นหลุม"}]'::jsonb),
('2569/P004-R1', 'P - 004', '2026-08-30', 3800, 2569, 1, '2026-11-30', '2026-09-15', 750, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงทุ่งรวงทอง', '[{"date": "2026-08-30", "type": "ปุ๋ยอินทรีย์อัดเม็ดรองพื้น", "amount": "30 กิโลกรัม", "cost": 420, "note": "เตรียมแปลงปลูก"}]'::jsonb),
('2569/P005-R1', 'P - 005', '2026-08-31', 4800, 2569, 1, '2026-12-01', '2026-09-16', 1000, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงหนองบัวงาม', '[{"date": "2026-08-31", "type": "ปุ๋ยหมักใบไม้ผุและมูลวัว", "amount": "35 กิโลกรัม", "cost": 450, "note": "รองพื้นก้นหลุม"}]'::jsonb),
('2569/P006-R1', 'P - 006', '2026-09-01', 4600, 2569, 1, '2026-12-01', '2026-09-16', 950, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงม่อนแสงจันทร์', '[{"date": "2026-09-01", "type": "ปุ๋ยหมักชีวภาพสูตร 1", "amount": "30 กิโลกรัม", "cost": 400, "note": "เตรียมดินแปลงปลูก"}]'::jsonb),
('2569/P007-R1', 'P - 007', '2026-09-01', 2800, 2569, 1, '2026-12-01', '2026-09-17', 550, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงสวนเกสรทอง', '[{"date": "2026-09-01", "type": "ปุ๋ยคอกหมักชีวภาพ", "amount": "20 กิโลกรัม", "cost": 280, "note": "รองพื้นแปลง"}]'::jsonb),
('2569/P008-R1', 'P - 008', '2026-09-02', 3900, 2569, 1, '2026-12-02', '2026-09-17', 800, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงดอนมูลพัฒนา', '[{"date": "2026-09-02", "type": "ปุ๋ยหมักชีวภาพผสมแกลบดำ", "amount": "25 กิโลกรัม", "cost": 350, "note": "รองก้นหลุม"}]'::jsonb),
('2569/P009-R1', 'P - 009', '2026-09-02', 4300, 2569, 1, '2026-12-02', '2026-09-18', 880, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงสวนสมุนไพรทวีสุข', '[{"date": "2026-09-02", "type": "ปุ๋ยอินทรีย์ชีวภาพสูตรพิเศษ", "amount": "30 กิโลกรัม", "cost": 420, "note": "เตรียมแปลงปลูก"}]'::jsonb),
('2569/P010-R1', 'P - 010', '2026-09-03', 5100, 2569, 1, '2026-12-03', '2026-09-18', 1100, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงเนินดินทอง', '[{"date": "2026-09-03", "type": "ปุ๋ยหมักใบไม้ผุ", "amount": "35 กิโลกรัม", "cost": 480, "note": "รองก้นหลุม"}]'::jsonb),
('2569/P011-R1', 'P - 011', '2026-09-03', 3500, 2569, 1, '2026-12-03', '2026-09-19', 700, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงชาเขียวเกสร', '[{"date": "2026-09-03", "type": "ปุ๋ยอินทรีย์อัดเม็ด", "amount": "25 กิโลกรัม", "cost": 350, "note": "รองพื้น"}]'::jsonb),
('2569/P012-R1', 'P - 012', '2026-09-04', 3100, 2569, 1, '2026-12-04', '2026-09-19', 600, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงสวนงามตา', '[{"date": "2026-09-04", "type": "ปุ๋ยหมักชีวภาพสูตร 1", "amount": "20 กิโลกรัม", "cost": 300, "note": "รองก้นหลุม"}]'::jsonb),
('2569/P013-R1', 'P - 013', '2026-09-04', 3800, 2569, 1, '2026-12-04', '2026-09-20', 750, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงแสงดาวสว่าง', '[{"date": "2026-09-04", "type": "ปุ๋ยคอกหมัก", "amount": "25 กิโลกรัม", "cost": 360, "note": "เตรียมแปลง"}]'::jsonb),
('2569/P014-R1', 'P - 014', '2026-09-05', 4700, 2569, 1, '2026-12-05', '2026-09-20', 980, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงชื่นใจสมุนไพร', '[{"date": "2026-09-05", "type": "ปุ๋ยหมักชีวภาพสูตรเตรียมดิน", "amount": "30 กิโลกรัม", "cost": 450, "note": "รองพื้นก่อนลงกล้า"}]'::jsonb),
('2569/P015-R1', 'P - 015', '2026-09-05', 4200, 2569, 1, '2026-12-05', '2026-09-21', 850, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงแก้วตาปันสุข', '[{"date": "2026-09-05", "type": "ปุ๋ยหมักชีวภาพสูตรเร่งราก", "amount": "25 กิโลกรัม", "cost": 380, "note": "รองก้นหลุม"}]'::jsonb),
('2569/P016-R1', 'P - 016', '2026-09-06', 3200, 2569, 1, '2026-12-06', '2026-09-21', 620, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงหอมกลิ่นดอกไม้', '[{"date": "2026-09-06", "type": "ปุ๋ยอินทรีย์อัดเม็ด", "amount": "20 กิโลกรัม", "cost": 300, "note": "รองพื้นแปลง"}]'::jsonb),
('2569/P017-R1', 'P - 017', '2026-09-06', 3600, 2569, 1, '2026-12-06', '2026-09-22', 720, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงรื่นรมย์สมถะ', '[{"date": "2026-09-06", "type": "ปุ๋ยหมักชีวภาพ", "amount": "25 กิโลกรัม", "cost": 350, "note": "เตรียมดินแปลงปลูก"}]'::jsonb),
('2569/P018-R1', 'P - 018', '2026-09-07', 4900, 2569, 1, '2026-12-07', '2026-09-22', 1050, 'เก๊กฮวย', 'growing', 'ลงกล้าเก๊กฮวย แปลงอุดมสุขทรัพย์', '[{"date": "2026-09-07", "type": "ปุ๋ยหมักใบไม้ผุและมูลวัว", "amount": "35 กิโลกรัม", "cost": 460, "note": "รองพื้นก้นหลุม"}]'::jsonb),
('2569/P019-R1', 'P - 019', '2026-09-07', 3000, 2569, 1, '2026-12-07', '2026-09-23', 580, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงใกล้หอประชุม', '[{"date": "2026-09-07", "type": "ปุ๋ยคอกมูลไก่หมัก", "amount": "20 กิโลกรัม", "cost": 260, "note": "บำรุงต้นกล้าเริ่มต้น"}]'::jsonb),
('2569/P020-R1', 'P - 020', '2026-09-08', 3700, 2569, 1, '2026-12-08', '2026-09-23', 750, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงสวนดอนแก้ว', '[{"date": "2026-09-08", "type": "ปุ๋ยหมักชีวภาพ", "amount": "25 กิโลกรัม", "cost": 340, "note": "เตรียมแปลงปลูก"}]'::jsonb),
('2569/P021-R1', 'P - 021', '2026-09-08', 4500, 2569, 1, '2026-12-08', '2026-09-24', 950, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงร่มไม้ชายทุ่ง', '[{"date": "2026-09-08", "type": "ปุ๋ยอินทรีย์อัดเม็ด", "amount": "30 กิโลกรัม", "cost": 420, "note": "รองก้นหลุม"}]'::jsonb),
('2569/P022-R1', 'P - 022', '2026-09-09', 4100, 2569, 1, '2026-12-09', '2026-09-24', 820, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงห้วยน้ำริน', '[{"date": "2026-09-09", "type": "ปุ๋ยหมักชีวภาพสูตร 1", "amount": "25 กิโลกรัม", "cost": 360, "note": "เตรียมดินแปลงปลูก"}]'::jsonb),
('2569/P023-R1', 'P - 023', '2026-09-09', 4800, 2569, 1, '2026-12-09', '2026-09-25', 1000, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงสันป่าเปา', '[{"date": "2026-09-09", "type": "ปุ๋ยหมักใบไม้ผุ", "amount": "30 กิโลกรัม", "cost": 440, "note": "รองพื้นก้นหลุม"}]'::jsonb),
('2569/P024-R1', 'P - 024', '2026-09-10', 2900, 2569, 1, '2026-12-10', '2026-09-25', 540, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงลาภดีมีสุข', '[{"date": "2026-09-10", "type": "ปุ๋ยคอกหมักชีวภาพ", "amount": "20 กิโลกรัม", "cost": 280, "note": "รองก้นหลุม"}]'::jsonb),
('2569/P025-R1', 'P - 025', '2026-09-10', 3600, 2569, 1, '2026-12-10', '2026-09-26', 720, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงอบอุ่นใจ', '[{"date": "2026-09-10", "type": "ปุ๋ยหมักชีวภาพ", "amount": "25 กิโลกรัม", "cost": 350, "note": "เตรียมดิน"}]'::jsonb),
('2569/P026-R1', 'P - 026', '2026-09-11', 5200, 2569, 1, '2026-12-11', '2026-09-26', 1120, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงมั่นคงถาวร', '[{"date": "2026-09-11", "type": "ปุ๋ยอินทรีย์อัดเม็ด", "amount": "35 กิโลกรัม", "cost": 490, "note": "รองก้นหลุม"}]'::jsonb),
('2569/P027-R1', 'P - 027', '2026-09-11', 3900, 2569, 1, '2026-12-11', '2026-09-27', 780, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงสงบร่มเย็น', '[{"date": "2026-09-11", "type": "ปุ๋ยคอกมูลไก่หมัก", "amount": "25 กิโลกรัม", "cost": 330, "note": "รองพื้นแปลง"}]'::jsonb),
('2569/P028-R1', 'P - 028', '2026-09-12', 3200, 2569, 1, '2026-12-12', '2026-09-27', 620, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงเลิศรสสมุนไพร', '[{"date": "2026-09-12", "type": "ปุ๋ยหมักชีวภาพสูตร 1", "amount": "20 กิโลกรัม", "cost": 300, "note": "บำรุงต้นกล้า"}]'::jsonb),
('2569/P029-R1', 'P - 029', '2026-09-12', 4300, 2569, 1, '2026-12-12', '2026-09-28', 880, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงชูชาติเกษตร', '[{"date": "2026-09-12", "type": "ปุ๋ยหมักใบไม้ผุ", "amount": "30 กิโลกรัม", "cost": 410, "note": "เตรียมแปลงปลูก"}]'::jsonb),
('2569/P030-R1', 'P - 030', '2026-09-13', 4600, 2569, 1, '2026-12-13', '2026-09-28', 960, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงยอดดีพัฒนา', '[{"date": "2026-09-13", "type": "ปุ๋ยอินทรีย์อัดเม็ด", "amount": "30 กิโลกรัม", "cost": 430, "note": "รองก้นหลุม"}]'::jsonb),
('2569/P031-R1', 'P - 031', '2026-09-13', 4000, 2569, 1, '2026-12-13', '2026-09-29', 800, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงศรีทองพืชผล', '[{"date": "2026-09-13", "type": "ปุ๋ยคอกหมัก", "amount": "25 กิโลกรัม", "cost": 350, "note": "เตรียมดินแปลงปลูก"}]'::jsonb),
('2569/P032-R1', 'P - 032', '2026-09-14', 3100, 2569, 1, '2026-12-14', '2026-09-29', 600, 'คาโมมายล์', 'growing', 'ลงกล้าคาโมมายล์ แปลงอิ่มเอมใจ', '[{"date": "2026-09-14", "type": "ปุ๋ยหมักชีวภาพสูตรเตรียมดิน", "amount": "20 กิโลกรัม", "cost": 290, "note": "รองพื้นก่อนลงกล้า"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    plot_id = EXCLUDED.plot_id,
    plant_date = EXCLUDED.plant_date,
    cost = EXCLUDED.cost,
    crop_year = EXCLUDED.crop_year,
    crop_cycle = EXCLUDED.crop_cycle,
    harvest_date_est = EXCLUDED.harvest_date_est,
    fert_date_est = EXCLUDED.fert_date_est,
    seedling_count = EXCLUDED.seedling_count,
    seedling_source = EXCLUDED.seedling_source,
    status = EXCLUDED.status,
    note = EXCLUDED.note,
    fertilizing_log = EXCLUDED.fertilizing_log;

-- รอบเก็บเกี่ยวในอดีต (2568)
INSERT INTO public.crops (id, plot_id, plant_date, cost, crop_year, crop_cycle, harvest_date_est, harvest_date_actual, seedling_count, seedling_source, yield, status, is_processed, drying_date, fresh_used, dry_weight, note, harvest_note, fertilizing_log)
VALUES
('2568/P001-R1', 'P - 001', '2026-03-01', 4000, 2568, 1, '2026-06-01', '2026-06-05', 800, 'เก๊กฮวย', 150.0, 'harvested', true, '2026-06-07', 150.0, 15.0, 'แปลงสวนหน้าบ้าน รอบที่ 1 สด 150 กก. ได้แห้ง 15 กก. (10:1)', 'ดอกสดสีเหลืองทองคุณภาพดีมาก', '[]'::jsonb),
('2568/P002-R1', 'P - 002', '2026-03-15', 3000, 2568, 1, '2026-06-15', '2026-06-18', 500, 'คาโมมายล์', 100.0, 'harvested', true, '2026-06-20', 100.0, 10.0, 'แปลงริมคลองส่งน้ำ รอบที่ 1 สด 100 กก. ได้แห้ง 10 กก. (10:1)', 'ดอกคาโมมายล์หอมฟุ้ง ได้มาตรฐาน', '[]'::jsonb),
('2568/P003-R1', 'P - 003', '2026-02-10', 5000, 2568, 1, '2026-05-10', '2026-05-12', 1100, 'เก๊กฮวย', 180.0, 'harvested', true, '2026-05-15', 180.0, 18.0, 'แปลงเชิงเขาม่อนแก้ว รอบที่ 1 สด 180 กก. ได้แห้ง 18 กก. (10:1)', 'ผลผลิตดอกโต สวยงาม', '[]'::jsonb),
('2568/P004-R1', 'P - 004', '2026-02-15', 3500, 2568, 1, '2026-05-15', '2026-05-16', 700, 'เก๊กฮวย', 140.0, 'harvested', true, '2026-05-18', 140.0, 14.0, 'แปลงทุ่งรวงทอง รอบที่ 1 สด 140 กก. ได้แห้ง 14 กก. (10:1)', 'ดอกสดสวยงาม ไร้สารเคมี', '[]'::jsonb),
('2568/P005-R2', 'P - 005', '2026-06-01', 4300, 2568, 2, '2026-09-01', '2026-09-05', 800, 'เก๊กฮวย', 150.0, 'harvested', true, '2026-09-08', 150.0, 15.0, 'แปลงทุ่งรวงทอง รอบที่ 2 สด 150 กก. ได้แห้ง 15 กก. (10:1)', 'ดอกสมบูรณ์ดีมาก เก็บเกี่ยวได้ตามเป้าหมาย', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    plot_id = EXCLUDED.plot_id,
    plant_date = EXCLUDED.plant_date,
    cost = EXCLUDED.cost,
    crop_year = EXCLUDED.crop_year,
    crop_cycle = EXCLUDED.crop_cycle,
    harvest_date_est = EXCLUDED.harvest_date_est,
    harvest_date_actual = EXCLUDED.harvest_date_actual,
    seedling_count = EXCLUDED.seedling_count,
    seedling_source = EXCLUDED.seedling_source,
    yield = EXCLUDED.yield,
    status = EXCLUDED.status,
    is_processed = EXCLUDED.is_processed,
    drying_date = EXCLUDED.drying_date,
    fresh_used = EXCLUDED.fresh_used,
    dry_weight = EXCLUDED.dry_weight,
    note = EXCLUDED.note,
    harvest_note = EXCLUDED.harvest_note,
    fertilizing_log = EXCLUDED.fertilizing_log;
