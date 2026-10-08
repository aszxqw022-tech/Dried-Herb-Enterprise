import { generateRandomCoordinates, getHerbDefaultIcon, HERB_GROUPS_PRESETS, formatCropSeasonId } from './helpers.js';

const STORAGE_KEYS = {
  ENTERPRISE: 'herb_enterprise_profile',
  MEMBERS: 'herb_enterprise_members',
  PLOTS: 'herb_enterprise_plots',
  HERBS: 'herb_enterprise_herbs_catalog', // Tier 1: Herbs Catalog
  CROPS: 'herb_enterprise_crops', // Tier 2: Planting Cycles
  DIVIDENDS: 'herb_enterprise_dividends', // Tier 2: Member Dividends
  INVENTORY: 'herb_enterprise_inventory',
  SALES: 'herb_enterprise_sales',
  CUSTOMERS: 'herb_enterprise_customers',
  AUTH: 'herb_enterprise_auth',
  ROADMAPS: 'herb_enterprise_roadmaps',
  DRYING_BATCHES: 'herb_enterprise_drying_batches',
  PACKAGING_BATCHES: 'herb_enterprise_packaging_batches',
  PRODUCTS: 'herb_enterprise_products',
  ACTIVITY_LOGS: 'herb_enterprise_activity_logs' // Tier 3: Activity Logs
};

export const MOCK_HERBS_CATALOG = [
  {
    herbId: 'HRB-001',
    name: 'เก๊กฮวย',
    category: 'ชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ',
    icon: '🌼',
    standardRatio: 8.0,
    freshBuyingPrice: 50,
    drySellingPriceKg: 250,
    jarSellingPrice50g: 150,
    growthDays: 90,
    dryLossPct: 87.5,
    baselinePriceFresh: 50,
    baselinePriceDry: 250,
    description: 'พืชสมุนไพรเด่น ดอกสีเหลืองทอง กลิ่นหอม บำรุงตับ ดับพิษร้อน ปลูกง่าย ผลผลิตคุ้มค่า',
    isActive: true
  },
  {
    herbId: 'HRB-002',
    name: 'คาโมมายล์',
    category: 'ชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ',
    icon: '🌼',
    standardRatio: 6.0,
    freshBuyingPrice: 70,
    drySellingPriceKg: 450,
    jarSellingPrice50g: 100,
    growthDays: 90,
    dryLossPct: 83.3,
    baselinePriceFresh: 70,
    baselinePriceDry: 450,
    description: 'สมุนไพรพรีเมียม กลิ่นหอมผ่อนคลาย ช่วยการนอนหลับ และคลายความตึงเครียด',
    isActive: true
  }
];

const MOCK_MEMBER_DIVIDENDS = [];
const MOCK_ACTIVITY_LOGS = [];
const MOCK_DRYING_BATCHES = [];
const MOCK_PACKAGING_BATCHES = [];

let supabaseClient = null;

// Mock User Accounts for Login & Roles
const MOCK_USERS = [
  {
    username: '12/4',
    password: '0611391105',
    name: 'นายวีรวัฒน์ ปินทรายมูล',
    role: 'Admin',
    roleDisplay: 'ประธานกลุ่ม',
    memberId: 'MEM-001',
    avatarText: 'ว',
    color: 'emerald'
  },
  {
    username: '12/5',
    password: '0897654321',
    name: 'นางแหม่ม สุตินกาศ',
    role: 'Officer',
    roleDisplay: 'รองประธานกลุ่ม',
    memberId: 'MEM-002',
    avatarText: 'แ',
    color: 'blue'
  },
  {
    username: '45/1',
    password: '0812345699',
    name: 'นายมานะ รักเกษตร',
    role: 'Officer',
    roleDisplay: 'เหรัญญิก',
    memberId: 'MEM-003',
    avatarText: 'ม',
    color: 'amber'
  }
];

// Initial Profile setup
const DEFAULT_ENTERPRISE = {
  name: 'วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านศรีดอนมูล',
  village: 'หมู่ที่ 12',
  subdistrict: 'ศรีดอนมูล',
  district: 'เชียงแสน',
  province: 'เชียงราย',
  zipcode: '57150',
  phone: '061-139-1105',
  email: 'sridonmun.driedherbs@gmail.com',
  chairman: 'นายวีรวัฒน์ ปินทรายมูล',
  description: 'กลุ่มเกษตรกรผลิตและแปรรูปสมุนไพรอบแห้งปลอดสารพิษเพื่อความยั่งยืน เก๊กฮวย คาโมมายล์ และสมุนไพรพื้นบ้าน',
  committee: {
    president: { name: 'นายวีรวัฒน์ ปินทรายมูล', phone: '061-139-1105' },
    vicePresident: { name: 'นางแหม่ม สุตินกาศ', phone: '089-765-4321' },
    treasurer: { name: 'นายมานะ รักเกษตร', phone: '081-234-5699' },
    secretary: { name: 'นางสมศรี มีวิถี', phone: '081-234-5604' },
    board: [
      { role: 'ฝ่ายแปรรูปและเตาอบ', name: 'นายวิชัย ปัญญาดี', phone: '081-234-5605' },
      { role: 'ฝ่ายคลังสินค้าและบรรจุภัณฑ์', name: 'นางนภา สุขสบาย', phone: '081-234-5606' },
      { role: 'ฝ่ายการตลาดและจัดจำหน่าย', name: 'นายดำรง รักชาติ', phone: '081-234-5607' }
    ]
  }
};

// Mock Members (3 คน)
const MOCK_MEMBERS = [
  { id: 'MEM-001', name: 'นายวีรวัฒน์ ปินทรายมูล', role: 'ประธานกลุ่ม', phone: '061-139-1105', status: 'active', villageNumber: 'หมู่ 12', joinDate: '2024-01-10', houseNumber: '12/4' },
  { id: 'MEM-002', name: 'นางแหม่ม สุตินกาศ', role: 'รองประธาน', phone: '089-765-4321', status: 'active', villageNumber: 'หมู่ 12', joinDate: '2024-01-15', houseNumber: '12/5' },
  { id: 'MEM-003', name: 'นายมานะ รักเกษตร', role: 'เหรัญญิก', phone: '081-234-5699', status: 'active', villageNumber: 'หมู่ 12', joinDate: '2024-02-01', houseNumber: '45/1' }
];

// Mock plots for members (3 แปลง: 1 คน 1 แปลง)
const MOCK_PLOTS = [
  { id: 'P - 001', memberIds: ['MEM-001'], name: 'แปลงสวนหน้าบ้าน', sizeRai: 3, sizeNgan: 1, sizeSqWah: 50, lat: 20.3112, lng: 99.9964, status: 'active', plantType: 'เก๊กฮวย' },
  { id: 'P - 002', memberIds: ['MEM-002'], name: 'แปลงริมคลองส่งน้ำ', sizeRai: 2, sizeNgan: 2, sizeSqWah: 20, lat: 20.3125, lng: 99.9948, status: 'active', plantType: 'คาโมมายล์' },
  { id: 'P - 003', memberIds: ['MEM-003'], name: 'แปลงท้ายหมู่บ้าน', sizeRai: 4, sizeNgan: 0, sizeSqWah: 0, lat: 20.3140, lng: 99.9980, status: 'active', plantType: 'เก๊กฮวย' }
];

const MOCK_CROPS = [];
const MOCK_INVENTORY = [];
const MOCK_PRODUCTS = [];
const MOCK_CUSTOMERS = [];
const MOCK_SALES = [];

// Default Standard Planting Roadmaps (แผนการปลูกสมุนไพรมาตรฐาน 3 กลุ่ม)
export const DEFAULT_ROADMAPS = {
  // 1. สมุนไพรกลุ่มชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ
  'เก๊กฮวย': {
    name: 'เก๊กฮวย',
    icon: '🌼',
    category: 'ชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ',
    description: 'พืชสมุนไพรเด่น ดอกสีเหลืองทอง กลิ่นหอม บำรุงตับ ดับพิษร้อน ปลูกง่าย ผลผลิตคุ้มค่า',
    durationDays: 90,
    cycleText: 'ระยะเวลาเพาะปลูกรวมประมาณ 90 วัน',
    steps: [
      { stepNo: 1, title: 'ลงต้นกล้า', dayNumber: 1, dayLabel: 'วันที่ 1', advice: 'รองก้นหลุม/เริ่มปลูก', detail: 'รองก้นหลุมด้วยปุ๋ยหมักชีวภาพหรือปุ๋ยคอกหมัก รดน้ำแปลงให้ชุ่มชื้น คลุมโคนต้นด้วยฟางข้าวเพื่อรักษาความชื้น', color: 'emerald', icon: 'fa-seedling' },
      { stepNo: 2, title: 'ใส่ปุ๋ยบำรุงครั้งที่ 1', dayNumber: 30, dayLabel: 'วันที่ 30', advice: 'เร่งต้น/ใบ', detail: 'ใส่ปุ๋ยหมักชีวภาพสูตรบำรุงต้นและใบ พรวนดินรอบโคนต้นอย่างระมัดระวัง กำจัดวัชพืช พร้อมให้น้ำอย่างสม่ำเสมอสัปดาห์ละ 2-3 ครั้ง', color: 'teal', icon: 'fa-leaf' },
      { stepNo: 3, title: 'ใส่ปุ๋ยบำรุงครั้งที่ 2', dayNumber: 60, dayLabel: 'วันที่ 60', advice: 'เร่งตาดอก', detail: 'ใส่ปุ๋ยอินทรีย์เสริมธาตุฟอสฟอรัสและโพแทสเซียม (มูลค้างคาวหรือปุ๋ยหมักพิเศษ) เพื่อเร่งตาดอกให้ดก ดอกสมบูรณ์ สีเหลืองเข้มสด', color: 'amber', icon: 'fa-sun' },
      { stepNo: 4, title: 'เก็บเกี่ยวผลผลิต', dayNumber: 90, dayLabel: 'วันที่ 90', advice: 'เก็บเกี่ยวส่งโรงอบ', detail: 'เก็บเกี่ยวดอกเก๊กฮวยที่บานประมาณ 70-80% ในช่วงเช้าตรู่ (06:00-09:00 น.) ก่อนแดดจัด คัดแยกสิ่งเจือปน และนำส่งเข้าเตาอบแห้งภายในวันเดียวกัน', color: 'rose', icon: 'fa-basket-shopping' }
    ]
  },
  'คาโมมายล์': {
    name: 'คาโมมายล์',
    icon: '🌼',
    category: 'ชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ',
    description: 'สมุนไพรเพื่อการผ่อนคลาย ดอกสีขาวเกสรเหลือง ช่วยให้นอนหลับสบาย ต้านการอักเสบ',
    durationDays: 85,
    cycleText: 'ระยะเวลาเพาะปลูกรวมประมาณ 80 - 85 วัน',
    steps: [
      { stepNo: 1, title: 'ลงแปลงปลูก/ย้ายกล้า', dayNumber: 1, dayLabel: 'วันที่ 1', advice: 'รองก้นหลุม/เริ่มปลูก', detail: 'ยกร่องแปลงปลูก ดินร่วนซุยระบายน้ำดี รองก้นหลุมด้วยปุ๋ยหมักอินทรีย์ ปลูกระยะห่าง 25-30 ซม. รดน้ำละอองฝอย', color: 'emerald', icon: 'fa-seedling' },
      { stepNo: 2, title: 'ใส่ปุ๋ยบำรุงครั้งที่ 1', dayNumber: 25, dayLabel: 'วันที่ 25', advice: 'เร่งต้น/ราก', detail: 'ใส่ปุ๋ยหมักชีวภาพหรือน้ำหมักจุลินทรีย์เจือจาง เพื่อพัฒนาระบบรากและแตกกิ่งก้าน พรวนดินตื้นๆ ไม่ให้กระทบรากฝอย', color: 'teal', icon: 'fa-water' },
      { stepNo: 3, title: 'ใส่ปุ๋ยบำรุงครั้งที่ 2', dayNumber: 50, dayLabel: 'วันที่ 50', advice: 'เร่งตาดอก', detail: 'บำรุงด้วยปุ๋ยอินทรีย์สูตรเร่งดอกและเสริมความแข็งแรงของก้านดอก ตรวจสอบความชื้นแปลงไม่ให้แฉะเกินไป', color: 'amber', icon: 'fa-spa' },
      { stepNo: 4, title: 'เก็บเกี่ยวผลผลิต', dayNumber: 80, dayLabel: 'วันที่ 80', advice: 'เก็บเกี่ยวส่งโรงอบ', detail: 'เด็ดเก็บเฉพาะดอกที่กลีบสีขาวบานราบเต็มที่ ช่วงสายหลังน้ำค้างแห้ง ส่งเข้าตู้อบแห้งลมร้อนอุณหภูมิ 45-50°C เพื่อรักษากลิ่นหอมระเหย', color: 'rose', icon: 'fa-basket-shopping' }
    ]
  }
};

export class AppState {
  constructor() {
    this.onAuthChange = null;
    this.onEnterpriseChange = null;
    try {
      this.membersCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS)) || JSON.parse(JSON.stringify(MOCK_MEMBERS));
      this.plotsCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLOTS)) || JSON.parse(JSON.stringify(MOCK_PLOTS));
      this.cropsCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.CROPS)) || JSON.parse(JSON.stringify(MOCK_CROPS));
      this.inventoryCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY)) || JSON.parse(JSON.stringify(MOCK_INVENTORY));
      this.salesCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES)) || JSON.parse(JSON.stringify(MOCK_SALES));
      this.customersCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) || JSON.parse(JSON.stringify(MOCK_CUSTOMERS));
    } catch (e) {
      this.membersCache = JSON.parse(JSON.stringify(MOCK_MEMBERS));
      this.plotsCache = JSON.parse(JSON.stringify(MOCK_PLOTS));
      this.cropsCache = JSON.parse(JSON.stringify(MOCK_CROPS));
      this.inventoryCache = JSON.parse(JSON.stringify(MOCK_INVENTORY));
      this.salesCache = JSON.parse(JSON.stringify(MOCK_SALES));
      this.customersCache = JSON.parse(JSON.stringify(MOCK_CUSTOMERS));
    }
    this.init();
  }

  initSupabase() {
    const defaultUrl = 'https://fhoszzgibwlgzggopeux.supabase.co';
    const defaultKey = 'sb_publishable_upI8AP-NK_GUbvtcZw7WLw_sh63HUPy';

    let url = localStorage.getItem('supabase_url');
    let key = localStorage.getItem('supabase_key');

    // Ensure valid credentials for the active project
    if (!url || !key || key.startsWith('eyJ') || !url.includes('fhoszzgibwlgzggopeux')) {
      url = defaultUrl;
      key = defaultKey;
      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_key', key);
    }

    if (url && key && typeof supabase !== 'undefined') {
      try {
        supabaseClient = supabase.createClient(url, key);
        console.log("Supabase Client connected successfully to:", url);
      } catch (e) {
        console.error("Failed to initialize Supabase client:", e);
        supabaseClient = null;
      }
    } else {
      supabaseClient = null;
    }
  }

  async syncFromSupabase() {
    if (!supabaseClient) return;

    try {
      console.log("Syncing from Supabase...");

      // 1. Sync enterprise profile
      const { data: entData, error: entError } = await supabaseClient
        .from('enterprise_profile')
        .select('*')
        .single();
      
      if (!entError && entData) {
        localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(entData));
        if (this.onEnterpriseChange) {
          this.onEnterpriseChange(entData);
        }
      } else if (entError && entError.code === 'PGRST116') {
        // Table is empty, seed initial data
        const profile = this.getEnterprise();
        await supabaseClient.from('enterprise_profile').insert([{ id: 1, ...profile }]);
      }

      // 2. Sync members
      const { data: membersData, error: memError } = await supabaseClient
        .from('members')
        .select('*')
        .order('id', { ascending: true });
      
      if (!memError && membersData && membersData.length > 0) {
        this.membersCache = membersData.map(m => ({
          ...m,
          villageNumber: m.village_number || m.villageNumber || 'หมู่ 12',
          joinDate: m.join_date || m.joinDate,
          houseNumber: m.house_number || m.houseNumber || ''
        }));
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(this.membersCache));
      } else if (membersData && membersData.length === 0) {
        await supabaseClient.from('members').insert(MOCK_MEMBERS.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          phone: m.phone,
          status: m.status,
          village_number: m.villageNumber,
          join_date: m.joinDate,
          house_number: m.houseNumber
        })));
        this.membersCache = JSON.parse(JSON.stringify(MOCK_MEMBERS));
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(this.membersCache));
      } else if (memError) {
        console.warn("Supabase members sync skipped:", memError.message);
        if (!this.membersCache || this.membersCache.length === 0) {
          const stored = localStorage.getItem(STORAGE_KEYS.MEMBERS);
          this.membersCache = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(MOCK_MEMBERS));
        }
      }

      // 3. Sync plots
      const { data: plotsData, error: plotsError } = await supabaseClient
        .from('plots')
        .select('*')
        .order('id', { ascending: true });
      
      if (!plotsError && plotsData && plotsData.length > 0) {
        this.plotsCache = plotsData.map(p => ({
          ...p,
          sizeRai: p.size_rai !== undefined ? p.size_rai : p.sizeRai,
          sizeNgan: p.size_ngan !== undefined ? p.size_ngan : p.sizeNgan,
          sizeSqWah: p.size_sq_wah !== undefined ? p.size_sq_wah : p.sizeSqWah,
          plantType: p.plant_type !== undefined ? p.plant_type : p.plantType,
          memberIds: p.member_ids !== undefined ? p.member_ids : (p.memberIds || [])
        }));
        localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(this.plotsCache));
      } else if (plotsData && plotsData.length === 0) {
        const plotsToInsert = MOCK_PLOTS.map(p => ({
          id: p.id,
          name: p.name,
          member_ids: p.memberIds,
          size_rai: p.sizeRai,
          size_ngan: p.sizeNgan,
          size_sq_wah: p.sizeSqWah,
          plant_type: p.plantType,
          lat: p.lat,
          lng: p.lng,
          status: p.status
        }));
        await supabaseClient.from('plots').insert(plotsToInsert);
        this.plotsCache = JSON.parse(JSON.stringify(MOCK_PLOTS));
        localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(this.plotsCache));
      } else if (plotsError) {
        console.warn("Supabase plots sync skipped:", plotsError.message);
        if (!this.plotsCache || this.plotsCache.length === 0) {
          const stored = localStorage.getItem(STORAGE_KEYS.PLOTS);
          this.plotsCache = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(MOCK_PLOTS));
        }
      }

      // 4. Sync crops
      const { data: cropsData, error: cropsError } = await supabaseClient
        .from('crops')
        .select('*')
        .order('id', { ascending: true });
      
      if (!cropsError && cropsData && cropsData.length > 0) {
        this.cropsCache = cropsData.map(c => ({
          ...c,
          plotId: c.plot_id || c.plotId,
          cropYear: c.crop_year || c.cropYear,
          cropCycle: c.crop_cycle || c.cropCycle || 1,
          plantDate: c.plant_date || c.plantDate,
          harvestDateEst: c.harvest_date_est || c.harvestDateEst || '',
          harvestDateActual: c.harvest_date_actual || c.harvestDateActual || null,
          fertilizingLog: c.fertilizing_log || c.fertilizingLog || []
        }));
        localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(this.cropsCache));
      } else if (cropsData && cropsData.length === 0) {
        this.cropsCache = [];
        localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify([]));
      } else if (cropsError) {
        console.warn("Supabase crops sync skipped:", cropsError.message);
        if (!this.cropsCache) {
          const stored = localStorage.getItem(STORAGE_KEYS.CROPS);
          this.cropsCache = stored ? JSON.parse(stored) : [];
        }
      }

      // 5. Sync inventory
      const { data: invData, error: invError } = await supabaseClient
        .from('inventory')
        .select('*')
        .order('id', { ascending: true });
      
      if (!invError && invData && invData.length > 0) {
        this.inventoryCache = invData.map(i => ({
          ...i,
          cropId: i.crop_id || i.cropId,
          herbType: i.herb_type || i.herbType,
          dryStockKg: i.dry_stock_kg !== undefined ? i.dry_stock_kg : i.dryStockKg,
          dryDate: i.dry_date || i.dryDate,
          qualityGrade: i.quality_grade || i.qualityGrade,
          costPerKg: i.cost_per_kg !== undefined ? i.cost_per_kg : i.costPerKg
        }));
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(this.inventoryCache));
      } else if (invData && invData.length === 0) {
        this.inventoryCache = [];
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]));
      } else if (invError) {
        console.warn("Supabase inventory sync skipped:", invError.message);
        if (!this.inventoryCache) {
          const stored = localStorage.getItem(STORAGE_KEYS.INVENTORY);
          this.inventoryCache = stored ? JSON.parse(stored) : [];
        }
      }

      // 6. Sync sales
      const { data: salesData, error: salesError } = await supabaseClient
        .from('sales')
        .select('*')
        .order('id', { ascending: true });
      
      if (!salesError && salesData && salesData.length > 0) {
        this.salesCache = salesData.map(s => ({
          ...s,
          inventoryId: s.inventory_id || s.inventoryId,
          cropId: s.crop_id || s.cropId,
          customer: s.customer_name || s.customer,
          amountKg: s.quantity_kg !== undefined ? s.quantity_kg : (s.amountKg !== undefined ? s.amountKg : s.amount),
          quantityKg: s.quantity_kg !== undefined ? s.quantity_kg : (s.amountKg !== undefined ? s.amountKg : s.amount),
          pricePerKg: s.price_per_kg !== undefined ? s.price_per_kg : (s.pricePerKg !== undefined ? s.pricePerKg : s.price),
          price: s.price_per_kg !== undefined ? s.price_per_kg : (s.pricePerKg !== undefined ? s.pricePerKg : s.price),
          saleDate: s.sale_date || s.saleDate || s.date,
          date: s.sale_date || s.saleDate || s.date,
          buyerPhone: s.buyer_phone || s.buyerPhone,
          invoiceNo: s.invoice_no || s.invoiceNo,
          totalPrice: (s.quantity_kg || s.amountKg || s.amount || 0) * (s.price_per_kg || s.pricePerKg || s.price || 0)
        }));
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(this.salesCache));
      } else if (salesData && salesData.length === 0) {
        this.salesCache = [];
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
      } else if (salesError) {
        console.warn("Supabase sales sync skipped:", salesError.message);
        if (!this.salesCache) {
          const stored = localStorage.getItem(STORAGE_KEYS.SALES);
          this.salesCache = stored ? JSON.parse(stored) : [];
        }
      }

      // 7. Sync customers
      const { data: custList, error: custError } = await supabaseClient
        .from('customers')
        .select('*')
        .order('id', { ascending: true });
      if (!custError && custList && custList.length > 0) {
        this.customersCache = custList.map(c => ({
          ...c,
          customerType: c.customer_type || c.customerType,
          lineId: c.line_id || c.lineId,
          contactChannel: c.contact_channel || c.contactChannel
        }));
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(this.customersCache));
      } else if (custList && custList.length === 0) {
        this.customersCache = [];
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
      } else if (custError) {
        console.warn("Supabase customers sync skipped:", custError.message);
        if (!this.customersCache) {
          const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
          this.customersCache = stored ? JSON.parse(stored) : [];
        }
      }

      // 8. Sync herbs_catalog
      const { data: herbsData, error: herbsError } = await supabaseClient
        .from('herbs_catalog')
        .select('*')
        .order('herb_id', { ascending: true });
      if (!herbsError && herbsData && herbsData.length > 0) {
        const herbsMapped = herbsData.map(h => ({
          herbId: h.herb_id,
          name: h.name,
          category: h.category,
          icon: h.icon,
          standardRatio: Number(h.standard_ratio || 8),
          freshBuyingPrice: Number(h.fresh_buying_price || 50),
          drySellingPriceKg: Number(h.dry_selling_price_kg || 250),
          jarSellingPrice50g: Number(h.jar_selling_price_50g || 150),
          growthDays: Number(h.growth_days || 90),
          dryLossPct: Number(h.dry_loss_pct || 87.5),
          baselinePriceFresh: Number(h.baseline_price_fresh || h.fresh_buying_price || 50),
          baselinePriceDry: Number(h.baseline_price_dry || h.dry_selling_price_kg || 250),
          description: h.description || '',
          isActive: h.is_active !== false
        }));
        localStorage.setItem(STORAGE_KEYS.HERBS, JSON.stringify(herbsMapped));
      }

      // 9. Sync products
      const { data: prdData, error: prdError } = await supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      if (!prdError && prdData && prdData.length > 0) {
        const prdMapped = prdData.map(p => ({
          ...p,
          updatedDate: p.updated_date || p.updatedDate
        }));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prdMapped));
      } else if (!prdError && prdData && prdData.length === 0) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
      }

      // 10. Sync drying_batches
      const { data: dryingData, error: dryingError } = await supabaseClient
        .from('drying_batches')
        .select('*')
        .order('id', { ascending: true });
      if (!dryingError && dryingData && dryingData.length > 0) {
        const dryingMapped = dryingData.map(d => ({
          id: d.id,
          herbType: d.herb_type,
          totalFreshAvailableKg: Number(d.total_fresh_available_kg || 0),
          freshWeightKg: Number(d.fresh_weight_kg || 0),
          dryWeightKg: Number(d.dry_weight_kg || 0),
          ratioActual: d.ratio_actual,
          processedDate: d.processed_date,
          note: d.note || '',
          cropIds: d.crop_ids || []
        }));
        localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify(dryingMapped));
      } else if (!dryingError && dryingData && dryingData.length === 0) {
        localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify([]));
      }

      // 11. Sync packaging_batches
      const { data: packData, error: packError } = await supabaseClient
        .from('packaging_batches')
        .select('*')
        .order('id', { ascending: true });
      if (!packError && packData && packData.length > 0) {
        const packMapped = packData.map(p => ({
          id: p.id,
          herbType: p.herb_type,
          dryUsedKg: Number(p.dry_used_kg || 0),
          packageSize: p.package_size,
          jarsProduced: Number(p.jars_produced || 0),
          processedDate: p.processed_date,
          productId: p.product_id,
          productName: p.product_name,
          operatorName: p.operator_name,
          note: p.note || ''
        }));
        localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify(packMapped));
      } else if (!packError && packData && packData.length === 0) {
        localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify([]));
      }

      console.log("Supabase sync completed successfully!");
      const syncSummary = {
        members: this.membersCache?.length || 0,
        plots: this.plotsCache?.length || 0,
        crops: this.cropsCache?.length || 0
      };
      if (this.onDataSync) {
        try {
          this.onDataSync(syncSummary);
        } catch (err) {
          console.error("onDataSync error:", err);
        }
      }
      window.dispatchEvent(new CustomEvent('supabase-data-synced', {
        detail: syncSummary
      }));
    } catch (e) {
      console.error("Sync error:", e);
      throw e;
    }
  }

  // --- Auth & Session Methods ---
  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!data) return null;
    try {
      const user = JSON.parse(data);
      if (user && (user.name.includes('สมเกียรติ') || user.username === 'admin' || user.memberId === 'MEM-001' && user.name !== 'นายวีรวัฒน์ ปินทรายมูล')) {
        const president = MOCK_USERS[0];
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(president));
        return president;
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  login(username, password) {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim().replace(/-/g, '');

    const members = this.getMembers();
    const member = members.find(m => m.houseNumber && m.houseNumber.trim() === cleanUsername);
    if (!member) {
      throw new Error('ไม่พบบัญชีผู้ใช้งานที่มีเลขที่บ้านนี้');
    }

    const memberPhoneClean = member.phone.replace(/-/g, '');
    if (memberPhoneClean !== cleanPassword) {
      throw new Error('รหัสผ่าน (เบอร์โทรศัพท์) ไม่ถูกต้อง');
    }

    // Determine role
    let appRole = 'Member';
    if (member.id === 'MEM-001' || member.role === 'ประธานกลุ่ม') {
      appRole = 'Admin';
    } else if (member.id === 'MEM-002' || member.role === 'รองประธาน' || member.role === 'เหรัญญิก') {
      appRole = 'Officer';
    }

    const sessionData = {
      username: cleanUsername,
      name: member.name,
      role: appRole,
      roleDisplay: member.role,
      memberId: member.id,
      avatarText: member.name.charAt(0) || 'M',
      color: appRole === 'Admin' ? 'emerald' : (appRole === 'Officer' ? 'amber' : 'blue'),
      loginTime: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(sessionData));
    if (this.onAuthChange) this.onAuthChange(sessionData);
    return sessionData;
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    if (this.onAuthChange) this.onAuthChange(null);
  }

  getDemoUsers() {
    return MOCK_USERS;
  }

  /**
   * Reset all simulation data to fresh pristine state
   */
  resetAllSimulationData() {
    localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(DEFAULT_ENTERPRISE));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(MOCK_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(MOCK_PLOTS));
    localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(DEFAULT_ROADMAPS));
    localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HERBS, JSON.stringify(MOCK_HERBS_CATALOG));
    localStorage.removeItem('herb_enterprise_direct_sales_v1');

    // Ensure session is set
    if (!this.getCurrentUser()) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(MOCK_USERS[0]));
    }

    // Refresh memory caches
    this.plotsCache = JSON.parse(JSON.stringify(MOCK_PLOTS));
    this.membersCache = JSON.parse(JSON.stringify(MOCK_MEMBERS));
    this.cropsCache = [];
    this.inventoryCache = [];
    this.salesCache = [];
    this.customersCache = [];

    if (this.onEnterpriseChange) {
      this.onEnterpriseChange(DEFAULT_ENTERPRISE);
    }
    if (this.onAuthChange) {
      this.onAuthChange(this.getCurrentUser());
    }
  }

  init() {
    this.initSupabase();

    const SIMULATION_RESET_KEY = 'herb_enterprise_sim_ver_v22';
    if (localStorage.getItem('herb_enterprise_sim_ver') !== SIMULATION_RESET_KEY) {
      this.resetAllSimulationData();
      localStorage.setItem('herb_enterprise_sim_ver', SIMULATION_RESET_KEY);
      localStorage.setItem('herb_enterprise_products_price_v6', 'done');
      if (supabaseClient) {
        this.syncFromSupabase().catch(e => console.error("Initial Supabase sync failed:", e));
      }
      return;
    }
    
    // 1. Enterprise Setup
    const storedEnt = localStorage.getItem(STORAGE_KEYS.ENTERPRISE);
    if (!storedEnt) {
      localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(DEFAULT_ENTERPRISE));
    } else {
      try {
        const ent = JSON.parse(storedEnt);
        if (ent && (ent.name === 'วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านแม่ริม' || ent.district === 'แม่ริม')) {
          localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(DEFAULT_ENTERPRISE));
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // 2. Members
    const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (storedMembers === null) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(MOCK_MEMBERS));
    }

    // 3. Plots
    const storedPlots = localStorage.getItem(STORAGE_KEYS.PLOTS);
    if (storedPlots === null) {
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(MOCK_PLOTS));
    }

    // 4. Crop Seasons (1 รอบมีได้ 1 แปลงเท่านั้น ไม่เขียนทับข้อมูลที่บันทึกแล้ว)
    const storedCrops = localStorage.getItem(STORAGE_KEYS.CROPS);
    if (!storedCrops || JSON.parse(storedCrops).length === 0) {
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(MOCK_CROPS));
    } else {
      // Automatic cleanup & migration to standard format: [ปี พ.ศ.]/[รหัสแปลง]-R[รอบที่]
      try {
        let cropsList = JSON.parse(storedCrops);
        
        // Auto-migrate any existing crops to new format
        cropsList = cropsList.map(c => {
          const standardId = formatCropSeasonId(c.id, c.cropYear, c.cropCycle);
          return {
            ...c,
            id: standardId || c.id
          };
        });



        const seen = new Set();
        const deduplicated = [];
        for (let i = cropsList.length - 1; i >= 0; i--) {
          const c = cropsList[i];
          // Delete old invalid IDs by skipping them
          if (!String(c.id).includes('/')) {
            continue;
          }
          const key = `${c.plotId}_${c.cropYear}_${c.cropCycle || 1}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduplicated.unshift(c);
          }
        }
        localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(deduplicated));
        
        // Also migrate and clean up Drying Batches, Inventory and Sales referencing crop IDs
        const storedDrying = localStorage.getItem(STORAGE_KEYS.DRYING_BATCHES);
        if (storedDrying) {
          const dryingList = JSON.parse(storedDrying).map(d => ({
            ...d,
            cropIds: (d.cropIds || []).map(id => formatCropSeasonId(id))
          }));
          localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify(dryingList));
        }

        const storedInv = localStorage.getItem(STORAGE_KEYS.INVENTORY);
        if (storedInv) {
          const validInv = JSON.parse(storedInv).map(i => ({
            ...i,
            cropId: formatCropSeasonId(i.cropId)
          })).filter(i => String(i.cropId).includes('/'));
          localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(validInv));
        }

        const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);
        if (storedSales) {
          const validSales = JSON.parse(storedSales).map(s => ({
            ...s,
            cropId: formatCropSeasonId(s.cropId)
          })).filter(s => String(s.cropId).includes('/'));
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(validSales));
        }
      } catch (err) {
        console.error("Crops deduplication & migration error:", err);
      }
    }

    // 5. Inventory (Phase 2)
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(MOCK_INVENTORY));

    // 6. Sales (Phase 2)
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(MOCK_SALES));
    }

    // 7. Customers (Auto-migrate lineId & facebook fields)
    const storedCust = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!storedCust) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(MOCK_CUSTOMERS));
    } else {
      try {
        let custList = JSON.parse(storedCust);
        let updated = false;
        custList.forEach(c => {
          const mockMatch = MOCK_CUSTOMERS.find(m => m.id === c.id);
          if (mockMatch) {
            if (!c.lineId && mockMatch.lineId) { c.lineId = mockMatch.lineId; updated = true; }
            if (!c.facebook && mockMatch.facebook) { c.facebook = mockMatch.facebook; updated = true; }
          }
          if (!c.lineId && c.contactChannel && c.contactChannel.toLowerCase().includes('line')) {
            c.lineId = c.contactChannel.replace(/line\s*:\s*/i, '').trim();
            updated = true;
          }
          if (!c.facebook && c.contactChannel && (c.contactChannel.toLowerCase().includes('fb') || c.contactChannel.toLowerCase().includes('facebook'))) {
            c.facebook = c.contactChannel.replace(/fb\s*:\s*|facebook\s*:\s*/i, '').trim();
            updated = true;
          }
        });
        MOCK_CUSTOMERS.forEach(m => {
          if (!custList.some(c => c.id === m.id)) {
            custList.push(m);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(custList));
        }
      } catch (e) {
        console.error("Customers migration error:", e);
      }
    }

    // 8. Planting Roadmaps
    if (!localStorage.getItem(STORAGE_KEYS.ROADMAPS)) {
      localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(DEFAULT_ROADMAPS));
    }

    // 9. Products Catalog (Finished Goods & Inventory PRD-XXX)
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
    }

    // 10. Packaging Batches (Canning & Packaging process logs)
    if (!localStorage.getItem(STORAGE_KEYS.PACKAGING_BATCHES)) {
      localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify(MOCK_PACKAGING_BATCHES));
    }

    // Trigger asynchronous Supabase synchronization if connected
    if (supabaseClient) {
      this.syncFromSupabase().catch(e => {
        console.error("Initial Supabase sync failed:", e);
      });
    }
  }

  // --- Enterprise Profile Methods ---
  getEnterprise() {
    try {
      const ent = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTERPRISE));
      if (!ent) return DEFAULT_ENTERPRISE;
      // Auto-migrate legacy address if previously saved as หมู่ที่ 2
      if (!ent.village || ent.village.includes('หมู่ที่ 2') || ent.village.includes('หมู่ 4')) {
        ent.village = 'หมู่ที่ 12';
        ent.subdistrict = 'ศรีดอนมูล';
        ent.district = 'เชียงแสน';
        ent.province = 'เชียงราย';
        ent.zipcode = '57150';
        localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(ent));
      }
      // Auto-migrate legacy president / vice president to new leaders
      if (!ent.chairman || ent.chairman.includes('สมเกียรติ')) {
        ent.chairman = 'นายวีรวัฒน์ ปินทรายมูล';
        ent.phone = '061-139-1105';
        if (ent.committee && ent.committee.president) {
          ent.committee.president = { name: 'นายวีรวัฒน์ ปินทรายมูล', phone: '061-139-1105' };
        }
        if (ent.committee && ent.committee.vicePresident) {
          ent.committee.vicePresident = { name: 'นางแหม่ม สุตินกาศ', phone: '089-765-4321' };
        }
        localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(ent));
      }
      if (!ent.committee) {
        ent.committee = JSON.parse(JSON.stringify(DEFAULT_ENTERPRISE.committee));
      }
      return ent;
    } catch (e) {
      return DEFAULT_ENTERPRISE;
    }
  }

  saveEnterprise(data) {
    if (supabaseClient) {
      supabaseClient.from('enterprise_profile').update(data).eq('id', 1).then(({ error }) => {
        if (error) console.error("Supabase enterprise save error:", error);
      });
    }
    localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(data));
    if (this.onEnterpriseChange) {
      this.onEnterpriseChange(data);
    }
    return data;
  }

  // --- Members Methods ---
  getMembers() {
    if (supabaseClient && Array.isArray(this.membersCache) && this.membersCache.length > 0) {
      return this.membersCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (data === null) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(MOCK_MEMBERS));
        return JSON.parse(JSON.stringify(MOCK_MEMBERS));
      }
      let list = JSON.parse(data) || [];
      const filtered = (list || []).filter(m => m && typeof m === 'object' && m.id);
      if (supabaseClient && (!this.membersCache || this.membersCache.length === 0)) {
        this.membersCache = filtered;
      }
      return filtered;
    } catch (e) {
      return [];
    }
  }

  getMemberById(id) {
    return this.getMembers().find(m => m.id === id);
  }

  addMember(member) {
    const members = this.getMembers();
    const maxIdNum = members.reduce((max, m) => {
      const num = parseInt((m.id || '').split('-')[1]);
      return (!isNaN(num) && num > max) ? num : max;
    }, 0);
    const newId = `MEM-${String(maxIdNum + 1).padStart(3, '0')}`;
    
    const newMember = {
      ...member,
      id: newId,
      villageNumber: member.villageNumber || 'หมู่ 12',
      joinDate: member.joinDate || new Date().toISOString().split('T')[0],
      houseNumber: member.houseNumber || '',
      status: member.status || 'active'
    };

    this.membersCache = this.membersCache || [];
    this.membersCache.push(newMember);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(this.membersCache));

    if (supabaseClient) {
      const dbMember = {
        id: newMember.id,
        name: newMember.name,
        role: newMember.role,
        phone: newMember.phone,
        status: newMember.status,
        village_number: newMember.villageNumber,
        join_date: newMember.joinDate,
        house_number: newMember.houseNumber
      };
      supabaseClient.from('members').insert([dbMember]).then(({ error }) => {
        if (error) {
          console.error("Supabase addMember error:", error);
          showToast("ล้มเหลวในการบันทึกออนไลน์: " + error.message, "error");
        }
      });
    }
    return newMember;
  }

  updateMember(id, updatedData) {
    let members = this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
      const updatedMember = { ...members[index], ...updatedData };
      this.membersCache = members;
      this.membersCache[index] = updatedMember;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(this.membersCache));

      if (supabaseClient) {
        const dbMemberUpdate = {};
        if (updatedMember.name !== undefined) dbMemberUpdate.name = updatedMember.name;
        if (updatedMember.role !== undefined) dbMemberUpdate.role = updatedMember.role;
        if (updatedMember.phone !== undefined) dbMemberUpdate.phone = updatedMember.phone;
        if (updatedMember.status !== undefined) dbMemberUpdate.status = updatedMember.status;
        if (updatedMember.villageNumber !== undefined) dbMemberUpdate.village_number = updatedMember.villageNumber;
        if (updatedMember.joinDate !== undefined) dbMemberUpdate.join_date = updatedMember.joinDate;
        if (updatedMember.houseNumber !== undefined) dbMemberUpdate.house_number = updatedMember.houseNumber;

        supabaseClient.from('members').update(dbMemberUpdate).eq('id', id).then(({ error }) => {
          if (error) {
            console.error("Supabase updateMember error:", error);
            showToast("ล้มเหลวในการอัปเดตออนไลน์: " + error.message, "error");
          }
        });
      }
      return updatedMember;
    }
    return null;
  }

  deleteMember(id) {
    let members = this.getMembers();
    
    // Also unassign or clean up member from plots
    let plots = this.getPlots();
    plots.forEach(p => {
      if (p.memberIds && p.memberIds.includes(id)) {
        p.memberIds = p.memberIds.filter(mId => mId !== id);
      }
    });
    localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
    if (this.plotsCache) {
      this.plotsCache.forEach(p => {
        if (p.memberIds && p.memberIds.includes(id)) {
          p.memberIds = p.memberIds.filter(mId => mId !== id);
        }
      });
    }

    const filtered = members.filter(m => m.id !== id);
    this.membersCache = filtered;
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));

    if (supabaseClient) {
      supabaseClient.from('members').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deleteMember error:", error);
          showToast("ล้มเหลวในการลบออนไลน์: " + error.message, "error");
        }
      });
    }
    return true;
  }

  // --- Plots Methods ---
  getPlots() {
    if (supabaseClient && Array.isArray(this.plotsCache) && this.plotsCache.length > 0) {
      return this.plotsCache;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLOTS);
      if (stored === null) {
        localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(MOCK_PLOTS));
        return JSON.parse(JSON.stringify(MOCK_PLOTS));
      }
      let plots = JSON.parse(stored) || [];
      const filtered = (plots || []).filter(p => p && typeof p === 'object' && p.id);
      if (supabaseClient && (!this.plotsCache || this.plotsCache.length === 0)) {
        this.plotsCache = filtered;
      }
      return filtered;
    } catch (e) {
      return [];
    }
  }

  getPlotById(id) {
    return this.getPlots().find(p => p.id === id);
  }

  getPlotsByMemberId(memberId) {
    return this.getPlots().filter(p => p.memberIds && p.memberIds.includes(memberId));
  }

  addPlot(plot) {
    const plots = this.getPlots();
    const maxIdNum = plots.reduce((max, p) => {
      const num = parseInt(p.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const newId = `P - ${String(maxIdNum + 1).padStart(3, '0')}`;
    
    let finalLat = parseFloat(plot.lat);
    let finalLng = parseFloat(plot.lng);
    if (!finalLat || !finalLng) {
      const randCoords = generateRandomCoordinates();
      finalLat = randCoords.lat;
      finalLng = randCoords.lng;
    }

    const newPlot = {
      ...plot,
      id: newId,
      sizeRai: parseInt(plot.sizeRai) || 0,
      sizeNgan: parseInt(plot.sizeNgan) || 0,
      sizeSqWah: parseInt(plot.sizeSqWah) || 0,
      lat: finalLat,
      lng: finalLng,
      status: plot.status || 'active'
    };
    
    this.plotsCache = this.plotsCache || [];
    this.plotsCache.push(newPlot);
    localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(this.plotsCache));
    
    if (supabaseClient) {
      const dbPlot = {
        id: newPlot.id,
        name: newPlot.name,
        member_ids: newPlot.memberIds,
        size_rai: newPlot.sizeRai,
        size_ngan: newPlot.sizeNgan,
        size_sq_wah: newPlot.sizeSqWah,
        plant_type: newPlot.plantType,
        lat: newPlot.lat,
        lng: newPlot.lng,
        status: newPlot.status
      };
      supabaseClient.from('plots').insert([dbPlot]).then(({ error }) => {
        if (error) {
          console.error("Supabase addPlot error:", error);
          showToast("ล้มเหลวในการบันทึกออนไลน์: " + error.message, "error");
        }
      });
    }
    return newPlot;
  }

  updatePlot(id, updatedData) {
    let plots = this.getPlots();
    const index = plots.findIndex(p => p.id === id);
    if (index !== -1) {
      delete plots[index].memberId;
      const updatedPlot = { 
        ...plots[index], 
        ...updatedData,
        sizeRai: parseInt(updatedData.sizeRai) || 0,
        sizeNgan: parseInt(updatedData.sizeNgan) || 0,
        sizeSqWah: parseInt(updatedData.sizeSqWah) || 0,
        lat: parseFloat(updatedData.lat) || plots[index].lat,
        lng: parseFloat(updatedData.lng) || plots[index].lng
      };

      this.plotsCache = plots;
      this.plotsCache[index] = updatedPlot;
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(this.plotsCache));

      if (supabaseClient) {
        const dbPlotUpdate = {
          name: updatedPlot.name,
          member_ids: updatedPlot.memberIds,
          size_rai: updatedPlot.sizeRai,
          size_ngan: updatedPlot.sizeNgan,
          size_sq_wah: updatedPlot.sizeSqWah,
          plant_type: updatedPlot.plantType,
          lat: updatedPlot.lat,
          lng: updatedPlot.lng,
          status: updatedPlot.status
        };
        supabaseClient.from('plots').update(dbPlotUpdate).eq('id', id).then(({ error }) => {
          if (error) {
            console.error("Supabase updatePlot error:", error);
            showToast("ล้มเหลวในการอัปเดตออนไลน์: " + error.message, "error");
          }
        });
      }
      return updatedPlot;
    }
    return null;
  }

  deletePlot(id) {
    let plots = this.getPlots();
    const crops = this.getCrops().filter(c => c.plotId === id);
    
    // Auto-cascade: delete any crops tied to this plot
    crops.forEach(c => {
      try {
        this.deleteCrop(c.id);
      } catch (e) {
        console.warn("Failed to cascade delete crop:", c.id, e);
      }
    });

    const filtered = plots.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(filtered));
    this.plotsCache = filtered;

    if (supabaseClient) {
      supabaseClient.from('plots').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deletePlot error:", error);
        }
      });
    }
    return true;
  }

  // --- Crop Seasons Methods ---
  getCrops() {
    if (Array.isArray(this.cropsCache)) {
      return this.cropsCache;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.CROPS);
    if (raw === null) {
      this.cropsCache = [];
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify([]));
      return [];
    }
    try {
      const stored = JSON.parse(raw);
      this.cropsCache = Array.isArray(stored) ? stored : [];
      return this.cropsCache;
    } catch (e) {
      this.cropsCache = [];
      return [];
    }
  }

  getCropById(id) {
    return this.getCrops().find(c => c.id === id);
  }

  getCropsByPlotId(plotId) {
    return this.getCrops().filter(c => c.plotId === plotId);
  }

  addCrop(crop) {
    const crops = this.getCrops();
    
    // Determine cropYear (Thai Buddhist Era, e.g. 2569)
    const plantDateObj = crop.plantDate ? new Date(crop.plantDate) : new Date();
    const cropYear = parseInt(crop.cropYear) || (plantDateObj.getFullYear() + 543);
    const cropCycle = parseInt(crop.cropCycle) || 1;
    const yearSuffix = String(cropYear).slice(-2); // e.g. '69' from 2569

    // STRICT VALIDATION: In 1 round (cropYear + cropCycle), 1 plot can only have 1 crop record!
    const existing = crops.find(c => 
      c.plotId === crop.plotId && 
      Number(c.cropYear) === Number(cropYear) && 
      Number(c.cropCycle || 1) === Number(cropCycle)
    );
    if (existing) {
      throw new Error(`แปลง ${crop.plotId} มีรอบเพาะปลูกในรอบนี้แล้ว (1 รอบบันทึกได้ 1 แปลงเท่านั้น ระบบล็อกห้ามทำซ้ำ)`);
    }

    // Format ID as standard: [ปี พ.ศ. 4 หลัก]/[P ตามด้วยเลขแปลง 3 หลัก]-R[เลขรอบ 1 หรือ 2] (strictly no spaces) e.g. 2569/P001-R1
    const newId = formatCropSeasonId(crop.plotId, cropYear, cropCycle);
    
    let estHarvest = crop.harvestDateEst;
    if (!estHarvest && crop.plantDate) {
      const pDate = new Date(crop.plantDate);
      pDate.setDate(pDate.getDate() + 90);
      estHarvest = pDate.toISOString().split('T')[0];
    }

    const newCrop = {
      ...crop,
      id: newId,
      cost: parseFloat(crop.cost) || 0,
      yield: crop.yield ? parseFloat(crop.yield) : null,
      status: crop.status || 'growing',
      harvestDateEst: estHarvest,
      cropYear: cropYear,
      cropCycle: cropCycle,
      fertilizingLog: crop.fertilizingLog || [],
      isProcessed: false
    };
    
    this.cropsCache = this.cropsCache || [];
    this.cropsCache.push(newCrop);
    localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(this.cropsCache));

    if (supabaseClient) {
      const dbCrop = {
        id: newCrop.id,
        plot_id: newCrop.plotId,
        plant_date: newCrop.plantDate,
        cost: newCrop.cost,
        crop_year: newCrop.cropYear,
        harvest_date_est: newCrop.harvestDateEst,
        harvest_date_actual: newCrop.harvestDateActual || null,
        yield: newCrop.yield,
        status: newCrop.status,
        fertilizing_log: newCrop.fertilizingLog,
        is_processed: newCrop.isProcessed
      };
      supabaseClient.from('crops').insert([dbCrop]).then(({ error }) => {
        if (error) {
          console.error("Supabase addCrop error:", error);
          showToast("ล้มเหลวในการบันทึกออนไลน์: " + error.message, "error");
        }
      });
    }
    return newCrop;
  }

  updateCrop(id, updatedData) {
    let crops = this.getCrops();
    const index = crops.findIndex(c => c.id === id);
    if (index !== -1) {
      const updatedCrop = { 
        ...crops[index], 
        ...updatedData,
        cost: updatedData.cost !== undefined ? (parseFloat(updatedData.cost) || 0) : crops[index].cost,
        yield: updatedData.yield !== undefined ? parseFloat(updatedData.yield) : crops[index].yield
      };

      this.cropsCache = crops;
      this.cropsCache[index] = updatedCrop;
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(this.cropsCache));

      if (supabaseClient) {
        const dbCropUpdate = {
          plot_id: updatedCrop.plotId,
          plant_date: updatedCrop.plantDate,
          cost: updatedCrop.cost,
          crop_year: updatedCrop.cropYear,
          harvest_date_est: updatedCrop.harvestDateEst,
          harvest_date_actual: updatedCrop.harvestDateActual || null,
          yield: updatedCrop.yield,
          status: updatedCrop.status,
          fertilizing_log: updatedCrop.fertilizingLog,
          is_processed: updatedCrop.isProcessed
        };
        supabaseClient.from('crops').update(dbCropUpdate).eq('id', id).then(({ error }) => {
          if (error) {
            console.error("Supabase updateCrop error:", error);
            showToast("ล้มเหลวในการอัปเดตออนไลน์: " + error.message, "error");
          }
        });
      }
      return updatedCrop;
    }
    return null;
  }

  addFertilizerLog(cropId, logEntry) {
    let crops = this.getCrops();
    const index = crops.findIndex(c => c.id === cropId);
    if (index !== -1) {
      const log = crops[index].fertilizingLog || [];
      const newEntry = {
        date: logEntry.date || new Date().toISOString().split('T')[0],
        type: logEntry.type,
        amount: logEntry.amount,
        cost: parseFloat(logEntry.cost) || 0
      };
      log.push(newEntry);
      
      const updatedCrop = { ...crops[index], fertilizingLog: log };
      
      if (supabaseClient) {
        this.cropsCache[index] = updatedCrop;
        supabaseClient.from('crops').update({ fertilizing_log: log }).eq('id', cropId).then(({ error }) => {
          if (error) {
            console.error("Supabase addFertilizerLog error:", error);
            showToast("ล้มเหลวในการบันทึกออนไลน์: " + error.message, "error");
          }
        });
      } else {
        crops[index] = updatedCrop;
        localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
      }
      return updatedCrop;
    }
    return null;
  }

  deleteCrop(id) {
    const crops = this.getCrops();
    const filtered = crops.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(filtered));
    this.cropsCache = filtered;

    // Also delete inventory associated with it
    let inventory = this.getInventory();
    inventory = inventory.filter(inv => inv.cropId !== id);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    this.inventoryCache = inventory;

    // Also delete sales associated with it
    let sales = this.getSales();
    sales = sales.filter(s => s.cropId !== id);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    this.salesCache = sales;

    if (supabaseClient) {
      supabaseClient.from('crops').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deleteCrop error:", error);
        }
      });
    }

    return true;
  }

  // --- Inventory Methods (Phase 2) ---
  getInventory() {
    if (Array.isArray(this.inventoryCache)) {
      return this.inventoryCache;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (raw === null) {
      this.inventoryCache = [];
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]));
      return [];
    }
    try {
      const stored = JSON.parse(raw);
      this.inventoryCache = Array.isArray(stored) ? stored : [];
      return this.inventoryCache;
    } catch (e) {
      this.inventoryCache = [];
      return [];
    }
  }

  getInventoryByCropId(cropId) {
    return this.getInventory().find(inv => inv.cropId === cropId);
  }

  // --- Sales Methods (Phase 2) ---
  getSales() {
    if (Array.isArray(this.salesCache)) {
      return this.salesCache;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (raw === null) {
      this.salesCache = [];
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
      return [];
    }
    try {
      const stored = JSON.parse(raw);
      this.salesCache = Array.isArray(stored) ? stored : [];
      return this.salesCache;
    } catch (e) {
      this.salesCache = [];
      return [];
    }
  }

  getSalesByCropId(cropId) {
    return this.getSales().filter(s => s.cropId === cropId);
  }

  /**
   * Process fresh harvested flowers into dry herb stock
   * Allows optional custom dryWeightKg input, or defaults to calculated ratio (Chrysanthemum 8:1, Chamomile 6:1)
   */
  processDryHerbStock(cropId, freshYieldKg, customDryWeightKg = null, dryingDate = null) {
    const crop = this.getCropById(cropId);
    if (!crop) throw new Error('ไม่พบรหัสรอบการปลูกนี้ในระบบ');
    if (crop.isProcessed) throw new Error('ล็อตเพาะปลูกนี้ผ่านกระบวนการแปรรูปอบแห้งแล้ว');

    const plot = this.getPlotById(crop.plotId);
    const herbType = crop.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';

    const yieldAmount = parseFloat(freshYieldKg) || crop.yield || 0;
    if (yieldAmount <= 0) throw new Error('น้ำหนักผลผลิตสดต้องมากกว่า 0 กิโลกรัมเพื่อเข้าอบแห้ง');

    // Calculate dried yield or use custom dry weight based on Master Herbs Catalog
    const masterHerb = this.getHerbByName(herbType) || this.getHerbById(herbType);
    const standardRatio = masterHerb ? (parseFloat(masterHerb.standardRatio) || 8.0) : 8.0;

    let finalDryWeight = 0;
    if (customDryWeightKg !== null && !isNaN(parseFloat(customDryWeightKg)) && parseFloat(customDryWeightKg) > 0) {
      finalDryWeight = parseFloat(parseFloat(customDryWeightKg).toFixed(2));
    } else {
      finalDryWeight = parseFloat((yieldAmount / standardRatio).toFixed(2));
    }

    const actualDryingDate = dryingDate || new Date().toISOString().split('T')[0];
    const batchId = 'DRY-' + Date.now().toString().slice(-4);

    // 1. Add to Inventory
    const inventory = this.getInventory();
    const existingIndex = inventory.findIndex(inv => inv.cropId === cropId);
    let invItem;
    if (existingIndex !== -1) {
      inventory[existingIndex].dryStockKg = parseFloat((inventory[existingIndex].dryStockKg + finalDryWeight).toFixed(2));
      inventory[existingIndex].processedDate = actualDryingDate;
      invItem = inventory[existingIndex];
      if (supabaseClient) {
        supabaseClient.from('inventory').update({ dry_stock_kg: invItem.dryStockKg }).eq('crop_id', cropId).then(({ error }) => {
          if (error) console.error("Supabase inventory update error:", error);
        });
      }
    } else {
      invItem = {
        cropId: cropId,
        herbType: herbType,
        dryStockKg: finalDryWeight,
        processedDate: actualDryingDate
      };
      inventory.push(invItem);
      if (supabaseClient) {
        supabaseClient.from('inventory').insert([{
          crop_id: invItem.cropId,
          herb_type: invItem.herbType,
          dry_stock_kg: invItem.dryStockKg,
          processed_date: invItem.processedDate
        }]).then(({ error }) => {
          if (error) console.error("Supabase inventory insert error:", error);
        });
      }
    }
    if (!supabaseClient) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    // 2. Mark Crop as processed and save yield, drying date, and dry weight
    this.updateCrop(cropId, { 
      status: 'harvested',
      yield: yieldAmount,
      harvestDateActual: crop.harvestDateActual || actualDryingDate,
      isProcessed: true,
      dryingDate: actualDryingDate,
      freshUsed: yieldAmount,
      dryWeight: finalDryWeight
    });

    // 3. Add to batch history
    this.addDryingBatch({
      id: batchId,
      herbType: herbType,
      totalFreshAvailableKg: yieldAmount,
      freshWeightKg: yieldAmount,
      dryWeightKg: finalDryWeight,
      ratioActual: (yieldAmount / (finalDryWeight || 1)).toFixed(2),
      processedDate: actualDryingDate,
      note: `อบแห้งแปลง ${plot ? plot.name : cropId}`,
      cropIds: [cropId]
    });

    return finalDryWeight;
  }

  /**
   * Get all enterprise drying batch logs
   */
  getDryingBatches() {
    const data = localStorage.getItem(STORAGE_KEYS.DRYING_BATCHES);
    let list = [];
    if (!data) {
      return [];
    } else {
      try {
        list = JSON.parse(data) || [];
      } catch (e) {
        list = [];
      }
    }
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }
    let hasUpdated = false;
    list.forEach(b => {
      const fresh = parseFloat(b.freshWeightKg) || 0;
      const dry = parseFloat(b.dryWeightKg) || 0;
      if (fresh > 0 && dry > 0) {
        const calculatedRatio = (fresh / dry).toFixed(2);
        if (b.ratioActual !== calculatedRatio) {
          b.ratioActual = calculatedRatio;
          hasUpdated = true;
        }
      }
    });
    if (hasUpdated) {
      localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify(list));
    }
    return list.sort((a, b) => new Date(b.processedDate) - new Date(a.processedDate));
  }

  /**
   * Add a drying batch log
   */
  addDryingBatch(batch) {
    const batches = this.getDryingBatches();
    batches.unshift(batch);
    localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify(batches));

    // Tier 3 Trigger: Auto-restock dry flower into Inventory_Stock / Products
    try {
      if (!batch.syncedToStock) {
        const dryKg = parseFloat(batch.dryWeightKg) || 0;
        if (dryKg > 0 && batch.herbType) {
          const products = this.getProducts();
          const matchPrd = products.find(p => p.unit === 'กก.' && p.name.includes(batch.herbType));
          if (matchPrd) {
            this.updateProduct(matchPrd.id, { stock: parseFloat(((parseFloat(matchPrd.stock) || 0) + dryKg).toFixed(2)) });
          }
        }
      }
    } catch (e) {
      console.error("Auto-restock dry flower trigger error in addDryingBatch:", e);
    }

    return batch;
  }

  /**
   * Process pooled fresh flowers of a specific herb type into dry herb stock
   * Gathers fresh harvest from all plots of this herb without plot/member division
   */
  processPooledHerbDrying(herbType, freshWeightKg, customDryWeightKg = null, batchNote = '', processedDate = null) {
    const allCrops = this.getCrops();
    const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');
    const targetHerb = isChrys ? 'เก๊กฮวย' : (herbType.includes('คาโมมายล์') ? 'คาโมมายล์' : herbType);
    
    // Find all harvested unprocessed crops of this herb type
    const pendingCrops = allCrops.filter(c => {
      if (c.status !== 'harvested' || c.isProcessed) return false;
      const plot = this.getPlotById(c.plotId);
      const cHerb = c.seedlingSource || (plot ? plot.plantType : '') || '';
      return cHerb.includes(targetHerb);
    });

    const totalPendingWeight = pendingCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
    if (totalPendingWeight <= 0) {
      throw new Error(`ไม่พบผลผลิตดอกสดรออบของพืช '${targetHerb}' ในระบบ`);
    }

    const weightToProcess = Math.min(parseFloat(freshWeightKg) || totalPendingWeight, totalPendingWeight);
    if (weightToProcess <= 0) {
      throw new Error('กรุณาระบุน้ำหนักผลผลิตสดที่ต้องการนำเข้าอบ');
    }

    // Determine ratio and final dry weight (สูตรมาตรฐานวิสาหกิจ 10:1 เช่น สด 150 kg -> แห้ง 15 kg)
    let ratio = 10;

    let finalDryWeight = 0;
    if (customDryWeightKg !== null && !isNaN(parseFloat(customDryWeightKg)) && parseFloat(customDryWeightKg) > 0) {
      finalDryWeight = parseFloat(parseFloat(customDryWeightKg).toFixed(2));
    } else {
      finalDryWeight = parseFloat((weightToProcess / ratio).toFixed(2));
    }

    const actualDate = processedDate || new Date().toISOString().split('T')[0];
    const batchId = 'DRY-' + Date.now().toString().slice(-4);

    // 1. Mark pending crops as processed and record drying info
    let remainingFresh = weightToProcess;
    const processedCropIds = [];
    const actualRatio = weightToProcess / (finalDryWeight || 1);

    for (const crop of pendingCrops) {
      const cYield = parseFloat(crop.yield) || 0;
      if (remainingFresh >= cYield - 0.05) {
        const cropDryWeight = parseFloat((cYield / actualRatio).toFixed(2));
        this.updateCrop(crop.id, { 
          isProcessed: true,
          dryingDate: actualDate,
          dryWeight: cropDryWeight,
          freshUsed: cYield
        });
        processedCropIds.push(crop.id);
        remainingFresh -= cYield;
      } else if (remainingFresh > 0) {
        const cropDryWeight = parseFloat((remainingFresh / actualRatio).toFixed(2));
        this.updateCrop(crop.id, { 
          isProcessed: true,
          dryingDate: actualDate,
          dryWeight: cropDryWeight,
          freshUsed: remainingFresh
        });
        processedCropIds.push(crop.id);
        remainingFresh = 0;
      }
    }

    // 2. Add dry herb stock to inventory
    const inventory = this.getInventory();
    const existingIndex = inventory.findIndex(inv => inv.isPooledBatch && inv.herbType === targetHerb);
    
    if (existingIndex !== -1) {
      inventory[existingIndex].dryStockKg = parseFloat((inventory[existingIndex].dryStockKg + finalDryWeight).toFixed(2));
      inventory[existingIndex].processedDate = actualDate;
    } else {
      inventory.push({
        cropId: batchId,
        herbType: targetHerb,
        dryStockKg: finalDryWeight,
        processedDate: actualDate,
        isPooledBatch: true,
        note: batchNote || `ผลผลิตรวมวิสาหกิจ (ทุกแปลงสมาชิก) - รอบอบ ${actualDate}`
      });
    }

    if (!supabaseClient) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    // Also sync to products catalog (PRD-XXX)
    try {
      const products = this.getProducts();
      const matchPrd = products.find(p => p.unit === 'กก.' && p.name.includes(targetHerb));
      if (matchPrd) {
        this.updateProduct(matchPrd.id, { stock: parseFloat((matchPrd.stock + finalDryWeight).toFixed(2)) });
      }
    } catch (e) {
      console.error("Sync product error:", e);
    }

    // 3. Record batch drying log
    const dryingBatch = {
      id: batchId,
      herbType: targetHerb,
      totalFreshAvailableKg: totalPendingWeight,
      freshWeightKg: weightToProcess,
      dryWeightKg: finalDryWeight,
      ratioActual: (weightToProcess / (finalDryWeight || 1)).toFixed(2),
      processedDate: actualDate,
      note: batchNote || `ผลผลิตสดรวมทุกแปลงสมาชิก - อบแห้งเข้าคลัง`,
      cropIds: processedCropIds,
      syncedToStock: true
    };
    this.addDryingBatch(dryingBatch);

    return dryingBatch;
  }

  /**
   * Get all enterprise packaging/canning batch logs
   */
  getPackagingBatches() {
    const data = localStorage.getItem(STORAGE_KEYS.PACKAGING_BATCHES);
    let list = [];
    if (!data) {
      return [];
    } else {
      try {
        list = JSON.parse(data) || [];
      } catch (e) {
        list = [];
      }
    }
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }
    // Normalize packaging batches to 50 G
    let changed = false;
    list.forEach(b => {
      if (!b.packageSize || b.packageSize.includes('กิโลกรัม') || b.packageSize.includes('50 กรัม')) {
        b.packageSize = '50 G';
        if (b.dryUsedKg >= 50 && b.jarsProduced === 1) {
          b.dryUsedKg = 5.0;
          b.jarsProduced = 100;
        }
        if (b.productName) {
          b.productName = b.productName.replace(/50\s*กก\./g, '50 G').replace(/50\s*กิโลกรัม/g, '50 G').replace(/50\s*กรัม/g, '50 G').replace('กระป๋อง', 'กระป๋อง');
        }
        if (b.note) {
          b.note = b.note.replace(/50\s*กก\./g, '50 G').replace(/50\s*กิโลกรัม/g, '50 G');
        }
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify(list));
    }
    return list.sort((a, b) => new Date(b.processedDate) - new Date(a.processedDate));
  }

  /**
   * Add a packaging batch log
   */
  addPackagingBatch(batch) {
    const batches = this.getPackagingBatches();
    batches.unshift(batch);
    localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify(batches));
    return batch;
  }

  /**
   * Process dry herb into canned/jar packaging products
   * (ดอกแห้ง > แบบกระป๋อง: สูตร 50 G ต่อ 1 กระป๋อง, 1 กก. = 20 กระป๋อง)
   */
  processHerbCanning(herbType, dryUsedKg, packageSizeUnit = '50 G', jarsCount = null, operatorName = '', note = '', processedDate = null) {
    const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');
    const targetHerb = isChrys ? 'เก๊กฮวย' : (herbType.includes('คาโมมายล์') ? 'คาโมมายล์' : herbType);
    const usedKg = parseFloat(dryUsedKg) || 0;
    
    // Parse package size in grams (e.g. 50 G per jar = 0.05 kg)
    let szG = 50;
    if (typeof packageSizeUnit === 'number') {
      szG = packageSizeUnit;
    } else if (typeof packageSizeUnit === 'string') {
      const match = packageSizeUnit.match(/\d+/);
      szG = match ? parseInt(match[0]) : 50;
    }

    const jarsProduced = jarsCount ? parseInt(jarsCount) : Math.max(1, Math.floor((usedKg * 1000) / szG));
    const actualDate = processedDate || new Date().toISOString().split('T')[0];

    const yearBE = new Date(actualDate).getFullYear() + 543;
    const yearShort = String(yearBE).slice(-2);
    const existingBatches = this.getPackagingBatches();
    const batchId = `PACK-${yearShort}${String(existingBatches.length + 1).padStart(2, '0')}`;

    // 1. Deduct dry herbs used from inventory & bulk dry product stock (PRD-001/PRD-002)
    try {
      const inventory = this.getInventory();
      const invItem = inventory.find(i => (i.herbType && i.herbType.includes(targetHerb)));
      if (invItem && invItem.dryStockKg >= usedKg) {
        invItem.dryStockKg = Math.max(0, parseFloat((invItem.dryStockKg - usedKg).toFixed(2)));
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      }

      const bulkProd = products.find(p => p.unit === 'กก.' && (p.name.includes(targetHerb) || p.category.includes(targetHerb)));
      if (bulkProd && bulkProd.stock >= usedKg) {
        this.updateProduct(bulkProd.id, { stock: Math.max(0, parseFloat((bulkProd.stock - usedKg).toFixed(2))) });
      }
    } catch (e) {
      console.error("Canning deduction error:", e);
    }

    // 2. Find canned product in products catalog and increase jar stock
    const products = this.getProducts();
    let cannedProduct = products.find(p => (p.unit === 'กระป๋อง' || p.unit === 'กระป๋อง') && (p.category.includes(targetHerb) || p.name.includes(targetHerb)));

    if (cannedProduct) {
      this.updateProduct(cannedProduct.id, {
        stock: (cannedProduct.stock || 0) + jarsProduced,
        updatedDate: actualDate
      });
    }

    // 2. Record packaging batch log
    const batch = {
      id: batchId,
      herbType: targetHerb,
      dryUsedKg: usedKg,
      packageSize: `${szG} G`,
      jarsProduced: jarsProduced,
      processedDate: actualDate,
      productId: cannedProduct ? cannedProduct.id : '',
      productName: cannedProduct ? cannedProduct.name : `ดอก${targetHerb}กระป๋อง (${szG} G)`,
      operatorName: operatorName || 'สมาชิกกลุ่มแปรรูป',
      note: note || `บรรจุกระป๋องขนาด ${szG} G (1 กก. = ${Math.floor(1000 / szG)} กป.) ตามเกณฑ์วิสาหกิจ`
    };

    this.addPackagingBatch(batch);
    return batch;
  }

  /**
   * Record a sale of dry herbs from a specific Crop lot.
   * Decrements stock and logs transaction.
   */
  recordSale(cropId, amount, price, customer, date, saleType = 'bulk', customerId = null) {
    const amt = parseFloat(amount) || 0;
    const prc = parseFloat(price) || 0;
    if (amt <= 0) throw new Error(saleType === 'bulk' ? 'ปริมาณสมุนไพรอบแห้งที่ขายต้องมากกว่า 0 กก.' : 'จำนวนกระป๋องที่ขายต้องมากกว่า 0 กระป๋อง');
    if (prc <= 0) throw new Error('ราคาต่อหน่วยต้องมากกว่า 0 บาท');

    // 1. Check Inventory
    const inventory = this.getInventory();
    const invIndex = inventory.findIndex(inv => inv.cropId === cropId);
    if (invIndex === -1) throw new Error('ไม่พบล็อตสินค้านี้ในคลังสินค้า');
    
    const inv = inventory[invIndex];
    const jarCapacity = 0.05; // 50g per jar (0.05 kg) as requested (50 G ต่อ 1 กระป๋อง)

    let weightToDeduct = amt;
    if (saleType === 'jar') {
      weightToDeduct = parseFloat((amt * jarCapacity).toFixed(2));
    }

    if (inv.dryStockKg < weightToDeduct) {
      if (saleType === 'bulk') {
        throw new Error(`จำนวนสินค้าล็อตนี้ไม่เพียงพอในคลัง (คงเหลือ ${inv.dryStockKg} กก., ต้องการขาย ${amt} กก.)`);
      } else {
        const maxJarsAvailable = Math.floor(inv.dryStockKg / jarCapacity);
        throw new Error(`วัตถุดิบอบแห้งในคลังไม่เพียงพอสำหรับบรรจุขาย (คงเหลือ ${inv.dryStockKg} กก., เทียบเท่าสูงสุด ${maxJarsAvailable} กระป๋อง, ต้องการขาย ${amt} กระป๋อง)`);
      }
    }

    inv.dryStockKg = parseFloat((inv.dryStockKg - weightToDeduct).toFixed(2));
    if (supabaseClient) {
      supabaseClient.from('inventory').update({ dry_stock_kg: inv.dryStockKg }).eq('crop_id', cropId).then(({ error }) => {
        if (error) console.error("Supabase inventory deduct error:", error);
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    // Log sale transaction
    const sales = this.getSales();
    const maxIdNum = sales.reduce((max, s) => {
      const num = parseInt(s.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const newSaleId = `SALE-${String(maxIdNum + 1).padStart(3, '0')}`;

    const newSale = {
      id: newSaleId,
      cropId,
      amount: amt,
      price: prc,
      amountKg: amt, // for legacy code compatibility
      pricePerKg: prc, // for legacy code compatibility
      totalPrice: parseFloat((amt * prc).toFixed(2)),
      customerId: customerId || null,
      customer: customer || 'ทั่วไป/ไม่ระบุชื่อ',
      date: date || new Date().toISOString().split('T')[0],
      saleType // 'bulk' or 'jar'
    };
    
    if (supabaseClient) {
      this.salesCache.push(newSale);
      const dbSale = {
        id: newSale.id,
        crop_id: newSale.cropId,
        amount: newSale.amount,
        price: newSale.price,
        amount_kg: newSale.amountKg,
        price_per_kg: newSale.pricePerKg,
        total_price: newSale.totalPrice,
        customer: newSale.customer,
        date: newSale.date,
        sale_type: newSale.saleType
      };
      supabaseClient.from('sales').insert([dbSale]).then(({ error }) => {
        if (error) {
          console.error("Supabase recordSale error:", error);
          showToast("ล้มเหลวในการบันทึกประวัติการขายออนไลน์: " + error.message, "error");
        }
      });
    } else {
      sales.push(newSale);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    }

    return newSale;
  }

  deleteSale(saleId, restoreStock = true) {
    let sales = this.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (!sale) throw new Error('ไม่พบรายการขายนี้ในระบบ');

    // 1. Optionally restore stock back into the crop lot
    if (restoreStock) {
      let inventory = this.getInventory();
      const invIndex = inventory.findIndex(inv => inv.cropId === sale.cropId);
      if (invIndex !== -1) {
        const inv = inventory[invIndex];
        const jarCapacity = 0.05; // 50g per jar
        const weightToRestore = sale.saleType === 'jar'
          ? parseFloat((sale.amount * jarCapacity).toFixed(2))
          : (parseFloat(sale.amount) || parseFloat(sale.amountKg) || 0);

        inv.dryStockKg = parseFloat((inv.dryStockKg + weightToRestore).toFixed(2));
        if (supabaseClient) {
          supabaseClient.from('inventory').update({ dry_stock_kg: inv.dryStockKg }).eq('crop_id', sale.cropId).then(({ error }) => {
            if (error) console.error("Supabase restore inventory error:", error);
          });
        } else {
          localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
        }
      }

      // Restore product stock if linked to catalog (PRD-XXX)
      try {
        const products = this.getProducts();
        const prod = products.find(p => p.id === sale.cropId);
        if (prod) {
          const restoredQty = parseFloat(sale.amount) || parseFloat(sale.amountKg) || 0;
          this.updateProduct(prod.id, { stock: parseFloat((prod.stock + restoredQty).toFixed(2)) });
        }
      } catch (e) {
        console.error("Product stock restore error:", e);
      }
    }

    // 2. Remove sale from sales cache and storage
    if (supabaseClient) {
      this.salesCache = this.salesCache.filter(s => s.id !== saleId);
      supabaseClient.from('sales').delete().eq('id', saleId).then(({ error }) => {
        if (error) console.error("Supabase deleteSale error:", error);
      });
    } else {
      const filtered = sales.filter(s => s.id !== saleId);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(filtered));
    }

    return true;
  }

  deleteSales(saleIds, restoreStock = true) {
    if (!Array.isArray(saleIds) || saleIds.length === 0) return 0;
    let successCount = 0;
    saleIds.forEach(id => {
      try {
        this.deleteSale(id, restoreStock);
        successCount++;
      } catch (e) {
        console.error(`Failed to delete sale ${id}:`, e);
      }
    });
    return successCount;
  }

  updateLotWeights(cropId, yieldFresh, dryStock) {
    const fresh = parseFloat(yieldFresh) || 0;
    const dry = parseFloat(dryStock) || 0;
    if (fresh < 0 || dry < 0) throw new Error('น้ำหนักดอกสดและอบแห้งต้องไม่ติดลบ');

    // 1. Update Inventory
    let inventory = this.getInventory();
    const invIndex = inventory.findIndex(inv => inv.cropId === cropId);
    if (invIndex === -1) throw new Error('ไม่พบล็อตสินค้านี้ในคลังสินค้า');
    inventory[invIndex].dryStockKg = dry;
    
    if (supabaseClient) {
      supabaseClient.from('inventory').update({ dry_stock_kg: dry }).eq('crop_id', cropId).then(({ error }) => {
        if (error) console.error("Supabase updateLotWeights inventory error:", error);
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    // 2. Update Crop record
    let crops = this.getCrops();
    const cropIndex = crops.findIndex(c => c.id === cropId);
    if (cropIndex !== -1) {
      crops[cropIndex].yield = fresh;
      if (supabaseClient) {
        supabaseClient.from('crops').update({ yield: fresh }).eq('id', cropId).then(({ error }) => {
          if (error) console.error("Supabase updateLotWeights crop error:", error);
        });
      } else {
        localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
      }
    }

    return { fresh, dry };
  }

  // --- Customer Methods ---
  getCustomers() {
    if (supabaseClient && Array.isArray(this.customersCache) && this.customersCache.length > 0) {
      return this.customersCache;
    }
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) || [];
    const result = (Array.isArray(stored) && stored.length > 0) ? stored : MOCK_CUSTOMERS;
    if (supabaseClient && (!this.customersCache || this.customersCache.length === 0)) {
      this.customersCache = result;
    }
    return result;
  }

  getCustomerById(id) {
    return this.getCustomers().find(c => c.id === id);
  }

  addCustomer(customerData) {
    const customers = this.getCustomers();
    const maxIdNum = customers.reduce((max, c) => {
      const parts = (c.id || '').split('-');
      const num = parseInt(parts[1]);
      return (!isNaN(num) && num > max) ? num : max;
    }, 0);
    const newId = `CUST-${String(maxIdNum + 1).padStart(3, '0')}`;

    const newCustomer = {
      id: newId,
      name: (customerData.name || '').trim(),
      customerType: customerData.customerType || 'ลูกค้าทั่วไป',
      phone: (customerData.phone || '').trim(),
      address: (customerData.address || '').trim(),
      lineId: (customerData.lineId || '').trim(),
      facebook: (customerData.facebook || '').trim(),
      contactChannel: (customerData.contactChannel || customerData.lineId || customerData.facebook || '').trim()
    };

    if (!newCustomer.name) throw new Error('กรุณาระบุชื่อลูกค้าหรือชื่อร้านค้า');

    this.customersCache = this.customersCache || [];
    this.customersCache.push(newCustomer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(this.customersCache));

    if (supabaseClient) {
      const dbCust = {
        id: newCustomer.id,
        name: newCustomer.name,
        customer_type: newCustomer.customerType,
        phone: newCustomer.phone,
        address: newCustomer.address,
        line_id: newCustomer.lineId,
        facebook: newCustomer.facebook,
        contact_channel: newCustomer.contactChannel
      };
      supabaseClient.from('customers').insert([dbCust]).then(({ error }) => {
        if (error) {
          console.error("Supabase addCustomer error:", error);
        }
      });
    }

    return newCustomer;
  }

  updateCustomer(id, data) {
    let customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      const updatedCust = {
        ...customers[index],
        name: (data.name !== undefined ? data.name : customers[index].name).trim(),
        customerType: data.customerType || customers[index].customerType,
        phone: (data.phone !== undefined ? data.phone : customers[index].phone).trim(),
        address: (data.address !== undefined ? data.address : customers[index].address).trim(),
        lineId: (data.lineId !== undefined ? data.lineId : (customers[index].lineId || '')).trim(),
        facebook: (data.facebook !== undefined ? data.facebook : (customers[index].facebook || '')).trim(),
        contactChannel: (data.contactChannel !== undefined ? data.contactChannel : (customers[index].contactChannel || '')).trim()
      };
      this.customersCache = customers;
      this.customersCache[index] = updatedCust;
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(this.customersCache));

      if (supabaseClient) {
        const dbCustUpdate = {
          name: updatedCust.name,
          customer_type: updatedCust.customerType,
          phone: updatedCust.phone,
          address: updatedCust.address,
          line_id: updatedCust.lineId,
          facebook: updatedCust.facebook,
          contact_channel: updatedCust.contactChannel
        };
        supabaseClient.from('customers').update(dbCustUpdate).eq('id', id).then(({ error }) => {
          if (error) {
            console.error("Supabase updateCustomer error:", error);
          }
        });
      }

      return updatedCust;
    }
    throw new Error('ไม่พบข้อมูลลูกค้ารายนี้');
  }

  deleteCustomer(id) {
    let customers = this.getCustomers();
    const sales = this.getSales();
    const hasSales = sales.some(s => s.customerId === id);
    if (hasSales) {
      throw new Error('ไม่สามารถลบลูกค้ารายนี้ได้ เนื่องจากมีประวัติการจำหน่ายสินค้าผูกอยู่');
    }

    const filtered = customers.filter(c => c.id !== id);
    this.customersCache = filtered;
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));

    if (supabaseClient) {
      supabaseClient.from('customers').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deleteCustomer error:", error);
        }
      });
    }

    return true;
  }

  /**
   * Generates a complete financial statement per member (Cost, Sales, Net Profit)
   */
  getFinancialReport() {
    const members = this.getMembers();
    const plots = this.getPlots();
    const crops = this.getCrops();
    const sales = this.getSales();

    return members.map(m => {
      // Find plots owned by this member
      const memberPlots = plots.filter(p => p.memberIds && p.memberIds.includes(m.id));
      const plotIds = memberPlots.map(p => p.id);

      // Find crops on those plots
      const memberCrops = crops.filter(c => plotIds.includes(c.plotId));
      const cropIds = memberCrops.map(c => c.id);

      // Total Cost = Sum of crop season costs (initial cost + fertilizing/maintenance logs cost)
      const totalCost = memberCrops.reduce((sum, c) => {
        const initialCost = parseFloat(c.cost) || 0;
        const fertCost = (c.fertilizingLog || []).reduce((s, f) => s + (parseFloat(f.cost) || 0), 0);
        return sum + initialCost + fertCost;
      }, 0);

      // Total Revenue = Sum of sales of this member's crop lots
      const memberSales = sales.filter(s => cropIds.includes(s.cropId));
      const totalRevenue = memberSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);

      const netProfit = totalRevenue - totalCost;

      // Breakdown by Herb type (สดที่ส่ง, แห้งที่ได้, และรายได้ตามพืช)
      const herbBreakdown = {};
      memberCrops.forEach(c => {
        const plot = plots.find(p => p.id === c.plotId);
        const hName = c.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';
        if (!herbBreakdown[hName]) {
          herbBreakdown[hName] = {
            herbName: hName,
            cropsCount: 0,
            freshYieldKg: 0,
            cost: 0,
            revenue: 0,
            net: 0
          };
        }
        herbBreakdown[hName].cropsCount++;
        herbBreakdown[hName].freshYieldKg += (parseFloat(c.yield) || 0);
        const cCost = (parseFloat(c.cost) || 0) + (c.fertilizingLog || []).reduce((s, f) => s + (parseFloat(f.cost) || 0), 0);
        herbBreakdown[hName].cost += cCost;
      });

      memberSales.forEach(s => {
        const crop = memberCrops.find(c => c.id === s.cropId);
        const hName = s.cropType || (crop ? crop.seedlingSource : 'เก๊กฮวย') || 'เก๊กฮวย';
        if (!herbBreakdown[hName]) {
          herbBreakdown[hName] = { herbName: hName, cropsCount: 0, freshYieldKg: 0, cost: 0, revenue: 0, net: 0 };
        }
        herbBreakdown[hName].revenue += (parseFloat(s.totalPrice) || 0);
      });

      Object.values(herbBreakdown).forEach(hb => {
        hb.net = hb.revenue - hb.cost;
      });

      return {
        id: m.id,
        name: m.name,
        role: m.role,
        villageNumber: m.villageNumber,
        totalPlots: memberPlots.length,
        totalCrops: memberCrops.length,
        totalCost,
        totalRevenue,
        netProfit,
        herbBreakdown,
        status: netProfit > 0 ? 'profit' : netProfit < 0 ? 'loss' : 'breakeven'
      };
    });
  }

  // --- Products Catalog Methods (PRD-XXX) ---
  getProducts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
        return [];
      }
      let products = JSON.parse(data) || [];
      if (!Array.isArray(products) || products.length === 0) {
        return [];
      }
      
      // AUTO-MIGRATE: Clean up old units based on strict criteria (กก. and กระป๋อง only)
      let needsSave = false;
      products.forEach(p => {
        if (p.unit === 'กระปุก' || p.unit === 'ซอง' || p.unit === 'กล่อง' || p.unit === 'ขวด' || p.unit === 'custom') {
          p.unit = 'กระป๋อง';
          needsSave = true;
        }
      });
      if (needsSave) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      }

      return products;
    } catch (e) {
      return [];
    }
  }

  /**
   * ซิงโครไนซ์รายการสินค้าในคลังให้มีสินค้ามาตรฐาน (ดอกอบแห้ง 1 กก. และ กระป๋อง 50G) 
   * สำหรับทุกชนิดพืชที่ถูกสร้างขึ้นในแผนการปลูก
   */
  syncHerbProductsWithRoadmaps(products) {
    try {
      if (!products || products.length === 0) return [];
      const roadmaps = this.getRoadmaps ? this.getRoadmaps() : {};
      const herbNames = Object.keys(roadmaps || {});
      if (herbNames.length === 0) return products;

      let changed = false;

      // Clean up auto-generated products for herbs no longer in roadmaps (preserve base catalog PRD-001..PRD-007)
      const baseProductIds = ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-005', 'PRD-006', 'PRD-007'];
      const filtered = products.filter(p => {
        if (baseProductIds.includes(p.id)) return true;
        // Keep if category is in active roadmaps
        if (p.category && herbNames.includes(p.category)) return true;
        // If stock > 0, preserve
        if ((parseFloat(p.stock) || 0) > 0) return true;
        return false;
      });
      if (filtered.length !== products.length) {
        products = filtered;
        changed = true;
      }

      // หาเลขรหัส PRD สูงสุด
      let maxIdNum = products.reduce((max, p) => {
        const match = (p.id || '').match(/PRD-(\d+)/);
        const num = match ? parseInt(match[1], 10) : 0;
        return (!isNaN(num) && num > max) ? num : max;
      }, 0);

      herbNames.forEach(herb => {
        if (!herb || !herb.trim()) return;
        const herbClean = herb.trim();

        // 1. ตรวจสอบสินค้าอบแห้ง (1 กก.)
        const hasBulk = products.some(p => 
          (p.category === herbClean || (p.name || '').includes(herbClean)) && (p.unit === 'กก.' || p.unit === 'kg')
        );
        if (!hasBulk) {
          maxIdNum++;
          const newId = `PRD-${String(maxIdNum).padStart(3, '0')}`;
          let bulkPrefix = 'ดอก';
          if (herbClean.includes('ใบ') || herbClean.includes('เตย') || herbClean.includes('ตะไคร้') || herbClean.includes('ฟ้าทะลายโจร') || herbClean.includes('เสลดพังพอน')) {
            bulkPrefix = '';
          } else if (herbClean.includes('ขมิ้น') || herbClean.includes('ไพล') || herbClean.includes('กระชาย') || herbClean.includes('ขิง') || herbClean.includes('ว่าน') || herbClean.includes('มะกรูด')) {
            bulkPrefix = '';
          }
          const bulkName = bulkPrefix ? `${bulkPrefix}${herbClean}อบแห้ง (1 กก.)` : `${herbClean}อบแห้ง (1 กก.)`;

          products.push({
            id: newId,
            name: bulkName,
            price: 300,
            unit: 'กก.',
            stock: 0,
            category: herbClean,
            updatedDate: new Date().toISOString().split('T')[0]
          });
          changed = true;
        }

        // 2. ตรวจสอบสินค้ากระป๋อง (50 G)
        const hasCan = products.some(p => 
          (p.category === herbClean || (p.name || '').includes(herbClean)) && (p.unit === 'กระป๋อง' || p.unit === 'กระปุก')
        );
        if (!hasCan) {
          maxIdNum++;
          const newId = `PRD-${String(maxIdNum).padStart(3, '0')}`;
          products.push({
            id: newId,
            name: `${herbClean}กระป๋อง (50 G)`,
            price: 120,
            unit: 'กระป๋อง',
            stock: 0,
            category: herbClean,
            updatedDate: new Date().toISOString().split('T')[0]
          });
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      }
      return products;
    } catch (e) {
      console.error('Error syncing herb products:', e);
      return products;
    }
  }

  /**
   * Helper to get current product price by herb type and unit
   * e.g. getProductPrice('เก๊กฮวย', 'กก.') -> 250
   * e.g. getProductPrice('คาโมมายล์', 'กก.') -> 450
   * e.g. getProductPrice('เก๊กฮวย', 'กระป๋อง') -> 150 (50 G)
   * e.g. getProductPrice('คาโมมายล์', 'กระป๋อง') -> 100 (50 G)
   */
  getProductPrice(herbType = '', unit = 'กก.') {
    const products = this.getProducts();
    const cleanHerb = (herbType || '').replace(/^(ดอก|ใบ|ต้น)/, '').trim();
    const isChrys = herbType.includes('เก๊กฮวย');
    const isCham = herbType.includes('คาโมมายล์');
    
    const found = products.find(p => {
      const matchUnit = unit === 'กก.' ? (p.unit === 'กก.' || p.unit === 'kg') : (p.unit === 'กระป๋อง' || p.unit === 'กระปุก');
      if (!matchUnit) return false;
      if (isChrys && (p.name.includes('เก๊กฮวย') || p.category.includes('เก๊กฮวย'))) return true;
      if (isCham && (p.name.includes('คาโมมายล์') || p.category.includes('คาโมมายล์'))) return true;
      return p.name.includes(herbType) || (cleanHerb && p.name.includes(cleanHerb)) || p.category === herbType || p.category === cleanHerb;
    });

    if (found) return found.price;

    // Check Master Herbs Catalog dynamically
    const masterHerb = this.getHerbByName(herbType) || this.getHerbById(herbType);
    if (masterHerb) {
      if (unit === 'กก.') {
        return parseFloat(masterHerb.drySellingPriceKg || masterHerb.baselinePriceDry) || 300;
      } else {
        return parseFloat(masterHerb.jarSellingPrice50g) || 120;
      }
    }

    // Standard Fallbacks: เก๊กฮวยกระป๋อง 50G=150, คาโมมายด์กระป๋อง 50G=100, เก๊กฮวยอบแห้ง 1KG=250, คาโมมายด์อบแห้ง 1KG=450
    if (isChrys) return unit === 'กก.' ? 250 : 150;
    if (isCham) return unit === 'กก.' ? 450 : 100;
    return unit === 'กก.' ? 300 : 120;
  }

  /**
   * Helper to quickly update product price
   */
  updateProductPrice(productId, newPrice) {
    const priceVal = parseFloat(newPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      throw new Error('ราคาต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0 บาท');
    }
    return this.updateProduct(productId, { price: priceVal });
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  addProduct(productData) {
    const products = this.getProducts();
    let newId = productData.id ? productData.id.trim() : '';
    if (!newId) {
      const maxIdNum = products.reduce((max, p) => {
        const parts = (p.id || '').split('-');
        const num = parseInt(parts[1]);
        return (!isNaN(num) && num > max) ? num : max;
      }, 0);
      newId = `PRD-${String(maxIdNum + 1).padStart(3, '0')}`;
    }

    if (products.some(p => p.id === newId)) {
      throw new Error(`รหัสสินค้า '${newId}' มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
    }

    const newProduct = {
      id: newId,
      name: (productData.name || '').trim(),
      price: parseFloat(productData.price) || 0,
      unit: (productData.unit || 'กก.').trim(),
      stock: parseFloat(productData.stock) || 0,
      category: (productData.category || 'ทั่วไป').trim(),
      updatedDate: productData.updatedDate || new Date().toISOString().split('T')[0]
    };

    if (!newProduct.name) throw new Error('กรุณาระบุชื่อสินค้า');
    if (newProduct.price < 0) throw new Error('ราคาต่อหน่วยต้องไม่ติดลบ');
    if (newProduct.stock < 0) throw new Error('จำนวนสต็อกเริ่มต้นต้องไม่ติดลบ');

    products.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  }

  updateProduct(id, productData) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`ไม่พบสินค้ารหัส ${id} ในระบบ`);

    products[index] = {
      ...products[index],
      name: productData.name !== undefined ? productData.name.trim() : products[index].name,
      price: productData.price !== undefined ? (parseFloat(productData.price) || 0) : products[index].price,
      unit: productData.unit !== undefined ? productData.unit.trim() : products[index].unit,
      stock: productData.stock !== undefined ? (parseFloat(productData.stock) || 0) : products[index].stock,
      category: productData.category !== undefined ? productData.category.trim() : products[index].category,
      updatedDate: new Date().toISOString().split('T')[0]
    };

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return products[index];
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
    return true;
  }

  adjustProductStock(id, newStock, reason = '') {
    const stockVal = parseFloat(newStock);
    if (isNaN(stockVal) || stockVal < 0) throw new Error('จำนวนสต็อกต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
    return this.updateProduct(id, { stock: stockVal });
  }

  deductProductStock(id, amount, customerName = '', salePrice = null, date = null, customerId = null) {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) throw new Error('จำนวนที่ตัดสต็อกต้องมากกว่า 0');

    const product = this.getProductById(id);
    if (!product) throw new Error(`ไม่พบสินค้ารหัส ${id}`);
    if (product.stock < amt) {
      throw new Error(`สต็อกสินค้ามีไม่เพียงพอ (คงเหลือ ${product.stock} ${product.unit}, ต้องการตัด ${amt} ${product.unit})`);
    }

    const newStock = parseFloat((product.stock - amt).toFixed(2));
    this.updateProduct(id, { stock: newStock });

    // Also deduct bulk dry herb stock from inventory if sold in กก.
    if (product.unit === 'กก.' || product.unit === 'kg') {
      try {
        const inventory = this.getInventory();
        const targetHerb = product.name.includes('เก๊กฮวย') ? 'เก๊กฮวย' : (product.name.includes('คาโมมาย') ? 'คาโมมายล์' : '');
        if (targetHerb) {
          const invItem = inventory.find(i => (i.herbType && i.herbType.includes(targetHerb)));
          if (invItem) {
            invItem.dryStockKg = Math.max(0, parseFloat((invItem.dryStockKg - amt).toFixed(2)));
            localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
          }
        }
      } catch (e) {
        console.error("Inventory sync error in deductProductStock:", e);
      }
    }

    // Record sale transaction
    const unitPrice = salePrice !== null && !isNaN(parseFloat(salePrice)) ? parseFloat(salePrice) : product.price;
    const sales = this.getSales();
    const maxIdNum = sales.reduce((max, s) => {
      const num = parseInt(s.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const newSaleId = `SALE-${String(maxIdNum + 1).padStart(3, '0')}`;
    const newSale = {
      id: newSaleId,
      cropId: id,
      amount: amt,
      price: unitPrice,
      amountKg: amt,
      pricePerKg: unitPrice,
      totalPrice: parseFloat((amt * unitPrice).toFixed(2)),
      customerId: customerId || null,
      customer: customerName || 'ทั่วไป/ไม่ระบุชื่อ',
      date: date || new Date().toISOString().split('T')[0],
      saleType: product.unit === 'กก.' ? 'bulk' : 'jar'
    };

    sales.push(newSale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

    return { product: this.getProductById(id), sale: newSale };
  }

  getStats() {
    const currentUser = this.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    const members = this.getMembers();
    let plots = this.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const plotIds = plots.map(p => p.id);
    const crops = this.getCrops().filter(c => plotIds.includes(c.plotId));
    const cropIds = crops.map(c => c.id);
    const inventory = this.getInventory().filter(i => cropIds.includes(i.cropId));
    const sales = this.getSales().filter(s => cropIds.includes(s.cropId));

    const activeMembersCount = isMember ? 1 : members.filter(m => m.status === 'active').length;
    
    let totalSqMeters = 0;
    plots.forEach(p => {
      const r = p.sizeRai || 0;
      const n = p.sizeNgan || 0;
      const w = p.sizeSqWah || 0;
      totalSqMeters += (r * 1600) + (n * 400) + (w * 4);
    });

    const activeCrops = crops.filter(c => c.status === 'growing');
    const chrysanthemumPlots = plots.filter(p => p.plantType === 'เก๊กฮวย').length;
    const chamomilePlots = plots.filter(p => p.plantType === 'คาโมมายล์').length;

    // Total fresh yield collected
    const totalYield = crops.filter(c => c.status === 'harvested' && c.yield).reduce((sum, c) => sum + c.yield, 0);

    // Total processed dry herbs currently in stock
    const totalDryStock = inventory.reduce((sum, i) => sum + i.dryStockKg, 0);

    // Total sales revenue
    const totalSalesRev = sales.reduce((sum, s) => sum + s.totalPrice, 0);

    return {
      totalMembers: isMember ? 1 : members.length,
      activeMembers: activeMembersCount,
      totalPlots: plots.length,
      totalAreaSqM: totalSqMeters,
      totalAreaRai: (totalSqMeters / 1600).toFixed(2),
      activeCrops: activeCrops.length,
      chrysanthemumPlots,
      chamomilePlots,
      totalYield: totalYield.toFixed(1),
      totalDryStock: totalDryStock.toFixed(2),
      totalSalesRevenue: totalSalesRev
    };
  }

  // --- Planting Roadmap Methods ---
  getRoadmaps() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROADMAPS);
      let roadmaps = data ? JSON.parse(data) : {};

      let hasChange = false;

      // ลบเฉพาะคีย์ที่ว่างเปล่า
      Object.keys(roadmaps).forEach(h => {
        if (!h || !h.trim()) {
          delete roadmaps[h];
          hasChange = true;
        }
      });

      // Auto-ensure standard herbs exist and have matching icons
      Object.keys(DEFAULT_ROADMAPS).forEach(herbName => {
        const def = DEFAULT_ROADMAPS[herbName];
        if (!roadmaps[herbName]) {
          roadmaps[herbName] = JSON.parse(JSON.stringify(def));
          hasChange = true;
        } else {
          // If icon is generic or empty or mismatched, update to matching icon
          if (!roadmaps[herbName].icon || (roadmaps[herbName].icon === '🌿' && def.icon !== '🌿')) {
            roadmaps[herbName].icon = def.icon || getHerbDefaultIcon(herbName);
            hasChange = true;
          }
          if (!roadmaps[herbName].category && def.category) {
            roadmaps[herbName].category = def.category;
            hasChange = true;
          }
        }
      });

      // Ensure every single herb in roadmaps has an appropriate matching icon
      Object.keys(roadmaps).forEach(h => {
        const autoIcon = getHerbDefaultIcon(h);
        if (!roadmaps[h].icon || roadmaps[h].icon === '🌿' || roadmaps[h].icon === '🪻' || roadmaps[h].icon === '🫚' || roadmaps[h].icon === '🪴') {
          roadmaps[h].icon = autoIcon;
          hasChange = true;
        }
      });

      if (hasChange || !data) {
        localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(roadmaps));
      }

      return roadmaps;
    } catch (e) {
      console.error("Error reading roadmaps:", e);
      return JSON.parse(JSON.stringify(DEFAULT_ROADMAPS));
    }
  }

  getRoadmapByHerb(herbName) {
    const roadmaps = this.getRoadmaps();
    if (roadmaps[herbName]) {
      return roadmaps[herbName];
    }
    const keys = Object.keys(roadmaps);
    if (keys.length > 0) {
      return roadmaps[keys[0]];
    }
    return DEFAULT_ROADMAPS['เก๊กฮวย'];
  }

  saveRoadmaps(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(data));
      return data;
    } catch (e) {
      console.error("Error saving roadmaps:", e);
      throw e;
    }
  }

  saveHerbRoadmap(herbName, roadmapData) {
    const roadmaps = this.getRoadmaps();
    if (!roadmapData.icon || roadmapData.icon === '🌿') {
      roadmapData.icon = getHerbDefaultIcon(herbName);
    }
    roadmaps[herbName] = roadmapData;
    this.saveRoadmaps(roadmaps);

    // สร้างรายการสินค้าในคลังสำหรับพืชสมุนไพรใหม่ให้อัตโนมัติทันที
    try {
      this.getProducts();
    } catch (e) {}

    return roadmapData;
  }

  saveHerbStep(herbName, stepData) {
    const roadmaps = this.getRoadmaps();
    if (!roadmaps[herbName]) {
      roadmaps[herbName] = {
        name: herbName,
        icon: '🌿',
        description: `แผนการปลูกสมุนไพร ${herbName}`,
        durationDays: 90,
        cycleText: 'ระยะเวลาเพาะปลูกรวมประมาณ 90 วัน',
        steps: []
      };
    }

    const steps = roadmaps[herbName].steps || [];
    const existingIndex = steps.findIndex(s => s.stepNo === Number(stepData.stepNo) || (stepData.originalStepNo && s.stepNo === Number(stepData.originalStepNo)));

    const formattedStep = {
      stepNo: Number(stepData.stepNo) || (steps.length + 1),
      title: stepData.title || 'ขั้นตอนใหม่',
      dayNumber: Number(stepData.dayNumber) || 1,
      dayLabel: stepData.dayLabel || `วันที่ ${stepData.dayNumber || 1}`,
      advice: stepData.advice || '',
      detail: stepData.detail || '',
      color: stepData.color || 'emerald',
      icon: stepData.icon || 'fa-seedling'
    };

    if (existingIndex >= 0) {
      steps[existingIndex] = formattedStep;
    } else {
      steps.push(formattedStep);
      // Sort new steps by dayNumber
      steps.sort((a, b) => a.dayNumber - b.dayNumber);
    }

    // Re-index step numbers 1, 2, 3...
    steps.forEach((s, idx) => {
      s.stepNo = idx + 1;
    });

    roadmaps[herbName].steps = steps;
    // Update max duration if step day exceeds current
    const maxDay = Math.max(...steps.map(s => s.dayNumber), 1);
    roadmaps[herbName].durationDays = maxDay;
    roadmaps[herbName].cycleText = `ระยะเวลาเพาะปลูกรวมประมาณ ${maxDay} วัน`;

    this.saveRoadmaps(roadmaps);
    return roadmaps[herbName];
  }

  reorderHerbSteps(herbName, fromIndex, toIndex) {
    const roadmaps = this.getRoadmaps();
    if (!roadmaps[herbName] || !roadmaps[herbName].steps) return false;

    const steps = [...roadmaps[herbName].steps];
    if (fromIndex < 0 || fromIndex >= steps.length || toIndex < 0 || toIndex >= steps.length) return false;
    if (fromIndex === toIndex) return roadmaps[herbName];

    // Move element from fromIndex to toIndex
    const [movedItem] = steps.splice(fromIndex, 1);
    steps.splice(toIndex, 0, movedItem);

    // Re-index step numbers 1, 2, 3...
    steps.forEach((s, idx) => {
      s.stepNo = idx + 1;
    });

    roadmaps[herbName].steps = steps;
    this.saveRoadmaps(roadmaps);
    return roadmaps[herbName];
  }

  deleteHerbStep(herbName, stepNo) {
    const roadmaps = this.getRoadmaps();
    if (!roadmaps[herbName] || !roadmaps[herbName].steps) return false;

    roadmaps[herbName].steps = roadmaps[herbName].steps.filter(s => s.stepNo !== Number(stepNo));
    // Re-number
    roadmaps[herbName].steps.forEach((s, idx) => {
      s.stepNo = idx + 1;
    });

    const maxDay = roadmaps[herbName].steps.length > 0 ? Math.max(...roadmaps[herbName].steps.map(s => s.dayNumber)) : 0;
    roadmaps[herbName].durationDays = maxDay;
    roadmaps[herbName].cycleText = `ระยะเวลาเพาะปลูกรวมประมาณ ${maxDay} วัน`;

    this.saveRoadmaps(roadmaps);
    return roadmaps[herbName];
  }

  deleteHerbRoadmap(herbName) {
    const roadmaps = this.getRoadmaps();
    if (!roadmaps[herbName]) return false;
    delete roadmaps[herbName];
    if (Object.keys(roadmaps).length === 0) {
      this.saveRoadmaps(JSON.parse(JSON.stringify(DEFAULT_ROADMAPS)));
    } else {
      this.saveRoadmaps(roadmaps);
    }

    // ล้างรายการสินค้าของพืชที่ถูกลบ (หากสต็อกคงเหลือเป็น 0)
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) {
        let products = JSON.parse(data) || [];
        const filtered = products.filter(p => !(p.category === herbName && (parseFloat(p.stock) || 0) === 0));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
      }
    } catch (e) {}

    return true;
  }

  // =========================================================================
  // 4-TIER ENTERPRISE DATABASE ARCHITECTURE METHODS
  // =========================================================================

  // --- TIER 1: MASTER DATA (พืชสมุนไพร, ข้อมูลหลัก) ---
  getHerbsCatalog() {
    try {
      const roadmaps = this.getRoadmaps ? this.getRoadmaps() : {};
      const validHerbNames = Object.keys(roadmaps);

      let list = [];
      const data = localStorage.getItem(STORAGE_KEYS.HERBS);
      if (data) {
        list = JSON.parse(data);
      } else {
        list = JSON.parse(JSON.stringify(MOCK_HERBS_CATALOG));
      }

      // STRICT RULE: ข้อมูลพืชต้องตรงตาม "แผนการปลูก" (Roadmap) มีดอกอะไรเอาตามนั้น
      let filteredList = list.filter(h => validHerbNames.includes(h.name));

      // เติมข้อมูลพืชที่มีในแผนการปลูกแต่ยังไม่มีในแคตตาล็อก
      validHerbNames.forEach((hName, idx) => {
        if (!filteredList.some(item => item.name === hName)) {
          const mock = MOCK_HERBS_CATALOG.find(m => m.name === hName);
          filteredList.push({
            herbId: mock ? mock.herbId : `HRB-${String(idx + 1).padStart(3, '0')}`,
            name: hName,
            category: roadmaps[hName]?.category || 'ชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ',
            icon: roadmaps[hName]?.icon || getHerbDefaultIcon(hName),
            standardRatio: (mock && mock.standardRatio) || (hName.includes('คาโมมายล์') ? 6.0 : 8.0),
            freshBuyingPrice: (mock && mock.freshBuyingPrice) || (hName.includes('คาโมมายล์') ? 70 : 50),
            drySellingPriceKg: (mock && mock.drySellingPriceKg) || 300,
            jarSellingPrice50g: (mock && mock.jarSellingPrice50g) || 120,
            growthDays: roadmaps[hName]?.durationDays || 90,
            isActive: true
          });
        }
      });

      // ซิงค์บันทึกกลับลง Storage ถ้ามีการเปลี่ยนแปลงหรือคัดกรองออก
      if (JSON.stringify(filteredList) !== data) {
        localStorage.setItem(STORAGE_KEYS.HERBS, JSON.stringify(filteredList));
      }
      return filteredList;
    } catch (e) {
      console.error("Error reading herbs catalog:", e);
      return JSON.parse(JSON.stringify(MOCK_HERBS_CATALOG));
    }
  }

  setHerbRatio(herbName, newRatio) {
    const ratio = parseFloat(newRatio) || 8.0;
    const catalog = this.getHerbsCatalog();
    const h = catalog.find(item => item.name === herbName || (item.name && item.name.includes(herbName)));
    if (h) {
      h.standardRatio = ratio;
      this.saveHerbsCatalog(catalog);
    }
    const roadmaps = this.getRoadmaps();
    if (roadmaps[herbName]) {
      roadmaps[herbName].standardRatio = ratio;
      this.saveRoadmaps(roadmaps);
    }
    return ratio;
  }

  saveHerbsCatalog(catalog) {
    try {
      localStorage.setItem(STORAGE_KEYS.HERBS, JSON.stringify(catalog));
      return catalog;
    } catch (e) {
      console.error("Error saving herbs catalog:", e);
      throw e;
    }
  }

  getHerbById(herbId) {
    const list = this.getHerbsCatalog();
    return list.find(h => h.herbId === herbId || h.name === herbId || (h.name && h.name.includes(herbId))) || null;
  }

  getHerbByName(name) {
    const list = this.getHerbsCatalog();
    if (!name) return null;
    const cleanName = name.replace(/^(ดอก|ใบ|ต้น)/, '').trim();
    return list.find(h => h.name === name || h.name === cleanName || (h.name && name.includes(h.name)) || (h.name && h.name.includes(cleanName))) || null;
  }

  addOrUpdateHerb(herb) {
    const list = this.getHerbsCatalog();
    const cleanName = (herb.name || '').trim();
    if (!cleanName) throw new Error('กรุณาระบุชื่อพืชสมุนไพร');

    const freshPrice = parseFloat(herb.freshBuyingPrice || herb.baselinePriceFresh) || 0;
    const ratio = parseFloat(herb.standardRatio) || 8.0;
    const dryPrice = parseFloat(herb.drySellingPriceKg || herb.baselinePriceDry) || 300;
    const jarPrice = parseFloat(herb.jarSellingPrice50g) || 120;
    const icon = herb.icon || getHerbDefaultIcon(cleanName) || '🌿';

    const normalizedHerb = {
      ...herb,
      name: cleanName,
      icon: icon,
      standardRatio: ratio,
      freshBuyingPrice: freshPrice,
      drySellingPriceKg: dryPrice,
      jarSellingPrice50g: jarPrice,
      baselinePriceFresh: freshPrice,
      baselinePriceDry: dryPrice,
      growthDays: parseInt(herb.growthDays) || 90,
      category: herb.category || 'ชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ',
      description: herb.description || `สมุนไพร${cleanName} ปลอดสารเคมี ได้มาตรฐานวิสาหกิจชุมชน`,
      isActive: herb.isActive !== undefined ? herb.isActive : true
    };

    const idx = list.findIndex(h => h.herbId === herb.herbId || h.name === cleanName);
    if (idx >= 0) {
      normalizedHerb.herbId = list[idx].herbId || herb.herbId || `HRB-${String(idx + 1).padStart(3, '0')}`;
      list[idx] = { ...list[idx], ...normalizedHerb };
    } else {
      if (!normalizedHerb.herbId) {
        let maxIdNum = list.reduce((max, h) => {
          const m = (h.herbId || '').match(/HRB-(\d+)/);
          const num = m ? parseInt(m[1], 10) : 0;
          return num > max ? num : max;
        }, 0);
        normalizedHerb.herbId = `HRB-${String(maxIdNum + 1).padStart(3, '0')}`;
      }
      list.push(normalizedHerb);
    }
    this.saveHerbsCatalog(list);

    // 1. Sync Herb Roadmap automatically
    try {
      const roadmaps = this.getRoadmaps();
      if (!roadmaps[cleanName]) {
        roadmaps[cleanName] = {
          name: cleanName,
          category: normalizedHerb.category,
          icon: icon,
          durationDays: normalizedHerb.growthDays,
          steps: [
            { stepNo: 1, title: 'เพาะกล้า/เตรียมดิน', daysFromStart: 0, description: 'เตรียมแปลงและเพาะกล้า' },
            { stepNo: 2, title: 'ย้ายปลูกลงแปลง', daysFromStart: 15, description: 'ปลูกลงแปลงตามระยะห่างมาตรฐาน' },
            { stepNo: 3, title: 'บำรุงและดูแลรักษา', daysFromStart: 45, description: 'ให้น้ำและปุ๋ยชีวภาพสม่ำเสมอ' },
            { stepNo: 4, title: 'เก็บเกี่ยวผลผลิต', daysFromStart: normalizedHerb.growthDays, description: 'เก็บเกี่ยวผลผลิตสดตามเกณฑ์คุณภาพ' }
          ]
        };
      } else {
        roadmaps[cleanName].icon = icon;
        roadmaps[cleanName].durationDays = normalizedHerb.growthDays;
      }
      localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(roadmaps));
    } catch (e) {
      console.warn("Auto-sync roadmap warning:", e);
    }

    // 2. Sync / Update Products in Warehouse (กก. และ กระป๋อง) with new prices
    try {
      let products = this.getProducts();
      let bulkPrd = products.find(p => (p.category === cleanName || (p.name || '').includes(cleanName)) && (p.unit === 'กก.' || p.unit === 'kg'));
      let jarPrd = products.find(p => (p.category === cleanName || (p.name || '').includes(cleanName)) && (p.unit === 'กระป๋อง' || p.unit === 'กระปุก'));

      let maxPrdNum = products.reduce((max, p) => {
        const m = (p.id || '').match(/PRD-(\d+)/);
        const num = m ? parseInt(m[1], 10) : 0;
        return num > max ? num : max;
      }, 0);

      const bulkName = `ดอก${cleanName}อบแห้ง (1 กก.)`;
      const jarName = `${cleanName}กระป๋อง (50 G)`;

      if (bulkPrd) {
        bulkPrd.price = dryPrice;
      } else {
        maxPrdNum++;
        products.push({
          id: `PRD-${String(maxPrdNum).padStart(3, '0')}`,
          name: bulkName,
          price: dryPrice,
          unit: 'กก.',
          stock: 0,
          category: cleanName,
          updatedDate: new Date().toISOString().split('T')[0]
        });
      }

      if (jarPrd) {
        jarPrd.price = jarPrice;
      } else {
        maxPrdNum++;
        products.push({
          id: `PRD-${String(maxPrdNum).padStart(3, '0')}`,
          name: jarName,
          price: jarPrice,
          unit: 'กระป๋อง',
          stock: 0,
          category: cleanName,
          updatedDate: new Date().toISOString().split('T')[0]
        });
      }

      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn("Auto-sync products warning:", e);
    }

    return normalizedHerb;
  }

  deleteHerb(herbIdOrName) {
    let list = this.getHerbsCatalog();
    const target = list.find(h => h.herbId === herbIdOrName || h.name === herbIdOrName);
    if (!target) return false;

    // Check if crops currently using this herb
    const crops = this.getCrops();
    const usingCrops = crops.filter(c => c.seedlingSource === target.name);
    if (usingCrops.length > 0) {
      throw new Error(`ไม่สามารถลบสมุนไพร "${target.name}" ได้เนื่องจากมีรอบเพาะปลูกใช้งานอยู่ (${usingCrops.length} รอบ)`);
    }

    list = list.filter(h => h.herbId !== target.herbId && h.name !== target.name);
    this.saveHerbsCatalog(list);

    // Remove roadmap
    this.deleteHerbRoadmap(target.name);
    return true;
  }

  // --- TIER 2: PERIODIC DATA (รอบเพาะปลูก และ เงินปันผลสมาชิก) ---
  getPlantingCycles() {
    // Standard cycle code format: [ปี]/[แปลง]-R[รอบ] e.g. 2569/P001-R1
    const crops = this.getCrops();
    return crops.map(c => ({
      ...c,
      cycleCode: c.seasonId || c.id,
      standardCycleId: c.seasonId || c.id
    }));
  }

  savePlantingCycle(cycleData) {
    if (cycleData.id && this.getCropById(cycleData.id)) {
      return this.updateCrop(cycleData.id, cycleData);
    }
    return this.addCrop(cycleData);
  }

  getMemberDividends(cycleId = null) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DIVIDENDS);
      let list = [];
      if (!data) {
        list = [...MOCK_MEMBER_DIVIDENDS];
        localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(list));
      } else {
        list = JSON.parse(data);
      }
      if (cycleId) {
        return list.filter(d => d.cycleId === cycleId);
      }
      return list;
    } catch (e) {
      console.error("Error loading member dividends:", e);
      return [...MOCK_MEMBER_DIVIDENDS];
    }
  }

  saveMemberDividend(dividend) {
    const list = this.getMemberDividends();
    const idx = list.findIndex(d => d.dividendId === dividend.dividendId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...dividend };
    } else {
      if (!dividend.dividendId) {
        dividend.dividendId = `DIV-${Date.now().toString().slice(-6)}`;
      }
      list.unshift(dividend);
    }
    localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(list));
    return dividend;
  }

  calculateCycleDividends(cycleId, laborRatePerKg = 25, profitShareRate = 0.6) {
    const crops = this.getCrops().filter(c => (c.seasonId === cycleId || c.id === cycleId));
    const members = this.getMembers();
    const sales = this.getSales().filter(s => crops.some(c => c.id === s.cropId));
    const totalCycleRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.totalPrice) || 0), 0);
    
    const results = [];
    crops.forEach(crop => {
      const member = members.find(m => m.id === crop.memberId) || { name: 'ไม่ระบุสมาชิก' };
      const produceKg = parseFloat(crop.yield) || 0;
      const laborCost = Math.round(produceKg * laborRatePerKg);
      const profitShare = Math.round((totalCycleRevenue * profitShareRate) * (produceKg / (crops.reduce((s, x) => s + (parseFloat(x.yield) || 0), 0) || 1)));
      const dividend = {
        dividendId: `DIV-${cycleId.replace(/[\/\-]/g, '')}-${crop.memberId || 'MEM'}`,
        cycleId: cycleId,
        memberId: crop.memberId,
        memberName: member.name,
        produceDeliveredKg: produceKg,
        laborCost: laborCost,
        profitShare: profitShare,
        totalPayout: laborCost + profitShare,
        paidDate: new Date().toISOString().split('T')[0],
        status: 'calculated'
      };
      this.saveMemberDividend(dividend);
      results.push(dividend);
    });
    return results;
  }

  // --- TIER 3: TRANSACTIONAL DATA (บันทึกกิจกรรมประจำวัน & สต็อก) ---
  getActivityLogs(cycleId = null) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      let list = [];
      if (!data) {
        list = [...MOCK_ACTIVITY_LOGS];
        localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(list));
      } else {
        list = JSON.parse(data);
      }
      if (cycleId) {
        return list.filter(l => l.cycleId === cycleId);
      }
      return list.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
    } catch (e) {
      console.error("Error reading activity logs:", e);
      return [...MOCK_ACTIVITY_LOGS];
    }
  }

  addActivityLog(log) {
    const list = this.getActivityLogs();
    const newLog = {
      logId: log.logId || `ACT-${Date.now().toString().slice(-6)}`,
      cycleId: log.cycleId,
      activityDate: log.activityDate || new Date().toISOString().split('T')[0],
      activityType: log.activityType || 'ดูแลแปลงทั่วไป',
      description: log.description || '',
      freshHarvestedKg: parseFloat(log.freshHarvestedKg) || 0,
      recordedBy: log.recordedBy || (this.getCurrentUser()?.id || 'MEM-001')
    };
    list.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(list));
    return newLog;
  }

  // --- TIER 4: AGGREGATED / ANALYTICAL LAYER (แดชบอร์ด & รายงานสรุป) ---
  getDashboardMetrics() {
    const sales = this.getSales();
    const crops = this.getCrops();
    const dryingBatches = this.getDryingBatches();
    const products = this.getProducts();

    // 1. Net revenue
    const netRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.totalPrice) || 0), 0);

    // 2. Total fresh yield
    const totalFreshYieldKg = crops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);

    // 3. Total dry yield
    const totalDryYieldKg = dryingBatches.reduce((sum, b) => sum + (parseFloat(b.dryWeightKg) || 0), 0);

    // 4. Ready stock valuation
    const readyStockValue = products.reduce((sum, p) => sum + ((parseFloat(p.stock) || 0) * (parseFloat(p.price) || 0)), 0);

    // 5. Herb sales breakdown (bulk vs jar)
    const herbSales = {};
    const jarSales = {};
    sales.forEach(s => {
      const isJar = s.saleType === 'jar' || (s.cropId && s.cropId.includes('PRD-CAN'));
      let herbName = 'เก๊กฮวย';
      if ((s.productName && s.productName.includes('คาโมมายล์')) || (s.cropId && s.cropId.includes('คาโมมายล์'))) herbName = 'คาโมมายล์';
      else if ((s.productName && s.productName.includes('อัญชัน')) || (s.cropId && s.cropId.includes('อัญชัน'))) herbName = 'อัญชัน';
      else if ((s.productName && s.productName.includes('ดาวเรือง')) || (s.cropId && s.cropId.includes('ดาวเรือง'))) herbName = 'ดาวเรือง';

      const val = parseFloat(s.totalPrice) || 0;
      if (isJar) {
        jarSales[herbName] = (jarSales[herbName] || 0) + val;
      } else {
        herbSales[herbName] = (herbSales[herbName] || 0) + val;
      }
    });

    return {
      netRevenue,
      totalFreshYieldKg,
      totalDryYieldKg,
      readyStockValue,
      herbSales,
      jarSales,
      totalPlots: this.getPlots().length,
      activeMembers: this.getMembers().filter(m => m.status === 'active').length
    };
  }

  getFinancialReports() {
    const metrics = this.getDashboardMetrics();
    const dividends = this.getMemberDividends();
    const totalMemberPayout = dividends.reduce((sum, d) => sum + (parseFloat(d.totalPayout) || 0), 0);
    const retainedEarnings = metrics.netRevenue - totalMemberPayout;
    const grossMarginPct = metrics.netRevenue > 0 ? ((retainedEarnings / metrics.netRevenue) * 100).toFixed(1) : 0;

    return {
      totalRevenue: metrics.netRevenue,
      totalMemberPayout,
      retainedEarnings,
      grossMarginPct: parseFloat(grossMarginPct),
      readyStockValue: metrics.readyStockValue,
      freshYieldKg: metrics.totalFreshYieldKg,
      dryYieldKg: metrics.totalDryYieldKg
    };
  }

  resetDefaultRoadmaps() {
    localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(DEFAULT_ROADMAPS));
    return JSON.parse(JSON.stringify(DEFAULT_ROADMAPS));
  }
}
export const appState = new AppState();
