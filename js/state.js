// State Management with LocalStorage persistence for Dried Herb Community Enterprise
import { generateRandomCoordinates } from './helpers.js';

const STORAGE_KEYS = {
  ENTERPRISE: 'herb_enterprise_profile',
  MEMBERS: 'herb_enterprise_members',
  PLOTS: 'herb_enterprise_plots',
  CROPS: 'herb_enterprise_crops',
  INVENTORY: 'herb_enterprise_inventory',
  SALES: 'herb_enterprise_sales',
  AUTH: 'herb_enterprise_auth'
};

let supabaseClient = null;

// Mock User Accounts for Login & Roles
const MOCK_USERS = [
  {
    username: '12/4',
    password: '0812345600',
    name: 'นายสมเกียรติ พึ่งตน',
    role: 'Admin',
    roleDisplay: 'ประธานกลุ่ม',
    memberId: 'MEM-001',
    avatarText: 'ส',
    color: 'emerald'
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
  },
  {
    username: '12/5',
    password: '0812345602',
    name: 'นางใจดี ศรีสมุนไพร',
    role: 'Member',
    roleDisplay: 'สมาชิกเกษตรกร',
    memberId: 'MEM-002',
    avatarText: 'จ',
    color: 'blue'
  }
];

// Initial Profile setup
const DEFAULT_ENTERPRISE = {
  name: 'วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านศรีดอนมูล',
  village: 'หมู่ที่ 2 บ้านศรีดอนมูล',
  subdistrict: 'ศรีดอนมูล',
  district: 'เชียงแสน',
  province: 'เชียงราย',
  zipcode: '57150',
  phone: '089-555-1234',
  email: 'sridonmun.driedherbs@gmail.com',
  chairman: 'นายสมเกียรติ พึ่งตน',
  description: 'กลุ่มเกษตรกรผลิตและแปรรูปสมุนไพรอบแห้งปลอดสารพิษเพื่อความยั่งยืน เก๊กฮวย คาโมมายล์ และสมุนไพรพื้นบ้าน'
};

// Mock 33 Members
const MOCK_MEMBERS = [
  { id: 'MEM-001', name: 'นายสมเกียรติ พึ่งตน', role: 'ประธานกลุ่ม', phone: '081-234-5600', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-01-10', houseNumber: '12/4' },
  { id: 'MEM-002', name: 'นางใจดี ศรีสมุนไพร', role: 'รองประธาน', phone: '081-234-5602', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-01-15', houseNumber: '12/5' },
  { id: 'MEM-003', name: 'นายมานะ รักเกษตร', role: 'เหรัญญิก', phone: '081-234-5699', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-01-15', houseNumber: '45/1' },
  { id: 'MEM-004', name: 'นางสมศรี มีวิถี', role: 'เลขานุการ', phone: '081-234-5604', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-01-20', houseNumber: '18' },
  { id: 'MEM-005', name: 'นายวิชัย ปัญญาดี', role: 'กรรมการ', phone: '081-234-5605', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-02-01', houseNumber: '99/2' },
  { id: 'MEM-006', name: 'นางนภา สุขสบาย', role: 'สมาชิกทั่วไป', phone: '081-234-5606', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-05', houseNumber: '24/1' },
  { id: 'MEM-007', name: 'นายดำรง รักชาติ', role: 'สมาชิกทั่วไป', phone: '081-234-5607', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-02-10', houseNumber: '55' },
  { id: 'MEM-008', name: 'นางสมปอง สุขสำราญ', role: 'สมาชิกทั่วไป', phone: '081-234-5608', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-10', houseNumber: '102' },
  { id: 'MEM-009', name: 'นายบุญมี ทองคำ', role: 'สมาชิกทั่วไป', phone: '081-234-5609', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-02-12', houseNumber: '7/3' },
  { id: 'MEM-010', name: 'นางประกาย แสงทอง', role: 'สมาชิกทั่วไป', phone: '081-234-5610', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-02-15', houseNumber: '88' },
  { id: 'MEM-011', name: 'นายสุรพล เด่นดี', role: 'สมาชิกทั่วไป', phone: '081-234-5611', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-20', houseNumber: '14/2' },
  { id: 'MEM-012', name: 'นางวิมล รุ่งเรือง', role: 'สมาชิกทั่วไป', phone: '081-234-5612', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-22', houseNumber: '33' },
  { id: 'MEM-013', name: 'นายเกรียงไกร ใฝ่ดี', role: 'สมาชิกทั่วไป', phone: '081-234-5613', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-03-01', houseNumber: '61/4' },
  { id: 'MEM-014', name: 'นางนงนุช สุดสวย', role: 'สมาชิกทั่วไป', phone: '081-234-5614', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-03-05', houseNumber: '40' },
  { id: 'MEM-015', name: 'นายทวีลาภ ลาภดี', role: 'สมาชิกทั่วไป', phone: '081-234-5615', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-03-10', houseNumber: '115' },
  { id: 'MEM-016', name: 'นางพิศมัย ใจธรรม', role: 'สมาชิกทั่วไป', phone: '081-234-5616', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-03-12', houseNumber: '29' },
  { id: 'MEM-017', name: 'นายอดุลย์ อบอุ่น', role: 'สมาชิกทั่วไป', phone: '081-234-5617', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-03-15', houseNumber: '82/1' },
  { id: 'MEM-018', name: 'นางสาวสุดา ชาเขียว', role: 'สมาชิกทั่วไป', phone: '081-234-5618', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-03-18', houseNumber: '19' },
  { id: 'MEM-019', name: 'นายสมหมาย มั่นคง', role: 'สมาชิกทั่วไป', phone: '081-234-5619', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-03-20', houseNumber: '104' },
  { id: 'MEM-020', name: 'นางอรอนงค์ โฉมงาม', role: 'สมาชิกทั่วไป', phone: '081-234-5620', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-03-22', houseNumber: '73/2' },
  { id: 'MEM-021', name: 'นายประจักษ์ รักสงบ', role: 'สมาชิกทั่วไป', phone: '081-234-5621', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-03-25', houseNumber: '51' },
  { id: 'MEM-022', name: 'นางสาวรุ่งทิวา แสงดาว', role: 'สมาชิกทั่วไป', phone: '081-234-5622', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-01', houseNumber: '95' },
  { id: 'MEM-023', name: 'นายประเสริฐ ดีเลิศ', role: 'สมาชิกทั่วไป', phone: '081-234-5623', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-04-05', houseNumber: '37/1' },
  { id: 'MEM-024', name: 'นางสาวกมลวรรณ ชื่นใจ', role: 'สมาชิกทั่วไป', phone: '081-234-5624', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-04-10', houseNumber: '6/2' },
  { id: 'MEM-025', name: 'นายพิชัย ชูชาติ', role: 'สมาชิกทั่วไป', phone: '081-234-5625', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-12', houseNumber: '128' },
  { id: 'MEM-026', name: 'นางชลลดา ปันแก้ว', role: 'สมาชิกทั่วไป', phone: '081-234-5626', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-04-15', houseNumber: '84' },
  { id: 'MEM-027', name: 'นายธวัชชัย ยอดดี', role: 'สมาชิกทั่วไป', phone: '081-234-5627', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-20', houseNumber: '111/3' },
  { id: 'MEM-028', name: 'นางมธุรส หอมกลิ่น', role: 'สมาชิกทั่วไป', phone: '081-234-5628', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-04-22', houseNumber: '48' },
  { id: 'MEM-029', name: 'นายเสนาะ ร้องเพราะ', role: 'สมาชิกทั่วไป', phone: '081-234-5629', status: 'inactive', villageNumber: 'หมู่ 2', joinDate: '2024-04-25', houseNumber: '15/1' },
  { id: 'MEM-030', name: 'นางอัญชลี รื่นรมย์', role: 'สมาชิกทั่วไป', phone: '081-234-5630', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-28', houseNumber: '67' },
  { id: 'MEM-031', name: 'นายอุดม ศรีทอง', role: 'สมาชิกทั่วไป', phone: '081-234-5631', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-05-01', houseNumber: '2/1' },
  { id: 'MEM-032', name: 'นางรักษ์ชนก อุดมดี', role: 'สมาชิกทั่วไป', phone: '081-234-5632', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-05-05', houseNumber: '93' },
  { id: 'MEM-033', name: 'นายพชรพล อิ่มเอม', role: 'สมาชิกทั่วไป', phone: '081-234-5633', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-05-10', houseNumber: '58/2' }
];

// Mock plots for some members to display initially
const MOCK_PLOTS = [
  { id: 'PLOT-001', memberIds: ['MEM-001'], name: 'แปลงสวนหน้าบ้าน (ประธาน)', sizeRai: 2, sizeNgan: 1, sizeSqWah: 50, lat: 18.9142, lng: 98.9442, status: 'active' },
  { id: 'PLOT-002', memberIds: ['MEM-002'], name: 'แปลงริมคลองส่งน้ำ', sizeRai: 1, sizeNgan: 2, sizeSqWah: 0, lat: 18.9158, lng: 98.9415, status: 'active' },
  { id: 'PLOT-003', memberIds: ['MEM-003'], name: 'แปลงเชิงเขาม่อนแก้ว', sizeRai: 3, sizeNgan: 0, sizeSqWah: 80, lat: 18.9121, lng: 98.9495, status: 'active' },
  { id: 'PLOT-004', memberIds: ['MEM-004'], name: 'แปลงใกล้หอประชุม', sizeRai: 0, sizeNgan: 3, sizeSqWah: 50, lat: 18.9172, lng: 98.9455, status: 'active' }
];

// Mock crop seasons for initial plots
const MOCK_CROPS = [
  {
    id: 'CROP-001',
    plotId: 'PLOT-001',
    plantDate: '2026-08-27',
    harvestDateEst: '2026-11-27',
    fertDateEst: '2026-09-10',
    harvestDateActual: null,
    seedlingCount: 800,
    seedlingSource: 'เก๊กฮวย',
    cost: 4500,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    cropCycle: 1,
    note: 'ลงกล้าเก๊กฮวยแปลงสวนหน้าบ้าน เตรียมดินด้วยปุ๋ยหมักชีวภาพ',
    fertilizingLog: [
      { date: '2026-08-27', type: 'ปุ๋ยหมักชีวภาพสูตรเตรียมดิน', amount: '30 กิโลกรัม', cost: 450, note: 'รองพื้นก่อนลงกล้า' }
    ]
  },
  {
    id: 'CROP-002',
    plotId: 'PLOT-002',
    plantDate: '2026-08-28',
    harvestDateEst: '2026-11-28',
    fertDateEst: '2026-09-12',
    harvestDateActual: null,
    seedlingCount: 500,
    seedlingSource: 'คาโมมายล์',
    cost: 3200,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    cropCycle: 1,
    note: 'ลงกล้าคาโมมายล์ แปลงริมคลองส่งน้ำ',
    fertilizingLog: [
      { date: '2026-08-28', type: 'ปุ๋ยคอกมูลไก่หมัก', amount: '25 กิโลกรัม', cost: 300, note: 'บำรุงต้นกล้าเริ่มต้น' }
    ]
  },
  {
    id: 'CROP-003',
    plotId: 'PLOT-003',
    plantDate: '2026-09-01',
    harvestDateEst: '2026-12-01',
    fertDateEst: '2026-09-15',
    harvestDateActual: null,
    seedlingCount: 1200,
    seedlingSource: 'เก๊กฮวย',
    cost: 5500,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    cropCycle: 1,
    note: 'ลงกล้าเก๊กฮวย แปลงเชิงเขาม่อนแก้ว',
    fertilizingLog: []
  },
  {
    id: 'CROP-004',
    plotId: 'PLOT-004',
    plantDate: '2026-09-05',
    harvestDateEst: '2026-12-05',
    fertDateEst: '2026-09-20',
    harvestDateActual: null,
    seedlingCount: 650,
    seedlingSource: 'คาโมมายล์',
    cost: 3800,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    cropCycle: 1,
    note: 'ลงกล้าคาโมมายล์ แปลงใกล้หอประชุม',
    fertilizingLog: []
  },
  {
    id: 'CROP-005',
    plotId: 'PLOT-001',
    plantDate: '2026-03-01',
    harvestDateEst: '2026-06-01',
    harvestDateActual: '2026-06-05',
    seedlingCount: 800,
    seedlingSource: 'เก๊กฮวย',
    cost: 4500,
    yield: 160.0,
    status: 'harvested',
    isProcessed: true,
    cropYear: 2569,
    cropCycle: 1,
    note: 'รอบปลูกเก๊กฮวย เก็บเกี่ยวผลผลิตเรียบร้อยและอบแห้งแล้ว',
    harvestNote: 'ดอกสดสมบูรณ์ คุณภาพเกรด A',
    fertilizingLog: [
      { date: '2026-03-05', type: 'ปุ๋ยหมักชีวภาพสูตรใบ', amount: '20 กิโลกรัม', cost: 350 }
    ]
  },
  {
    id: 'CROP-006',
    plotId: 'PLOT-002',
    plantDate: '2026-03-15',
    harvestDateEst: '2026-06-15',
    harvestDateActual: '2026-06-18',
    seedlingCount: 500,
    seedlingSource: 'คาโมมายล์',
    cost: 3200,
    yield: 90.0,
    status: 'harvested',
    isProcessed: true,
    cropYear: 2569,
    cropCycle: 1,
    note: 'รอบปลูกคาโมมายล์ เก็บเกี่ยวและอบแห้งแล้ว',
    harvestNote: 'ดอกแห้งหอมมาก',
    fertilizingLog: [
      { date: '2026-03-20', type: 'ปุ๋ยคอกเตรียมดิน', amount: '30 กิโลกรัม', cost: 400 }
    ]
  },
  {
    id: 'CROP-007',
    plotId: 'PLOT-003',
    plantDate: '2026-04-01',
    harvestDateEst: '2026-07-01',
    harvestDateActual: '2026-08-25',
    seedlingCount: 1000,
    seedlingSource: 'เก๊กฮวย',
    cost: 4800,
    yield: 175.5,
    status: 'harvested',
    isProcessed: false,
    cropYear: 2569,
    cropCycle: 1,
    note: 'เก็บเกี่ยวดอกสดเก๊กฮวยเรียบร้อยแล้ว รอส่งเข้าตู้อบแห้ง',
    harvestNote: 'ดอกสดคุณภาพดี รอคิวเตาอบที่ 1',
    fertilizingLog: []
  },
  {
    id: 'CROP-008',
    plotId: 'PLOT-004',
    plantDate: '2026-04-10',
    harvestDateEst: '2026-07-10',
    harvestDateActual: '2026-08-26',
    seedlingCount: 600,
    seedlingSource: 'คาโมมายล์',
    cost: 3500,
    yield: 85.0,
    status: 'harvested',
    isProcessed: false,
    cropYear: 2569,
    cropCycle: 1,
    note: 'เก็บเกี่ยวดอกสดคาโมมายล์เรียบร้อยแล้ว รอส่งเข้าตู้อบแห้ง',
    harvestNote: 'ดอกสดสมบูรณ์ รอคิวเตาอบที่ 2',
    fertilizingLog: []
  }
];

// Mock inventory split by cropId (Phase 2 core feature)
const MOCK_INVENTORY = [
  { cropId: 'CROP-005', herbType: 'เก๊กฮวย', dryStockKg: 15.0, processedDate: '2026-06-07' },
  { cropId: 'CROP-006', herbType: 'คาโมมายล์', dryStockKg: 10.0, processedDate: '2026-06-20' }
];

// Mock sales transactions linked to specific cropIds
const MOCK_SALES = [
  { id: 'SALE-001', cropId: 'CROP-005', amountKg: 5.0, pricePerKg: 500, totalPrice: 2500, customer: 'ร้านชาสมุนไพรม่อนแจ่ม', date: '2026-06-15' },
  { id: 'SALE-002', cropId: 'CROP-006', amountKg: 5.0, pricePerKg: 650, totalPrice: 3250, customer: 'กลุ่มท่องเที่ยวแม่ริม', date: '2026-06-25' }
];

export class AppState {
  constructor() {
    this.onAuthChange = null;
    this.onEnterpriseChange = null;
    this.membersCache = [];
    this.plotsCache = [];
    this.cropsCache = [];
    this.inventoryCache = [];
    this.salesCache = [];
    this.init();
  }

  initSupabase() {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    if (url && key && typeof supabase !== 'undefined') {
      try {
        supabaseClient = supabase.createClient(url, key);
        console.log("Supabase Client initialized successfully!");
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
        this.membersCache = membersData;
      } else if (membersData && membersData.length === 0) {
        await supabaseClient.from('members').insert(MOCK_MEMBERS);
        this.membersCache = JSON.parse(JSON.stringify(MOCK_MEMBERS));
      }

      // 3. Sync plots
      const { data: plotsData, error: plotsError } = await supabaseClient
        .from('plots')
        .select('*')
        .order('id', { ascending: true });
      
      if (!plotsError && plotsData && plotsData.length > 0) {
        this.plotsCache = plotsData.map(p => ({
          ...p,
          sizeRai: p.size_rai,
          sizeNgan: p.size_ngan,
          sizeSqWah: p.size_sq_wah,
          plantType: p.plant_type,
          memberIds: p.member_ids
        }));
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
      }

      // 4. Sync crops
      const { data: cropsData, error: cropsError } = await supabaseClient
        .from('crops')
        .select('*')
        .order('id', { ascending: true });
      
      if (!cropsError && cropsData && cropsData.length > 0) {
        this.cropsCache = cropsData.map(c => ({
          ...c,
          plotId: c.plot_id,
          cropYear: c.crop_year,
          harvestDateEst: c.harvest_date_est || '',
          harvestDateActual: c.harvest_date_actual || null,
          fertilizingLog: c.fertilizing_log || []
        }));
      } else if (cropsData && cropsData.length === 0) {
        const cropsToInsert = MOCK_CROPS.map(c => ({
          id: c.id,
          plot_id: c.plotId,
          plant_date: c.plantDate,
          cost: c.cost,
          crop_year: c.cropYear,
          harvest_date_est: c.harvestDateEst || null,
          harvest_date_actual: c.harvestDateActual || null,
          yield: c.yield || null,
          status: c.status,
          fertilizing_log: c.fertilizingLog || []
        }));
        await supabaseClient.from('crops').insert(cropsToInsert);
        this.cropsCache = JSON.parse(JSON.stringify(MOCK_CROPS));
      }

      // 5. Sync inventory
      const { data: invData, error: invError } = await supabaseClient
        .from('inventory')
        .select('*')
        .order('id', { ascending: true });
      
      if (!invError && invData && invData.length > 0) {
        this.inventoryCache = invData.map(i => ({
          ...i,
          cropId: i.crop_id,
          dryStockKg: i.dry_stock_kg,
          dryDate: i.dry_date,
          qualityGrade: i.quality_grade,
          costPerKg: i.cost_per_kg
        }));
      } else if (invData && invData.length === 0) {
        const invToInsert = MOCK_INVENTORY.map(i => ({
          id: i.id,
          crop_id: i.cropId,
          dry_stock_kg: i.dryStockKg,
          dry_date: i.dryDate,
          quality_grade: i.qualityGrade,
          cost_per_kg: i.costPerKg,
          status: i.status,
          history: i.history || []
        }));
        this.inventoryCache = JSON.parse(JSON.stringify(MOCK_INVENTORY));
      }

      // 6. Sync sales
      const { data: salesData, error: salesError } = await supabaseClient
        .from('sales')
        .select('*')
        .order('id', { ascending: true });
      
      if (!salesError && salesData && salesData.length > 0) {
        this.salesCache = salesData.map(s => ({
          ...s,
          inventoryId: s.inventory_id,
          quantityKg: s.quantity_kg,
          pricePerKg: s.price_per_kg,
          saleDate: s.sale_date,
          buyerPhone: s.buyer_phone,
          invoiceNo: s.invoice_no,
          totalPrice: s.quantity_kg * s.price_per_kg
        }));
      } else if (salesData && salesData.length === 0) {
        const salesToInsert = MOCK_SALES.map((s, idx) => {
          const invItem = this.inventoryCache.find(i => i.cropId === s.cropId);
          return {
            id: s.id,
            inventory_id: invItem ? invItem.id : 'INV-001',
            customer_name: s.customer,
            quantity_kg: s.amountKg,
            price_per_kg: s.pricePerKg,
            sale_date: s.date,
            buyer_phone: '081-234-5600',
            invoice_no: `INV-${String(idx + 1).padStart(3, '0')}`
          };
        });
        await supabaseClient.from('sales').insert(salesToInsert);
        this.salesCache = MOCK_SALES.map((s, idx) => {
          const invItem = this.inventoryCache.find(i => i.cropId === s.cropId);
          return {
            ...s,
            inventoryId: invItem ? invItem.id : 'INV-001',
            quantityKg: s.amountKg,
            pricePerKg: s.pricePerKg,
            saleDate: s.date,
            buyerPhone: '081-234-5600',
            invoiceNo: `INV-${String(idx + 1).padStart(3, '0')}`,
            totalPrice: s.amountKg * s.pricePerKg
          };
        });
      }

      console.log("Supabase sync completed successfully!");
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
      return JSON.parse(data);
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
    } else if (member.id === 'MEM-003' || member.role === 'เหรัญญิก') {
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

  init() {
    this.initSupabase();
    
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
    if (!storedMembers) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(MOCK_MEMBERS));
    } else {
      try {
        const list = JSON.parse(storedMembers);
        const mem1 = list.find(m => m.id === 'MEM-001');
        // Migrate to houseNumber structure if needed
        if (mem1 && (!mem1.houseNumber || mem1.citizenId)) {
          list.forEach(m => {
            const mockVer = MOCK_MEMBERS.find(mock => mock.id === m.id);
            if (mockVer) {
              m.houseNumber = mockVer.houseNumber;
              m.phone = mockVer.phone;
            }
            delete m.citizenId;
          });
          localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(list));
          localStorage.removeItem(STORAGE_KEYS.AUTH); // Clear old session
        }
      } catch (e) {
        console.error("Migration error:", e);
      }
    }

    // 3. Plots
    if (!localStorage.getItem(STORAGE_KEYS.PLOTS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.PLOTS)).length === 0) {
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(MOCK_PLOTS));
    }

    // 4. Crop Seasons
    localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(MOCK_CROPS));

    // 5. Inventory (Phase 2)
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(MOCK_INVENTORY));

    // 6. Sales (Phase 2)
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(MOCK_SALES));

    // Trigger asynchronous Supabase synchronization if connected
    if (supabaseClient) {
      this.syncFromSupabase().catch(e => {
        console.error("Initial Supabase sync failed:", e);
      });
    }
  }

  // --- Enterprise Profile Methods ---
  getEnterprise() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTERPRISE));
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
    if (supabaseClient) {
      return this.membersCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      const list = data ? JSON.parse(data) : MOCK_MEMBERS;
      return (list || []).filter(m => m && typeof m === 'object' && m.id);
    } catch (e) {
      return MOCK_MEMBERS;
    }
  }

  getMemberById(id) {
    return this.getMembers().find(m => m.id === id);
  }

  addMember(member) {
    const members = this.getMembers();
    const maxIdNum = members.reduce((max, m) => {
      const num = parseInt(m.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const newId = `MEM-${String(maxIdNum + 1).padStart(3, '0')}`;
    
    const newMember = {
      ...member,
      id: newId,
      joinDate: member.joinDate || new Date().toISOString().split('T')[0],
      status: member.status || 'active'
    };

    if (supabaseClient) {
      this.membersCache.push(newMember);
      supabaseClient.from('members').insert([newMember]).then(({ error }) => {
        if (error) {
          console.error("Supabase addMember error:", error);
          showToast("ล้มเหลวในการบันทึกออนไลน์: " + error.message, "error");
        }
      });
    } else {
      members.push(newMember);
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }
    return newMember;
  }

  updateMember(id, updatedData) {
    let members = this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
      const updatedMember = { ...members[index], ...updatedData };
      
      if (supabaseClient) {
        this.membersCache[index] = updatedMember;
        supabaseClient.from('members').update(updatedData).eq('id', id).then(({ error }) => {
          if (error) {
            console.error("Supabase updateMember error:", error);
            showToast("ล้มเหลวในการอัปเดตออนไลน์: " + error.message, "error");
          }
        });
      } else {
        members[index] = updatedMember;
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      }
      return updatedMember;
    }
    return null;
  }

  deleteMember(id) {
    let members = this.getMembers();
    const plots = this.getPlots().filter(p => p.memberIds && p.memberIds.includes(id));
    if (plots.length > 0) {
      throw new Error(`ไม่สามารถลบสมาชิกได้เนื่องจากสมาชิกมีแปลงปลูกอยู่ในระบบ (${plots.length} แปลง)`);
    }

    if (supabaseClient) {
      this.membersCache = this.membersCache.filter(m => m.id !== id);
      supabaseClient.from('members').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deleteMember error:", error);
          showToast("ล้มเหลวในการลบออนไลน์: " + error.message, "error");
        }
      });
    } else {
      const filtered = members.filter(m => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));
    }
    return true;
  }

  // --- Plots Methods ---
  getPlots() {
    if (supabaseClient) {
      return this.plotsCache;
    }
    try {
      const plots = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLOTS)) || [];
      return (plots || []).filter(p => p && typeof p === 'object' && p.id);
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
    const newId = `PLOT-${String(maxIdNum + 1).padStart(3, '0')}`;
    
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
    
    if (supabaseClient) {
      this.plotsCache.push(newPlot);
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
    } else {
      plots.push(newPlot);
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
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

      if (supabaseClient) {
        this.plotsCache[index] = updatedPlot;
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
      } else {
        plots[index] = updatedPlot;
        localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
      }
      return updatedPlot;
    }
    return null;
  }

  deletePlot(id) {
    let plots = this.getPlots();
    const crops = this.getCrops().filter(c => c.plotId === id);
    if (crops.length > 0) {
      throw new Error(`ไม่สามารถลบแปลงปลูกได้เนื่องจากมีข้อมูลรอบการเพาะปลูกผูกอยู่ (${crops.length} รอบ)`);
    }

    if (supabaseClient) {
      this.plotsCache = this.plotsCache.filter(p => p.id !== id);
      supabaseClient.from('plots').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deletePlot error:", error);
          showToast("ล้มเหลวในการลบออนไลน์: " + error.message, "error");
        }
      });
    } else {
      const filtered = plots.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(filtered));
    }
    return true;
  }

  // --- Crop Seasons Methods ---
  getCrops() {
    if (supabaseClient) {
      return this.cropsCache;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CROPS)) || [];
  }

  getCropById(id) {
    return this.getCrops().find(c => c.id === id);
  }

  getCropsByPlotId(plotId) {
    return this.getCrops().filter(c => c.plotId === plotId);
  }

  addCrop(crop) {
    const crops = this.getCrops();
    const maxIdNum = crops.reduce((max, c) => {
      const num = parseInt(c.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const newId = `CROP-${String(maxIdNum + 1).padStart(3, '0')}`;
    
    let estHarvest = crop.harvestDateEst;
    if (!estHarvest && crop.plantDate) {
      const pDate = new Date(crop.plantDate);
      pDate.setDate(pDate.getDate() + 100);
      estHarvest = pDate.toISOString().split('T')[0];
    }

    const newCrop = {
      ...crop,
      id: newId,
      cost: parseFloat(crop.cost) || 0,
      yield: crop.yield ? parseFloat(crop.yield) : null,
      status: crop.status || 'growing',
      harvestDateEst: estHarvest,
      cropYear: parseInt(crop.cropYear) || (new Date(crop.plantDate || new Date()).getFullYear() + 543),
      fertilizingLog: crop.fertilizingLog || [],
      isProcessed: false
    };
    
    if (supabaseClient) {
      this.cropsCache.push(newCrop);
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
    } else {
      crops.push(newCrop);
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
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
        cost: parseFloat(updatedData.cost) || 0,
        yield: updatedData.yield ? parseFloat(updatedData.yield) : crops[index].yield
      };

      if (supabaseClient) {
        this.cropsCache[index] = updatedCrop;
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
      } else {
        crops[index] = updatedCrop;
        localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
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
    if (supabaseClient) {
      this.cropsCache = this.cropsCache.filter(c => c.id !== id);
      this.inventoryCache = this.inventoryCache.filter(inv => inv.cropId !== id);
      this.salesCache = this.salesCache.filter(s => s.cropId !== id);
      
      supabaseClient.from('crops').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deleteCrop error:", error);
          showToast("ล้มเหลวในการลบออนไลน์: " + error.message, "error");
        }
      });
    } else {
      const filtered = crops.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(filtered));

      // Also delete inventory associated with it
      let inventory = this.getInventory();
      inventory = inventory.filter(inv => inv.cropId !== id);
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));

      // Also delete sales associated with it
      let sales = this.getSales();
      sales = sales.filter(s => s.cropId !== id);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    }

    return true;
  }

  // --- Inventory Methods (Phase 2) ---
  getInventory() {
    if (supabaseClient) {
      return this.inventoryCache;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY)) || [];
  }

  getInventoryByCropId(cropId) {
    return this.getInventory().find(inv => inv.cropId === cropId);
  }

  // --- Sales Methods (Phase 2) ---
  getSales() {
    if (supabaseClient) {
      return this.salesCache;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES)) || [];
  }

  getSalesByCropId(cropId) {
    return this.getSales().filter(s => s.cropId === cropId);
  }

  /**
   * Process fresh harvested flowers into dry herb stock
   * Allows optional custom dryWeightKg input, or defaults to calculated ratio (Chrysanthemum 8:1, Chamomile 6:1)
   */
  processDryHerbStock(cropId, freshYieldKg, customDryWeightKg = null) {
    const crop = this.getCropById(cropId);
    if (!crop) throw new Error('ไม่พบรหัสรอบการปลูกนี้ในระบบ');
    if (crop.isProcessed) throw new Error('ล็อตเพาะปลูกนี้ผ่านกระบวนการแปรรูปอบแห้งแล้ว');

    const plot = this.getPlotById(crop.plotId);
    const herbType = crop.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';

    const yieldAmount = parseFloat(freshYieldKg) || crop.yield || 0;
    if (yieldAmount <= 0) throw new Error('น้ำหนักผลผลิตสดต้องมากกว่า 0 กิโลกรัมเพื่อเข้าอบแห้ง');

    // Calculate dried yield or use custom dry weight
    let finalDryWeight = 0;
    if (customDryWeightKg !== null && !isNaN(parseFloat(customDryWeightKg)) && parseFloat(customDryWeightKg) > 0) {
      finalDryWeight = parseFloat(parseFloat(customDryWeightKg).toFixed(2));
    } else {
      const ratio = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย') ? 8 : 6;
      finalDryWeight = parseFloat((yieldAmount / ratio).toFixed(2));
    }

    // 1. Add to Inventory
    const inventory = this.getInventory();
    const existingIndex = inventory.findIndex(inv => inv.cropId === cropId);
    let invItem;
    if (existingIndex !== -1) {
      inventory[existingIndex].dryStockKg = parseFloat((inventory[existingIndex].dryStockKg + finalDryWeight).toFixed(2));
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
        processedDate: new Date().toISOString().split('T')[0]
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

    // 2. Mark Crop as processed and save yield if changed
    this.updateCrop(cropId, { 
      status: 'harvested',
      yield: yieldAmount,
      harvestDateActual: crop.harvestDateActual || new Date().toISOString().split('T')[0],
      isProcessed: true 
    });

    return finalDryWeight;
  }

  /**
   * Record a sale of dry herbs from a specific Crop lot.
   * Decrements stock and logs transaction.
   */
  recordSale(cropId, amount, price, customer, date, saleType = 'bulk') {
    const amt = parseFloat(amount) || 0;
    const prc = parseFloat(price) || 0;
    if (amt <= 0) throw new Error(saleType === 'bulk' ? 'ปริมาณสมุนไพรอบแห้งที่ขายต้องมากกว่า 0 กก.' : 'จำนวนกระปุกที่ขายต้องมากกว่า 0 กระปุก');
    if (prc <= 0) throw new Error('ราคาต่อหน่วยต้องมากกว่า 0 บาท');

    // 1. Check Inventory
    const inventory = this.getInventory();
    const invIndex = inventory.findIndex(inv => inv.cropId === cropId);
    if (invIndex === -1) throw new Error('ไม่พบล็อตสินค้านี้ในคลังสินค้า');
    
    const inv = inventory[invIndex];
    const isChrys = inv.herbType === 'เก๊กฮวย' || inv.herbType.includes('เก๊กฮวย');
    const jarCapacity = isChrys ? 0.10 : 0.05; // 100g for Chrysanthemum, 50g for Chamomile

    let weightToDeduct = amt;
    if (saleType === 'jar') {
      weightToDeduct = parseFloat((amt * jarCapacity).toFixed(2));
    }

    if (inv.dryStockKg < weightToDeduct) {
      if (saleType === 'bulk') {
        throw new Error(`จำนวนสินค้าล็อตนี้ไม่เพียงพอในคลัง (คงเหลือ ${inv.dryStockKg} กก., ต้องการขาย ${amt} กก.)`);
      } else {
        const maxJarsAvailable = Math.floor(inv.dryStockKg / jarCapacity);
        throw new Error(`วัตถุดิบอบแห้งในคลังไม่เพียงพอสำหรับบรรจุขาย (คงเหลือ ${inv.dryStockKg} กก., เทียบเท่าสูงสุด ${maxJarsAvailable} กระปุก, ต้องการขาย ${amt} กระปุก)`);
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
        status: netProfit > 0 ? 'profit' : netProfit < 0 ? 'loss' : 'breakeven'
      };
    });
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
}
export const appState = new AppState();
