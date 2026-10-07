// Fresh Flower Buying Management Component (จัดการรับซื้อดอกสดจากสมาชิก - ต้นน้ำการผลิต)
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal, getHerbDefaultIcon } from '../helpers.js';

export const FreshBuyingComponent = {
  searchQuery: '',
  herbFilter: 'all',

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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <!-- KPI 3: แปลงปลูกที่ส่งมอบผลผลิต -->
        <div class="p-5 bg-white border border-teal-200 shadow-sm rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
          <div class="space-y-1">
            <span class="text-xs font-bold text-teal-800 uppercase tracking-wide block">แปลงที่ส่งมอบดอกสด</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-extrabold text-teal-950 font-mono">${contributingPlotsSet.size}</span>
              <span class="text-sm font-bold text-teal-700">แปลง</span>
            </div>
            <span class="text-xs text-teal-700 block font-medium">จากทั้งหมด ${allPlots.length} แปลงในกลุ่ม</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            <i class="fa-solid fa-map-location-dot"></i>
          </div>
        </div>

        <!-- KPI 4: จำนวนพืชสมุนไพรที่รับซื้อ -->
        <div class="p-5 bg-white border border-blue-200 shadow-sm rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
          <div class="space-y-1">
            <span class="text-xs font-bold text-blue-800 uppercase tracking-wide block">ชนิดพืชสมุนไพรรับซื้อ</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-extrabold text-blue-950 font-mono">${herbList.length}</span>
              <span class="text-sm font-bold text-blue-700">ชนิด</span>
            </div>
            <span class="text-xs text-blue-700 block font-medium">ตามแผนการปลูกวิสาหกิจ</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            <i class="fas fa-seedling"></i>
          </div>
        </div>
      </div>
    `;

    // 2. Herb Buying Price Cards Grid
    const herbCardsHtml = herbList.map(herb => {
      const data = herbPricingData[herb];
      return `
        <div class="group relative bg-white rounded-2xl border-2 border-amber-300 hover:border-amber-500 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden p-5">
          <!-- Top stripe -->
          <div class="h-2 w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 absolute top-0 left-0"></div>

          <div>
            <!-- Header: Icon, Name, Badge -->
            <div class="flex items-start justify-between gap-2 mb-4 pt-1">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                  ${data.icon}
                </span>
                <div class="min-w-0">
                  <h3 class="text-lg font-bold text-gray-900 truncate">ดอก${herb}สด</h3>
                  <span class="text-xs text-amber-800 font-semibold flex items-center gap-1">
                    <i class="fas fa-handshake text-amber-600"></i> รับซื้อจากแปลงสมาชิก
                  </span>
                </div>
              </div>
              <span class="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                ดอกสด (กก.)
              </span>
            </div>

            <!-- Big Price Display -->
            <div class="p-4 bg-gradient-to-br from-amber-50 via-amber-100/40 to-white rounded-2xl border-2 border-amber-300 space-y-1.5 my-3 shadow-inner">
              <div class="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                <span><i class="fas fa-hand-holding-dollar text-amber-600 mr-1"></i> ราคารับซื้อสดจากสมาชิก</span>
                <span class="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-bold">เกณฑ์ปัจจุบัน</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-4xl sm:text-5xl font-black text-amber-950 font-mono tracking-tight">${data.price.toLocaleString()}</span>
                <span class="text-base font-bold text-amber-800">บาท / กก.</span>
              </div>
              <p class="text-xs text-amber-800 font-medium leading-relaxed pt-1 border-t border-amber-200/60">
                * ระบบนำราคานี้ไปคำนวณเงินสดจ่ายให้สมาชิกทันทีเมื่อส่งผลผลิตเข้าสู่โรงอบแห้ง
              </p>
            </div>

            <!-- Cumulative Intake & Payout Stats -->
            <div class="grid grid-cols-2 gap-2.5 pt-1 text-xs">
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-gray-500 text-[11px] block font-medium">รับซื้อสะสม:</span>
                <span class="font-bold text-gray-900 text-base font-mono">${data.totalFreshKg.toFixed(1)} กก.</span>
                <span class="text-[10px] text-gray-400 block mt-0.5">${data.cropCount} รอบเก็บเกี่ยว</span>
              </div>
              <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span class="text-emerald-800 text-[11px] block font-medium">ยอดจ่ายเงินสะสม:</span>
                <span class="font-bold text-emerald-950 text-base font-mono">฿${formatBaht(data.totalPayout)}</span>
                <span class="text-[10px] text-emerald-700 block mt-0.5">ตรงตามเกณฑ์</span>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <button class="edit-fresh-buying-btn mt-5 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            data-herb="${herb}" title="กำหนดราคารับซื้อสดของ ${herb}">
            <i class="fas fa-edit"></i>
            <span>กำหนดราคารับซื้อสด (บาท/กก.)</span>
          </button>
        </div>
      `;
    }).join('');

    // 3. Intake Records Table (ประวัติการรับซื้อดอกสดจากสมาชิก)
    let filteredHarvests = allHarvestedCrops.filter(c => {
      const h = getCropHerb(c);
      if (this.herbFilter !== 'all' && h !== this.herbFilter) return false;

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
      ? `<tr><td colspan="7" class="py-12 text-center text-sm text-gray-400 bg-white">
           <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-400 flex items-center justify-center mx-auto text-2xl mb-2">
             <i class="fa-solid fa-hand-holding-dollar"></i>
           </div>
           ยังไม่มีประวัติการรับซื้อดอกสด หรือไม่พบข้อมูลตามเงื่อนไขที่ค้นหา
         </td></tr>`
      : filteredHarvests.map((c, idx) => {
          const herb = getCropHerb(c);
          const herbPrice = herbPricingData[herb] ? herbPricingData[herb].price : 50;
          const freshKg = parseFloat(c.yield) || 0;
          const payout = freshKg * herbPrice;
          const plot = allPlots.find(p => p.id === c.plotId);
          const plotCode = plot ? plot.code : (c.plotId || '-');

          // Member names
          let memberNamesStr = '-';
          if (plot && plot.memberIds && plot.memberIds.length > 0) {
            memberNamesStr = plot.memberIds.map(mId => {
              const m = allMembers.find(mem => mem.id === mId);
              return m ? m.name : mId;
            }).join(', ');
          }

          const harvestDateDisplay = c.harvestDate ? formatThaiDate(c.harvestDate) : '-';
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
                ${freshKg.toFixed(1)} <span class="text-xs font-normal text-gray-500">กก.</span>
              </td>
              <td class="py-4 px-4 text-right align-middle">
                <span class="font-mono font-bold text-amber-900 text-sm">฿${herbPrice.toLocaleString()}</span>
                <span class="text-xs text-gray-500 block">/ กก.</span>
              </td>
              <td class="py-4 px-4 text-right align-middle">
                <div class="font-mono font-black text-emerald-800 text-base">฿${formatBaht(payout)}</div>
                <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${isProcessed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                  ${isProcessed ? 'อบแห้งแล้ว' : 'รอเข้าเตาอบ'}
                </span>
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
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                ต้นน้ำการผลิต
              </span>
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              กำหนดเกณฑ์ราคารับซื้อผลผลิตดอกสดจากแปลงปลูกของสมาชิก · คำนวณยอดเงินจ่ายให้สมาชิกและต้นทุนวัตถุดิบเข้าโรงอบแห้งโดยอัตโนมัติ
            </p>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap">
            <a href="#fresh-produce" class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-sm">
              <i class="fa-solid fa-fire-burner"></i>
              <span>ไปที่โรงอบแห้ง &rarr;</span>
            </a>
            <a href="#inventory" class="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-sm flex items-center gap-1.5 transition-all shadow-2xs">
              <i class="fa-solid fa-boxes-stacked text-emerald-600"></i>
              <span>คลังสินค้า &rarr;</span>
            </a>
            <a href="#finance" class="px-3.5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-sm flex items-center gap-1.5 transition-all shadow-2xs">
              <i class="fa-solid fa-wallet text-teal-600"></i>
              <span>การเงินสมาชิก &rarr;</span>
            </a>
          </div>
        </div>

        <!-- 1. KPI Summary Cards -->
        ${kpiCardsHtml}

        <!-- 2. Herbs Fresh Buying Price Cards Section -->
        <div class="rounded-2xl border-2 border-amber-300 shadow-md overflow-hidden bg-white">
          <div class="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl shrink-0 shadow-inner">
                <i class="fa-solid fa-tag"></i>
              </div>
              <div>
                <h2 class="text-base sm:text-lg font-bold tracking-wide flex items-center gap-2">
                  <span>เกณฑ์ราคารับซื้อผลผลิตดอกสด (บาท / กก.)</span>
                </h2>
                <p class="text-xs sm:text-sm text-amber-100 mt-0.5">
                  กดปุ่ม "กำหนดราคารับซื้อสด" เพื่อปรับราคาตามชนิดสมุนไพร โดยระบบจะซิงค์ไปยังโรงอบแห้งและการเงินสมาชิกทันที
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white">
                <i class="fas fa-link text-amber-300"></i> อัปเดตอัตโนมัติ Real-Time
              </span>
            </div>
          </div>

          <div class="p-5 bg-gradient-to-b from-amber-50/40 to-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            ${herbCardsHtml}
          </div>
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
                  <th class="py-3 px-4">วันที่เก็บเกี่ยว / รหัสรอบ</th>
                  <th class="py-3 px-4">แปลงปลูก / สมาชิกผู้ปลูก</th>
                  <th class="py-3 px-4">ชนิดพืชสมุนไพร</th>
                  <th class="py-3 px-4 text-right">น้ำหนักดอกสด (กก.)</th>
                  <th class="py-3 px-4 text-right">ราคารับซื้อสด</th>
                  <th class="py-3 px-4 text-right">ยอดเงินรับซื้อ (บาท)</th>
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

    // 2. Herb Filter Binding
    const herbSelect = document.getElementById('fresh-buying-herb-filter');
    if (herbSelect) {
      herbSelect.addEventListener('change', (e) => {
        this.herbFilter = e.target.value;
        this.refreshView();
      });
    }

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
          <!-- Information Banner -->
          <div class="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-start gap-3">
            <span class="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
              <i class="fa-solid fa-hand-holding-dollar text-amber-200"></i>
            </span>
            <div class="text-sm text-amber-950">
              <b class="font-bold block text-base text-amber-900 mb-0.5">จัดการรับซื้อดอกสด: ${herbIcon} ดอก${masterHerb.name}สด</b>
              กำหนดเกณฑ์ราคารับซื้อผลผลิตดอกสดจากแปลงปลูกของสมาชิกกลุ่มวิสาหกิจชุมชน
            </div>
          </div>

          <input type="hidden" name="herbName" value="${masterHerb.name}">

          <!-- Fresh Buying Price Input Field -->
          <div class="p-4 bg-white rounded-2xl border-2 border-amber-300 shadow-2xs space-y-2">
            <label for="modal-fresh-buying-input" class="block text-sm font-bold text-amber-950 uppercase">
              <i class="fas fa-coins text-amber-600 mr-1.5"></i> ราคารับซื้อสดจากสมาชิก (บาท / กก.) *
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-amber-700 font-bold text-xl">฿</span>
              <input type="number" id="modal-fresh-buying-input" name="freshBuyingPrice" required min="1" step="any" value="${currentPrice}"
                class="w-full pl-10 pr-24 py-3 rounded-xl border-2 border-amber-400 text-2xl sm:text-3xl font-extrabold text-amber-950 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-inner">
              <span class="absolute inset-y-0 right-0 pr-4 flex items-center text-sm font-bold text-amber-800 pointer-events-none">
                บาท / กก.
              </span>
            </div>
            <p class="text-xs text-amber-800">
              * ราคานี้จะถูกนำไปใช้อ้างอิงการรับซื้อผลผลิตในระบบโรงอบแห้ง และสรุปยอดเงินปันผล/การเงินของสมาชิกโดยอัตโนมัติ
            </p>
          </div>

          <!-- Live Preview Calculation -->
          <div class="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <span class="text-xs font-bold text-gray-700 block uppercase">
              <i class="fas fa-calculator text-amber-700 mr-1"></i> ตัวอย่างการจ่ายเงินให้สมาชิกตามราคานี้
            </span>
            <div id="fresh-buying-calc-preview" class="grid grid-cols-3 gap-2.5 pt-1 text-center">
              <div class="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <span class="text-[11px] text-gray-500 block">รับซื้อ 50 กก.</span>
                <span class="text-base font-bold text-amber-900 font-mono">฿${formatBaht(50 * currentPrice)}</span>
              </div>
              <div class="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <span class="text-[11px] text-gray-500 block">รับซื้อ 100 กก.</span>
                <span class="text-base font-bold text-amber-900 font-mono">฿${formatBaht(100 * currentPrice)}</span>
              </div>
              <div class="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <span class="text-[11px] text-gray-500 block">รับซื้อ 500 กก.</span>
                <span class="text-base font-bold text-amber-900 font-mono">฿${formatBaht(500 * currentPrice)}</span>
              </div>
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
