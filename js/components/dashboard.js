import { appState } from '../state.js';
import { formatThaiArea, formatThaiDate, formatBaht, formatCropSeasonId } from '../helpers.js';
import { SalesComponent } from './sales.js';

// LocalStorage key for direct sales
const DIRECT_SALES_KEY = 'herb_enterprise_direct_sales_v1';

// Standard themes for active herbs
const HERB_THEMES = {
  'เก๊กฮวย': { icon: '🌼', name: 'ดอกเก๊กฮวย', stdRatio: 8.0, pricePerKg: 250, freshColor: 'rgba(52, 211, 153, 0.85)', freshBorder: '#059669', dryColor: 'rgba(6, 95, 70, 0.9)', dryBorder: '#022c22' },
  'คาโมมายล์': { icon: '🌿', name: 'ดอกคาโมมายล์', stdRatio: 6.0, pricePerKg: 450, freshColor: 'rgba(110, 231, 183, 0.85)', freshBorder: '#10b981', dryColor: 'rgba(15, 118, 110, 0.9)', dryBorder: '#134e4a' },
  'อัญชัน': { icon: '🌸', name: 'ดอกอัญชัน', stdRatio: 7.0, pricePerKg: 350, freshColor: 'rgba(192, 132, 252, 0.85)', freshBorder: '#9333ea', dryColor: 'rgba(107, 33, 168, 0.9)', dryBorder: '#581c87' },
  'ดาวเรือง': { icon: '🌻', name: 'ดอกดาวเรือง', stdRatio: 7.5, pricePerKg: 280, freshColor: 'rgba(253, 224, 71, 0.85)', freshBorder: '#ca8a04', dryColor: 'rgba(161, 98, 7, 0.9)', dryBorder: '#713f12' }
};

// Seed demo sales transactions if direct sales is empty
const DEFAULT_RECENT_SALES = [
  {
    id: 'INV-2568-013',
    invoiceNo: 'INV-2568-013',
    receiptNo: 'INV-2568-013',
    date: '2026-10-05',
    customerName: 'คุณกานดา พิมลวรรณ',
    customerType: 'ลูกค้าทั่วไป',
    sellerName: 'นายสมเกียรติ พึ่งตน',
    productName: 'กระปุกเก๊กฮวย 50g',
    quantity: 20,
    unit: 'กระป๋อง',
    unitPrice: 150,
    totalPrice: 3000,
    totalAmount: 3000,
    payment: 'โอนเงิน',
    items: [
      { productId: 'PRD-003', productName: 'เก๊กฮวยกระป๋อง (50 G)', quantity: 20, unit: 'กระป๋อง', unitPrice: 150, totalPrice: 3000 }
    ]
  },
  {
    id: 'INV-2568-012',
    invoiceNo: 'INV-2568-012',
    receiptNo: 'INV-2568-012',
    date: '2026-10-04',
    customerName: 'บริษัท เชียงรายทีแลนด์ จำกัด',
    customerType: 'ตัวแทนจำหน่าย',
    sellerName: 'นายสมเกียรติ พึ่งตน',
    productName: 'กระปุกเก๊กฮวย 50g',
    quantity: 30,
    unit: 'กระป๋อง',
    unitPrice: 150,
    totalPrice: 4500,
    totalAmount: 4500,
    payment: 'โอนเงิน',
    items: [
      { productId: 'PRD-003', productName: 'เก๊กฮวยกระป๋อง (50 G)', quantity: 30, unit: 'กระป๋อง', unitPrice: 150, totalPrice: 4500 }
    ]
  },
  {
    id: 'INV-2568-011',
    invoiceNo: 'INV-2568-011',
    receiptNo: 'INV-2568-011',
    date: '2026-10-02',
    customerName: 'ร้านชาสมุนไพรม่อนแจ่ม',
    customerType: 'ร้านคาเฟ่/ร้านขายของฝาก',
    sellerName: 'นายสมเกียรติ พึ่งตน',
    productName: 'ดอกคาโมมายล์อบแห้ง (กก.)',
    quantity: 5,
    unit: 'กก.',
    unitPrice: 1500,
    totalPrice: 7500,
    totalAmount: 7500,
    payment: 'โอนเงิน',
    items: [
      { productId: 'PRD-002', productName: 'ดอกคาโมมายล์อบแห้ง', quantity: 5, unit: 'กก.', unitPrice: 1500, totalPrice: 7500 }
    ]
  },
  {
    id: 'INV-2568-010',
    invoiceNo: 'INV-2568-010',
    receiptNo: 'INV-2568-010',
    date: '2026-09-28',
    customerName: 'คุณสมหญิง อารีย์พร',
    customerType: 'ลูกค้าทั่วไป',
    sellerName: 'นางใจดี ศรีสมุนไพร',
    productName: 'กระปุกคาโมมายล์ 50g',
    quantity: 15,
    unit: 'กระป๋อง',
    unitPrice: 100,
    totalPrice: 1500,
    totalAmount: 1500,
    payment: 'เงินสด',
    items: [
      { productId: 'PRD-004', productName: 'คาโมมายล์กระป๋อง (50 G)', quantity: 15, unit: 'กระป๋อง', unitPrice: 100, totalPrice: 1500 }
    ]
  },
  {
    id: 'INV-2568-009',
    invoiceNo: 'INV-2568-009',
    receiptNo: 'INV-2568-009',
    date: '2026-09-25',
    customerName: 'ร้านคาเฟ่บ้านชาดอนมูล',
    customerType: 'ร้านคาเฟ่/ร้านขายของฝาก',
    sellerName: 'นายมานะ รักเกษตร',
    productName: 'ดอกเก๊กฮวยอบแห้ง (กก.)',
    quantity: 3,
    unit: 'กก.',
    unitPrice: 1000,
    totalPrice: 3000,
    totalAmount: 3000,
    payment: 'โอนเงิน',
    items: [
      { productId: 'PRD-001', productName: 'ดอกเก๊กฮวยอบแห้ง', quantity: 3, unit: 'กก.', unitPrice: 1000, totalPrice: 3000 }
    ]
  }
];

function getDirectSales(activeHerbs = null) {
  let sales = [];
  try {
    let raw = JSON.parse(localStorage.getItem(DIRECT_SALES_KEY));
    if (Array.isArray(raw) && raw.length > 0) {
      sales = raw;
    }
  } catch (e) {}

  if (sales.length === 0) {
    sales = [...DEFAULT_RECENT_SALES];
  }

  // Filter out any sales of herbs that are not currently active
  if (activeHerbs && Array.isArray(activeHerbs) && activeHerbs.length > 0) {
    sales = sales.filter(s => {
      const prodName = s.productName || (s.items && s.items[0] ? s.items[0].productName : '');
      const inactiveKnownHerbs = ['อัญชัน', 'ชาอัสสัม', 'ดาวเรือง', 'ฟ้าทะลายโจร'].filter(h => !activeHerbs.includes(h));
      const hasInactive = inactiveKnownHerbs.some(inh => prodName.includes(inh));
      return !hasInactive;
    });
  }

  return sales;
}

function getActiveHerbs() {
  const roadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
  const plots = appState.getPlots ? appState.getPlots() : [];
  const allCrops = appState.getCrops ? appState.getCrops() : [];

  const set = new Set(Object.keys(roadmaps));
  plots.forEach(p => { if (p.plantType && p.plantType.trim()) set.add(p.plantType.trim()); });
  allCrops.forEach(c => {
    const herb = c.seedlingSource || (plots.find(p => p.id === c.plotId)?.plantType);
    if (herb && herb.trim()) set.add(herb.trim());
  });
  if (set.size === 0) {
    set.add('เก๊กฮวย');
    set.add('คาโมมายล์');
  }
  return Array.from(set);
}

export const DashboardComponent = {
  charts: {},

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';
    const enterprise = appState.getEnterprise() || {};

    // 1. Plots Data (14 Plots)
    let plots = appState.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const plotIds = plots.map(p => p.id);
    const allCrops = appState.getCrops().filter(c => plotIds.includes(c.plotId));

    // Calculate plot status breakdown for Donut Chart (จาก 14 แปลง)
    let growingPlotsCount = 0;
    let harvestedPlotsCount = 0;
    let idlePlotsCount = 0;

    plots.forEach(p => {
      const plotCrops = allCrops.filter(c => c.plotId === p.id);
      const hasGrowing = plotCrops.some(c => c.status === 'growing');
      const hasHarvested = plotCrops.some(c => c.status === 'harvested');

      if (hasGrowing) {
        growingPlotsCount++;
      } else if (hasHarvested) {
        harvestedPlotsCount++;
      } else {
        idlePlotsCount++;
      }
    });

    // Ensure total matches 14 plots if empty
    if (plots.length === 14 && growingPlotsCount === 0 && harvestedPlotsCount === 0 && idlePlotsCount === 0) {
      growingPlotsCount = 7;
      harvestedPlotsCount = 4;
      idlePlotsCount = 3;
    }

    // 2. Fresh & Dry Produce Calculations
    const roadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
    const activeHerbsList = getActiveHerbs();
    const harvestedCrops = allCrops.filter(c => c.status === 'harvested');
    const dryingBatches = appState.getDryingBatches ? appState.getDryingBatches() : [];

    const produceMap = {};
    activeHerbsList.forEach(name => {
      const theme = HERB_THEMES[name] || {
        name,
        icon: roadmaps[name]?.icon || '🌿',
        stdRatio: 7.0,
        pricePerKg: 300,
        freshColor: 'rgba(52, 211, 153, 0.85)',
        freshBorder: '#059669',
        dryColor: 'rgba(6, 95, 70, 0.9)',
        dryBorder: '#022c22'
      };
      produceMap[name] = {
        name,
        theme,
        freshKg: 0,
        dryKg: 0
      };
    });

    harvestedCrops.forEach(c => {
      const plot = plots.find(p => p.id === c.plotId);
      const herbRaw = c.seedlingSource || (plot ? plot.plantType : '') || '';
      const matchedKey = activeHerbsList.find(h => herbRaw.includes(h)) || activeHerbsList[0];

      if (produceMap[matchedKey]) {
        produceMap[matchedKey].freshKg += (parseFloat(c.yield) || 0);
        if (c.isProcessed) {
          produceMap[matchedKey].dryKg += (parseFloat(c.dryWeight) || 0);
        }
      }
    });

    dryingBatches.forEach(b => {
      const herbRaw = b.herbType || '';
      const matchedKey = activeHerbsList.find(h => herbRaw.includes(h));
      if (matchedKey && produceMap[matchedKey]) {
        if (produceMap[matchedKey].dryKg === 0) {
          produceMap[matchedKey].dryKg += (parseFloat(b.dryWeightKg) || 0);
        }
      }
    });

    // Provide realistic baseline yields if initial state
    if (produceMap['เก๊กฮวย'] && produceMap['เก๊กฮวย'].freshKg === 0) {
      produceMap['เก๊กฮวย'].freshKg = 335.5;
      produceMap['เก๊กฮวย'].dryKg = 42.0;
    }
    if (produceMap['คาโมมายล์'] && produceMap['คาโมมายล์'].freshKg === 0) {
      produceMap['คาโมมายล์'].freshKg = 175.0;
      produceMap['คาโมมายล์'].dryKg = 29.2;
    }
    if (produceMap['อัญชัน'] && produceMap['อัญชัน'].freshKg === 0) {
      produceMap['อัญชัน'].freshKg = 120.0;
      produceMap['อัญชัน'].dryKg = 17.1;
    }

    const totalFreshAll = Object.values(produceMap).reduce((sum, h) => sum + h.freshKg, 0);
    const totalDryAll = Object.values(produceMap).reduce((sum, h) => sum + h.dryKg, 0);
    const totalDryEstValue = Object.values(produceMap).reduce((sum, h) => sum + (h.dryKg * (h.theme.pricePerKg || 300)), 0);

    // 3. Inventory Stock Calculations
    const allProducts = appState.getProducts();
    let totalInventoryValue = 0;
    let totalStockCans = 0;
    let totalDryInventoryKg = 0;

    allProducts.forEach(p => {
      const stock = parseFloat(p.stock) || 0;
      const price = parseFloat(p.price) || 0;
      totalInventoryValue += (stock * price);

      if (p.unit === 'กระป๋อง' || (p.name || '').includes('กระป๋อง')) {
        totalStockCans += stock;
      } else if (p.unit === 'กก.' || (p.name || '').includes('อบแห้ง')) {
        totalDryInventoryKg += stock;
      }
    });

    if (totalInventoryValue === 0) totalInventoryValue = 82400;
    if (totalStockCans === 0) totalStockCans = 150;
    if (totalDryInventoryKg === 0) totalDryInventoryKg = 25.0;

    // 4. Sales Calculations (Dry Bulk vs Canned Jars by Herb)
    const dryHerbBaseline = {
      'เก๊กฮวย': { revenue: 38600, qty: 38.6 },
      'คาโมมายล์': { revenue: 27000, qty: 18.0 },
      'อัญชัน': { revenue: 15400, qty: 22.0 },
      'ดาวเรือง': { revenue: 8400, qty: 12.0 }
    };

    const jarHerbBaseline = {
      'เก๊กฮวย': { revenue: 48500, qty: 323 },
      'คาโมมายล์': { revenue: 35200, qty: 352 },
      'อัญชัน': { revenue: 18600, qty: 155 },
      'ดาวเรือง': { revenue: 9600, qty: 80 }
    };

    let totalDrySalesAmt = 0;
    let totalDrySalesKg = 0;
    let totalJarSalesAmt = 0;
    let totalJarSalesCount = 0;

    activeHerbsList.forEach(h => {
      const d = dryHerbBaseline[h] || { revenue: 10000, qty: 10.0 };
      const j = jarHerbBaseline[h] || { revenue: 12000, qty: 100 };
      totalDrySalesAmt += d.revenue;
      totalDrySalesKg += d.qty;
      totalJarSalesAmt += j.revenue;
      totalJarSalesCount += j.qty;
    });

    const totalRevenueVal = totalDrySalesAmt + totalJarSalesAmt;

    // Recent 4 Sales Transactions
    const directSales = getDirectSales(activeHerbsList);
    const recentSales = directSales.slice(0, 4);

    return `
      <div class="fade-in space-y-6 pb-8">

        <!-- ===== Page Header ===== -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-bold mb-2 border border-emerald-200 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ระบบแดชบอร์ดสารสนเทศกลาง (Central Enterprise Analytics)</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-800 flex items-center gap-2.5">
              <i class="fa-solid fa-chart-line text-emerald-700"></i>
              <span>แดชบอร์ดภาพรวม (Dashboard Overview)</span>
            </h1>
            <p class="text-sm text-slate-500 mt-1">
              สรุปภาพรวมผลผลิต สต็อกสินค้าคงคลัง และแนวโน้มยอดขายด้วยแผนภูมิภาพสำหรับคณะกรรมการวิสาหกิจชุมชน
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold shadow-2xs flex items-center gap-2">
              <i class="fa-solid fa-circle-check text-emerald-600"></i>
              <span>พืชหลัก: ${activeHerbsList.join(' / ')}</span>
            </span>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- 1. แถบสรุปด่วนด้านบน (4 Summary Metric Cards)                  -->
        <!-- ============================================================== -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          <!-- Card 1: ยอดขายรวมสุทธิ -->
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">ยอดขายรวมสุทธิ</span>
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg border border-emerald-100 group-hover:scale-105 transition-transform">
                  <i class="fas fa-coins"></i>
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">
                ${formatBaht(totalRevenueVal)}
              </div>
            </div>
            <div class="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span class="text-emerald-700 font-bold flex items-center gap-1">
                <i class="fas fa-arrow-trend-up"></i> +28.5% MoM
              </span>
              <span class="text-gray-400">รายได้สะสมปี 2568</span>
            </div>
          </div>

          <!-- Card 2: ผลผลิตสดรวม -->
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">ผลผลิตสดรวม</span>
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg border border-emerald-100 group-hover:scale-105 transition-transform">
                  <i class="fas fa-seedling"></i>
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight flex items-baseline gap-1.5">
                <span>${totalFreshAll.toFixed(1)}</span>
                <span class="text-sm font-bold text-gray-500">กก.</span>
              </div>
            </div>
            <div class="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span class="text-gray-600 font-medium">${activeHerbsList.map(h => `${h} ${(produceMap[h]?.freshKg || 0).toFixed(1)}`).join(' · ')}</span>
              <span class="text-emerald-700 font-bold">14 แปลง</span>
            </div>
          </div>

          <!-- Card 3: ผลผลิตแห้งรวม -->
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">ผลผลิตแห้งรวม</span>
                <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg border border-amber-100 group-hover:scale-105 transition-transform">
                  <i class="fas fa-boxes-stacked"></i>
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight flex items-baseline gap-1.5">
                <span>${totalDryAll.toFixed(1)}</span>
                <span class="text-sm font-bold text-gray-500">กก.</span>
              </div>
            </div>
            <div class="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span class="text-gray-600 font-medium">มูลค่าประเมินผลผลิต</span>
              <span class="text-amber-800 font-bold">${formatBaht(totalDryEstValue)}</span>
            </div>
          </div>

          <!-- Card 4: มูลค่าสต็อกพร้อมขาย -->
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">มูลค่าสต็อกพร้อมขาย</span>
                <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg border border-teal-100 group-hover:scale-105 transition-transform">
                  <i class="fas fa-warehouse"></i>
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">
                ${formatBaht(totalInventoryValue)}
              </div>
            </div>
            <div class="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span class="text-gray-600 font-medium">พร้อมขาย ${totalStockCans} กระป๋อง</span>
              <span class="text-teal-800 font-bold">แห้ง ${totalDryInventoryKg.toFixed(1)} กก.</span>
            </div>
          </div>

        </div>

        <!-- ============================================================== -->
        <!-- 2. โซนกราฟแท่งเปรียบเทียบยอดขาย (Sales Comparison Bar Charts)  -->
        <!-- ฝั่งซ้าย: ยอดขายดอกแห้ง (กก.) | ฝั่งขวา: ยอดขายแบบกระปุกแยกต่างหาก -->
        <!-- ============================================================== -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <!-- ฝั่งซ้าย: กราฟแท่งยอดขายสมุนไพรอบแห้งยกกิโลกรัม (Dried Flower Bulk) -->
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h2 class="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i class="fas fa-boxes-stacked text-amber-700"></i>
                    <span>ยอดขายสมุนไพรอบแห้งยกกิโลกรัม (กก.)</span>
                  </h2>
                  <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
                    เปรียบเทียบยอดขายดอกไม้แห้ง: ${activeHerbsList.map(h => 'ดอก' + h + 'แห้ง').join(', ')} (บาท)
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    แสดงตัวเลขบนหัวแท่ง
                  </span>
                </div>
              </div>

              <!-- Dry Sales Summary Badges -->
              <div class="flex items-center gap-2 flex-wrap pt-3 text-xs">
                <span class="px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                  💰 รวมยอดขายดอกแห้ง: ฿${totalDrySalesAmt.toLocaleString()}
                </span>
                <span class="px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 font-medium">
                  ⚖️ ปริมาณรวม: ${totalDrySalesKg.toFixed(1)} กก.
                </span>
              </div>
            </div>

            <div class="relative h-72 sm:h-80 w-full mt-4">
              <canvas id="chart-dry-sales-by-herb"></canvas>
            </div>
          </div>

          <!-- ฝั่งขวา: กราฟแท่งยอดขายผลิตภัณฑ์ชาดอกไม้แบบกระปุก (Canned Herbal Tea Jars) -->
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h2 class="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i class="fas fa-jar text-emerald-700"></i>
                    <span>ยอดขายผลิตภัณฑ์ชาดอกไม้แบบกระปุก (กระปุก)</span>
                  </h2>
                  <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
                    เปรียบเทียบยอดขายกระปุก: ${activeHerbsList.map(h => 'กระปุก' + h).join(', ')} (บาท)
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    แยกอีกกราฟแท่ง
                  </span>
                </div>
              </div>

              <!-- Jar Sales Summary Badges -->
              <div class="flex items-center gap-2 flex-wrap pt-3 text-xs">
                <span class="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">
                  💰 รวมยอดขายชากระปุก: ฿${totalJarSalesAmt.toLocaleString()}
                </span>
                <span class="px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 font-medium">
                  📦 ปริมาณรวม: ${totalJarSalesCount.toLocaleString()} กระปุก
                </span>
              </div>
            </div>

            <div class="relative h-72 sm:h-80 w-full mt-4">
              <canvas id="chart-jar-sales-by-herb"></canvas>
            </div>
          </div>

        </div>

        <!-- ============================================================== -->
        <!-- 3. โซนแนวโน้มยอดขายรายเดือน & สัดส่วนประเภทสินค้า               -->
        <!-- ============================================================== -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <!-- ฝั่งซ้าย: กราฟแท่งแนวโน้มยอดขายรายเดือน (Monthly Revenue) -->
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h2 class="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i class="fas fa-chart-column text-emerald-700"></i>
                    <span>แนวโน้มยอดขายรายเดือน (Monthly Revenue)</span>
                  </h2>
                  <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
                    รายได้จากการจำหน่ายผลิตภัณฑ์สมุนไพรสะสมรายเดือน (บาท)
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    แสดงตัวเลขบนหัวแท่ง
                  </span>
                </div>
              </div>

              <!-- Revenue Summary Mini Info -->
              <div class="flex items-center justify-between pt-3 text-xs">
                <span class="text-gray-500">มกราคม - กันยายน 2568 (9 เดือน)</span>
                <span class="text-emerald-800 font-bold">เฉลี่ย ฿${Math.round(totalRevenueVal / 9).toLocaleString()}/เดือน</span>
              </div>
            </div>

            <div class="relative h-80 sm:h-96 w-full mt-4">
              <canvas id="chart-monthly-revenue"></canvas>
            </div>
          </div>

          <!-- ฝั่งขวา: พายชาร์ต: สัดส่วนยอดขายตามประเภทสินค้า -->
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div class="pb-3 border-b border-gray-100">
              <div class="flex items-center justify-between">
                <h2 class="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <i class="fas fa-chart-pie text-emerald-700"></i>
                  <span>สัดส่วนยอดขายตามประเภทสินค้า</span>
                </h2>
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  ทุกกลุ่มผลิตภัณฑ์
                </span>
              </div>
              <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
                เปรียบเทียบสัดส่วนรายได้: กระปุก 50g vs ดอกแห้งยกกิโลกรัม (กก.)
              </p>
            </div>

            <div class="relative h-80 sm:h-96 w-full mt-4 flex items-center justify-center">
              <canvas id="chart-product-category-pie"></canvas>
            </div>
          </div>

        </div>

        <!-- ============================================================== -->
        <!-- 4. รายการเคลื่อนไหวด่วนด้านล่าง (Bottom Activity Bar)           -->
        <!-- ============================================================== -->
        <div class="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
          
          <!-- Bar Header & Quick Actions -->
          <div class="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <i class="fas fa-clock-rotate-left text-emerald-700"></i>
                <span>รายการเคลื่อนไหวการขายล่าสุด (Recent Transactions)</span>
              </h2>
              <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
                4 รายการขายล่าสุด พร้อมตรวจสอบรายละเอียดและเปิดดูใบเสร็จรับเงิน
              </p>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <a href="#sales" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
                <i class="fas fa-plus"></i>
                <span>บันทึกการขายใหม่</span>
              </a>
              <a href="#crops" class="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm transition-all shadow-2xs flex items-center gap-1.5 active:scale-95">
                <i class="fas fa-seedling"></i>
                <span>บันทึกรอบเพาะปลูก</span>
              </a>
            </div>
          </div>

          <!-- Recent Transactions Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-gray-50/80 text-gray-600 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                  <th class="py-3 px-4 sm:px-5">รหัสใบเสร็จ</th>
                  <th class="py-3 px-4">วันที่</th>
                  <th class="py-3 px-4">ลูกค้า (ผู้ซื้อ)</th>
                  <th class="py-3 px-4">รายการสินค้า</th>
                  <th class="py-3 px-4 text-right">ยอดเงินสุทธิ</th>
                  <th class="py-3 px-4 text-center">การชำระเงิน</th>
                  <th class="py-3 px-4 sm:px-5 text-right">ใบเสร็จรับเงิน</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${recentSales.map(s => {
                  const invoiceId = s.invoiceNo || s.id || 'INV-2568-001';
                  const itemTitle = s.productName || (s.items && s.items[0] ? s.items[0].productName : 'ผลิตภัณฑ์สมุนไพร');
                  const itemQtyText = s.quantity ? `${s.quantity} ${s.unit || 'ชิ้น'}` : (s.items && s.items[0] ? `${s.items[0].quantity} ${s.items[0].unit || 'ชิ้น'}` : '');
                  const paymentBadge = s.payment === 'เงินสด' 
                    ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">💵 เงินสด</span>'
                    : '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">📱 โอนเงิน</span>';

                  return `
                    <tr class="hover:bg-emerald-50/30 transition-colors">
                      <td class="py-3.5 px-4 sm:px-5 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        ${invoiceId}
                      </td>
                      <td class="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                        ${formatThaiDate(s.date)}
                      </td>
                      <td class="py-3.5 px-4 font-bold text-gray-800">
                        <div>${s.customerName || 'ลูกค้าทั่วไป'}</div>
                        ${s.customerType ? `<div class="text-xs font-normal text-gray-400 mt-0.5">${s.customerType}</div>` : ''}
                      </td>
                      <td class="py-3.5 px-4 text-gray-700">
                        <span class="font-medium">${itemTitle}</span>
                        ${itemQtyText ? `<span class="text-xs text-gray-500 ml-1">(${itemQtyText})</span>` : ''}
                      </td>
                      <td class="py-3.5 px-4 text-right font-mono font-bold text-gray-900 text-sm sm:text-base whitespace-nowrap">
                        ${formatBaht(s.totalAmount || s.totalPrice || 0)}
                      </td>
                      <td class="py-3.5 px-4 text-center whitespace-nowrap">
                        ${paymentBadge}
                      </td>
                      <td class="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <button type="button" 
                          class="view-dashboard-receipt-btn px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          data-id="${invoiceId}">
                          <i class="fas fa-receipt text-emerald-600"></i>
                          <span>เปิดดูใบเสร็จ</span>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Bottom Footer Link -->
          <div class="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 px-5">
            <span>แสดง 4 รายการล่าสุดจากระบบบันทึกการขาย</span>
            <a href="#sales" class="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
              <span>ดูประวัติการขายทั้งหมด (${directSales.length} รายการ)</span>
              <i class="fas fa-arrow-right text-xs"></i>
            </a>
          </div>

        </div>

      </div>
    `;
  },

  init() {
    this.renderCharts();
    this.bindEvents();
  },

  bindEvents() {
    const receiptBtns = document.querySelectorAll('.view-dashboard-receipt-btn');
    receiptBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const saleId = e.currentTarget.getAttribute('data-id');
        if (SalesComponent && typeof SalesComponent._openReceipt === 'function') {
          SalesComponent._openReceipt(saleId);
        } else {
          window.location.hash = '#sales';
        }
      });
    });
  },

  destroyCharts() {
    if (this.charts) {
      Object.values(this.charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          try { chart.destroy(); } catch (e) {}
        }
      });
    }
    this.charts = {};
  },

  renderCharts() {
    this.destroyCharts();

    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not loaded');
      return;
    }

    Chart.defaults.font.family = "'Prompt', 'Sarabun', sans-serif";
    Chart.defaults.color = '#475569';

    const activeHerbsList = getActiveHerbs();
    const roadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
    const plots = appState.getPlots ? appState.getPlots() : [];
    const allCrops = appState.getCrops ? appState.getCrops() : [];
    const harvestedCrops = allCrops.filter(c => c.status === 'harvested');
    const dryingBatches = appState.getDryingBatches ? appState.getDryingBatches() : [];

    // Baseline definitions for product sales
    const dryHerbBaseline = {
      'เก๊กฮวย': { revenue: 38600, qty: 38.6 },
      'คาโมมายล์': { revenue: 27000, qty: 18.0 },
      'อัญชัน': { revenue: 15400, qty: 22.0 },
      'ดาวเรือง': { revenue: 8400, qty: 12.0 }
    };

    const jarHerbBaseline = {
      'เก๊กฮวย': { revenue: 48500, qty: 323 },
      'คาโมมายล์': { revenue: 35200, qty: 352 },
      'อัญชัน': { revenue: 18600, qty: 155 },
      'ดาวเรือง': { revenue: 9600, qty: 80 }
    };

    // Helper for top bar labels plugin
    const makeTopBarPlugin = (pluginId, prefix = '฿', suffix = '', color = '#065f46') => ({
      id: pluginId,
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i);
          if (!meta.hidden) {
            meta.data.forEach((bar, index) => {
              const val = dataset.data[index];
              if (val > 0) {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.font = 'bold 14px Prompt, Sarabun, sans-serif';
                ctx.fillStyle = color;
                const labelText = `${prefix}${val.toLocaleString()}${suffix}`;
                ctx.fillText(labelText, bar.x, bar.y - 4);
                ctx.restore();
              }
            });
          }
        });
      }
    });

    // ==============================================================
    // 1. Chart A: กราฟแท่งยอดขายสมุนไพรอบแห้งยกกิโลกรัม (Dried Flower Bulk)
    // ==============================================================
    const ctxDry = document.getElementById('chart-dry-sales-by-herb');
    if (ctxDry) {
      const dryLabels = activeHerbsList.map(h => `${HERB_THEMES[h]?.icon || roadmaps[h]?.icon || '🌿'} ดอก${h}แห้ง`);
      const dryData = activeHerbsList.map(h => dryHerbBaseline[h]?.revenue || 10000);
      const dryColors = activeHerbsList.map(h => {
        if (h === 'เก๊กฮวย') return 'rgba(217, 119, 6, 0.85)';
        if (h === 'คาโมมายล์') return 'rgba(5, 150, 105, 0.85)';
        if (h === 'อัญชัน') return 'rgba(126, 34, 206, 0.85)';
        return 'rgba(202, 138, 4, 0.85)';
      });
      const dryBorders = activeHerbsList.map(h => {
        if (h === 'เก๊กฮวย') return '#b45309';
        if (h === 'คาโมมายล์') return '#047857';
        if (h === 'อัญชัน') return '#6b21a8';
        return '#a16207';
      });

      this.charts.drySales = new Chart(ctxDry.getContext('2d'), {
        type: 'bar',
        data: {
          labels: dryLabels,
          datasets: [
            {
              label: 'ยอดขายดอกแห้ง (บาท)',
              data: dryData,
              backgroundColor: dryColors,
              borderColor: dryBorders,
              borderWidth: 1.5,
              borderRadius: 6,
              barPercentage: 0.55
            }
          ]
        },
        plugins: [makeTopBarPlugin('drySalesTopLabels', '฿', '', '#78350f')],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 14,
                boxHeight: 14,
                padding: 12,
                font: { size: 12, weight: 'bold' }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (ctx) => {
                  const herb = activeHerbsList[ctx.dataIndex] || '';
                  const qty = dryHerbBaseline[herb]?.qty || 0;
                  return ` ยอดขาย: ฿${ctx.raw.toLocaleString()} (ปริมาณ ${qty.toLocaleString()} กก.)`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grace: '18%',
              grid: { color: '#f1f5f9' },
              ticks: {
                font: { size: 12 },
                callback: (val) => `${val.toLocaleString()} บ.`
              }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 14, weight: 'bold' } }
            }
          }
        }
      });
    }

    // ==============================================================
    // 2. Chart B: กราฟแท่งยอดขายชาดอกไม้แบบกระปุก (Canned Herbal Tea Jars)
    // ==============================================================
    const ctxJar = document.getElementById('chart-jar-sales-by-herb');
    if (ctxJar) {
      const jarLabels = activeHerbsList.map(h => `${HERB_THEMES[h]?.icon || roadmaps[h]?.icon || '🌿'} กระปุก${h}`);
      const jarData = activeHerbsList.map(h => jarHerbBaseline[h]?.revenue || 12000);
      const jarColors = activeHerbsList.map(h => {
        if (h === 'เก๊กฮวย') return 'rgba(245, 158, 11, 0.85)';
        if (h === 'คาโมมายล์') return 'rgba(16, 185, 129, 0.85)';
        if (h === 'อัญชัน') return 'rgba(168, 85, 247, 0.85)';
        return 'rgba(234, 179, 8, 0.85)';
      });
      const jarBorders = activeHerbsList.map(h => {
        if (h === 'เก๊กฮวย') return '#d97706';
        if (h === 'คาโมมายล์') return '#059669';
        if (h === 'อัญชัน') return '#9333ea';
        return '#ca8a04';
      });

      this.charts.jarSales = new Chart(ctxJar.getContext('2d'), {
        type: 'bar',
        data: {
          labels: jarLabels,
          datasets: [
            {
              label: 'ยอดขายชากระปุก (บาท)',
              data: jarData,
              backgroundColor: jarColors,
              borderColor: jarBorders,
              borderWidth: 1.5,
              borderRadius: 6,
              barPercentage: 0.55
            }
          ]
        },
        plugins: [makeTopBarPlugin('jarSalesTopLabels', '฿', '', '#065f46')],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 14,
                boxHeight: 14,
                padding: 12,
                font: { size: 12, weight: 'bold' }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (ctx) => {
                  const herb = activeHerbsList[ctx.dataIndex] || '';
                  const qty = jarHerbBaseline[herb]?.qty || 0;
                  return ` ยอดขาย: ฿${ctx.raw.toLocaleString()} (จำนวน ${qty.toLocaleString()} กระปุก)`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grace: '18%',
              grid: { color: '#f1f5f9' },
              ticks: {
                font: { size: 12 },
                callback: (val) => `${val.toLocaleString()} บ.`
              }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 14, weight: 'bold' } }
            }
          }
        }
      });
    }

    // ==============================================================
    // 3. Chart 3: กราฟแท่งแนวโน้มยอดขายรายเดือน (Monthly Revenue)
    // ==============================================================
    const ctx2 = document.getElementById('chart-monthly-revenue');
    if (ctx2) {
      const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];
      const revenueData = [9200, 11800, 14500, 16800, 19500, 23500, 27500, 32000, 28500];

      this.charts.monthlyRevenue = new Chart(ctx2.getContext('2d'), {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [
            {
              label: 'รายได้จากการขาย (บาท)',
              data: revenueData,
              backgroundColor: 'rgba(16, 185, 129, 0.85)',
              hoverBackgroundColor: 'rgba(5, 150, 105, 0.95)',
              borderColor: '#047857',
              borderWidth: 1.5,
              borderRadius: 6,
              barPercentage: 0.65
            }
          ]
        },
        plugins: [makeTopBarPlugin('monthlyRevenueTopLabels', '฿', '', '#065f46')],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 14,
                boxHeight: 14,
                padding: 12,
                font: { size: 12, weight: 'bold' }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (ctx) => ` ยอดขาย: ${ctx.raw.toLocaleString()} บาท`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grace: '15%',
              grid: { color: '#f1f5f9' },
              ticks: {
                font: { size: 12 },
                callback: (val) => `${val.toLocaleString()} บ.`
              }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 12, weight: 'bold' } }
            }
          }
        }
      });
    }

    // ==============================================================
    // 4. Chart 4: พายชาร์ต: สัดส่วนยอดขายตามประเภทสินค้า (เชื่อมโยงตาม activeHerbsList แบบไดนามิก)
    // ==============================================================
    const ctx3 = document.getElementById('chart-product-category-pie');
    if (ctx3) {
      const catLabels = [];
      const catRevenue = [];
      const catColors = [];

      const colorPalette = {
        'เก๊กฮวย': { jar: '#f59e0b', dry: '#d97706' },
        'คาโมมายล์': { jar: '#10b981', dry: '#065f46' },
        'อัญชัน': { jar: '#a855f7', dry: '#7e22ce' },
        'ดาวเรือง': { jar: '#eab308', dry: '#ca8a04' }
      };

      const fallbackPalettes = [
        { jar: '#0ea5e9', dry: '#0284c7' },
        { jar: '#8b5cf6', dry: '#6d28d9' },
        { jar: '#ec4899', dry: '#be185d' },
        { jar: '#14b8a6', dry: '#0f766e' }
      ];

      // 1. เพิ่มกลุ่มกระปุก (50g) เฉพาะพืชสมุนไพรที่ยังเปิดใช้งานในระบบ
      activeHerbsList.forEach((h, idx) => {
        const pal = colorPalette[h] || fallbackPalettes[idx % fallbackPalettes.length];
        const rev = jarHerbBaseline[h]?.revenue || 12000;
        catLabels.push(`กระปุก${h} (50g)`);
        catRevenue.push(rev);
        catColors.push(pal.jar);
      });

      // 2. เพิ่มกลุ่มดอกแห้ง (กก.) เฉพาะพืชสมุนไพรที่ยังเปิดใช้งานในระบบ
      activeHerbsList.forEach((h, idx) => {
        const pal = colorPalette[h] || fallbackPalettes[idx % fallbackPalettes.length];
        const rev = dryHerbBaseline[h]?.revenue || 10000;
        catLabels.push(`ดอก${h}แห้ง (กก.)`);
        catRevenue.push(rev);
        catColors.push(pal.dry);
      });

      this.charts.productCategoryPie = new Chart(ctx3.getContext('2d'), {
        type: 'pie',
        data: {
          labels: catLabels,
          datasets: [
            {
              data: catRevenue,
              backgroundColor: catColors,
              borderColor: '#ffffff',
              borderWidth: 2,
              hoverOffset: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 20,
                boxHeight: 20,
                padding: 18,
                color: '#0f172a',
                font: { size: 16, weight: 'bold', family: "'Prompt', 'Sarabun', sans-serif" },
                generateLabels: (chart) => {
                  const data = chart.data;
                  const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                  return data.labels.map((label, i) => {
                    const val = data.datasets[0].data[i];
                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                    return {
                      text: `${label} (${pct}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: '#ffffff',
                      lineWidth: 2,
                      fontColor: '#0f172a',
                      index: i
                    };
                  });
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { size: 15, weight: 'bold' },
              bodyFont: { size: 14 },
              padding: 14,
              cornerRadius: 10,
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                  return ` ยอดขาย: ฿${ctx.raw.toLocaleString()} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  }
};
