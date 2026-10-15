// Fresh Produce Management Component (ระบบจัดการผลผลิตดอกสดรวม - Clean & Elderly-Friendly Process Flow)
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal, getHerbDefaultIcon } from '../helpers.js';

export const FreshProduceComponent = {
  selectedHerb: 'เก๊กฮวย',
  activeTab: 'drying', // 'drying' | 'canning'
  mode: 'drying', // หน้าที่เปิดอยู่: 'drying' = 5. จัดการโรงอบแห้ง | 'canning' = 6. แปรรูปบรรจุกระป๋อง
  historySubTab: 'drying', // 'drying' | 'canning'
  // ค่าเริ่มต้นของตัวกรองประวัติ = ปัจจุบัน (ปี พ.ศ. ปัจจุบัน / เดือนปัจจุบัน / รอบปลูกที่ 2)
  dryYearFilter: String(new Date().getFullYear() + 543),
  dryMonthFilter: String(new Date().getMonth() + 1).padStart(2, '0'),
  dryCycleFilter: '2',
  canYearFilter: String(new Date().getFullYear() + 543),
  canMonthFilter: String(new Date().getMonth() + 1).padStart(2, '0'),
  canCycleFilter: '2',

  render() {
    this.activeTab = this.mode === 'canning' ? 'canning' : 'drying';
    const allCrops = appState.getCrops();
    const plots = appState.getPlots();
    const dryingBatches = appState.getDryingBatches ? appState.getDryingBatches() : [];
    const packagingBatches = appState.getPackagingBatches ? appState.getPackagingBatches() : [];

    const allHarvestedCrops = appState.getHarvestedOrPurchasedCrops();

    const getCropHerb = (c) => {
      const plot = appState.getPlotById(c.plotId);
      const raw = c.seedlingSource || (plot ? plot.plantType : '') || 'เก๊กฮวย';
      if (raw.includes('เก๊กฮวย')) return 'เก๊กฮวย';
      if (raw.includes('คาโมมายล์')) return 'คาโมมายล์';
      return raw.trim() || 'เก๊กฮวย';
    };

    const allRoadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
    const roadmapHerbNames = Object.keys(allRoadmaps);
    const herbTypes = roadmapHerbNames.length > 0 ? roadmapHerbNames : ['เก๊กฮวย', 'คาโมมายล์'];

    if (!this.selectedHerb || !herbTypes.includes(this.selectedHerb)) {
      this.selectedHerb = herbTypes[0] || 'เก๊กฮวย';
    }
    const currentSelectedHerb = this.selectedHerb;

    const getHerbRatio = (h = '') => {
      return this.getHerbRatio(h);
    };

    const herbPools = herbTypes.map(herb => {
      const cropsForHerb = allHarvestedCrops.filter(c => getCropHerb(c) === herb);
      const pendingCrops = cropsForHerb.filter(c => !c.isProcessed);
      const processedCrops = cropsForHerb.filter(c => c.isProcessed);

      const pendingFreshKg = pendingCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
      const processedFreshKg = processedCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);

      const isChrys = herb === 'เก๊กฮวย' || herb.includes('เก๊กฮวย');
      const isCham = herb === 'คาโมมายล์' || herb.includes('คาโมมายล์');
      const ratio = getHerbRatio(herb);
      const estDryKg = pendingFreshKg > 0 ? (pendingFreshKg / ratio) : 0;

      const herbBatches = dryingBatches.filter(b => {
        if (b.herbType === herb) return true;
        if (isChrys && b.herbType && b.herbType.includes('เก๊กฮวย')) return true;
        if (isCham && b.herbType && b.herbType.includes('คาโมมายล์')) return true;
        return false;
      });
      const actualDryKg = herbBatches.reduce((sum, b) => sum + (parseFloat(b.dryWeightKg) || 0), 0);
      // ดอกแห้งคงเหลือในคลังจริง (หักที่แปรรูป/ขายไปแล้ว)
      const dryStockKg = (appState.getInventory() || [])
        .filter(i => i.herbType && i.herbType.includes(herb))
        .reduce((sum, i) => sum + (parseFloat(i.dryStockKg) || 0), 0);
      const batchCount = herbBatches.length;

      return {
        herb, isChrys, isCham, ratio, pendingCrops, processedCrops,
        pendingFreshKg, processedFreshKg, estDryKg, actualDryKg, dryStockKg, batchCount, herbBatches
      };
    });

    const selectedPool = herbPools.find(p => p.herb === currentSelectedHerb) || herbPools[0];

    const filteredBatches = dryingBatches.filter(b => {
      if (b.herbType === currentSelectedHerb) return true;
      if (selectedPool && selectedPool.isChrys && b.herbType && b.herbType.includes('เก๊กฮวย')) return true;
      if (selectedPool && selectedPool.isCham && b.herbType && b.herbType.includes('คาโมมายล์')) return true;
      return false;
    });
    const filteredFreshDryingSum = filteredBatches.reduce((sum, b) => sum + (parseFloat(b.freshWeightKg) || 0), 0);
    const filteredDryFromBatches = selectedPool ? selectedPool.actualDryKg : 0;
    const cropsForHerb = allHarvestedCrops.filter(c => getCropHerb(c) === currentSelectedHerb);

    // ปี (พ.ศ.) / รอบ ของล็อตอบแห้ง — อ่านจากรหัสรอบเพาะปลูกที่นำเข้าอบ เช่น 2569/P003-R1
    const batchYears = (b) => {
      const ys = (b.cropIds || []).map(id => String(id).split('/')[0]).filter(y => /^\d{4}$/.test(y));
      if (ys.length > 0) return [...new Set(ys)];
      const d = b.processedDate ? new Date(b.processedDate) : null;
      return d && !isNaN(d) ? [String(d.getFullYear() + 543)] : [];
    };
    const batchCycles = (b) => [...new Set((b.cropIds || []).map(id => (String(id).match(/-R(\d+)/) || [])[1]).filter(Boolean))];
    const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const monthOptionsHtml = (cur) => `<option value="all" ${cur === 'all' ? 'selected' : ''}>ทุกเดือน</option>` +
      THAI_MONTHS.map((m, i) => { const v = String(i + 1).padStart(2, '0'); return `<option value="${v}" ${cur === v ? 'selected' : ''}>${m}</option>`; }).join('');
    const monthOf = (b) => String(b.processedDate || '').slice(5, 7);
    const nowBE = String(new Date().getFullYear() + 543);
    const dryYearOptions = [...new Set([nowBE, ...filteredBatches.flatMap(batchYears)])].sort((a, b) => b - a);
    const dryCycleOptions = [...new Set(['1', '2', ...filteredBatches.flatMap(batchCycles)])].sort((a, b) => a - b);
    const dryHistoryBatches = filteredBatches.filter(b => {
      if (this.dryYearFilter !== 'all' && !batchYears(b).includes(this.dryYearFilter)) return false;
      if (this.dryMonthFilter !== 'all' && monthOf(b) !== this.dryMonthFilter) return false;
      if (this.dryCycleFilter !== 'all' && !batchCycles(b).includes(this.dryCycleFilter)) return false;
      return true;
    });
    const dryHistoryFresh = dryHistoryBatches.reduce((sum, b) => sum + (parseFloat(b.freshWeightKg) || 0), 0);
    const dryHistoryDry = dryHistoryBatches.reduce((sum, b) => sum + (parseFloat(b.dryWeightKg) || 0), 0);


    const filteredPackBatches = packagingBatches.filter(b => {
      if (b.herbType === currentSelectedHerb) return true;
      if (selectedPool && selectedPool.isChrys && b.herbType && b.herbType.includes('เก๊กฮวย')) return true;
      if (selectedPool && selectedPool.isCham && b.herbType && b.herbType.includes('คาโมมายล์')) return true;
      return false;
    });
    const filteredDryUsedSum = filteredPackBatches.reduce((sum, b) => sum + (parseFloat(b.dryUsedKg) || 0), 0);
    const filteredJarsProducedSum = filteredPackBatches.reduce((sum, b) => sum + (parseInt(b.jarsProduced) || 0), 0);

    // ประวัติแปรรูปสินค้า — ปีดูจากวันที่บรรจุ, รอบอนุมานจากล็อตอบแห้งล่าสุดของพืชเดียวกันที่อบก่อนหรือวันเดียวกัน
    const packYears = (b) => {
      const d = b.processedDate ? new Date(b.processedDate) : null;
      return d && !isNaN(d) ? [String(d.getFullYear() + 543)] : [];
    };
    const packCycles = (b) => {
      const dt = new Date(b.processedDate);
      const src = dryingBatches.find(x => x.herbType === b.herbType && !isNaN(dt) && new Date(x.processedDate) <= dt);
      return src ? batchCycles(src) : [];
    };
    const canYearOptions = [...new Set([nowBE, ...filteredPackBatches.flatMap(packYears)])].sort((a, b) => b - a);
    const canCycleOptions = ['1', '2'];
    const canHistoryBatches = filteredPackBatches.filter(b => {
      if (this.canYearFilter !== 'all' && !packYears(b).includes(this.canYearFilter)) return false;
      if (this.canMonthFilter !== 'all' && monthOf(b) !== this.canMonthFilter) return false;
      if (this.canCycleFilter !== 'all' && packCycles(b).length > 0 && !packCycles(b).includes(this.canCycleFilter)) return false;
      return true;
    });
    const canHistoryKg = canHistoryBatches.reduce((sum, b) => sum + (parseFloat(b.dryUsedKg) || 0), 0);
    const canHistoryJars = canHistoryBatches.reduce((sum, b) => sum + (parseInt(b.jarsProduced) || 0), 0);

    const pricePerKg = appState.getProductPrice(selectedPool.herb, 'กก.');
    const pricePerJar = appState.getProductPrice(selectedPool.herb, 'กระป๋อง');
    const products = appState.getProducts();
    const cannedProduct = products.find(p => (p.unit === 'กระป๋อง' || p.unit === 'กระป๋อง') && (p.category.includes(selectedPool.herb) || p.name.includes(selectedPool.herb))) || {
      id: selectedPool.isChrys ? 'PRD-003' : 'PRD-004',
      name: selectedPool.isChrys ? 'เก๊กฮวยกระป๋อง (50 G)' : 'คาโมมายล์กระป๋อง (50 G)',
      stock: selectedPool.isChrys ? 100 : 50,
      price: pricePerJar
    };
    const currentJarsInStock = cannedProduct.stock || 0;
    const availableDryKg = selectedPool.actualDryKg;
    const potentialJars = Math.floor(availableDryKg * 20);
    const potentialJarsValue = potentialJars * pricePerJar;

    return `
      <div class="fade-in space-y-6 pb-12 max-w-7xl mx-auto">
        
        <!-- 1. Executive Header & Segmented Control -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <span class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-700 via-teal-600 to-emerald-500 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-700/20">
                <i class="fa-solid ${this.mode === 'canning' ? 'fa-jar' : 'fa-fire-burner'}"></i>
              </span>
              <span>${this.mode === 'canning' ? 'แปรรูปสินค้า' : 'กระบวนการแปรรูปสมุนไพร'}</span>
            </h1>
            <p class="text-sm text-gray-500 mt-1 font-medium flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>${this.mode === 'canning' ? 'เลือกสินค้าที่เพิ่มไว้ในคลัง (เช่น ซอง 30 กรัม, กระป๋อง 50 กรัม) แล้วแปรรูปจากดอกแห้ง' : 'จัดการผลผลิตสด และอบแห้ง'}</span>
            </p>
          </div>

          <!-- Segmented Control with Herb Icons & Rich Colors -->
          <div class="flex items-center p-1.5 bg-gray-100 rounded-2xl border border-gray-200 shrink-0 shadow-inner gap-1">
            ${herbTypes.map(h => {
              const isActive = h === currentSelectedHerb;
              const isChrys = h.includes('เก๊กฮวย');
              const allRoadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
              const icon = allRoadmaps[h]?.icon || getHerbDefaultIcon(h);
              const activeClass = isChrys
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold shadow-md shadow-amber-500/25 border-amber-400'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-600/25 border-emerald-500';
              const inactiveClass = 'text-gray-600 hover:text-gray-900 hover:bg-white/80 font-medium border-transparent';
              return `
                <button data-herb="${h}" class="fresh-herb-pill-btn px-5 py-2 rounded-xl text-sm transition-all cursor-pointer border flex items-center gap-2 ${isActive ? activeClass : inactiveClass}">
                  <span class="text-base">${icon}</span>
                  <span>${h}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 2. Vibrant Colorful KPI Summary Cards (4 Cards) -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Card 1: ดอกสดรออบ -->
          <div class="bg-gradient-to-br from-emerald-50/90 via-green-50/40 to-white p-5 rounded-2xl border-2 border-emerald-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all group">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">ดอกสดรออบ</span>
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg shadow-2xs group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-leaf"></i>
              </div>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-mono tracking-tight">${selectedPool.pendingFreshKg.toFixed(1)}</span>
                <span class="text-sm font-bold text-emerald-700">กก.</span>
              </div>
              <div class="mt-2.5">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200/80">
                  <i class="fas fa-seedling text-emerald-600"></i>
                  ${cropsForHerb.filter(c => !c.isProcessed).length} แปลงเพาะปลูก
                </span>
              </div>
            </div>
          </div>

          <!-- Card 2: ดอกแห้งในคลัง -->
          <div class="bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white p-5 rounded-2xl border-2 border-amber-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all group">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-amber-900 uppercase tracking-wider">ดอกแห้งในคลัง (Bulk)</span>
              <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg shadow-2xs group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-box-open"></i>
              </div>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-3xl sm:text-4xl font-extrabold text-amber-950 font-mono tracking-tight">${selectedPool.actualDryKg.toFixed(1)}</span>
                <span class="text-sm font-bold text-amber-700">กก.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Tab Content Area -->
        <div class="pt-2">
          ${this.activeTab === 'drying' ? `
            <!-- ===== TAB 1: อบแห้ง ===== -->
            <div class="space-y-6">
              
              <!-- Clean Process Pipeline Card -->
              ${this.renderProcessFlowCard(selectedPool)}

              <!-- ประวัติการอบแห้ง -->
              <div class="bg-white rounded-3xl border-2 border-emerald-100 shadow-md overflow-hidden">
                <div class="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between flex-wrap gap-4">
                  <div class="flex items-center gap-3">
                    <span class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-base">
                      <i class="fa-solid fa-clock-rotate-left"></i>
                    </span>
                    <div>
                      <h3 class="text-base font-bold">ประวัติการอบแห้ง</h3>
                      <p class="text-xs text-emerald-200 mt-0.5">รวม ${dryHistoryBatches.length} รอบ · สด ${dryHistoryFresh.toFixed(1)} กิโลกรัม · แห้ง ${dryHistoryDry.toFixed(1)} กิโลกรัม</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <select id="dry-history-year-filter" class="px-3 py-1.5 rounded-xl border border-white/30 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer">
                      <option value="all" ${this.dryYearFilter === 'all' ? 'selected' : ''}>ทุกปี</option>
                      ${dryYearOptions.map(y => `<option value="${y}" ${this.dryYearFilter === y ? 'selected' : ''}>ปี ${y}</option>`).join('')}
                    </select>
                    <select id="dry-history-month-filter" class="px-3 py-1.5 rounded-xl border border-white/30 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer">
                      ${monthOptionsHtml(this.dryMonthFilter)}
                    </select>
                    <select id="dry-history-cycle-filter" class="px-3 py-1.5 rounded-xl border border-white/30 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer">
                      <option value="all" ${this.dryCycleFilter === 'all' ? 'selected' : ''}>ทุกรอบ</option>
                      ${dryCycleOptions.map(r => `<option value="${r}" ${this.dryCycleFilter === r ? 'selected' : ''}>รอบ ${r}</option>`).join('')}
                    </select>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-emerald-50/80 border-b-2 border-emerald-200 text-sm font-bold text-emerald-950 tracking-wider">
                      <tr>
                        <th class="px-6 py-4 whitespace-nowrap">วันที่อบ</th>
                        <th class="px-6 py-4 whitespace-nowrap">รหัสล็อต</th>
                        <th class="px-6 py-4 whitespace-nowrap">รอบเพาะปลูก</th>
                        <th class="px-6 py-4 whitespace-nowrap text-right">สด (กิโลกรัม)</th>
                        <th class="px-6 py-4 whitespace-nowrap text-right">แห้ง (กิโลกรัม)</th>
                        <th class="px-6 py-4 whitespace-nowrap">หมายเหตุ</th>
                        <th class="px-6 py-4 whitespace-nowrap text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-base font-medium text-slate-800">
                      ${dryHistoryBatches.length === 0 ? `
                        <tr>
                          <td colspan="7" class="px-6 py-12 text-center text-slate-400 font-medium">
                            ไม่มีประวัติการอบแห้ง
                          </td>
                        </tr>
                      ` : dryHistoryBatches.map(b => {
                        const freshUsed = parseFloat(b.freshWeightKg) || 0;
                        const dryYield = parseFloat(b.dryWeightKg) || 0;
                        const ratioStr = String(parseFloat(b.ratioActual || (freshUsed / (dryYield || 1)).toFixed(2)) || 0); // ตัด .00 ออก เช่น 8.00 → 8
                        const cropRounds = (b.cropIds || []).join(', ') || '-';
                        return `
                          <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-slate-600">${formatThaiDate(b.processedDate)}</td>
                            <td class="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900">${b.id || '-'}</td>
                            <td class="px-6 py-4 text-sm text-slate-700 max-w-[260px]">${cropRounds}</td>
                            <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-emerald-800 font-bold">${freshUsed.toFixed(1)}</td>
                            <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-amber-900 font-bold">${dryYield.toFixed(1)}</td>
                            <td class="px-6 py-4 text-slate-600">${b.note || '-'}</td>
                            <td class="px-6 py-4 text-center whitespace-nowrap">
                              <button class="delete-dry-batch-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                data-batch-id="${b.id}" title="ลบประวัติการอบแห้งล็อตนี้">
                                <i class="fas fa-trash-alt text-xs"></i>
                                <span>ลบ</span>
                              </button>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ` : this.activeTab === 'canning' ? `
            <!-- ===== TAB 2: แปรรูปบรรจุกระป๋อง ===== -->
            <div class="space-y-6">
              
              <!-- Clean Process Pipeline Card -->
              ${this.renderCanningProcessCard(selectedPool)}

              <!-- ประวัติแปรรูปสินค้า -->
              <div class="bg-white rounded-3xl border-2 border-teal-100 shadow-md overflow-hidden">
                <div class="px-6 py-4 bg-gradient-to-r from-teal-800 to-emerald-800 text-white flex items-center justify-between flex-wrap gap-4">
                  <div class="flex items-center gap-3">
                    <span class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-base">
                      <i class="fa-solid fa-clock-rotate-left"></i>
                    </span>
                    <div>
                      <h3 class="text-base font-bold">ประวัติแปรรูปสินค้า</h3>
                      <p class="text-xs text-teal-100 mt-0.5">รวม ${canHistoryBatches.length} ล็อต · ใช้ดอกแห้ง ${canHistoryKg.toFixed(1)} กิโลกรัม · ได้ ${canHistoryJars} หน่วย</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <select id="can-history-year-filter" class="px-3 py-1.5 rounded-xl border border-white/30 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 cursor-pointer">
                      <option value="all" ${this.canYearFilter === 'all' ? 'selected' : ''}>ทุกปี</option>
                      ${canYearOptions.map(y => `<option value="${y}" ${this.canYearFilter === y ? 'selected' : ''}>ปี ${y}</option>`).join('')}
                    </select>
                    <select id="can-history-month-filter" class="px-3 py-1.5 rounded-xl border border-white/30 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 cursor-pointer">
                      ${monthOptionsHtml(this.canMonthFilter)}
                    </select>
                    <select id="can-history-cycle-filter" class="px-3 py-1.5 rounded-xl border border-white/30 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 cursor-pointer">
                      <option value="all" ${this.canCycleFilter === 'all' ? 'selected' : ''}>ทุกรอบ</option>
                      ${canCycleOptions.map(r => `<option value="${r}" ${this.canCycleFilter === r ? 'selected' : ''}>รอบ ${r}</option>`).join('')}
                    </select>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-teal-50/80 border-b-2 border-teal-200 text-sm font-bold text-teal-950 tracking-wider">
                      <tr>
                        <th class="px-6 py-4 whitespace-nowrap">วันที่แปรรูป</th>
                        <th class="px-6 py-4 whitespace-nowrap">รหัสล็อต</th>
                        <th class="px-6 py-4 whitespace-nowrap text-right">ดอกแห้งใช้ไป (กิโลกรัม)</th>
                        <th class="px-6 py-4 whitespace-nowrap text-right">สินค้าที่ได้</th>
                        <th class="px-6 py-4 whitespace-nowrap">หมายเหตุ</th>
                        <th class="px-6 py-4 whitespace-nowrap text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-base font-medium text-slate-800">
                      ${canHistoryBatches.length === 0 ? `
                        <tr>
                          <td colspan="6" class="px-6 py-12 text-center text-slate-400 font-medium">ไม่มีประวัติแปรรูปสินค้า</td>
                        </tr>
                      ` : canHistoryBatches.map(b => `
                        <tr class="hover:bg-slate-50/50 transition-colors">
                          <td class="px-6 py-4 whitespace-nowrap text-slate-600">${formatThaiDate(b.processedDate)}</td>
                          <td class="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900">${b.id || '-'}</td>
                          <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-amber-900 font-bold">${(parseFloat(b.dryUsedKg) || 0).toFixed(1)}</td>
                          <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-teal-900 font-extrabold">${b.productName ? b.productName + ' · ' : ''}${b.jarsProduced} ${b.unit || 'กระป๋อง'}</td>
                          <td class="px-6 py-4 text-slate-600">${b.note || '-'}</td>
                          <td class="px-6 py-4 text-center whitespace-nowrap">
                            <button class="delete-pack-batch-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                              data-batch-id="${b.id}" title="ลบประวัติแปรรูปสินค้าล็อตนี้">
                              <i class="fas fa-trash-alt text-xs"></i>
                              <span>ลบ</span>
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ` : `
            <!-- ===== TAB 3: ประวัติย้อนหลัง ===== -->
            <div class="space-y-6">
              
              <!-- Subtab Switcher -->
              <div class="flex items-center gap-2 mb-4 p-1.5 bg-gray-100 rounded-2xl border border-gray-200 w-fit">
                <button data-subtab="drying" class="fresh-hist-subtab-btn px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  this.historySubTab === 'drying' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/25' : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/80'
                }">
                  <i class="fa-solid fa-fire-alt text-base"></i>
                  <span>รอบการอบแห้ง (${filteredBatches.length})</span>
                </button>
                <button data-subtab="canning" class="fresh-hist-subtab-btn px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  this.historySubTab === 'canning' ? 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white shadow-md shadow-teal-700/25' : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/80'
                }">
                  <i class="fa-solid fa-jar text-base"></i>
                  <span>ประวัติแปรรูปสินค้า (${filteredPackBatches.length})</span>
                </button>
              </div>

              ${this.historySubTab === 'drying' ? `
                <div class="bg-white rounded-3xl border-2 border-amber-200 shadow-md overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                      <thead class="bg-amber-50/90 border-b-2 border-amber-200 text-sm font-bold text-amber-950 tracking-wider">
                        <tr>
                          <th class="px-6 py-4 whitespace-nowrap">วันที่อบ</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">สด (กก.)</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">แห้ง (กก.)</th>
                          <th class="px-6 py-4 whitespace-nowrap">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 text-sm font-medium text-gray-800">
                        ${filteredBatches.length === 0 ? `
                          <tr>
                            <td colspan="4" class="px-6 py-12 text-center text-gray-400 font-medium">ไม่มีประวัติการอบแห้ง</td>
                          </tr>
                        ` : filteredBatches.map(b => {
                          const freshUsed = parseFloat(b.freshWeightKg) || 0;
                          const dryYield = parseFloat(b.dryWeightKg) || 0;
                          const ratioStr = String(parseFloat(b.ratioActual || (freshUsed / (dryYield || 1)).toFixed(2)) || 0); // ตัด .00 ออก เช่น 8.00 → 8
                          return `
                            <tr class="hover:bg-amber-50/40 transition-colors">
                              <td class="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">${formatThaiDate(b.processedDate)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-emerald-800 font-bold">${freshUsed.toFixed(1)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-amber-900 font-bold">${dryYield.toFixed(1)}</td>
                              <td class="px-6 py-4 text-gray-600">${b.note || '-'}</td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              ` : `
                <div class="bg-white rounded-3xl border-2 border-teal-200 shadow-md overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                      <thead class="bg-teal-50/90 border-b-2 border-teal-200 text-sm font-bold text-teal-950 tracking-wider">
                        <tr>
                          <th class="px-6 py-4 whitespace-nowrap">วันที่แปรรูป</th>
                          <th class="px-6 py-4 whitespace-nowrap">รหัสล็อต</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">ดอกแห้งใช้ไป (กก.)</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">สินค้าที่ได้</th>
                          <th class="px-6 py-4 whitespace-nowrap">ผู้บันทึก</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 text-sm font-medium text-gray-800">
                        ${filteredPackBatches.length === 0 ? `
                          <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-gray-400 font-medium">ไม่มีประวัติการบรรจุ</td>
                          </tr>
                        ` : filteredPackBatches.map(b => {
                          return `
                            <tr class="hover:bg-teal-50/40 transition-colors">
                              <td class="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">${formatThaiDate(b.processedDate)}</td>
                              <td class="px-6 py-4 whitespace-nowrap font-mono font-bold text-emerald-800">${b.id}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono font-bold text-amber-900">${(parseFloat(b.dryUsedKg) || 0).toFixed(1)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-teal-900 font-extrabold text-base">${b.jarsProduced} ${b.unit || 'กป.'}</td>
                              <td class="px-6 py-4 text-gray-600">${b.operatorName || '-'}</td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              `}
            </div>
          `}
        </div>
      </div>
    `;
  },

  renderProcessFlowCard(pool) {
    const isReadyToDry = pool.pendingFreshKg > 0;
    const estDryYield = (pool.pendingFreshKg / 10).toFixed(1);
    return `
      <div class="bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/80 rounded-3xl border-2 border-emerald-300 shadow-md p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        
        <!-- Left: Fresh Harvest -->
        <div class="flex flex-col items-center flex-1 text-center w-full">
          <div class="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-800 border-2 border-emerald-300 flex items-center justify-center mb-3 text-3xl shadow-sm">
            <i class="fa-solid fa-leaf"></i>
          </div>
          <div class="text-sm font-bold text-emerald-900 mb-0.5">ผลผลิตสดรออบ</div>
          <div class="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-mono tracking-tight">${pool.pendingFreshKg.toFixed(1)} <span class="text-base text-emerald-700 font-bold">กก.</span></div>
          <span class="inline-flex items-center gap-1 mt-2.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <i class="fas fa-clock text-emerald-600"></i> รอเข้าเตาอบรอบถัดไป
          </span>
        </div>

        <!-- Middle: Action Transform Button -->
        <div class="flex flex-col items-center flex-1 w-full md:w-auto relative">
          <button data-herb="${pool.herb}" class="start-drying-pool-btn bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3.5 rounded-2xl text-base font-bold transition-all shadow-lg hover:shadow-orange-500/30 active:scale-95 flex items-center gap-2.5 cursor-pointer ${!isReadyToDry ? 'opacity-50 cursor-not-allowed' : ''}" ${!isReadyToDry ? 'disabled' : ''}>
            <i class="fa-solid fa-fire-alt text-lg text-yellow-200"></i>
            <span>นำเข้าเตาอบแห้ง</span>
          </button>
        </div>

        <!-- Right: Dry Yield -->
        <div class="flex flex-col items-center flex-1 text-center w-full">
          <div class="w-20 h-20 rounded-2xl bg-amber-100 text-amber-800 border-2 border-amber-300 flex items-center justify-center mb-3 text-3xl shadow-sm">
            <i class="fa-solid fa-box-open"></i>
          </div>
          <div class="text-sm font-bold text-amber-900 mb-0.5">ดอกแห้งในคลัง</div>
          <div class="text-3xl sm:text-4xl font-extrabold text-amber-950 font-mono tracking-tight">${pool.actualDryKg.toFixed(1)} <span class="text-base text-amber-700 font-bold">กก.</span></div>
          <span class="inline-flex items-center gap-1 mt-2.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <i class="fas fa-check-circle text-amber-600"></i> พร้อมจำหน่าย / บรรจุกระป๋อง
          </span>
        </div>

      </div>
    `;
  },

  renderCanningProcessCard(pool) {
    const dryKg = pool.dryStockKg || 0;
    const herbProducts = appState.getProducts().filter(p =>
      p.unit !== 'กก.' && p.unit !== 'kg' && appState.getProductHerb(p) === pool.herb);
    const isReadyToPack = dryKg > 0 && herbProducts.length > 0;
    const hint = herbProducts.length === 0
      ? `ยังไม่มีสินค้าแปรรูปของดอก${pool.herb} · ไปเพิ่มสินค้าที่หน้า "7. คลังและสต็อกรวม" ก่อน`
      : (dryKg <= 0 ? 'ยังไม่มีดอกแห้งในคลัง · ไปอบแห้งก่อน' : '');

    return `
      <div class="bg-gradient-to-br from-amber-50/70 via-white to-teal-50/70 rounded-3xl border-2 border-teal-300 shadow-md p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">

        <!-- Left: Dry Herb -->
        <div class="flex flex-col items-center flex-1 text-center w-full">
          <div class="w-20 h-20 rounded-2xl bg-amber-100 text-amber-800 border-2 border-amber-300 flex items-center justify-center mb-3 text-3xl shadow-sm">
            <i class="fa-solid fa-box-open"></i>
          </div>
          <div class="text-sm font-bold text-amber-900 mb-0.5">ดอกแห้งในคลัง</div>
          <div class="text-3xl sm:text-4xl font-extrabold text-amber-950 font-mono tracking-tight">${dryKg.toFixed(2)} <span class="text-base text-amber-700 font-bold">กิโลกรัม</span></div>
        </div>

        <!-- Middle: Action -->
        <div class="flex flex-col items-center flex-1 w-full md:w-auto relative">
          <button data-herb="${pool.herb}" class="start-canning-pool-btn bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white px-8 py-3.5 rounded-2xl text-base font-bold transition-all shadow-lg hover:shadow-teal-500/30 active:scale-95 flex items-center gap-2.5 cursor-pointer ${!isReadyToPack ? 'opacity-50 cursor-not-allowed' : ''}" ${!isReadyToPack ? 'disabled' : ''}>
            <i class="fa-solid fa-jar text-lg"></i>
            <span>แปรรูปสินค้า</span>
          </button>
          ${hint ? `<p class="text-xs text-gray-500 mt-3 text-center max-w-xs">${hint}</p>` : ''}
        </div>

        <!-- Right: Finished products -->
        <div class="flex flex-col items-center flex-1 text-center w-full">
          <div class="w-20 h-20 rounded-2xl bg-teal-100 text-teal-800 border-2 border-teal-300 flex items-center justify-center mb-3 text-3xl shadow-sm">
            <i class="fa-solid fa-jar"></i>
          </div>
          <div class="space-y-1 text-sm">
            ${herbProducts.length === 0 ? '<div class="text-gray-400">ยังไม่มีสินค้าแปรรูป</div>' : herbProducts.map(p => `
              <div class="text-teal-950"><span class="font-bold">${p.name}</span> <span class="font-mono font-extrabold text-teal-800">${(parseFloat(p.stock) || 0).toLocaleString()}</span> <span class="text-teal-700">${p.unit}</span></div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  },


    init() {
    this.bindEvents();
  },

  bindEvents() {
    // 1. Plant Switcher Pills
    const herbPills = document.querySelectorAll('.fresh-herb-pill-btn');
    herbPills.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const herb = btn.getAttribute('data-herb');
        if (herb && herb !== this.selectedHerb) {
          this.selectedHerb = herb;
          this.refreshView();
        }
      });
    });

    // 2. Tab Navigation
    const tabBtns = document.querySelectorAll('.fresh-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-tab');
        if (tab && tab !== 'history' && tab !== this.activeTab) {
          this.activeTab = tab;
          this.refreshView();
        }
      });
    });

    // 3. History Sub-tab Switcher
    const histSubTabBtns = document.querySelectorAll('.fresh-hist-subtab-btn');
    histSubTabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const subtab = btn.getAttribute('data-subtab');
        if (subtab && subtab !== this.historySubTab) {
          this.historySubTab = subtab;
          this.refreshView();
        }
      });
    });

    // 3.5 ตัวกรองปี / รอบ ของประวัติการอบแห้ง
    const dryYearSel = document.getElementById('dry-history-year-filter');
    if (dryYearSel) {
      dryYearSel.addEventListener('change', (e) => {
        this.dryYearFilter = e.target.value;
        this.refreshView();
      });
    }
    const dryMonthSel = document.getElementById('dry-history-month-filter');
    if (dryMonthSel) {
      dryMonthSel.addEventListener('change', (e) => {
        this.dryMonthFilter = e.target.value;
        this.refreshView();
      });
    }
    const canMonthSel = document.getElementById('can-history-month-filter');
    if (canMonthSel) {
      canMonthSel.addEventListener('change', (e) => {
        this.canMonthFilter = e.target.value;
        this.refreshView();
      });
    }
    const dryCycleSel = document.getElementById('dry-history-cycle-filter');
    if (dryCycleSel) {
      dryCycleSel.addEventListener('change', (e) => {
        this.dryCycleFilter = e.target.value;
        this.refreshView();
      });
    }

    // 3.55 ตัวกรอง + ปุ่มลบ ของประวัติแปรรูปสินค้า
    const canYearSel = document.getElementById('can-history-year-filter');
    if (canYearSel) {
      canYearSel.addEventListener('change', (e) => {
        this.canYearFilter = e.target.value;
        this.refreshView();
      });
    }
    const canCycleSel = document.getElementById('can-history-cycle-filter');
    if (canCycleSel) {
      canCycleSel.addEventListener('change', (e) => {
        this.canCycleFilter = e.target.value;
        this.refreshView();
      });
    }
    document.querySelectorAll('.delete-pack-batch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const batchId = btn.getAttribute('data-batch-id');
        if (!batchId) return;
        if (!confirm(`ลบประวัติแปรรูปสินค้าล็อต ${batchId} ใช่หรือไม่?\n\nดอกแห้งที่ใช้บรรจุจะถูกคืนเข้าคลัง และจำนวนกระป๋องของล็อตนี้จะถูกหักออกจากสต็อก`)) return;
        try {
          appState.deletePackagingBatch(batchId);
          showToast(`ลบประวัติแปรรูปสินค้าล็อต ${batchId} เรียบร้อยแล้ว`, 'success');
          this.refreshView();
        } catch (err) {
          showToast(err.message || 'ลบประวัติแปรรูปสินค้าไม่สำเร็จ', 'error');
        }
      });
    });

    // 3.6 ปุ่มลบประวัติการอบแห้ง
    document.querySelectorAll('.delete-dry-batch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const batchId = btn.getAttribute('data-batch-id');
        if (!batchId) return;
        if (!confirm(`ลบประวัติการอบแห้งล็อต ${batchId} ใช่หรือไม่?\n\nรอบเพาะปลูกที่อยู่ในล็อตนี้จะกลับไปเป็น "รออบ" และดอกแห้งของล็อตนี้จะถูกหักออกจากคลัง`)) return;
        try {
          appState.deleteDryingBatch(batchId);
          showToast(`ลบประวัติการอบแห้งล็อต ${batchId} เรียบร้อยแล้ว`, 'success');
          this.refreshView();
        } catch (err) {
          showToast(err.message || 'ลบประวัติการอบแห้งไม่สำเร็จ', 'error');
        }
      });
    });

    // 4. Action buttons (Drying)
    const startDryingBtns = document.querySelectorAll('.start-drying-pool-btn');
    startDryingBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const herb = btn.getAttribute('data-herb');
        if (herb) this.openHerbDryingModal(herb);
      });
    });

    // 5. Action buttons (Canning - ดอกแห้ง ➔ แบบกระป๋อง)
    const startCanningBtns = document.querySelectorAll('.start-canning-pool-btn');
    startCanningBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const herb = btn.getAttribute('data-herb');
        if (herb) this.openCanningModal(herb);
      });
    });

    // 6. Edit herb price buttons
    const editPriceBtns = document.querySelectorAll('.edit-herb-price-btn');
    editPriceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prodId = btn.getAttribute('data-prodid');
        if (prodId) this.openQuickEditPriceModal(prodId);
      });
    });

    // 7. Edit fresh harvest / buying price buttons
    const editHarvestBtns = document.querySelectorAll('.edit-fresh-harvest-btn');
    editHarvestBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cropId = btn.getAttribute('data-crop-id');
        if (cropId) this.openEditHarvestModal(cropId);
      });
    });

    // 8. Edit drying ratio button in Card 4 (กระบวนการแปรรูปสมุนไพร)
    const editRatioBtn = document.getElementById('edit-drying-ratio-btn');
    if (editRatioBtn) {
      editRatioBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const herb = editRatioBtn.getAttribute('data-herb') || this.selectedHerb;
        this.openEditRatioModal(herb);
      });
    }
  },

  openEditRatioModal(herbName) {
    const currentRatio = this.getHerbRatio(herbName);
    const modalHtml = `
      <form id="edit-drying-ratio-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
          <div class="space-y-2">
            <label for="drying-ratio-input" class="block text-sm font-bold text-gray-700 uppercase">
              อัตราส่วนการอบแห้ง (สด : แห้ง 1 กก.) *
            </label>
            <div class="relative">
              <input type="number" id="drying-ratio-input" name="standardRatio" required min="1" max="25" step="0.1" value="${currentRatio}"
                class="w-full pl-5 pr-20 py-3 rounded-xl border-2 border-emerald-400 text-2xl font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute right-4 top-3.5 text-base font-bold text-gray-400 pointer-events-none">
                : 1 กก.
              </span>
            </div>
            <p class="text-xs text-gray-400">
              เช่น ระบุ 8.0 หมายถึง ดอกสด 8 กิโลกรัม จะอบแห้งได้ดอกแห้ง 1 กิโลกรัม
            </p>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 active:scale-95">
            <i class="fas fa-save"></i> บันทึกอัตราส่วน
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `ปรับสูตรอบแห้ง: ${herbName}`,
      icon: 'fa-solid fa-scale-balanced',
      size: 'max-w-md',
      headerColor: 'bg-emerald-800',
      content: modalHtml,
      onRender: (dialog) => {
        const ratioInput = dialog.querySelector('#drying-ratio-input');
        const form = dialog.querySelector('#edit-drying-ratio-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newRatio = parseFloat(ratioInput ? ratioInput.value : 0);
            if (!newRatio || newRatio <= 0) {
              showToast('กรุณาระบุอัตราส่วนที่มากกว่า 0', 'error');
              return;
            }

            try {
              appState.setHerbRatio(herbName, newRatio);
              closeGlobalModal();
              showToast(`อัปเดตอัตราส่วนการอบแห้งของ "${herbName}" เป็น ${newRatio}:1 เรียบร้อยแล้ว`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  openEditHarvestModal(cropId) {
    const crop = appState.getCropById(cropId);
    if (!crop) return;

    const plots = appState.getPlots();
    const plot = plots.find(p => p.id === crop.plotId);
    const members = appState.getMembers();
    const owner = plot ? members.find(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : null;
    const cHerb = (crop.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย');
    const masterHerb = appState.getHerbByName ? (appState.getHerbByName(cHerb) || appState.getHerbById(cHerb)) : null;
    const currentPrice = typeof crop.freshBuyingPrice === 'number' 
      ? crop.freshBuyingPrice 
      : (masterHerb ? (parseFloat(masterHerb.freshBuyingPrice || masterHerb.baselinePriceFresh) || 50) : 50);
    const currentYield = parseFloat(crop.yield) || 0;
    const currentDate = crop.harvestDateActual || crop.harvestDateEst || new Date().toISOString().split('T')[0];
    const initialPayout = currentYield * currentPrice;

    const modalHtml = `
      <form id="edit-fresh-harvest-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
          <!-- Information Banner -->
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <span class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
              <i class="fas fa-weight-scale"></i>
            </span>
            <div class="text-sm text-emerald-950 flex-1">
              <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
                <b class="font-bold text-base text-emerald-900">แก้ไขข้อมูลรับซื้อผลผลิตสด (รหัสล็อต: ${crop.id})</b>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">${cHerb}</span>
              </div>
              <p class="text-emerald-800">
                แปลง: <b>${plot ? plot.name : crop.plotId}</b> | เกษตรกร: <b>${owner ? owner.name : '-'}</b>
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- วันที่เก็บเกี่ยว / รับซื้อ -->
            <div>
              <label for="harvest-date-input" class="block text-sm font-bold text-gray-700 uppercase mb-1">
                วันที่เก็บเกี่ยว / รับซื้อ *
              </label>
              <input type="date" id="harvest-date-input" name="harvestDate" required value="${currentDate}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <!-- ปริมาณผลผลิตสด (กก.) -->
            <div>
              <label for="harvest-yield-input" class="block text-sm font-bold text-gray-700 uppercase mb-1">
                ปริมาณดอกสดที่รับซื้อ (กก.) *
              </label>
              <div class="relative">
                <input type="number" id="harvest-yield-input" name="yield" required min="0.1" step="0.1" value="${currentYield}"
                  class="w-full px-4 pr-12 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
                <span class="absolute right-4 top-2.5 text-sm font-bold text-gray-400 pointer-events-none">กก.</span>
              </div>
            </div>
          </div>

          <!-- ราคารับซื้อสด (บาท/กก.) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="harvest-price-input" class="block text-sm font-bold text-gray-700 uppercase">
                ราคารับซื้อสด (บาท / กก.) *
              </label>
              <span class="text-xs text-gray-500">เกณฑ์กลางระบบ: <b>${masterHerb ? masterHerb.freshBuyingPrice : 50} บ./กก.</b></span>
            </div>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 font-bold text-base">฿</span>
              <input type="number" id="harvest-price-input" name="freshBuyingPrice" required min="0" step="any" value="${currentPrice}"
                class="w-full pl-9 pr-20 py-3 rounded-xl border-2 border-emerald-400 text-2xl font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-sm font-bold text-gray-500 pointer-events-none">
                บาท / กก.
              </span>
            </div>
            <p class="text-xs text-gray-400">
              * สามารถปรับราคาเฉพาะล็อตนี้ได้ตามคุณภาพผลผลิต (เกรด A/B) หรือหักลดตามความชื้น
            </p>
          </div>

          <!-- สรุปยอดเงินจ่ายรับซื้อ Realtime -->
          <div class="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-xs font-bold text-emerald-800 uppercase block">ยอดเงินรับซื้อที่ต้องจ่ายให้เกษตรกร</span>
              <span class="text-xs text-emerald-600">คำนวณจาก (ปริมาณสด × ราคารับซื้อต่อ กก.)</span>
            </div>
            <div class="text-right">
              <span id="harvest-total-payout-display" class="text-2xl font-extrabold text-emerald-950 font-mono">
                ${formatBaht(initialPayout)}
              </span>
            </div>
          </div>

          <!-- หมายเหตุ -->
          <div>
            <label for="harvest-note-input" class="block text-sm font-bold text-gray-700 uppercase mb-1">
              หมายเหตุการรับซื้อ
            </label>
            <input type="text" id="harvest-note-input" name="harvestNote" value="${crop.harvestNote || ''}" placeholder="เช่น ดอกสดคัดเกรด A ความชื้นปกติ"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 active:scale-95">
            <i class="fas fa-save"></i> บันทึกข้อมูลรับซื้อ
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `แก้ไขการรับซื้อผลผลิตสด: ล็อต ${crop.id}`,
      icon: 'fas fa-pen-to-square',
      size: 'max-w-lg',
      headerColor: 'bg-emerald-800',
      content: modalHtml,
      onRender: (dialog) => {
        const yieldInput = dialog.querySelector('#harvest-yield-input');
        const priceInput = dialog.querySelector('#harvest-price-input');
        const payoutDisplay = dialog.querySelector('#harvest-total-payout-display');

        const updatePayout = () => {
          const y = parseFloat(yieldInput ? yieldInput.value : 0) || 0;
          const p = parseFloat(priceInput ? priceInput.value : 0) || 0;
          if (payoutDisplay) payoutDisplay.textContent = formatBaht(y * p);
        };

        if (yieldInput) yieldInput.addEventListener('input', updatePayout);
        if (priceInput) priceInput.addEventListener('input', updatePayout);

        const form = dialog.querySelector('#edit-fresh-harvest-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newDate = dialog.querySelector('#harvest-date-input').value;
            const newYield = parseFloat(yieldInput ? yieldInput.value : 0) || 0;
            const newPrice = parseFloat(priceInput ? priceInput.value : 0) || 0;
            const newNote = (dialog.querySelector('#harvest-note-input').value || '').trim();

            if (newYield <= 0) {
              showToast('กรุณาระบุปริมาณดอกสดที่มากกว่า 0', 'error');
              return;
            }
            if (newPrice < 0) {
              showToast('ราคารับซื้อต้องไม่ติดลบ', 'error');
              return;
            }

            try {
              appState.updateCrop(cropId, {
                harvestDateActual: newDate,
                yield: newYield,
                freshBuyingPrice: newPrice,
                harvestNote: newNote
              });
              closeGlobalModal();
              showToast(`บันทึกการแก้ไขรับซื้อผลผลิตสดล็อต ${cropId} สำเร็จ (ยอดเงิน ${formatBaht(newYield * newPrice)})`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  openQuickEditPriceModal(productId) {
    const product = appState.getProductById(productId);
    if (!product) return;

    const modalHtml = `
      <form id="global-quick-price-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-sm font-bold text-emerald-800 uppercase block">กำหนดราคาจำหน่ายผลผลิต</span>
              <h3 class="text-base font-bold text-emerald-950">${product.name}</h3>
              <span class="text-sm text-emerald-700 font-medium">รหัสสินค้า: <b>${product.id}</b> | หมวดหมู่: <b>${product.category || 'ทั่วไป'}</b></span>
            </div>
            <div class="text-right">
              <span class="text-sm text-gray-500 block">ราคาปัจจุบัน:</span>
              <span class="text-xl font-bold text-emerald-800">${formatBaht(product.price)}</span>
              <span class="text-sm text-gray-500 font-medium block">ต่อ ${product.unit}</span>
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="quick-price-input" class="block text-sm font-bold text-gray-700 uppercase">
              ระบุราคาขายใหม่ (บาท / ${product.unit}) *
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 font-bold text-base">฿</span>
              <input type="number" id="quick-price-input" name="price" required min="0" step="any" value="${product.price}"
                class="w-full pl-9 pr-16 py-3 rounded-xl border-2 border-emerald-400 text-2xl font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-sm font-bold text-gray-500 pointer-events-none">
                บาท / ${product.unit}
              </span>
            </div>
            <p class="text-sm text-gray-400">
              ราคาที่แก้ไขจะถูกนำไปใช้อ้างอิงการตัดสต็อก การคำนวณมูลค่าในคลัง และการสรุปรายงานการเงินโดยอัตโนมัติ
            </p>
          </div>

          <div class="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <span class="text-sm font-bold text-gray-700 block uppercase">
              <i class="fas fa-calculator text-emerald-700 mr-1"></i> ตัวอย่างการคำนวณมูลค่าตามราคาใหม่
            </span>
            <div id="quick-price-preview-calc" class="grid grid-cols-3 gap-2.5 pt-1 text-center">
              ${this.renderPriceCalculationGrid(product.unit, product.price)}
            </div>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 active:scale-95">
            <i class="fas fa-save"></i> บันทึกราคาใหม่
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `แก้ไขราคาขาย: ${product.name}`,
      icon: 'fas fa-pen-to-square',
      size: 'max-w-lg',
      headerColor: 'bg-emerald-700',
      content: modalHtml,
      onRender: (dialog) => {
        const priceInput = dialog.querySelector('#quick-price-input');
        const previewContainer = dialog.querySelector('#quick-price-preview-calc');
        if (priceInput && previewContainer) {
          priceInput.addEventListener('input', () => {
            const p = parseFloat(priceInput.value) || 0;
            previewContainer.innerHTML = this.renderPriceCalculationGrid(product.unit, p);
          });
        }

        const form = dialog.querySelector('#global-quick-price-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPrice = parseFloat(priceInput ? priceInput.value : 0);
            if (isNaN(newPrice) || newPrice < 0) {
              showToast('กรุณาระบุราคาที่ถูกต้องและไม่ติดลบ', 'error');
              return;
            }

            try {
              appState.updateProductPrice(productId, newPrice);
              closeGlobalModal();
              showToast(`อัปเดตราคาขาย ${product.name} เป็น ${formatBaht(newPrice)} / ${product.unit} เรียบร้อยแล้ว`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  renderPriceCalculationGrid(unit, price) {
    const isKg = unit === 'กก.' || unit === 'kg';
    if (isKg) {
      return `
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-sm text-gray-500 font-semibold block">1 กก.</span>
          <span class="text-sm font-bold text-emerald-800 font-mono">${(price * 1).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-sm text-gray-500 font-semibold block">5 กก.</span>
          <span class="text-sm font-bold text-emerald-800 font-mono">${(price * 5).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-sm text-gray-500 font-semibold block">10 กก.</span>
          <span class="text-sm font-bold text-emerald-800 font-mono">${(price * 10).toLocaleString()} บ.</span>
        </div>
      `;
    } else {
      return `
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-sm text-gray-500 font-semibold block">1 กระป๋อง</span>
          <span class="text-sm font-bold text-emerald-800 font-mono">${(price * 1).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-sm text-gray-500 font-semibold block">5 กระป๋อง</span>
          <span class="text-sm font-bold text-emerald-800 font-mono">${(price * 5).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-sm text-gray-500 font-semibold block">20 กระป๋อง (~1 กก.)</span>
          <span class="text-sm font-bold text-emerald-800 font-mono">${(price * 20).toLocaleString()} บ.</span>
        </div>
      `;
    }
  },

  refreshView() {
    const appView = document.getElementById('app-view');
    if (appView) {
      appView.innerHTML = this.render();
      this.init();
    }
  },

  // -------------------------------------------------------------
  // Modal: Send Pooled Fresh Flowers to Drying Kiln
  // (Large fonts, simple layout, instant live calculation)
  // -------------------------------------------------------------
  getHerbRatio(h = '') {
    const masterHerb = appState.getHerbByName ? (appState.getHerbByName(h) || appState.getHerbById(h)) : null;
    if (masterHerb && masterHerb.standardRatio) {
      return parseFloat(masterHerb.standardRatio) || 8.0;
    }
    if (h.includes('เก๊กฮวย')) return 8.0;
    if (h.includes('คาโมมายล์')) return 6.0;
    if (h.includes('ชา')) return 5.0;
    if (h.includes('ดาวเรือง')) return 7.5;
    if (h.includes('ฟ้าทะลายโจร')) return 6.0;
    return 8.0;
  },

  getProducePrefix(h = '') {
    if (h.includes('ชา')) return `ใบ${h}`;
    if (h.includes('ดอก') || h.includes('เก๊กฮวย') || h.includes('คาโมมายล์') || h.includes('ดาวเรือง') || h.includes('กุหลาบ') || h.includes('อัญชัน')) return `ดอก${h}`;
    return `ผลผลิต${h}`;
  },

  // -------------------------------------------------------------
  // Modal: Send Pooled Fresh Produce to Drying Kiln
  // (Clear fields: Drying Date, Fresh Produce Used from Total kg, Dry Weight Obtained)
  // -------------------------------------------------------------
  openHerbDryingModal(herb) {
    const allCrops = appState.getCrops();
    const ratio = this.getHerbRatio(herb);
    const producePrefix = this.getProducePrefix(herb);

    // Get pending fresh crops for this herb
    const pendingCrops = appState.getHarvestedOrPurchasedCrops().filter(c => {
      if (c.isProcessed) return false;
      const plot = appState.getPlotById(c.plotId);
      const cHerb = c.seedlingSource || (plot ? plot.plantType : '') || 'เก๊กฮวย';
      return cHerb.includes(herb);
    });

    const pendingFreshWeight = pendingCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
    if (pendingFreshWeight <= 0) {
      showToast(`ไม่มี${producePrefix}สดรอเข้าเตาอบในขณะนี้`, 'info');
      return;
    }

    const defaultDryWeight = '0'; // ให้กรอกน้ำหนักดอกแห้งที่ชั่งได้จริงเอง
    const today = new Date().toISOString().split('T')[0];
    const pricePerKg = appState.getProductPrice(herb, 'กก.');
    const pricePerJar = appState.getProductPrice(herb, 'กระป๋อง');

    const contentHtml = `
      <form id="pool-drying-form" class="p-5 sm:p-6 space-y-5 bg-white text-gray-800 text-sm">

        <!-- วันที่อบ -->
        <div class="flex items-center gap-3">
          <label for="dry-input-date" class="text-sm font-bold text-gray-800 whitespace-nowrap w-28">วันที่อบ</label>
          <input type="text" id="dry-input-date" value="${today}" required
            class="w-40 px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        </div>

        <!-- ผลผลิตสดที่มีทั้งหมด (การ์ดเด่น) -->
        <div class="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between gap-4">
          <div>
            <div class="text-sm font-bold text-amber-900">ผลผลิตสดที่มีทั้งหมด</div>
            <div class="text-xs text-amber-700 mt-0.5">รอเข้าเตาอบ</div>
          </div>
          <div class="text-right">
            <span class="text-4xl font-black text-amber-950 font-mono tracking-tight">${pendingFreshWeight.toFixed(2)}</span>
            <span class="text-base font-bold text-amber-800 ml-1">กิโลกรัม</span>
          </div>
        </div>

        <!-- ใช้ผลผลิตสดเท่าไหร่ -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="dry-input-fresh-weight" class="text-sm font-bold text-gray-800">ผลผลิตสดที่นำเข้าอบ *</label>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input type="number" step="any" min="0.01" max="${pendingFreshWeight}" id="dry-input-fresh-weight" value="${pendingFreshWeight.toFixed(2)}" required
                class="w-full pl-3 pr-20 py-2.5 rounded-xl border border-gray-300 text-lg font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-bold text-gray-500 pointer-events-none">กิโลกรัม</span>
            </div>
          </div>
        </div>

        <!-- ได้แห้งเท่าไหร่ -->
        <div>
          <label for="dry-input-dry-weight" class="block text-sm font-bold text-gray-800 mb-1.5">ได้ดอกแห้งหลังอบเสร็จ *</label>
          <div class="relative">
            <input type="number" step="any" min="0" id="dry-input-dry-weight" value="${defaultDryWeight}" required
              class="w-full pl-3 pr-20 py-2.5 rounded-xl border border-gray-300 text-lg font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
            <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-bold text-emerald-700 pointer-events-none">กิโลกรัม</span>
          </div>
          <p id="dry-over-warning" class="text-xs text-gray-500 mt-1">ชั่งดอกแห้งที่ได้จริงหลังอบเสร็จ แล้วกรอกตัวเลข (ต้องไม่เกินผลผลิตสดที่นำเข้าอบ)</p>
        </div>

        <!-- หมายเหตุ -->
        <div>
          <label for="dry-input-note" class="block text-sm font-bold text-gray-800 mb-1.5">หมายเหตุ (ไม่ใส่ก็ได้)</label>
          <input type="text" id="dry-input-note" placeholder="เช่น ตู้อบ 1"
            class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        </div>

        <div class="pt-3 flex items-center justify-end gap-3 border-t border-gray-200">
          <button type="button" id="cancel-pool-dry-btn" class="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" id="submit-pool-dry-btn" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
            <i class="fas fa-fire-alt"></i>
            <span>ยืนยันบันทึกการอบแห้ง</span>
          </button>
        </div>

      </form>
    `;

    openGlobalModal({
      title: `♨️ บันทึกนำเข้าเตาอบแห้ง (${producePrefix})`,
      icon: '',
      size: 'max-w-lg',
      headerColor: 'bg-[#1e4620]',
      content: contentHtml,
      onRender: (dialog) => {
        // Initialize Flatpickr for Thai Date
        const dateInput = dialog.querySelector('#dry-input-date');
        let selectedDateStr = today;
        if (dateInput && window.flatpickr) {
          window.flatpickr(dateInput, {
            dateFormat: 'Y-m-d',
            locale: 'th',
            defaultDate: today,
            altInput: true,
            altFormat: 'd/m/Y',
            onChange: (selectedDates, dateStr) => {
              selectedDateStr = dateStr;
              updateSummaryText();
            }
          });
        }

        // Elements
        const freshInput = dialog.querySelector('#dry-input-fresh-weight');
        const dryInput = dialog.querySelector('#dry-input-dry-weight');
        const useAllBtn = dialog.querySelector('#use-all-fresh-btn');
        const noteInput = dialog.querySelector('#dry-input-note');
        const summaryText = dialog.querySelector('#dry-live-summary-text');
        const ratioBadge = dialog.querySelector('#dry-live-ratio-badge');

        const checkDryOverFresh = () => {
          const warn = dialog.querySelector('#dry-over-warning');
          if (!freshInput || !dryInput) return;
          const over = (parseFloat(dryInput.value) || 0) > (parseFloat(freshInput.value) || 0) + 0.0001;
          dryInput.classList.toggle('border-red-500', over);
          dryInput.classList.toggle('border-gray-300', !over);
          if (warn) {
            warn.classList.toggle('text-red-600', over);
            warn.classList.toggle('font-bold', over);
            warn.classList.toggle('text-gray-500', !over);
          }
        };
        const updateSummaryText = () => {
          checkDryOverFresh();
          if (!summaryText) return;
          const freshVal = parseFloat(freshInput ? freshInput.value : 0) || 0;
          const dryVal = parseFloat(dryInput ? dryInput.value : 0) || 0;
          const actualRatio = dryVal > 0 ? (freshVal / dryVal).toFixed(2) : ratio.toFixed(2);
          const estDryVal = dryVal * pricePerKg;
          const estJars = Math.floor(dryVal * 20);
          const estJarsVal = estJars * pricePerJar;
          
          summaryText.innerHTML = `
            <div>
              วันที่ <b>${formatThaiDate(selectedDateStr)}</b>: ใช้<b>${producePrefix}สด</b> <b class="text-amber-950 font-bold font-mono">${freshVal.toFixed(2)}</b> กก. (จากทั้งหมด <b>${pendingFreshWeight.toFixed(2)}</b> กก.) ➔ ได้หลังอบเสร็จ <b class="text-emerald-900 font-bold font-mono text-base">${dryVal.toFixed(2)}</b> กก.
            </div>
            <div class="mt-2 pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm text-emerald-950">
              <span class="flex items-center gap-1 font-bold">
                <i class="fas fa-coins text-amber-600"></i>
                <span>ประเมินมูลค่าผลผลิตหลังอบแห้ง:</span>
              </span>
              <div class="flex items-baseline gap-2 font-mono flex-wrap">
                <span class="text-gray-700">ขายแบบแห้ง (${pricePerKg} บ./กก.):</span>
                <b class="text-emerald-800 text-sm font-bold">${formatBaht(estDryVal)}</b>
                <span class="text-gray-400">|</span>
                <span class="text-gray-700">บรรจุกระป๋อง 50 G (~${estJars} กป.):</span>
                <b class="text-amber-800 text-sm font-bold">${formatBaht(estJarsVal)}</b>
              </div>
            </div>
          `;
          if (ratioBadge) {
            ratioBadge.textContent = `อัตราส่วนจริง: ${actualRatio} : 1`;
          }
        };

        // Dynamic Live Ratio Calculation
        const updateDryCalc = () => {
          if (!freshInput || !dryInput) return;
          const val = parseFloat(freshInput.value) || 0;
          updateSummaryText();
        };

        if (freshInput) {
          freshInput.addEventListener('input', updateDryCalc);
        }

        if (dryInput) {
          dryInput.addEventListener('input', updateSummaryText);
        }

        if (useAllBtn && freshInput) {
          useAllBtn.addEventListener('click', () => {
            freshInput.value = pendingFreshWeight.toFixed(2);
            updateDryCalc();
          });
        }

        // Cancel Button
        const cancelBtn = dialog.querySelector('#cancel-pool-dry-btn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', closeGlobalModal);
        }

        // Form Submission
        const form = dialog.querySelector('#pool-drying-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const freshWeight = parseFloat(freshInput ? freshInput.value : 0) || 0;
            const dryWeight = parseFloat(dryInput ? dryInput.value : 0) || 0;
            const date = selectedDateStr || (dateInput ? dateInput.value : '') || today;
            const note = (noteInput ? noteInput.value.trim() : '');

            if (freshWeight <= 0) {
              showToast('กรุณาระบุน้ำหนักผลผลิตสดที่ต้องการอบ', 'error');
              return;
            }
            if (freshWeight > pendingFreshWeight + 0.05) {
              showToast(`น้ำหนักสดที่ระบุ (${freshWeight.toFixed(2)} กก.) เกินกว่ายอดผลผลิตสดรออบ (${pendingFreshWeight.toFixed(2)} กก.)`, 'warning');
              return;
            }
            if (dryWeight <= 0) {
              showToast('กรุณาระบุน้ำหนักแห้งจริงที่ได้หลังอบเสร็จ', 'error');
              return;
            }
            if (dryWeight > freshWeight + 0.0001) {
              showToast(`ดอกแห้งที่ได้ (${dryWeight.toFixed(2)} กิโลกรัม) ต้องไม่เกินผลผลิตสดที่นำเข้าอบ (${freshWeight.toFixed(2)} กิโลกรัม)`, 'error');
              return;
            }

            try {
              appState.processPooledHerbDrying(herb, freshWeight, dryWeight, note, date);
              closeGlobalModal();
              showToast(`บันทึกการอบแห้ง${producePrefix}สดสำเร็จ (ใช้วันที่ ${formatThaiDate(date)} สด ${freshWeight.toFixed(2)} กก. ➔ ได้แห้ง ${dryWeight.toFixed(2)} กก. เข้าคลังสินค้าเรียบร้อย)`, 'success');
              this.refreshView();
            } catch (err) {
              console.error(err);
              showToast(err.message || 'เกิดข้อผิดพลาดในการบันทึกการอบแห้ง', 'error');
            }
          });
        }
      }
    });
  },

  // -------------------------------------------------------------
  // Modal: Process Dry Herbs into Canned / Jar Packaging Products
  // (ดอกแห้ง ➔ แบบกระป๋อง: กรอก กก. ดอกแห้ง -> คำนวณจำนวนกระป๋องและมูลค่าทันที)
  // -------------------------------------------------------------
  openCanningModal(herb) {
    const pool = (() => {
      const inv = appState.getInventory() || [];
      return inv.filter(i => i.herbType && i.herbType.includes(herb))
        .reduce((sum, i) => sum + (parseFloat(i.dryStockKg) || 0), 0);
    })();
    const totalDryAvailable = pool;
    const products = appState.getProducts().filter(p =>
      p.unit !== 'กก.' && p.unit !== 'kg' && appState.getProductHerb(p) === herb);

    if (products.length === 0) {
      showToast(`ยังไม่มีสินค้าแปรรูปของดอก${herb} กรุณาเพิ่มสินค้า (เช่น ซอง 30 กรัม) ที่หน้าคลังสินค้าก่อน`, 'warning');
      return;
    }
    if (totalDryAvailable <= 0) {
      showToast(`ไม่มีดอก${herb}แห้งในคลังสำหรับแปรรูป กรุณาทำการอบแห้งก่อน`, 'warning');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const gramsOf = (p) => appState.getProductPackGrams(p);
    const optionsHtml = products.map(p => {
      const g = gramsOf(p);
      return `<option value="${p.id}" ${g > 0 ? '' : 'disabled'}>${p.name} (${g > 0 ? g + ' กรัม/' + appState.getProductPieceUnit(p) : 'ยังไม่ระบุกรัม'})</option>`;
    }).join('');

    const contentHtml = `
      <form id="pool-canning-form" class="p-5 sm:p-6 space-y-4 bg-white text-gray-800 text-sm">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label for="canning-input-date" class="text-sm font-bold text-gray-800 block mb-1">วันที่แปรรูป</label>
            <input type="text" id="canning-input-date" value="${today}" required
              class="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>
          <div>
            <label for="canning-select-product" class="text-sm font-bold text-gray-800 block mb-1">เลือกสินค้าที่จะแปรรูป *</label>
            <select id="canning-select-product" class="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              ${optionsHtml}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div class="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200">
            <span class="text-sm font-bold text-amber-900 block">ดอกแห้งในคลัง</span>
            <div class="mt-1.5 text-xl sm:text-2xl font-bold text-amber-950 font-mono">${totalDryAvailable.toFixed(2)} <span class="text-sm font-semibold text-amber-800">กิโลกรัม</span></div>
          </div>

          <div class="p-3.5 bg-white rounded-2xl border-2 border-emerald-500 shadow-2xs">
            <label for="canning-input-qty" class="text-sm font-bold text-gray-800 block">จำนวนที่จะแปรรูป *</label>
            <div class="relative mt-1.5">
              <input type="number" step="1" min="0" id="canning-input-qty" value="0" required
                class="w-full pl-3 pr-16 py-1.5 rounded-xl border border-gray-300 text-lg font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span id="canning-unit-label" class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-bold text-gray-500 pointer-events-none"></span>
            </div>
          </div>

          <div class="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-200">
            <span class="text-sm font-bold text-teal-900 block">ดอกแห้งที่จะถูกหัก</span>
            <div class="mt-1.5 text-xl sm:text-2xl font-bold text-teal-950 font-mono"><span id="canning-used-kg">0.00</span> <span class="text-sm font-semibold text-teal-800">กิโลกรัม</span></div>
            <div id="canning-used-detail" class="text-xs text-teal-700 mt-0.5"></div>
          </div>
        </div>

        <div class="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
          <label for="canning-input-note" class="text-sm font-bold text-gray-700 block mb-1">หมายเหตุ</label>
          <input type="text" id="canning-input-note" placeholder="เช่น ล็อตวันที่ ... ติดฉลากแล้ว"
            class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
        </div>

        <div class="pt-3 flex items-center justify-end gap-3 border-t border-gray-200">
          <button type="button" id="cancel-pool-canning-btn" class="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">ยกเลิก</button>
          <button type="submit" id="submit-pool-canning-btn" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2">
            <i class="fa-solid fa-jar"></i>
            <span>บันทึกการแปรรูปสินค้า</span>
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `แปรรูปสินค้า (ดอก${herb})`,
      icon: '',
      size: 'max-w-3xl',
      headerColor: 'bg-[#1b4332]',
      content: contentHtml,
      onRender: (dialog) => {
        const dateInput = dialog.querySelector('#canning-input-date');
        let selectedDateStr = today;
        if (dateInput && typeof flatpickr !== 'undefined') {
          try {
            flatpickr(dateInput, { dateFormat: 'Y-m-d', defaultDate: today, onChange: (_, str) => { selectedDateStr = str || today; } });
          } catch (e) { /* ignore */ }
        }
        if (dateInput) dateInput.addEventListener('input', () => { selectedDateStr = dateInput.value || today; });

        const productSel = dialog.querySelector('#canning-select-product');
        const qtyInput = dialog.querySelector('#canning-input-qty');
        const unitLabel = dialog.querySelector('#canning-unit-label');
        const usedKgEl = dialog.querySelector('#canning-used-kg');
        const usedDetail = dialog.querySelector('#canning-used-detail');
        const noteInput = dialog.querySelector('#canning-input-note');

        const currentProduct = () => products.find(p => p.id === (productSel ? productSel.value : ''));
        const update = () => {
          const p = currentProduct();
          const g = p ? gramsOf(p) : 0;
          const qty = parseInt(qtyInput ? qtyInput.value : 0) || 0;
          const usedKg = (qty * g) / 1000;
          if (unitLabel) unitLabel.textContent = p ? appState.getProductPieceUnit(p) : '';
          if (usedKgEl) usedKgEl.textContent = usedKg.toFixed(2);
          if (usedDetail) usedDetail.textContent = p ? `${qty.toLocaleString()} ${appState.getProductPieceUnit(p)} × ${g} กรัม` : '';
          if (usedKgEl) usedKgEl.parentElement.classList.toggle('text-red-600', usedKg > totalDryAvailable + 0.0005);
        };
        if (productSel) productSel.addEventListener('change', update);
        if (qtyInput) qtyInput.addEventListener('input', update);
        update();

        const cancelBtn = dialog.querySelector('#cancel-pool-canning-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', closeGlobalModal);

        const form = dialog.querySelector('#pool-canning-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const p = currentProduct();
            const qty = parseInt(qtyInput ? qtyInput.value : 0) || 0;
            if (!p) { showToast('กรุณาเลือกสินค้าที่จะแปรรูป', 'error'); return; }
            if (qty <= 0) { showToast('กรุณาระบุจำนวนที่จะแปรรูป', 'error'); return; }
            try {
              const res = appState.processProductPackaging(p.id, qty, '', noteInput ? noteInput.value.trim() : '', selectedDateStr || today);
              closeGlobalModal();
              showToast(`แปรรูปสำเร็จ! ได้ ${res.productName} ${res.jarsProduced} ${res.unit} (ใช้ดอกแห้ง ${res.dryUsedKg.toFixed(2)} กิโลกรัม)`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message || 'เกิดข้อผิดพลาดในการแปรรูปสินค้า', 'error');
            }
          });
        }
      }
    });
  }
};
