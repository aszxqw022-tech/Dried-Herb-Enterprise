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

const dashFilter = { year: String(new Date().getFullYear()), month: 'all' };

function getDirectSales(activeHerbs = null) {
  let sales = [];
  try {
    let raw = JSON.parse(localStorage.getItem(DIRECT_SALES_KEY));
    if (Array.isArray(raw)) {
      sales = raw;
    }
  } catch (e) {
    sales = [];
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

  sales = sales.filter(s => {
    const d = String(s.date || s.saleDate || '');
    if (dashFilter.year !== 'all' && d.slice(0, 4) !== dashFilter.year) return false;
    if (dashFilter.month !== 'all' && d.slice(5, 7) !== dashFilter.month) return false;
    return true;
  });
  return sales;
}

function getAllSaleYears() {
  const ys = new Set([String(new Date().getFullYear())]);
  try {
    const raw = JSON.parse(localStorage.getItem(DIRECT_SALES_KEY));
    if (Array.isArray(raw)) raw.forEach(s => { const y = String(s.date || s.saleDate || '').slice(0, 4); if (/^\d{4}$/.test(y)) ys.add(y); });
  } catch (e) {}
  return Array.from(ys).sort().reverse();
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

function parseSalesBreakdown(sales, activeHerbsList) {
  const herbDryMap = {};
  const herbJarMap = {};
  const monthlyRevenueMap = {};
  const productCatMap = {};
  const monthlyCatMap = {};
  const monthlyHerbMap = {};

  activeHerbsList.forEach(h => {
    herbDryMap[h] = { revenue: 0, qty: 0 };
    herbJarMap[h] = { revenue: 0, qty: 0 };
  });

  let totalRevenue = 0;
  let totalDrySalesAmt = 0;
  let totalDrySalesKg = 0;
  let totalJarSalesAmt = 0;
  let totalJarSalesCount = 0;

  sales.forEach(sale => {
    const saleDate = sale.date || sale.saleDate || '';
    const items = (sale.items && Array.isArray(sale.items) && sale.items.length > 0)
      ? sale.items
      : [{
          productName: sale.productName || 'สินค้า',
          unit: sale.unit || 'หน่วย',
          quantity: parseFloat(sale.quantity) || 1,
          totalPrice: parseFloat(sale.totalPrice || sale.totalAmount) || 0
        }];

    let saleTotal = 0;
    const saleCats = {};
    const saleHerbs = {};

    items.forEach(it => {
      const pName = (it.productName || '').trim();
      const unit = (it.unit || '').trim();
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.totalPrice) || ((parseFloat(it.unitPrice) || 0) * qty);

      saleTotal += price;
      {
        const hh = activeHerbsList.find(h => pName.includes(h)) || activeHerbsList[0] || 'สมุนไพร';
        saleHerbs[hh] = saleHerbs[hh] || { amt: 0, qty: 0 };
        saleHerbs[hh].amt += price; saleHerbs[hh].qty += qty;
      }

      // Identify herb
      const matchedHerb = activeHerbsList.find(h => pName.includes(h)) || activeHerbsList[0] || 'สมุนไพร';
      const isJar = unit === 'กระป๋อง' || unit === 'กระปุก' || pName.includes('กระปุก') || pName.includes('กระป๋อง');
      const isDry = unit === 'กก.' || unit === 'kg' || pName.includes('แห้ง');

      if (!herbDryMap[matchedHerb]) herbDryMap[matchedHerb] = { revenue: 0, qty: 0 };
      if (!herbJarMap[matchedHerb]) herbJarMap[matchedHerb] = { revenue: 0, qty: 0 };

      if (isJar) {
        herbJarMap[matchedHerb].revenue += price;
        herbJarMap[matchedHerb].qty += qty;
        totalJarSalesAmt += price;
        totalJarSalesCount += qty;

        const catKey = `กระป๋อง${matchedHerb} (50g)`;
        productCatMap[catKey] = (productCatMap[catKey] || 0) + price;
        saleCats[pName || catKey] = (saleCats[pName || catKey] || 0) + price;
      } else {
        // Bulk dry or standard dry
        herbDryMap[matchedHerb].revenue += price;
        herbDryMap[matchedHerb].qty += qty;
        totalDrySalesAmt += price;
        totalDrySalesKg += qty;

        const catKey = `ดอก${matchedHerb}แห้ง (กก.)`;
        productCatMap[catKey] = (productCatMap[catKey] || 0) + price;
        saleCats[pName || catKey] = (saleCats[pName || catKey] || 0) + price;
      }
    });

    totalRevenue += saleTotal;

    // Monthly breakdown
    if (saleDate) {
      const parts = saleDate.split('-');
      if (parts.length >= 2) {
        const mKey = `${parts[0]}-${parts[1]}`;
        monthlyRevenueMap[mKey] = (monthlyRevenueMap[mKey] || 0) + saleTotal;
        monthlyHerbMap[mKey] = monthlyHerbMap[mKey] || {};
        Object.keys(saleHerbs).forEach(h => {
          const t = monthlyHerbMap[mKey][h] = monthlyHerbMap[mKey][h] || { amt: 0, qty: 0 };
          t.amt += saleHerbs[h].amt; t.qty += saleHerbs[h].qty;
        });
        monthlyCatMap[mKey] = monthlyCatMap[mKey] || {};
        Object.keys(saleCats).forEach(k => { monthlyCatMap[mKey][k] = (monthlyCatMap[mKey][k] || 0) + saleCats[k]; });
      }
    }
  });

  return {
    herbDryMap,
    herbJarMap,
    monthlyRevenueMap,
    monthlyCatMap,
    monthlyHerbMap,
    productCatMap,
    totalRevenue,
    totalDrySalesAmt,
    totalDrySalesKg,
    totalJarSalesAmt,
    totalJarSalesCount
  };
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

    // 4. Sales Calculations (Direct from Sales Records)
    const directSales = getDirectSales(activeHerbsList);
    const salesSummary = parseSalesBreakdown(directSales, activeHerbsList);

    const totalDrySalesAmt = salesSummary.totalDrySalesAmt;
    const totalDrySalesKg = salesSummary.totalDrySalesKg;
    const totalJarSalesAmt = salesSummary.totalJarSalesAmt;
    const totalJarSalesCount = salesSummary.totalJarSalesCount;
    const totalRevenueVal = salesSummary.totalRevenue;

    // การ์ดดอกแห้งแยกตามสมุนไพร + ต้นทุนรับซื้อดอกสด
    const dryCardsData = activeHerbsList.map(h => {
      const kg = allProducts.filter(pr => pr.unit === 'กก.' && (pr.name || '').includes(h)).reduce((t, pr) => t + (parseFloat(pr.stock) || 0), 0);
      const th = HERB_THEMES[h] || {};
      const palette = { 'เก๊กฮวย': ['#fff7ed', '#fed7aa'], 'คาโมมายล์': ['#fefce8', '#fde68a'] }[h] || ['#ecfdf5', '#a7f3d0'];
      return { herb: h, kg, icon: th.icon || '🌿', bg: palette[0], border: palette[1] };
    });
    let totalCostVal = 0;
    try {
      const rawPur = JSON.parse(localStorage.getItem('herb_enterprise_fresh_purchases') || '[]');
      (Array.isArray(rawPur) ? rawPur : []).forEach(pu => {
        const d = String(pu.date || '');
        if (dashFilter.year !== 'all' && d.slice(0, 4) !== dashFilter.year) return;
        if (dashFilter.month !== 'all' && d.slice(5, 7) !== dashFilter.month) return;
        totalCostVal += parseFloat(pu.amount) || ((parseFloat(pu.kg) || 0) * (parseFloat(pu.price) || 0));
      });
    } catch (e) {}
    const netVal = totalRevenueVal - totalCostVal;

    // Recent 4 Sales Transactions
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
        </div>


        <!-- ตัวกรอง -->
        <div class="bg-white rounded-2xl border border-gray-200/90 px-4 py-3 shadow-xs flex flex-wrap items-center gap-3">
          <i class="fas fa-filter text-emerald-700"></i>
          <select id="dash-filter-year" class="px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold bg-white">
            <option value="all" ${dashFilter.year === 'all' ? 'selected' : ''}>ทุกปี</option>
            ${getAllSaleYears().map(y => `<option value="${y}" ${dashFilter.year === y ? 'selected' : ''}>ปี ${parseInt(y) + 543}</option>`).join('')}
          </select>
          <select id="dash-filter-month" class="px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold bg-white">
            <option value="all" ${dashFilter.month === 'all' ? 'selected' : ''}>ทุกเดือน</option>
            ${['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].map((m, i) => { const v = String(i + 1).padStart(2, '0'); return `<option value="${v}" ${dashFilter.month === v ? 'selected' : ''}>${m}</option>`; }).join('')}
          </select>
          <button id="dash-filter-all" class="px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">ดูทั้งหมด</button>
        </div>

        <!-- ============================================================== -->
        <!-- 1. แถบสรุปด่วนด้านบน (4 Summary Metric Cards)                  -->
        <!-- ============================================================== -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          ${dryCardsData.map(c => `
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-bold text-gray-700">ดอก${c.herb}แห้ง</span>
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg border" style="background:${c.bg};border-color:${c.border}">${c.icon}</div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight flex items-baseline gap-1.5">
              <span>${c.kg.toFixed(1)}</span><span class="text-sm font-bold text-gray-500">กิโลกรัม</span>
            </div>
          </div>`).join('')}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-bold text-gray-700">ต้นทุน (รับซื้อดอกสดจากสมาชิก)</span>
              <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center text-lg border border-orange-100"><i class="fas fa-basket-shopping"></i></div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">${formatBaht(totalCostVal)}</div>
          </div>
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-bold text-gray-700">รายได้ที่ขายได้</span>
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg border border-emerald-100"><i class="fas fa-coins"></i></div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">${formatBaht(totalRevenueVal)}</div>
          </div>
          <div class="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-bold text-gray-700">รายได้สุทธิ</span>
              <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg border border-teal-100"><i class="fas fa-sack-dollar"></i></div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${netVal < 0 ? 'text-red-600' : 'text-emerald-700'}">${formatBaht(netVal)}</div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <i class="fas fa-chart-line text-emerald-700"></i>
                <span>แนวโน้มการขายแยกตามหมวดหมู่พืช</span>
              </h2>
              <p class="text-xs sm:text-sm text-gray-500 mt-0.5">รวมทุกสินค้าที่ขายออก (ดอกแห้ง กระป๋อง ซอง)</p>
            </div>
          </div>
          <div class="relative h-80 sm:h-96 w-full mt-4">
            <canvas id="chart-herb-lines"></canvas>
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
                    <span>สัดส่วนยอดขายแยกตามเดือน (100% Stacked)</span>
                  </h2>
                  <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
                    สัดส่วนยอดขายของแต่ละประเภทสินค้าในแต่ละเดือน (ชี้เมาส์ดูรายละเอียด)
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
                <span class="text-gray-500">ข้อมูลรายรับจากการขายจริงตามช่วงเวลา</span>
                <span class="text-emerald-800 font-bold">ยอดขายสุทธิ ฿${totalRevenueVal.toLocaleString()}</span>
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
                เปรียบเทียบสัดส่วนรายได้: กระป๋อง 50g vs ดอกแห้งยกกิโลกรัม (กก.)
              </p>
            </div>

            <div class="relative h-80 sm:h-96 w-full mt-4 flex items-center justify-center">
              <canvas id="chart-product-category-pie"></canvas>
            </div>
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
    const rerender = () => {
      const main = document.getElementById('app-view');
      if (main) { main.innerHTML = this.render(); this.init(); }
    };
    const ySel = document.getElementById('dash-filter-year');
    const mSel = document.getElementById('dash-filter-month');
    if (ySel) ySel.addEventListener('change', () => { dashFilter.year = ySel.value; rerender(); });
    if (mSel) mSel.addEventListener('change', () => { dashFilter.month = mSel.value; rerender(); });
    const allBtn = document.getElementById('dash-filter-all');
    if (allBtn) allBtn.addEventListener('click', () => { dashFilter.year = 'all'; dashFilter.month = 'all'; rerender(); });
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

    // Retrieve real sales data from Sales Screen (herb_enterprise_direct_sales_v1)
    const directSales = getDirectSales(activeHerbsList);
    const salesSummary = parseSalesBreakdown(directSales, activeHerbsList);

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
      const dryData = activeHerbsList.map(h => salesSummary.herbDryMap[h]?.revenue || 0);
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
                  const qty = salesSummary.herbDryMap[herb]?.qty || 0;
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
    // 2. Chart B: กราฟแท่งยอดขายชาดอกไม้แบบกระป๋อง (Canned Herbal Tea Cans)
    // ==============================================================
    const ctxJar = document.getElementById('chart-jar-sales-by-herb');
    if (ctxJar) {
      const jarLabels = activeHerbsList.map(h => `${HERB_THEMES[h]?.icon || roadmaps[h]?.icon || '🌿'} กระป๋อง${h}`);
      const jarData = activeHerbsList.map(h => salesSummary.herbJarMap[h]?.revenue || 0);
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
              label: 'ยอดขายชากระป๋อง (บาท)',
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
                  const qty = salesSummary.herbJarMap[herb]?.qty || 0;
                  return ` ยอดขาย: ฿${ctx.raw.toLocaleString()} (จำนวน ${qty.toLocaleString()} กระป๋อง)`;
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
      const THAI_MONTH_NAMES = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const monthlyKeys = Object.keys(salesSummary.monthlyRevenueMap).sort();
      let monthLabels = [];
      let revenueData = [];

      if (monthlyKeys.length > 0) {
        monthLabels = monthlyKeys.map(k => {
          const parts = k.split('-');
          const mNum = parseInt(parts[1]) || 1;
          const yNum = parseInt(parts[0]) || 2026;
          const thYearShort = String(yNum + 543).slice(-2);
          return `${THAI_MONTH_NAMES[mNum]} '${thYearShort}`;
        });
        revenueData = monthlyKeys.map(k => salesSummary.monthlyRevenueMap[k]);
      } else {
        // Fallback placeholder with 0 amounts
        const currentMonthIdx = new Date().getMonth() + 1;
        const currentThYearShort = String(new Date().getFullYear() + 543).slice(-2);
        monthLabels = [
          `${THAI_MONTH_NAMES[Math.max(1, currentMonthIdx - 2)]} '${currentThYearShort}`,
          `${THAI_MONTH_NAMES[Math.max(1, currentMonthIdx - 1)]} '${currentThYearShort}`,
          `${THAI_MONTH_NAMES[currentMonthIdx]} '${currentThYearShort}'`
        ];
        revenueData = [0, 0, 0];
      }

      let monthKeysUse = [];
      if (dashFilter.month !== 'all') {
        const yy = dashFilter.year !== 'all' ? dashFilter.year : (monthlyKeys.length ? monthlyKeys[monthlyKeys.length - 1].slice(0, 4) : String(new Date().getFullYear()));
        monthKeysUse = [`${yy}-${dashFilter.month}`];
      } else if (dashFilter.year !== 'all') {
        for (let m = 1; m <= 12; m++) monthKeysUse.push(`${dashFilter.year}-${String(m).padStart(2, '0')}`);
      } else {
        const last = monthlyKeys.length ? monthlyKeys[monthlyKeys.length - 1] : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const first = monthlyKeys.length ? monthlyKeys[0] : last;
        let [ly, lm] = last.split('-').map(Number);
        const [fy, fm] = first.split('-').map(Number);
        let count = Math.max(12, (ly - fy) * 12 + (lm - fm) + 1);
        let y = ly, m = lm;
        for (let i = 0; i < count; i++) { monthKeysUse.unshift(`${y}-${String(m).padStart(2, '0')}`); m--; if (m === 0) { m = 12; y--; } }
      }
      this._monthKeysUse = monthKeysUse;
      monthLabels = monthKeysUse.map(k => { const [yy, mm] = k.split('-'); return `${THAI_MONTH_NAMES[parseInt(mm)]} '${String(parseInt(yy) + 543).slice(-2)}`; });
      const catTotals = {};
      monthKeysUse.forEach(k => Object.entries(salesSummary.monthlyCatMap[k] || {}).forEach(([c, v]) => { catTotals[c] = (catTotals[c] || 0) + v; }));
      const catNames = Object.keys(catTotals).filter(c => catTotals[c] > 0).sort((x, y) => catTotals[y] - catTotals[x]);
      const PALETTE = ['#166534', '#e6b422', '#b08d6a', '#0ea5e9', '#e11d48', '#8b5cf6', '#f97316', '#14b8a6', '#84cc16', '#ec4899', '#64748b', '#a16207'];
      const catColor = (name, idx) => PALETTE[idx % PALETTE.length];
      const datasets = catNames.map((name, idx) => ({
        label: name,
        data: monthKeysUse.map(k => {
          const tot = salesSummary.monthlyRevenueMap[k] || 0;
          const v = (salesSummary.monthlyCatMap[k] || {})[name] || 0;
          return tot > 0 ? (v / tot) * 100 : 0;
        }),
        rawAmounts: monthKeysUse.map(k => (salesSummary.monthlyCatMap[k] || {})[name] || 0),
        backgroundColor: catColor(name, idx),
        borderColor: '#ffffff',
        borderWidth: 1.5,
        borderRadius: 4,
        barPercentage: 0.6
      }));
      const monthTotals = monthKeysUse.map(k => salesSummary.monthlyRevenueMap[k] || 0);
      const totalLabelPlugin = {
        id: 'monthTotalLabels',
        afterDatasetsDraw(chart) {
          const { ctx, chartArea } = chart;
          const meta = chart.getDatasetMeta(chart.data.datasets.length - 1);
          if (!meta) return;
          ctx.save();
          ctx.font = "bold 12px 'Prompt', 'Sarabun', sans-serif";
          ctx.fillStyle = '#065f46';
          ctx.textAlign = 'center';
          meta.data.forEach((bar, i) => {
            ctx.fillText('฿' + monthTotals[i].toLocaleString(), bar.x, chartArea.top - 6);
          });
          ctx.restore();
        }
      };

      this.charts.monthlyRevenue = new Chart(ctx2.getContext('2d'), {
        type: 'bar',
        data: { labels: monthLabels, datasets },
        plugins: [totalLabelPlugin],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 24 } },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 14, boxHeight: 14, padding: 12, font: { size: 12, weight: 'bold' } }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (c) => {
                  const amt = c.dataset.rawAmounts[c.dataIndex] || 0;
                  return ` ${c.dataset.label}: ฿${amt.toLocaleString()} (${c.parsed.y.toFixed(1)}%)`;
                },
                footer: (items) => items.length ? `ยอดรวมเดือนนี้: ฿${(monthTotals[items[0].dataIndex] || 0).toLocaleString()}` : ''
              }
            }
          },
          scales: {
            y: {
              stacked: true, min: 0, max: 100,
              grid: { color: '#f1f5f9' },
              ticks: { font: { size: 12 }, stepSize: 20, callback: (v) => `${v}%` }
            },
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 14, weight: 'bold' } } }
          }
        }
      });
    }

    // 3.5 กราฟเส้นแยกตามหมวดหมู่พืช
    const ctxLine = document.getElementById('chart-herb-lines');
    if (ctxLine) {
      const keys = this._monthKeysUse || [];
      const TM = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const labels = keys.map(k => { const [yy, mm] = k.split('-'); return `${TM[parseInt(mm)]} '${String(parseInt(yy) + 543).slice(-2)}`; });
      const lineColors = { 'เก๊กฮวย': '#f97316', 'คาโมมายล์': '#e6b422' };
      const extra = ['#166534', '#0ea5e9', '#8b5cf6', '#e11d48', '#14b8a6'];
      let ex = 0;
      const herbs = activeHerbsList.filter(h => keys.some(k => ((salesSummary.monthlyHerbMap[k] || {})[h] || { amt: 0 }).amt > 0));
      const build = (mode) => herbs.map(h => {
        const col = lineColors[h] || extra[ex++ % extra.length];
        return {
          label: h,
          data: keys.map(k => ((salesSummary.monthlyHerbMap[k] || {})[h] || { amt: 0, qty: 0 })[mode]),
          borderColor: col, backgroundColor: col, borderWidth: 3, tension: 0.3, pointRadius: 4, pointHoverRadius: 6
        };
      });
      let mode = 'amt';
      const chart = new Chart(ctxLine.getContext('2d'), {
        type: 'line',
        data: { labels, datasets: build('amt') },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 12, weight: 'bold' } } },
            tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.y.toLocaleString()} ${mode === 'amt' ? 'บาท' : 'ชิ้น'}` } }
          },
          scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
        }
      });
      this.charts.herbLines = chart;
    }

    // ==============================================================
    // 4. Chart 4: พายชาร์ต: สัดส่วนยอดขายตามประเภทสินค้า (เชื่อมโยงตาม activeHerbsList แบบไดนามิก)
    // ==============================================================
    const ctx3 = document.getElementById('chart-product-category-pie');
    if (ctx3) {
      let catLabels = [];
      let catRevenue = [];
      let catColors = [];

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

      // 1. เพิ่มกลุ่มกระป๋อง (50g) เฉพาะพืชสมุนไพรที่ยังเปิดใช้งานในระบบ
      activeHerbsList.forEach((h, idx) => {
        const pal = colorPalette[h] || fallbackPalettes[idx % fallbackPalettes.length];
        const rev = salesSummary.herbJarMap[h]?.revenue || 0;
        catLabels.push(`กระป๋อง${h} (50g)`);
        catRevenue.push(rev);
        catColors.push(pal.jar);
      });

      // 2. เพิ่มกลุ่มดอกแห้ง (กก.) เฉพาะพืชสมุนไพรที่ยังเปิดใช้งานในระบบ
      activeHerbsList.forEach((h, idx) => {
        const pal = colorPalette[h] || fallbackPalettes[idx % fallbackPalettes.length];
        const rev = salesSummary.herbDryMap[h]?.revenue || 0;
        catLabels.push(`ดอก${h}แห้ง (กก.)`);
        catRevenue.push(rev);
        catColors.push(pal.dry);
      });

      // ไม่แสดงสินค้าที่ยอดขายเป็น 0
      {
        const keep = catRevenue.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0);
        catLabels = keep.map(i => catLabels[i]);
        catColors = keep.map(i => catColors[i]);
        catRevenue = keep.map(i => catRevenue[i]);
      }
      // If all revenue is 0, show friendly zero distribution
      const totalPieRev = catRevenue.reduce((a, b) => a + b, 0);
      if (totalPieRev === 0) {
        catLabels = ['ยังไม่มีข้อมูลการขาย'];
        catRevenue = [1];
        catColors = ['#cbd5e1'];
      }

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
                  if (data.labels[0] === 'ยังไม่มีข้อมูลการขาย') {
                    return [{
                      text: 'ยังไม่มีข้อมูลการขาย',
                      fillStyle: '#cbd5e1',
                      strokeStyle: '#ffffff',
                      lineWidth: 2,
                      fontColor: '#94a3b8',
                      index: 0
                    }];
                  }
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
                  if (ctx.label === 'ยังไม่มีข้อมูลการขาย') {
                    return ' ยังไม่มีประวัติการขายในระบบ';
                  }
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
