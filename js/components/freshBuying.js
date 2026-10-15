// Fresh Flower Buying Management Component (จัดการรับซื้อดอกสดจากสมาชิก - ต้นน้ำการผลิต)
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal, getHerbDefaultIcon } from '../helpers.js';

export const FreshBuyingComponent = {
  searchQuery: '',
  herbFilter: 'all',
  yearFilter: String(new Date().getFullYear() + 543),
  monthFilter: String(new Date().getMonth() + 1).padStart(2, '0'),
  cycleFilter: '2',

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    const roadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
    const masterHerbs = appState.getHerbsCatalog ? appState.getHerbsCatalog() : [];
    const herbList = Object.keys(roadmaps).length > 0 ? Object.keys(roadmaps) : ['เก๊กฮวย', 'คาโมมายล์'];

    const allCrops = appState.getCrops ? appState.getCrops() : [];
    const allPlots = appState.getPlots ? appState.getPlots() : [];
    const allMembers = appState.getMembers ? appState.getMembers() : [];
    const allHarvestedCrops = allCrops.filter(c => c.status === 'harvested');

    // Helper: Resolve herb name for crop
    const getCropHerb = (crop) => {
      const plot = allPlots.find(p => p.id === crop.plotId);
      const raw = crop.seedlingSource || (plot ? plot.plantType : '') || 'เก๊กฮวย';
      for (const h of herbList) {
        if (raw.includes(h)) return h;
      }
      if (raw.includes('เก๊กฮวย')) return 'เก๊กฮวย';
      if (raw.includes('คาโมมายล์')) return 'คาโมมายล์';
      return raw.trim() || 'เก๊กฮวย';
    };

    // Calculate per-herb buying prices and totals
    const herbPricingData = {};
    let grandTotalFreshKg = 0;
    let grandTotalPayout = 0;
    const contributingPlotsSet = new Set();
    const contributingMembersSet = new Set();

    herbList.forEach(herb => {
      const isCham = herb.includes('คาโมมายล์');
      const mHerb = masterHerbs.find(h => h.name === herb);
      const freshPrice = mHerb ? (parseFloat(mHerb.freshBuyingPrice || mHerb.baselinePriceFresh) || (isCham ? 70 : 50)) : (isCham ? 70 : 50);

      const matchingCrops = allHarvestedCrops.filter(c => getCropHerb(c) === herb);
      const totalFreshKg = matchingCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
      const totalPayout = totalFreshKg * freshPrice;

      matchingCrops.forEach(c => {
        if (c.plotId) contributingPlotsSet.add(c.plotId);
        const plot = allPlots.find(p => p.id === c.plotId);
        if (plot && plot.memberIds) {
          plot.memberIds.forEach(mId => contributingMembersSet.add(mId));
        }
      });

      grandTotalFreshKg += totalFreshKg;
      grandTotalPayout += totalPayout;

      herbPricingData[herb] = {
        name: herb,
        mHerb,
        price: freshPrice,
        totalFreshKg,
        totalPayout,
        cropCount: matchingCrops.length,
        icon: (mHerb && mHerb.icon) || roadmaps[herb]?.icon || getHerbDefaultIcon(herb)
      };
    });

    // 1. KPI Cards HTML
    const kpiCardsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- KPI 1: ยอดเงินจ่ายซื้อสดสะสม -->
        <div class="p-5 bg-white border border-amber-200 shadow-sm rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
          <div class="space-y-1">
            <span class="text-xs font-bold text-amber-800 uppercase tracking-wide block">ยอดเงินรับซื้อดอกสดสะสม</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-extrabold text-amber-950 font-mono">฿${formatBaht(grandTotalPayout)}</span>
            </div>
            <span class="text-xs text-amber-700 block font-medium">จ่ายจริงตรงถึงมือสมาชิก</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            <i class="fa-solid fa-hand-holding-dollar"></i>
          </div>
        </div>

        <!-- KPI 2: ปริมาณดอกสดรับซื้อสะสม -->
        <div class="p-5 bg-white border border-emerald-200 shadow-sm rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
          <div class="space-y-1">
            <span class="text-xs font-bold text-emerald-800 uppercase tracking-wide block">ปริมาณดอกสดรับซื้อสะสม</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-extrabold text-emerald-950 font-mono">${grandTotalFreshKg.toFixed(1)}</span>
              <span class="text-sm font-bold text-emerald-700">กก.</span>
            </div>
            <span class="text-xs text-emerald-700 block font-medium">ส่งเข้ากระบวนการอบแห้ง</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            <i class="fas fa-weight-hanging"></i>
          </div>
        </div>
      </div>
    `;

    // 2. Herb Buying Price Cards Grid
    const herbCardsHtml = herbList.map(herb => {
      const data = herbPricingData[herb];
      return `
        <div class="bg-white rounded-xl border border-amber-200 shadow-sm px-4 py-3 flex flex-col gap-3 w-full sm:w-80">
          <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
                ${data.icon}
              </span>
              <div class="min-w-0">
                <h3 class="text-sm font-bold text-gray-900 truncate">ดอก${herb}สด</h3>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-2xl font-black text-amber-950 font-mono leading-tight">${data.price.toLocaleString()}</span>
                  <span class="text-xs font-bold text-amber-800">บาท / กิโลกรัม</span>
                </div>
              </div>
            </div>

            <button class="edit-fresh-buying-btn py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              data-herb="${herb}" title="กำหนดราคารับซื้อสดของ ${herb}">
              <i class="fas fa-edit"></i>
              <span>กำหนดราคา</span>
            </button>
          </div>

          <button class="buy-fresh-btn w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            data-herb="${herb}" title="รับซื้อดอก${herb}สดจากสมาชิก">
            <i class="fas fa-hand-holding-dollar"></i>
            <span>รับซื้อ</span>
          </button>
        </div>
      `;
    }).join('');

    // 3. Intake Records Table (ประวัติการรับซื้อดอกสดจากสมาชิก)
    // ปี (พ.ศ.) และรอบของรอบเพาะปลูก — ใช้ฟิลด์ cropYear/cropCycle หรืออ่านจากรหัสรอบ เช่น 2569/P003-R1
    const getCropYear = (c) => String(c.cropYear || (String(c.id || '').split('/')[0].match(/^\d{4}$/) || [''])[0] || '');
    const getCropCycle = (c) => String(c.cropCycle || ((String(c.id || '').match(/-R(\d+)/) || [])[1]) || '');
    const yearOptions = [...new Set([String(new Date().getFullYear() + 543), ...allCrops.map(getCropYear).filter(Boolean)])].sort((a, b) => b - a);
    const cycleOptions = [...new Set(['1', '2', ...allCrops.map(getCropCycle).filter(Boolean)])].sort((a, b) => a - b); // มีรอบ 1 และ 2 เสมอ

    // รายการรับซื้อ = ข้อมูลรับซื้อที่บันทึกไว้ เชื่อมกับรอบเพาะปลูก (แปลง/สมาชิก/รหัสรอบ)
    const purchasedRecords = this.getPurchases().map(pu => {
      const crop = allCrops.find(c => c.id === pu.cropId);
      if (!crop) return null;
      return { ...crop, yield: pu.kg, purchasePrice: pu.price, harvestDate: pu.date, _purchaseId: pu.id };
    }).filter(Boolean).reverse();

    let filteredHarvests = purchasedRecords.filter(c => {
      const h = getCropHerb(c);
      if (this.herbFilter !== 'all' && h !== this.herbFilter) return false;
      if (this.yearFilter !== 'all' && getCropYear(c) !== this.yearFilter) return false;
      if (this.monthFilter !== 'all' && String(c.harvestDate || '').slice(5, 7) !== this.monthFilter) return false;
      if (this.cycleFilter !== 'all' && getCropCycle(c) !== this.cycleFilter) return false;

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase().trim();
        const plot = allPlots.find(p => p.id === c.plotId);
        const plotCode = (plot ? plot.code : c.plotId || '').toLowerCase();
        const seasonId = (c.seasonId || c.id || '').toLowerCase();
        const memberNames = (plot && plot.memberIds ? plot.memberIds.map(mId => {
          const m = allMembers.find(mem => mem.id === mId);
          return m ? m.name : '';
        }).join(' ') : '').toLowerCase();

        return plotCode.includes(q) || seasonId.includes(q) || memberNames.includes(q) || h.toLowerCase().includes(q);
      }
      return true;
    });

    const intakeRowsHtml = filteredHarvests.length === 0
      ? `<tr><td colspan="8" class="py-12 text-center text-sm text-gray-400 bg-white">
           <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-400 flex items-center justify-center mx-auto text-2xl mb-2">
             <i class="fa-solid fa-hand-holding-dollar"></i>
           </div>
           ${purchasedRecords.length > 0
             ? `ไม่มีรายการตามตัวกรองที่เลือก (มีรายการรับซื้อทั้งหมด ${purchasedRecords.length} รายการ)<div class="mt-3"><button type="button" id="fresh-buying-show-all-btn" class="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm border border-amber-300">ดูทุกรายการ</button></div>`
             : 'ยังไม่มีประวัติการรับซื้อดอกสด หรือไม่พบข้อมูลตามเงื่อนไขที่ค้นหา'}
         </td></tr>`
      : filteredHarvests.map((c, idx) => {
          const herb = getCropHerb(c);
          const herbPrice = parseFloat(c.purchasePrice) || (herbPricingData[herb] ? herbPricingData[herb].price : 50);
          const freshKg = parseFloat(c.yield) || 0;
          const payout = freshKg * herbPrice;
          const plot = allPlots.find(p => p.id === c.plotId);
          const plotCode = plot ? (plot.code || plot.id) : (c.plotId || '-');

          // Member names
          let memberNamesStr = '-';
          if (plot && plot.memberIds && plot.memberIds.length > 0) {
            memberNamesStr = plot.memberIds.map(mId => {
              const m = allMembers.find(mem => mem.id === mId);
              return m ? m.name : mId;
            }).join(', ');
          }

          const harvestDateDisplay = (c.harvestDate || c.harvestDateActual) ? formatThaiDate(c.harvestDate || c.harvestDateActual) : '-';
          const isProcessed = !!c.isProcessed;

          return `
            <tr class="border-b border-gray-100 last:border-0 hover:bg-amber-50/30 transition-colors">
              <td class="py-4 px-4 text-center align-middle font-mono text-xs text-gray-400">
                ${idx + 1}
              </td>
              <td class="py-4 px-4 align-middle">
                <div class="font-bold text-gray-900 text-sm">${harvestDateDisplay}</div>
                <div class="text-xs text-gray-400 font-mono mt-0.5">${c.seasonId || c.id}</div>
              </td>
              <td class="py-4 px-4 align-middle">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 text-xs">
                  <i class="fa-solid fa-map-location-dot text-emerald-600"></i> ${plotCode}
                </span>
                <div class="text-xs text-gray-600 mt-1 font-medium truncate max-w-[200px]" title="${memberNamesStr}">
                  ${memberNamesStr}
                </div>
              </td>
              <td class="py-4 px-4 align-middle">
                <span class="inline-flex items-center gap-1 text-sm font-bold text-gray-800">
                  <span>${herbPricingData[herb]?.icon || '🌿'}</span>
                  <span>ดอก${herb}สด</span>
                </span>
              </td>
              <td class="py-4 px-4 text-right align-middle font-mono font-bold text-gray-900 text-sm">
                ${freshKg.toFixed(1)} <span class="text-xs font-normal text-gray-500">กิโลกรัม</span>
              </td>
              <td class="py-4 px-4 text-right align-middle">
                <span class="font-mono font-bold text-amber-900 text-sm">฿${herbPrice.toLocaleString()}</span>
                <span class="text-xs text-gray-500 block">/ กิโลกรัม</span>
              </td>
              <td class="py-4 px-4 text-right align-middle">
                <div class="font-mono font-black text-emerald-800 text-base">฿${formatBaht(payout)}</div>

              </td>
              <td class="py-4 px-4 text-center align-middle">
                <button type="button" class="delete-purchase-btn w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                  data-purchase-id="${c._purchaseId}" title="ลบรายการรับซื้อนี้">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">
        <!-- Top Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                <i class="fa-solid fa-hand-holding-dollar"></i>
              </span>
              <span>จัดการรับซื้อดอกสดจากสมาชิก</span>
            </h1>
            <p class="text-sm text-gray-500 mt-1">ราคารับซื้อดอกสดจากสมาชิก (บาท / กิโลกรัม)</p>
          </div>
        </div>

        <!-- Herbs Fresh Buying Price Cards -->
        <div class="flex flex-wrap gap-3">
          ${herbCardsHtml}
        </div>

        <!-- 3. Fresh Produce Intake Log Table (ตารางบันทึกการรับซื้อดอกสดจากสมาชิก) -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <i class="fa-solid fa-receipt text-amber-600"></i>
                <span>บันทึกการรับซื้อดอกสดจากสมาชิก (Intake Records)</span>
              </h2>
              <p class="text-xs text-gray-500 mt-0.5">รายการผลผลิตดอกสดที่เก็บเกี่ยวจากแปลงสมาชิก พร้อมยอดเงินคำนวณตามเกณฑ์ราคารับซื้อ</p>
            </div>

            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- Search Input -->
              <div class="relative min-w-[200px]">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i class="fas fa-search text-xs"></i>
                </span>
                <input type="text" id="fresh-buying-search-input" value="${this.searchQuery}" placeholder="ค้นหาแปลง, รอบ, สมาชิก..."
                  class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
              </div>

              <!-- Year Filter -->
              <select id="fresh-buying-year-filter" class="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                <option value="all" ${this.yearFilter === 'all' ? 'selected' : ''}>ทุกปี</option>
                ${yearOptions.map(y => `<option value="${y}" ${this.yearFilter === y ? 'selected' : ''}>ปี ${y}</option>`).join('')}
              </select>

              <!-- Month Filter -->
              <select id="fresh-buying-month-filter" class="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                <option value="all" ${this.monthFilter === 'all' ? 'selected' : ''}>ทุกเดือน</option>
                ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => { const v = String(i + 1).padStart(2, '0'); return `<option value="${v}" ${this.monthFilter === v ? 'selected' : ''}>${m}</option>`; }).join('')}
              </select>

              <!-- Cycle Filter -->
              <select id="fresh-buying-cycle-filter" class="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                <option value="all" ${this.cycleFilter === 'all' ? 'selected' : ''}>ทุกรอบ</option>
                ${cycleOptions.map(r => `<option value="${r}" ${this.cycleFilter === r ? 'selected' : ''}>รอบ ${r}</option>`).join('')}
              </select>

              <!-- Herb Filter -->
              <select id="fresh-buying-herb-filter" class="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                <option value="all" ${this.herbFilter === 'all' ? 'selected' : ''}>ทุกชนิดพืช</option>
                ${herbList.map(h => `<option value="${h}" ${this.herbFilter === h ? 'selected' : ''}>${h}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th class="py-3 px-4 text-center w-12">ลำดับ</th>
                  <th class="py-3 px-4">วันที่รับซื้อ / รหัสรอบ</th>
                  <th class="py-3 px-4">แปลงปลูก / สมาชิกผู้ปลูก</th>
                  <th class="py-3 px-4">ชนิดพืชสมุนไพร</th>
                  <th class="py-3 px-4 text-right">น้ำหนักดอกสด (กิโลกรัม)</th>
                  <th class="py-3 px-4 text-right">ราคารับซื้อสด</th>
                  <th class="py-3 px-4 text-right">ยอดเงินรับซื้อ (บาท)</th>
                  <th class="py-3 px-4 text-center w-16">ลบ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${intakeRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    // 1. Search Input Binding
    const searchInput = document.getElementById('fresh-buying-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }

    // 1.5 Year / Cycle Filter Bindings
    const yearSelect = document.getElementById('fresh-buying-year-filter');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.yearFilter = e.target.value;
        this.refreshView();
      });
    }
    const showAllBtn = document.getElementById('fresh-buying-show-all-btn');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => {
        this.yearFilter = 'all';
        this.monthFilter = 'all';
        this.cycleFilter = 'all';
        this.herbFilter = 'all';
        this.searchQuery = '';
        this.refreshView();
      });
    }
    const monthSelect = document.getElementById('fresh-buying-month-filter');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        this.monthFilter = e.target.value;
        this.refreshView();
      });
    }
    const cycleSelect = document.getElementById('fresh-buying-cycle-filter');
    if (cycleSelect) {
      cycleSelect.addEventListener('change', (e) => {
        this.cycleFilter = e.target.value;
        this.refreshView();
      });
    }

    // 2. Herb Filter Binding
    const herbSelect = document.getElementById('fresh-buying-herb-filter');
    if (herbSelect) {
      herbSelect.addEventListener('change', (e) => {
        this.herbFilter = e.target.value;
        this.refreshView();
      });
    }

    // 3.0 Delete purchase record (ลบรายการรับซื้อ)
    document.querySelectorAll('.delete-purchase-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-purchase-id');
        if (!id) return;
        if (!window.confirm('ลบรายการรับซื้อนี้ใช่หรือไม่? แปลงนี้จะกลับไปอยู่ในรายการที่รับซื้อได้อีกครั้ง')) return;
        this.savePurchases(this.getPurchases().filter(p => p.id !== id));
        showToast('ลบรายการรับซื้อเรียบร้อยแล้ว', 'success');
        this.refreshView();
      });
    });

    // 3.1 Buy Buttons (รับซื้อ)
    document.querySelectorAll('.buy-fresh-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const herbName = btn.getAttribute('data-herb');
        if (herbName) this.openBuyModal(herbName);
      });
    });

    // 3. Edit Fresh Buying Price Buttons
    const editBtns = document.querySelectorAll('.edit-fresh-buying-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const herbName = btn.getAttribute('data-herb');
        if (herbName) this.openEditFreshBuyingPriceModal(herbName);
      });
    });
  },

  // ---- ที่เก็บบันทึกการรับซื้อ (แยกจากข้อมูลรอบเพาะปลูก เพื่อไม่ให้หายตอนซิงค์) ----
  getPurchases() {
    try {
      const raw = localStorage.getItem('herb_enterprise_fresh_purchases');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  },

  savePurchases(list) {
    const prev = this.getPurchases();
    try { localStorage.setItem('herb_enterprise_fresh_purchases', JSON.stringify(list)); } catch (e) { /* ignore */ }
    // บันทึกขึ้น Supabase ด้วย เพื่อให้ทุกเครื่องเห็นข้อมูลเดียวกัน
    try { appState.syncJsonList('fresh_purchases', 'herb_enterprise_fresh_purchases', list, prev); } catch (e) { console.error(e); }
  },

  // Modal: รับซื้อดอกสดจากสมาชิก — ดึงจากรอบเพาะปลูกที่บันทึกเก็บเกี่ยวแล้ว
  openBuyModal(herbName) {
    const roadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
    const herbList = Object.keys(roadmaps).length > 0 ? Object.keys(roadmaps) : ['เก๊กฮวย', 'คาโมมายล์'];
    const isCham = herbName.includes('คาโมมายล์');
    const mHerb = appState.getHerbByName ? appState.getHerbByName(herbName) : null;
    const price = mHerb ? (parseFloat(mHerb.freshBuyingPrice || mHerb.baselinePriceFresh) || (isCham ? 70 : 50)) : (isCham ? 70 : 50);
    const herbIcon = (mHerb && mHerb.icon) || (roadmaps[herbName] && roadmaps[herbName].icon) || getHerbDefaultIcon(herbName);

    const allPlots = appState.getPlots ? appState.getPlots() : [];
    const allMembers = appState.getMembers ? appState.getMembers() : [];
    const getCropHerb = (crop) => {
      const plot = allPlots.find(p => p.id === crop.plotId);
      const raw = crop.seedlingSource || (plot ? plot.plantType : '') || 'เก๊กฮวย';
      for (const h of herbList) { if (raw.includes(h)) return h; }
      if (raw.includes('เก๊กฮวย')) return 'เก๊กฮวย';
      if (raw.includes('คาโมมายล์')) return 'คาโมมายล์';
      return raw.trim() || 'เก๊กฮวย';
    };

    // รอบเพาะปลูกที่เก็บเกี่ยวแล้ว (ตามบันทึกรอบเพาะปลูก) และยังไม่ได้รับซื้อ
    const purchasedIds = new Set(this.getPurchases().map(p => p.cropId));
    const rows = (appState.getCrops ? appState.getCrops() : [])
      .filter(c => c.status === 'harvested' && getCropHerb(c) === herbName && !purchasedIds.has(c.id))
      .map(c => {
        const plot = allPlots.find(p => p.id === c.plotId);
        const members = (plot && plot.memberIds ? plot.memberIds : []).map(mId => {
          const m = allMembers.find(mem => mem.id === mId);
          return m ? m.name : mId;
        }).join(', ') || '-';
        const kg = parseFloat(c.yield) || 0;
        return { cropId: c.id, plotName: plot ? (plot.name || plot.id) : (c.plotId || '-'), members, kg, canBuy: kg > 0 };
      });

    const todayStr = new Date().toISOString().split('T')[0];

    const rowsHtml = rows.length === 0
      ? `<div class="py-10 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
           ยังไม่มีแปลงที่เก็บเกี่ยว${herbName}แล้ว (บันทึกเก็บเกี่ยวได้ที่หน้า "จัดการรอบปลูก")
         </div>`
      : rows.map(r => `
          <div class="buy-row flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-xl border-2 ${r.canBuy ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-70'} transition-all"
               data-crop-id="${r.cropId}" data-kg="${r.kg}" data-search="${(r.plotName + ' ' + r.members + ' ' + r.cropId).toLowerCase().replace(/"/g, '')}">
            <input type="checkbox" class="buy-check w-5 h-5 accent-emerald-600 shrink-0 ${r.canBuy ? 'cursor-pointer' : 'cursor-not-allowed'}" ${r.canBuy ? '' : 'disabled'}>
            <div class="min-w-[90px] font-bold text-gray-900 text-sm truncate max-w-[160px]">${r.plotName}</div>
            <div class="flex-1 min-w-[120px] text-sm font-bold text-gray-800 truncate" title="${r.members}">
              <i class="fas fa-user text-emerald-600 mr-1.5 text-xs"></i>${r.members}
            </div>
            <div class="w-40 text-right text-sm">
              ${r.canBuy
                ? `<span class="font-mono font-bold text-gray-900">${r.kg.toFixed(1)}</span> <span class="text-xs text-gray-500">กิโลกรัม</span>`
                : `<span class="text-xs font-bold text-red-600">เก็บเกี่ยว 0 กิโลกรัม รับซื้อไม่ได้</span>`}
            </div>
            <div class="w-28 text-right">
              <span class="buy-amount font-mono font-bold text-emerald-800 text-sm">฿0</span>
            </div>
          </div>`).join('');

    const html = `
      <form id="buy-fresh-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-800 mb-1.5">วันที่รับซื้อ *</label>
              <input type="date" id="buy-date" value="${todayStr}" required
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-800 mb-1.5">ราคารับซื้อ (บาท / กิโลกรัม) *</label>
              <input type="number" id="buy-price" value="${price}" readonly tabindex="-1" title="แก้ราคาได้ที่ปุ่ม กำหนดราคา บนการ์ด"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 font-bold text-gray-700 font-mono cursor-not-allowed focus:outline-none">
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-bold text-gray-800">เลือกแปลง / สมาชิกที่รับซื้อ *</span>
            <span class="text-xs font-bold">
              <button type="button" id="buy-select-all" class="text-emerald-700 hover:underline cursor-pointer">เลือกทั้งหมด</button>
              <span class="text-gray-300 mx-1">|</span>
              <button type="button" id="buy-clear-all" class="text-red-600 hover:underline cursor-pointer">ยกเลิกทั้งหมด</button>
            </span>
          </div>

          <div class="relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input type="text" id="buy-search" placeholder="ค้นหาชื่อแปลง, สมาชิก, รหัสรอบ..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>

          <div class="space-y-2">${rowsHtml}</div>
          <div id="buy-no-match" class="hidden py-6 text-center text-sm text-gray-400">ไม่พบแปลงที่ค้นหา</div>

          <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-900">
            <span>เลือก: <span id="buy-sum-count">0</span> แปลง</span>
            <span>น้ำหนักรวม: <span id="buy-sum-kg">0</span> กิโลกรัม</span>
            <span>ยอดจ่ายรวม: <span id="buy-sum-amount">฿0</span></span>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-800 mb-1.5">หมายเหตุ (จะใส่หรือไม่ใส่ก็ได้)</label>
            <input type="text" id="buy-note" placeholder="เช่น ดอกสดคุณภาพดี"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">ยกเลิก</button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer">
            <i class="fas fa-check-circle"></i> ยืนยันการรับซื้อ
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `รับซื้อดอกสด: ${herbIcon} ดอก${herbName}สด`,
      icon: 'fa-solid fa-hand-holding-dollar',
      size: 'max-w-3xl',
      headerColor: 'bg-emerald-700',
      content: html,
      onRender: (dialog) => {
        const priceInput = dialog.querySelector('#buy-price');
        const rowEls = Array.from(dialog.querySelectorAll('.buy-row'));
        const p = parseFloat(priceInput.value) || 0;

        const recalc = () => {
          let cnt = 0, kgSum = 0, amtSum = 0;
          rowEls.forEach(row => {
            const chk = row.querySelector('.buy-check');
            const kg = parseFloat(row.getAttribute('data-kg')) || 0;
            const amt = chk.checked ? kg * p : 0;
            row.querySelector('.buy-amount').textContent = '฿' + formatBaht(kg * p);
            row.classList.toggle('border-emerald-400', chk.checked);
            row.classList.toggle('bg-emerald-50/50', chk.checked);
            if (chk.checked) { cnt++; kgSum += kg; amtSum += amt; }
          });
          dialog.querySelector('#buy-sum-count').textContent = cnt;
          dialog.querySelector('#buy-sum-kg').textContent = kgSum.toFixed(1);
          dialog.querySelector('#buy-sum-amount').textContent = '฿' + formatBaht(amtSum);
        };

        rowEls.forEach(row => row.querySelector('.buy-check').addEventListener('change', recalc));

        const searchEl = dialog.querySelector('#buy-search');
        const noMatchEl = dialog.querySelector('#buy-no-match');
        if (searchEl) {
          searchEl.addEventListener('input', () => {
            const q = searchEl.value.toLowerCase().trim();
            let shown = 0;
            rowEls.forEach(row => {
              const ok = !q || (row.getAttribute('data-search') || '').includes(q);
              row.classList.toggle('hidden', !ok);
              if (ok) shown++;
            });
            if (noMatchEl) noMatchEl.classList.toggle('hidden', shown > 0 || rowEls.length === 0);
          });
        }

        const setAll = (on) => {
          rowEls.forEach(row => {
            if (row.classList.contains('hidden')) return;
            const chk = row.querySelector('.buy-check');
            if (!chk.disabled) chk.checked = on;
          });
          recalc();
        };
        const selAll = dialog.querySelector('#buy-select-all');
        const clrAll = dialog.querySelector('#buy-clear-all');
        if (selAll) selAll.addEventListener('click', () => setAll(true));
        if (clrAll) clrAll.addEventListener('click', () => setAll(false));
        recalc();

        const form = dialog.querySelector('#buy-fresh-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = dialog.querySelector('#buy-date').value || todayStr;
            const note = dialog.querySelector('#buy-note').value.trim();
            if (p <= 0) { showToast('ยังไม่ได้กำหนดราคารับซื้อ กรุณากด "กำหนดราคา" ก่อน', 'warning'); return; }

            const picked = rowEls.filter(row => {
              const chk = row.querySelector('.buy-check');
              return chk.checked && !chk.disabled;
            });
            if (picked.length === 0) { showToast('กรุณาเลือกแปลงอย่างน้อย 1 แปลง', 'warning'); return; }

            const list = this.getPurchases();
            let total = 0, totalKg = 0;
            picked.forEach((row, i) => {
              const kg = parseFloat(row.getAttribute('data-kg')) || 0;
              if (kg <= 0) return; // เก็บเกี่ยว 0 รับซื้อไม่ได้
              list.push({
                id: `PUR-${Date.now()}-${i}`,
                cropId: row.getAttribute('data-crop-id'),
                herb: herbName,
                kg,
                price: p,
                amount: kg * p,
                date,
                note
              });
              total += kg * p;
              totalKg += kg;
            });
            this.savePurchases(list);

            closeGlobalModal();
            showToast(`รับซื้อดอก${herbName}สด ${picked.length} แปลง รวม ${totalKg.toFixed(1)} กิโลกรัม เป็นเงิน ฿${formatBaht(total)} เรียบร้อยแล้ว`, 'success');
            this.refreshView();
          });
        }
      }
    });
  },

  openEditFreshBuyingPriceModal(herbName) {
    const isCham = herbName.includes('คาโมมายล์');
    const masterHerb = appState.getHerbByName(herbName) || {
      herbId: 'HRB-000',
      name: herbName,
      icon: getHerbDefaultIcon ? getHerbDefaultIcon(herbName) : '🌿',
      freshBuyingPrice: isCham ? 70 : 50
    };
    const herbIcon = masterHerb.icon || (getHerbDefaultIcon ? getHerbDefaultIcon(herbName) : '🌿');
    const currentPrice = masterHerb.freshBuyingPrice || (isCham ? 70 : 50);

    const modalHtml = `
      <form id="global-edit-fresh-buying-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
          <input type="hidden" name="herbName" value="${masterHerb.name}">

          <!-- Fresh Buying Price Input Field -->
          <div class="p-4 bg-white rounded-2xl border-2 border-amber-300 shadow-2xs space-y-2">
            <label for="modal-fresh-buying-input" class="block text-sm font-bold text-amber-950 uppercase">
              <i class="fas fa-coins text-amber-600 mr-1.5"></i> ราคารับซื้อสดจากสมาชิก (บาท / กิโลกรัม) *
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-amber-700 font-bold text-xl">฿</span>
              <input type="number" id="modal-fresh-buying-input" name="freshBuyingPrice" required min="1" step="any" value="${currentPrice}"
                class="w-full pl-10 pr-36 py-3 rounded-xl border-2 border-amber-400 text-2xl sm:text-3xl font-extrabold text-amber-950 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-inner">
              <span class="absolute inset-y-0 right-0 pr-4 flex items-center text-sm font-bold text-amber-800 pointer-events-none">
                บาท / กิโลกรัม
              </span>
            </div>
          </div>

        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <i class="fas fa-save"></i> บันทึกราคารับซื้อสด
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `จัดการราคารับซื้อดอกสด: ${herbIcon} ดอก${masterHerb.name}สด`,
      icon: 'fa-solid fa-hand-holding-dollar',
      size: 'max-w-lg',
      headerColor: 'bg-amber-600',
      content: modalHtml,
      onRender: (dialog) => {
        const input = dialog.querySelector('#modal-fresh-buying-input');
        const preview = dialog.querySelector('#fresh-buying-calc-preview');
        if (input && preview) {
          input.addEventListener('input', () => {
            const val = parseFloat(input.value) || 0;
            preview.innerHTML = `
              <div class="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <span class="text-[11px] text-gray-500 block">รับซื้อ 50 กก.</span>
                <span class="text-base font-bold text-amber-900 font-mono">฿${formatBaht(50 * val)}</span>
              </div>
              <div class="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <span class="text-[11px] text-gray-500 block">รับซื้อ 100 กก.</span>
                <span class="text-base font-bold text-amber-900 font-mono">฿${formatBaht(100 * val)}</span>
              </div>
              <div class="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <span class="text-[11px] text-gray-500 block">รับซื้อ 500 กก.</span>
                <span class="text-base font-bold text-amber-900 font-mono">฿${formatBaht(500 * val)}</span>
              </div>
            `;
          });
        }

        const form = dialog.querySelector('#global-edit-fresh-buying-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPrice = parseFloat(input ? input.value : 0);
            if (isNaN(newPrice) || newPrice <= 0) {
              showToast('กรุณาระบุราคารับซื้อที่ถูกต้องและมากกว่า 0', 'error');
              return;
            }

            try {
              const fullHerb = appState.getHerbByName(herbName) || {};
              appState.addOrUpdateHerb({
                ...fullHerb,
                name: masterHerb.name,
                freshBuyingPrice: newPrice,
                baselinePriceFresh: newPrice
              });
              closeGlobalModal();
              showToast(`บันทึกราคารับซื้อดอก${masterHerb.name}สดจากสมาชิก เป็น ${newPrice} บาท/กก. เรียบร้อยแล้ว`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init();
    }
  }
};
