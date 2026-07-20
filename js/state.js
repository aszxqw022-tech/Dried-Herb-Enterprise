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

// Mock User Accounts for Login & Roles
const MOCK_USERS = [
  {
    username: 'admin',
    password: 'password124',
    name: 'นายสมเกียรติ พึ่งตน',
    role: 'ประธานกลุ่ม / ผู้ดูแลระบบ',
    memberId: 'MEM-001',
    avatarText: 'SK',
    color: 'emerald'
  },
  {
    username: 'officer',
    password: 'password124',
    name: 'นายมานะ รักเกษตร',
    role: 'เหรัญญิก / เจ้าหน้าที่คลัง',
    memberId: 'MEM-003',
    avatarText: 'MN',
    color: 'amber'
  },
  {
    username: 'member',
    password: 'password124',
    name: 'นางใจดี ศรีสมุนไพร',
    role: 'สมาชิกวิสาหกิจ',
    memberId: 'MEM-002',
    avatarText: 'JD',
    color: 'blue'
  }
];

// Initial Profile setup
const DEFAULT_ENTERPRISE = {
  name: 'วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านแม่ริม',
  village: 'หมู่ที่ 4 บ้านหนองเขียว',
  subdistrict: 'แม่แรม',
  district: 'แม่ริม',
  province: 'เชียงใหม่',
  zipcode: '50180',
  phone: '089-555-1234',
  email: 'maerim.driedherbs@gmail.com',
  chairman: 'นายสมเกียรติ พึ่งตน',
  description: 'กลุ่มเกษตรกรผลิตและแปรรูปสมุนไพรอบแห้งปลอดสารพิษเพื่อความยั่งยืน เก๊กฮวย คาโมมายล์ และสมุนไพรพื้นบ้าน'
};

// Mock 33 Members
const MOCK_MEMBERS = [
  { id: 'MEM-001', name: 'นายสมเกียรติ พึ่งตน', role: 'ประธานกลุ่ม', phone: '081-234-5678', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-01-10' },
  { id: 'MEM-002', name: 'นางใจดี ศรีสมุนไพร', role: 'รองประธาน', phone: '082-345-6789', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-01-15' },
  { id: 'MEM-003', name: 'นายมานะ รักเกษตร', role: 'เหรัญญิก', phone: '083-456-7890', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-01-15' },
  { id: 'MEM-004', name: 'นางสมศรี มีวิถี', role: 'เลขานุการ', phone: '084-567-8901', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-01-20' },
  { id: 'MEM-005', name: 'นายวิชัย ปัญญาดี', role: 'กรรมการ', phone: '085-678-9012', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-02-01' },
  { id: 'MEM-006', name: 'นางนภา สุขสบาย', role: 'สมาชิกทั่วไป', phone: '086-789-0123', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-05' },
  { id: 'MEM-007', name: 'นายดำรง รักชาติ', role: 'สมาชิกทั่วไป', phone: '087-890-1234', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-02-10' },
  { id: 'MEM-008', name: 'นางสมปอง สุขสำราญ', role: 'สมาชิกทั่วไป', phone: '088-901-2345', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-10' },
  { id: 'MEM-009', name: 'นายบุญมี ทองคำ', role: 'สมาชิกทั่วไป', phone: '089-012-3456', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-02-12' },
  { id: 'MEM-010', name: 'นางประกาย แสงทอง', role: 'สมาชิกทั่วไป', phone: '081-123-4567', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-02-15' },
  { id: 'MEM-011', name: 'นายสุรพล เด่นดี', role: 'สมาชิกทั่วไป', phone: '082-234-5678', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-20' },
  { id: 'MEM-012', name: 'นางวิมล รุ่งเรือง', role: 'สมาชิกทั่วไป', phone: '083-345-6789', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-22' },
  { id: 'MEM-013', name: 'นายเกรียงไกร ใฝ่ดี', role: 'สมาชิกทั่วไป', phone: '084-456-7890', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-03-01' },
  { id: 'MEM-014', name: 'นางนงนุช สุดสวย', role: 'สมาชิกทั่วไป', phone: '085-567-8901', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-03-05' },
  { id: 'MEM-015', name: 'นายทวีลาภ ลาภดี', role: 'สมาชิกทั่วไป', phone: '086-678-9012', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-03-10' },
  { id: 'MEM-016', name: 'นางพิศมัย ใจธรรม', role: 'สมาชิกทั่วไป', phone: '087-789-0123', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-03-12' },
  { id: 'MEM-017', name: 'นายอดุลย์ อบอุ่น', role: 'สมาชิกทั่วไป', phone: '088-890-1234', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-03-15' },
  { id: 'MEM-018', name: 'นางสาวสุดา ชาเขียว', role: 'สมาชิกทั่วไป', phone: '089-901-2345', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-03-18' },
  { id: 'MEM-019', name: 'นายสมหมาย มั่นคง', role: 'สมาชิกทั่วไป', phone: '081-901-2345', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-03-20' },
  { id: 'MEM-020', name: 'นางอรอนงค์ โฉมงาม', role: 'สมาชิกทั่วไป', phone: '082-901-2345', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-03-22' },
  { id: 'MEM-021', name: 'นายประจักษ์ รักสงบ', role: 'สมาชิกทั่วไป', phone: '083-901-2345', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-03-25' },
  { id: 'MEM-022', name: 'นางสาวรุ่งทิวา แสงดาว', role: 'สมาชิกทั่วไป', phone: '084-901-2345', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-01' },
  { id: 'MEM-023', name: 'นายประเสริฐ ดีเลิศ', role: 'สมาชิกทั่วไป', phone: '085-901-2345', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-04-05' },
  { id: 'MEM-024', name: 'นางสาวกมลวรรณ ชื่นใจ', role: 'สมาชิกทั่วไป', phone: '086-901-2345', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-04-10' },
  { id: 'MEM-025', name: 'นายพิชัย ชูชาติ', role: 'สมาชิกทั่วไป', phone: '087-901-2345', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-12' },
  { id: 'MEM-026', name: 'นางชลลดา ปันแก้ว', role: 'สมาชิกทั่วไป', phone: '088-901-2345', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-04-15' },
  { id: 'MEM-027', name: 'นายธวัชชัย ยอดดี', role: 'สมาชิกทั่วไป', phone: '089-901-2345', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-20' },
  { id: 'MEM-028', name: 'นางมธุรส หอมกลิ่น', role: 'สมาชิกทั่วไป', phone: '081-012-3456', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-04-22' },
  { id: 'MEM-029', name: 'นายเสนาะ ร้องเพราะ', role: 'สมาชิกทั่วไป', phone: '082-012-3456', status: 'inactive', villageNumber: 'หมู่ 2', joinDate: '2024-04-25' },
  { id: 'MEM-030', name: 'นางอัญชลี รื่นรมย์', role: 'สมาชิกทั่วไป', phone: '083-012-3456', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-28' },
  { id: 'MEM-031', name: 'นายอุดม ศรีทอง', role: 'สมาชิกทั่วไป', phone: '084-012-3456', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-05-01' },
  { id: 'MEM-032', name: 'นางรักษ์ชนก อุดมดี', role: 'สมาชิกทั่วไป', phone: '085-012-3456', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-05-05' },
  { id: 'MEM-033', name: 'นายพชรพล อิ่มเอม', role: 'สมาชิกทั่วไป', phone: '086-012-3456', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-05-10' }
];

// Mock plots for some members to display initially
const MOCK_PLOTS = [
  { id: 'PLOT-001', memberId: 'MEM-001', name: 'แปลงสวนหน้าบ้าน (ประธาน)', sizeRai: 2, sizeNgan: 1, sizeSqWah: 50, plantType: 'เก๊กฮวย', lat: 18.9142, lng: 98.9442, status: 'active' },
  { id: 'PLOT-002', memberId: 'MEM-002', name: 'แปลงริมคลองส่งน้ำ', sizeRai: 1, sizeNgan: 2, sizeSqWah: 0, plantType: 'คาโมมายล์', lat: 18.9158, lng: 98.9415, status: 'active' },
  { id: 'PLOT-003', memberId: 'MEM-003', name: 'แปลงเชิงเขาม่อนแก้ว', sizeRai: 3, sizeNgan: 0, sizeSqWah: 80, plantType: 'เก๊กฮวย', lat: 18.9121, lng: 98.9495, status: 'active' },
  { id: 'PLOT-004', memberId: 'MEM-004', name: 'แปลงใกล้หอประชุม', sizeRai: 0, sizeNgan: 3, sizeSqWah: 50, plantType: 'คาโมมายล์', lat: 18.9172, lng: 98.9455, status: 'active' },
  { id: 'PLOT-005', memberId: 'MEM-006', name: 'แปลงไร่นิเวศน์', sizeRai: 4, sizeNgan: 0, sizeSqWah: 0, plantType: 'เก๊กฮวย', lat: 18.9095, lng: 98.9421, status: 'active' },
  { id: 'PLOT-006', memberId: 'MEM-008', name: 'แปลงสวนหลังบ้านป้าสมปอง', sizeRai: 1, sizeNgan: 0, sizeSqWah: 20, plantType: 'คาโมมายล์', lat: 18.9135, lng: 98.9392, status: 'active' },
  { id: 'PLOT-007', memberId: 'MEM-011', name: 'แปลงดอยวิวสวนหอม', sizeRai: 5, sizeNgan: 2, sizeSqWah: 0, plantType: 'เก๊กฮวย', lat: 18.9192, lng: 98.9481, status: 'active' },
  { id: 'PLOT-008', memberId: 'MEM-015', name: 'แปลงผักหลังสวนทวีลาภ', sizeRai: 2, sizeNgan: 0, sizeSqWah: 0, plantType: 'คาโมมายล์', lat: 18.9102, lng: 98.9463, status: 'active' }
];

// Mock crop seasons for initial plots
const MOCK_CROPS = [
  {
    id: 'CROP-001',
    plotId: 'PLOT-001',
    plantDate: '2026-03-10',
    harvestDateEst: '2026-07-10',
    harvestDateActual: null,
    cost: 4500,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    fertilizingLog: [
      { date: '2026-03-10', type: 'ปุ๋ยหมักชีวภาพสูตรใบ', amount: '20 กิโลกรัม', cost: 350 },
      { date: '2026-04-15', type: 'น้ำหมักมูลค้างคาวบำรุงต้น', amount: '5 ลิตร (เจือจาง)', cost: 200 },
      { date: '2026-06-01', type: 'ปุ๋ยอินทรีย์บำรุงดอก', amount: '15 กิโลกรัม', cost: 300 }
    ]
  },
  {
    id: 'CROP-002',
    plotId: 'PLOT-002',
    plantDate: '2026-04-01',
    harvestDateEst: '2026-07-15',
    harvestDateActual: null,
    cost: 3200,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    fertilizingLog: [
      { date: '2026-04-01', type: 'ปุ๋ยคอกเตรียมดิน', amount: '50 กิโลกรัม', cost: 400 },
      { date: '2026-05-10', type: 'ปุ๋ยหมักแห้งเศษสมุนไพร', amount: '15 กิโลกรัม', cost: 250 }
    ]
  },
  {
    id: 'CROP-003',
    plotId: 'PLOT-003',
    plantDate: '2025-11-01',
    harvestDateEst: '2026-03-01',
    harvestDateActual: '2026-03-05',
    cost: 5000,
    yield: 185.5, // kg fresh
    status: 'harvested',
    isProcessed: true, // Already processed
    cropYear: 2568,
    fertilizingLog: [
      { date: '2025-11-01', type: 'ปุ๋ยอินทรีย์พื้นฐาน', amount: '30 กิโลกรัม', cost: 500 },
      { date: '2025-12-15', type: 'น้ำหมักสะเดาไล่แมลง', amount: '2 ลิตร', cost: 150 },
      { date: '2026-01-20', type: 'ปุ๋ยอินทรีย์เร่งดอก', amount: '20 กิโลกรัม', cost: 400 }
    ]
  },
  {
    id: 'CROP-004',
    plotId: 'PLOT-004',
    plantDate: '2025-11-15',
    harvestDateEst: '2026-03-15',
    harvestDateActual: '2026-03-12',
    cost: 2500,
    yield: 75.2, // kg fresh
    status: 'harvested',
    isProcessed: true, // Already processed
    cropYear: 2568,
    fertilizingLog: [
      { date: '2025-11-15', type: 'ปุ๋ยหมักชีวภาพสูตร 1', amount: '10 กิโลกรัม', cost: 200 },
      { date: '2026-01-05', type: 'ปุ๋ยคอกมูลไก่แห้ง', amount: '10 กิโลกรัม', cost: 200 }
    ]
  }
];

// Mock inventory split by cropId (Phase 2 core feature)
const MOCK_INVENTORY = [
  { cropId: 'CROP-003', herbType: 'เก๊กฮวย', dryStockKg: 13.18, processedDate: '2026-03-06' }, // 185.5 / 8 = 23.18 kg. Sold 10, remaining 13.18
  { cropId: 'CROP-004', herbType: 'คาโมมายล์', dryStockKg: 7.53, processedDate: '2026-03-13' }  // 75.2 / 6 = 12.53 kg. Sold 5, remaining 7.53
];

// Mock sales transactions linked to specific cropIds
const MOCK_SALES = [
  { id: 'SALE-001', cropId: 'CROP-003', amountKg: 10.0, pricePerKg: 450, totalPrice: 4500, customer: 'ร้านชาสมุนไพรม่อนแจ่ม', date: '2026-03-20' },
  { id: 'SALE-002', cropId: 'CROP-004', amountKg: 5.0, pricePerKg: 600, totalPrice: 3000, customer: 'กลุ่มท่องเที่ยวแม่ริม', date: '2026-04-05' }
];

export class AppState {
  constructor() {
    this.onAuthChange = null;
    this.onEnterpriseChange = null;
    this.init();
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
    const user = MOCK_USERS.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (!user) {
      throw new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    }

    const sessionData = {
      username: user.username,
      name: user.name,
      role: user.role,
      memberId: user.memberId,
      avatarText: user.avatarText,
      color: user.color,
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
    // 1. Enterprise Setup
    if (!localStorage.getItem(STORAGE_KEYS.ENTERPRISE)) {
      localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(DEFAULT_ENTERPRISE));
    }
    
    // 2. Members
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(MOCK_MEMBERS));
    }

    // 3. Plots
    if (!localStorage.getItem(STORAGE_KEYS.PLOTS)) {
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(MOCK_PLOTS));
    }

    // 4. Crop Seasons
    if (!localStorage.getItem(STORAGE_KEYS.CROPS)) {
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(MOCK_CROPS));
    }

    // 5. Inventory (Phase 2)
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(MOCK_INVENTORY));
    }

    // 6. Sales (Phase 2)
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(MOCK_SALES));
    }
  }

  // --- Enterprise Profile Methods ---
  getEnterprise() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTERPRISE));
  }

  saveEnterprise(data) {
    localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(data));
    if (this.onEnterpriseChange) {
      this.onEnterpriseChange(data);
    }
    return data;
  }

  // --- Members Methods ---
  getMembers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS)) || [];
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
    
    members.push(newMember);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    return newMember;
  }

  updateMember(id, updatedData) {
    let members = this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
      members[index] = { ...members[index], ...updatedData };
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      return members[index];
    }
    return null;
  }

  deleteMember(id) {
    let members = this.getMembers();
    const plots = this.getPlots().filter(p => p.memberId === id);
    if (plots.length > 0) {
      throw new Error(`ไม่สามารถลบสมาชิกได้เนื่องจากสมาชิกมีแปลงปลูกอยู่ในระบบ (${plots.length} แปลง)`);
    }

    const filtered = members.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));
    return true;
  }

  // --- Plots Methods ---
  getPlots() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PLOTS)) || [];
  }

  getPlotById(id) {
    return this.getPlots().find(p => p.id === id);
  }

  getPlotsByMemberId(memberId) {
    return this.getPlots().filter(p => p.memberId === memberId);
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
    
    plots.push(newPlot);
    localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
    return newPlot;
  }

  updatePlot(id, updatedData) {
    let plots = this.getPlots();
    const index = plots.findIndex(p => p.id === id);
    if (index !== -1) {
      plots[index] = { 
        ...plots[index], 
        ...updatedData,
        sizeRai: parseInt(updatedData.sizeRai) || 0,
        sizeNgan: parseInt(updatedData.sizeNgan) || 0,
        sizeSqWah: parseInt(updatedData.sizeSqWah) || 0,
        lat: parseFloat(updatedData.lat) || plots[index].lat,
        lng: parseFloat(updatedData.lng) || plots[index].lng
      };
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
      return plots[index];
    }
    return null;
  }

  deletePlot(id) {
    let plots = this.getPlots();
    const crops = this.getCrops().filter(c => c.plotId === id);
    if (crops.length > 0) {
      throw new Error(`ไม่สามารถลบแปลงปลูกได้เนื่องจากมีข้อมูลรอบการเพาะปลูกผูกอยู่ (${crops.length} รอบ)`);
    }

    const filtered = plots.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(filtered));
    return true;
  }

  // --- Crop Seasons Methods ---
  getCrops() {
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
    
    crops.push(newCrop);
    localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
    return newCrop;
  }

  updateCrop(id, updatedData) {
    let crops = this.getCrops();
    const index = crops.findIndex(c => c.id === id);
    if (index !== -1) {
      crops[index] = { 
        ...crops[index], 
        ...updatedData,
        cost: parseFloat(updatedData.cost) || 0,
        yield: updatedData.yield ? parseFloat(updatedData.yield) : crops[index].yield
      };
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
      return crops[index];
    }
    return null;
  }

  addFertilizerLog(cropId, logEntry) {
    let crops = this.getCrops();
    const index = crops.findIndex(c => c.id === cropId);
    if (index !== -1) {
      const log = crops[index].fertilizingLog || [];
      log.push({
        date: logEntry.date || new Date().toISOString().split('T')[0],
        type: logEntry.type,
        amount: logEntry.amount,
        cost: parseFloat(logEntry.cost) || 0
      });
      crops[index].fertilizingLog = log;
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
      return crops[index];
    }
    return null;
  }

  deleteCrop(id) {
    const crops = this.getCrops();
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

    return true;
  }

  // --- Inventory Methods (Phase 2) ---
  getInventory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY)) || [];
  }

  getInventoryByCropId(cropId) {
    return this.getInventory().find(inv => inv.cropId === cropId);
  }

  // --- Sales Methods (Phase 2) ---
  getSales() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES)) || [];
  }

  getSalesByCropId(cropId) {
    return this.getSales().filter(s => s.cropId === cropId);
  }

  /**
   * Process fresh harvested flowers into dry herb stock
   * Ratio: Chrysanthemum 8:1, Chamomile 6:1
   */
  processDryHerbStock(cropId, freshYieldKg) {
    const crop = this.getCropById(cropId);
    if (!crop) throw new Error('ไม่พบรหัสรอบการปลูกนี้ในระบบ');
    if (crop.isProcessed) throw new Error('ล็อตเพาะปลูกนี้ผ่านกระบวนการแปรรูปอบแห้งแล้ว');

    const plot = this.getPlotById(crop.plotId);
    if (!plot) throw new Error('ไม่พบแปลงปลูกที่ผูกกับรอบปลูกนี้');

    const yieldAmount = parseFloat(freshYieldKg) || crop.yield || 0;
    if (yieldAmount <= 0) throw new Error('น้ำหนักผลผลิตสดต้องมากกว่า 0 กิโลกรัมเพื่อเข้าอบแห้ง');

    // Calculate dried yield
    const ratio = plot.plantType === 'เก๊กฮวย' ? 8 : 6;
    const dryWeight = yieldAmount / ratio;
    const finalDryWeight = parseFloat(dryWeight.toFixed(2));

    // 1. Add to Inventory
    const inventory = this.getInventory();
    const existingIndex = inventory.findIndex(inv => inv.cropId === cropId);
    if (existingIndex !== -1) {
      inventory[existingIndex].dryStockKg = parseFloat((inventory[existingIndex].dryStockKg + finalDryWeight).toFixed(2));
    } else {
      inventory.push({
        cropId: cropId,
        herbType: plot.plantType,
        dryStockKg: finalDryWeight,
        processedDate: new Date().toISOString().split('T')[0]
      });
    }
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));

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
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));

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
    sales.push(newSale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

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
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));

    // 2. Update Crop record
    let crops = this.getCrops();
    const cropIndex = crops.findIndex(c => c.id === cropId);
    if (cropIndex !== -1) {
      crops[cropIndex].yield = fresh;
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
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
      const memberPlots = plots.filter(p => p.memberId === m.id);
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

  // Helper for overall statistics (Overridden with Phase 2 data)
  getStats() {
    const members = this.getMembers();
    const plots = this.getPlots();
    const crops = this.getCrops();
    const inventory = this.getInventory();
    const sales = this.getSales();

    const activeMembersCount = members.filter(m => m.status === 'active').length;
    
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
      totalMembers: members.length,
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
