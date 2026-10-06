// Fresh Produce Management Component (ระบบจัดการผลผลิตดอกสดรวม - Clean & Elderly-Friendly Process Flow)
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal, getHerbDefaultIcon } from '../helpers.js';

export const FreshProduceComponent = {
  selectedHerb: 'เก๊กฮวย',
  activeTab: 'drying', // 'drying' | 'canning' | 'history'
  historySubTab: 'drying', // 'drying' | 'canning'

  render() {
    const allCrops = appState.getCrops();
    const plots = appState.getPlots();
    const dryingBatches = appState.getDryingBatches ? appState.getDryingBatches() : [];
    const packagingBatches = appState.getPackagingBatches ? appState.getPackagingBatches() : [];

    const allHarvestedCrops = allCrops.filter(c => c.status === 'harvested');

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
      const batchCount = herbBatches.length;

      return {
        herb, isChrys, isCham, ratio, pendingCrops, processedCrops,
        pendingFreshKg, processedFreshKg, estDryKg, actualDryKg, batchCount, herbBatches
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

    const filteredPackBatches = packagingBatches.filter(b => {
      if (b.herbType === currentSelectedHerb) return true;
      if (selectedPool && selectedPool.isChrys && b.herbType && b.herbType.includes('เก๊กฮวย')) return true;
      if (selectedPool && selectedPool.isCham && b.herbType && b.herbType.includes('คาโมมายล์')) return true;
      return false;
    });
    const filteredDryUsedSum = filteredPackBatches.reduce((sum, b) => sum + (parseFloat(b.dryUsedKg) || 0), 0);
    const filteredJarsProducedSum = filteredPackBatches.reduce((sum, b) => sum + (parseInt(b.jarsProduced) || 0), 0);

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
                <i class="fa-solid fa-fire-burner"></i>
              </span>
              <span>กระบวนการแปรรูปสมุนไพร</span>
            </h1>
            <p class="text-sm text-gray-500 mt-1 font-medium flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>จัดการผลผลิตสด อบแห้ง และบรรจุภัณฑ์กระป๋อง (สูตรมาตรฐาน 10:1)</span>
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
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div class="mt-2.5">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100/80 text-amber-900 border border-amber-200/80">
                  <i class="fas fa-coins text-amber-600"></i>
                  มูลค่า ~${formatBaht(selectedPool.actualDryKg * pricePerKg)}
                </span>
              </div>
            </div>
          </div>

          <!-- Card 3: สินค้ากระป๋อง 50G -->
          <div class="bg-gradient-to-br from-teal-50/90 via-cyan-50/40 to-white p-5 rounded-2xl border-2 border-teal-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-teal-300 transition-all group">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-teal-900 uppercase tracking-wider">สินค้ากระป๋อง 50G</span>
              <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-lg shadow-2xs group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-jar"></i>
              </div>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-3xl sm:text-4xl font-extrabold text-teal-950 font-mono tracking-tight">${currentJarsInStock}</span>
                <span class="text-sm font-bold text-teal-700">กระป๋อง</span>
              </div>
              <div class="mt-2.5">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-100/80 text-teal-900 border border-teal-200/80">
                  <i class="fas fa-tag text-teal-600"></i>
                  มูลค่า ~${formatBaht(currentJarsInStock * pricePerJar)}
                </span>
              </div>
            </div>
          </div>

          <!-- Card 4: อัตราส่วนแปรรูป -->
          <div class="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 p-5 rounded-2xl border-2 border-emerald-500/40 shadow-md flex flex-col justify-between text-white relative overflow-hidden group">
            <div class="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
              <i class="fa-solid fa-scale-balanced text-9xl text-emerald-400"></i>
            </div>
            <div class="flex items-center justify-between mb-3 relative z-10">
              <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">อัตราส่วนแปรรูป</span>
              <button id="edit-drying-ratio-btn" data-herb="${selectedPool.herb}" class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95" title="คลิกเพื่อแก้ไขอัตราส่วนอบแห้งของ ${selectedPool.herb}">
                <i class="fas fa-pen-to-square text-xs"></i>
                <span>แก้ไขสูตร</span>
              </button>
            </div>
            <div class="relative z-10">
              <div class="flex items-baseline gap-2">
                <span class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">${selectedPool.ratio}:1</span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">Yield ${(100 / selectedPool.ratio).toFixed(1)}%</span>
              </div>
              <div class="mt-2.5">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/15 text-emerald-200 border border-white/10">
                  <i class="fas fa-arrows-spin text-amber-300"></i>
                  สด ${(selectedPool.ratio * 10).toFixed(0)} kg ➔ แห้ง 10 kg
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Colorful Tab Navigation -->
        <div class="bg-white p-2 rounded-2xl border border-gray-200 shadow-xs">
          <nav class="flex space-x-2 overflow-x-auto hide-scrollbar">
            <button data-tab="drying" class="fresh-tab-btn flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              this.activeTab === 'drying'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
            }">
              <i class="fa-solid fa-fire-alt text-base ${this.activeTab === 'drying' ? 'text-yellow-200' : 'text-amber-500'}"></i>
              <span>1. อบแห้ง (สด ➔ แห้ง)</span>
            </button>
            <button data-tab="canning" class="fresh-tab-btn flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              this.activeTab === 'canning'
                ? 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white shadow-md shadow-teal-700/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
            }">
              <i class="fa-solid fa-jar text-base ${this.activeTab === 'canning' ? 'text-teal-200' : 'text-teal-600'}"></i>
              <span>2. แปรรูปบรรจุกระป๋อง</span>
            </button>
            <button data-tab="history" class="fresh-tab-btn flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              this.activeTab === 'history'
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
            }">
              <i class="fa-solid fa-clock-rotate-left text-base ${this.activeTab === 'history' ? 'text-emerald-300' : 'text-gray-500'}"></i>
              <span>3. ประวัติย้อนหลัง (${filteredBatches.length + filteredPackBatches.length} รอบ)</span>
            </button>
          </nav>
        </div>

        <!-- 4. Tab Content Area -->
        <div class="pt-2">
          ${this.activeTab === 'drying' ? `
            <!-- ===== TAB 1: อบแห้ง ===== -->
            <div class="space-y-6">
              
              <!-- Clean Process Pipeline Card -->
              ${this.renderProcessFlowCard(selectedPool)}

              <!-- Data Table -->
              <div class="bg-white rounded-3xl border-2 border-emerald-100 shadow-md overflow-hidden">
                <div class="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between flex-wrap gap-4">
                  <div class="flex items-center gap-3">
                    <span class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-base">
                      <i class="fa-solid fa-list-check"></i>
                    </span>
                    <div>
                      <h3 class="text-base font-bold">รายการแปลงเก็บเกี่ยว (ผลผลิตสด)</h3>
                      <p class="text-xs text-emerald-200 mt-0.5">รวม ${cropsForHerb.length} แปลง · ยอดสดรวม ${(selectedPool.pendingFreshKg + selectedPool.processedFreshKg).toFixed(1)} กก.</p>
                    </div>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-emerald-50/80 border-b-2 border-emerald-200 text-sm font-bold text-emerald-950 tracking-wider">
                      <tr>
                        <th class="px-6 py-4 whitespace-nowrap">วันที่เก็บเกี่ยว</th>
                        <th class="px-6 py-4 whitespace-nowrap">รหัสแปลง</th>
                        <th class="px-6 py-4 whitespace-nowrap">เกษตรกร</th>
                        <th class="px-6 py-4 whitespace-nowrap text-right">ปริมาณสด (กก.)</th>
                        <th class="px-6 py-4 whitespace-nowrap text-right">ราคารับซื้อสด</th>
                        <th class="px-6 py-4 whitespace-nowrap text-right">ยอดเงินรับซื้อ</th>
                        <th class="px-6 py-4 whitespace-nowrap text-center">สถานะ</th>
                        <th class="px-6 py-4 whitespace-nowrap text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-base font-medium text-slate-800">
                      ${cropsForHerb.length === 0 ? `
                        <tr>
                          <td colspan="8" class="px-6 py-12 text-center text-slate-400 font-medium">
                            ไม่มีข้อมูลผลผลิตสดในระบบ
                          </td>
                        </tr>
                      ` : cropsForHerb.map(c => {
                        const plot = plots.find(p => p.id === c.plotId);
                        const members = appState.getMembers();
                        const owner = plot ? members.find(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : null;
                        const yieldNum = parseFloat(c.yield) || 0;
                        const cHerb = getCropHerb(c);
                        const masterHerb = appState.getHerbByName ? (appState.getHerbByName(cHerb) || appState.getHerbById(cHerb)) : null;
                        const freshBuyingPrice = typeof c.freshBuyingPrice === 'number' 
                          ? c.freshBuyingPrice 
                          : (masterHerb ? (parseFloat(masterHerb.freshBuyingPrice || masterHerb.baselinePriceFresh) || 50) : 50);
                        const totalPayout = yieldNum * freshBuyingPrice;

                        return `
                          <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-slate-600">
                              ${formatThaiDate(c.harvestDateActual || c.harvestDateEst)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-slate-900 font-bold text-base">${c.id}</div>
                              <div class="text-sm text-slate-600 font-semibold mt-0.5">${plot ? plot.name : '-'}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                              ${owner ? owner.name : '-'}
                            </td>
                            <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-slate-900 font-bold">
                              ${yieldNum.toFixed(1)} กก.
                            </td>
                            <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-emerald-800 font-bold">
                              ${freshBuyingPrice} บ./กก.
                            </td>
                            <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-emerald-900 font-extrabold text-base">
                              ${formatBaht(totalPayout)}
                            </td>
                            <td class="px-6 py-4 text-center whitespace-nowrap">
                              ${c.isProcessed ? `
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-slate-100 text-slate-600">
                                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  อบแล้ว
                                </span>
                              ` : `
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-amber-100 text-amber-900 font-bold">
                                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  รออบ
                                </span>
                              `}
                            </td>
                            <td class="px-6 py-4 text-center whitespace-nowrap">
                              <button class="edit-fresh-harvest-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                data-crop-id="${c.id}" title="แก้ไขปริมาณสดและราคารับซื้อของแปลงนี้">
                                <i class="fas fa-edit text-xs"></i>
                                <span>แก้ไข</span>
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

              <!-- Specification Layout with Rich Color Accents -->
              <div class="bg-white rounded-3xl border-2 border-teal-200 shadow-md overflow-hidden">
                <div class="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 px-6 py-4 flex items-center justify-between flex-wrap gap-2 text-white">
                  <div class="flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm">
                      <i class="fas fa-clipboard-list"></i>
                    </span>
                    <h3 class="text-base font-bold">ข้อมูลมาตรฐานผลิตภัณฑ์ & ศักยภาพการผลิต</h3>
                  </div>
                  <span class="px-3 py-1 rounded-lg text-xs font-bold bg-white/15 border border-white/20 text-teal-100">
                    อัตรา 1 กก. = 20 กระป๋อง (50 G)
                  </span>
                </div>
                <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div class="bg-gradient-to-br from-teal-50 to-cyan-50/50 p-4 rounded-2xl border border-teal-200/80 flex items-start gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      <i class="fas fa-jar"></i>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-teal-800 uppercase tracking-wide">ขนาดบรรจุภัณฑ์</div>
                      <div class="text-lg font-extrabold text-teal-950 mt-0.5">50 กรัม / กระป๋อง</div>
                      <div class="text-xs text-gray-500 mt-1 font-medium">กระป๋องมาตรฐานพร้อมฝาดึง ซีลสุญญากาศ</div>
                    </div>
                  </div>

                  <div class="bg-gradient-to-br from-emerald-50 to-green-50/50 p-4 rounded-2xl border border-emerald-200/80 flex items-start gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      <i class="fas fa-tag"></i>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-emerald-800 uppercase tracking-wide">ราคาจำหน่ายมาตรฐาน</div>
                      <div class="text-lg font-extrabold text-emerald-950 mt-0.5">${pricePerJar} บาท / กระป๋อง</div>
                      <div class="text-xs text-gray-500 mt-1 font-medium">ราคากลางวิสาหกิจชุมชน</div>
                    </div>
                  </div>

                  <div class="bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4 rounded-2xl border border-amber-200/80 flex items-start gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      <i class="fas fa-chart-line"></i>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-amber-900 uppercase tracking-wide">ศักยภาพผลิตปัจจุบัน</div>
                      <div class="text-lg font-extrabold text-amber-950 mt-0.5">~${potentialJars} กระป๋อง</div>
                      <div class="text-xs text-gray-500 mt-1 font-medium">คำนวณจากสต็อกดอกแห้ง ${selectedPool.actualDryKg.toFixed(1)} กก.</div>
                    </div>
                  </div>
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
                  <span>ประวัติบรรจุกระป๋อง (${filteredPackBatches.length})</span>
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
                          <th class="px-6 py-4 whitespace-nowrap text-center">อัตราส่วน</th>
                          <th class="px-6 py-4 whitespace-nowrap">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 text-sm font-medium text-gray-800">
                        ${filteredBatches.length === 0 ? `
                          <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-gray-400 font-medium">ไม่มีประวัติการอบแห้ง</td>
                          </tr>
                        ` : filteredBatches.map(b => {
                          const freshUsed = parseFloat(b.freshWeightKg) || 0;
                          const dryYield = parseFloat(b.dryWeightKg) || 0;
                          const ratioStr = b.ratioActual || (freshUsed / (dryYield || 1)).toFixed(2);
                          return `
                            <tr class="hover:bg-amber-50/40 transition-colors">
                              <td class="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">${formatThaiDate(b.processedDate)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-emerald-800 font-bold">${freshUsed.toFixed(1)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-amber-900 font-bold">${dryYield.toFixed(1)}</td>
                              <td class="px-6 py-4 text-center whitespace-nowrap">
                                <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  ${ratioStr} : 1
                                </span>
                              </td>
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
                          <th class="px-6 py-4 whitespace-nowrap">วันที่บรรจุ</th>
                          <th class="px-6 py-4 whitespace-nowrap">รหัสล็อต</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">ดอกแห้งใช้ไป (กก.)</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">ได้กระป๋อง</th>
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
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-teal-900 font-extrabold text-base">${b.jarsProduced} กป.</td>
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
          <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-amber-300 text-amber-900 text-xs font-bold mt-3 shadow-2xs">
            <i class="fas fa-scale-balanced text-amber-600"></i>
            <span>อัตราส่วนมาตรฐาน 10:1 (ได้ ~${estDryYield} กก.)</span>
          </div>
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
    const isReadyToPack = pool.actualDryKg > 0;
    const pricePerKg = appState.getProductPrice(pool.herb, 'กก.');
    const pricePerJar = appState.getProductPrice(pool.herb, 'กระป๋อง');
    const potentialJars = Math.floor(pool.actualDryKg * 20);

    return `
      <div class="bg-gradient-to-br from-amber-50/70 via-white to-teal-50/70 rounded-3xl border-2 border-teal-300 shadow-md p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        
        <!-- Left: Dry Herb -->
        <div class="flex flex-col items-center flex-1 text-center w-full">
          <div class="w-20 h-20 rounded-2xl bg-amber-100 text-amber-800 border-2 border-amber-300 flex items-center justify-center mb-3 text-3xl shadow-sm">
            <i class="fa-solid fa-box-open"></i>
          </div>
          <div class="text-sm font-bold text-amber-900 mb-0.5">วัตถุดิบดอกแห้งในคลัง</div>
          <div class="text-3xl sm:text-4xl font-extrabold text-amber-950 font-mono tracking-tight">${pool.actualDryKg.toFixed(1)} <span class="text-base text-amber-700 font-bold">กก.</span></div>
          <span class="inline-flex items-center gap-1 mt-2.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <i class="fas fa-coins text-amber-600"></i> มูลค่าวัตถุดิบ ~${formatBaht(pool.actualDryKg * pricePerKg)}
          </span>
        </div>

        <!-- Middle: Action Transform Button -->
        <div class="flex flex-col items-center flex-1 w-full md:w-auto relative">
          <button data-herb="${pool.herb}" class="start-canning-pool-btn bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white px-8 py-3.5 rounded-2xl text-base font-bold transition-all shadow-lg hover:shadow-teal-500/30 active:scale-95 flex items-center gap-2.5 cursor-pointer ${!isReadyToPack ? 'opacity-50 cursor-not-allowed' : ''}" ${!isReadyToPack ? 'disabled' : ''}>
            <i class="fa-solid fa-jar text-lg"></i>
            <span>แปรรูปบรรจุกระป๋อง</span>
          </button>
          <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-teal-300 text-teal-900 text-xs font-bold mt-3 shadow-2xs">
            <i class="fas fa-bolt text-teal-600"></i>
            <span>สูตร 50 G : 1 กก. = 20 กระป๋อง</span>
          </div>
        </div>

        <!-- Right: Finished Cans -->
        <div class="flex flex-col items-center flex-1 text-center w-full">
          <div class="w-20 h-20 rounded-2xl bg-teal-100 text-teal-800 border-2 border-teal-300 flex items-center justify-center mb-3 text-3xl shadow-sm">
            <i class="fa-solid fa-jar"></i>
          </div>
          <div class="text-sm font-bold text-teal-900 mb-0.5">กระป๋อง 50G สำเร็จ</div>
          <div class="text-3xl sm:text-4xl font-extrabold text-teal-950 font-mono tracking-tight">${potentialJars} <span class="text-base text-teal-700 font-bold">กป.</span></div>
          <span class="inline-flex items-center gap-1 mt-2.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
            <i class="fas fa-tag text-teal-600"></i> มูลค่าเพิ่ม ~${formatBaht(potentialJars * pricePerJar)}
          </span>
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
        if (tab && tab !== this.activeTab) {
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
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <span class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
              <i class="fa-solid fa-scale-balanced"></i>
            </span>
            <div class="text-sm text-emerald-950 flex-1">
              <b class="font-bold text-base text-emerald-900 block mb-0.5">แก้ไขอัตราส่วนการอบแห้ง / แปรรูป: ${herbName}</b>
              <p class="text-emerald-800">
                กำหนดสัดส่วนน้ำหนักสดที่ต้องใช้ต่อการได้ดอกแห้ง 1 กิโลกรัม (สูตรมาตรฐาน) โดยระบบจะนำไปคำนวณน้ำหนักแห้งที่ควรได้ในโรงอบโดยอัตโนมัติ
              </p>
            </div>
          </div>

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
              เช่น ระบุ 8.0 หมายถึง ดอกสด 8 กิโลกรัม จะอบแห้งได้ดอกแห้ง 1 กิโลกรัม (Yield ${(100 / currentRatio).toFixed(1)}%)
            </p>
          </div>

          <!-- Live Preview Card -->
          <div class="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block">ตัวอย่างผลลัพธ์การคำนวณ</span>
            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="p-3 bg-white rounded-xl border border-gray-200">
                <span class="text-xs text-gray-500 block">เปอร์เซ็นต์ผลผลิต (Yield)</span>
                <span id="preview-yield-pct" class="text-xl font-bold text-emerald-800 font-mono">${(100 / currentRatio).toFixed(1)}%</span>
              </div>
              <div class="p-3 bg-white rounded-xl border border-gray-200">
                <span class="text-xs text-gray-500 block">สด 100 กก. ได้แห้ง</span>
                <span id="preview-dry-weight" class="text-xl font-bold text-emerald-800 font-mono">${(100 / currentRatio).toFixed(1)} กก.</span>
              </div>
            </div>
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
        const yieldDisplay = dialog.querySelector('#preview-yield-pct');
        const dryDisplay = dialog.querySelector('#preview-dry-weight');

        if (ratioInput) {
          ratioInput.addEventListener('input', () => {
            const r = parseFloat(ratioInput.value) || 1;
            if (r > 0) {
              if (yieldDisplay) yieldDisplay.textContent = (100 / r).toFixed(1) + '%';
              if (dryDisplay) dryDisplay.textContent = (100 / r).toFixed(1) + ' กก.';
            }
          });
        }

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
    const pendingCrops = allCrops.filter(c => {
      if (c.status !== 'harvested' || c.isProcessed) return false;
      const plot = appState.getPlotById(c.plotId);
      const cHerb = c.seedlingSource || (plot ? plot.plantType : '') || '';
      return cHerb.includes(herb);
    });

    const pendingFreshWeight = pendingCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
    if (pendingFreshWeight <= 0) {
      showToast(`ไม่มี${producePrefix}สดรอเข้าเตาอบในขณะนี้`, 'info');
      return;
    }

    const defaultDryWeight = (pendingFreshWeight / ratio).toFixed(2);
    const today = new Date().toISOString().split('T')[0];
    const pricePerKg = appState.getProductPrice(herb, 'กก.');
    const pricePerJar = appState.getProductPrice(herb, 'กระป๋อง');

    const contentHtml = `
      <form id="pool-drying-form" class="p-5 sm:p-6 space-y-4 bg-white text-gray-800 text-sm">
        
        <!-- แถวที่ 1: ข้อมูลทั่วไป (วันที่อบ + พืชอะไร + สูตร) -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border border-emerald-200">
          <!-- วันที่อบ -->
          <div class="flex items-center gap-2">
            <label for="dry-input-date" class="text-sm font-bold text-gray-800 whitespace-nowrap">
              <i class="far fa-calendar-alt text-emerald-700 mr-1"></i> วันที่อบ:
            </label>
            <input type="text" id="dry-input-date" value="${today}" required
              class="w-36 px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs">
          </div>

          <!-- พืชอะไร & สูตรอบแห้ง -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3 py-1 rounded-xl text-sm font-bold text-emerald-950 bg-white border border-emerald-300 shadow-2xs">
              🌿 ${producePrefix}
            </span>
            <span class="px-2.5 py-1 rounded-xl text-sm font-bold text-amber-900 bg-amber-100 border border-amber-300 shadow-2xs">
              สูตรอบแห้ง ${ratio} : 1
            </span>
          </div>
        </div>

        <!-- แถบอธิบายสูตรมาตรฐานตามเกณฑ์อาจารย์ 10:1 -->
        <div class="p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-sm text-amber-950 flex items-start gap-2">
          <i class="fas fa-lightbulb text-amber-600 text-sm mt-0.5 shrink-0"></i>
          <div>
            <b class="font-bold">สูตรแปลงน้ำหนัก สด ➔ แห้ง มาตรฐานวิสาหกิจ (อัตราส่วน 10:1):</b>
            <span class="block text-gray-700 mt-0.5">
              รับสมุนไพรสด <b>150 kg</b> เมื่อนำไปอบ/ตากแห้ง จะได้สมุนไพรแห้ง <b>15 kg</b> (Yield 10% ตามที่อาจารย์ระบุ)
            </span>
          </div>
        </div>

        <!-- แถวที่ 2: ตัวเลขการอบ (3 ช่องในแถวเดียว) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          <!-- ช่องที่ 1: ผลผลิตสดที่มีทั้งหมด (จากกี่ กก.) -->
          <div class="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col justify-between">
            <div>
              <span class="text-sm font-bold text-amber-900 uppercase block">1. ผลผลิตสดที่มีทั้งหมด</span>
              <span class="text-sm text-amber-700">จากแปลงสมาชิกทุกแปลง</span>
            </div>
            <div class="mt-2 text-xl sm:text-2xl font-bold text-amber-950 font-mono">
              ${pendingFreshWeight.toFixed(2)} <span class="text-sm font-semibold text-amber-800">กก.</span>
            </div>
          </div>

          <!-- ช่องที่ 2: ใช้ผลผลิตสดเท่าไหร่ (กก.) -->
          <div class="p-3.5 bg-white rounded-2xl border-2 border-emerald-400 shadow-2xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <label for="dry-input-fresh-weight" class="text-sm font-bold text-gray-800 uppercase">
                2. ใช้ผลผลิตสดเท่าไหร่ *
              </label>
              <button type="button" id="use-all-fresh-btn" class="text-sm font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-lg cursor-pointer transition-colors">
                ใช้อบทั้งหมด
              </button>
            </div>
            <div class="mt-2 relative">
              <input type="number" step="any" min="0.01" max="${pendingFreshWeight}" id="dry-input-fresh-weight" value="${pendingFreshWeight.toFixed(2)}" required
                class="w-full pl-3 pr-10 py-1.5 rounded-xl border border-gray-300 text-lg font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-bold text-gray-500 pointer-events-none">
                กก.
              </span>
            </div>
            <span class="text-sm text-gray-500 mt-1 block">
              จากทั้งหมด ${pendingFreshWeight.toFixed(2)} กก.
            </span>
          </div>

          <!-- ช่องที่ 3: ได้กี่กิโลกรัมหลังอบเสร็จ -->
          <div class="p-3.5 bg-white rounded-2xl border-2 border-emerald-600 shadow-2xs flex flex-col justify-between">
            <label for="dry-input-dry-weight" class="text-sm font-bold text-gray-800 uppercase">
              3. ได้หลังอบเสร็จกี่ กก. *
            </label>
            <div class="mt-2 relative">
              <input type="number" step="any" min="0.01" id="dry-input-dry-weight" value="${defaultDryWeight}" required
                class="w-full pl-3 pr-10 py-1.5 rounded-xl border border-gray-300 text-lg font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-bold text-emerald-700 pointer-events-none">
                กก.
              </span>
            </div>
            <span class="text-sm text-emerald-700 font-medium mt-1 block">
              น้ำหนักผลผลิตแห้งจริงหลังอบเสร็จ
            </span>
          </div>

        </div>

        <!-- แถวที่ 2.5: กระป๋อง Live Summary สรุปผลการอบและมูลค่าเศรษฐกิจ -->
        <div id="dry-live-summary-box" class="p-3.5 bg-gradient-to-r from-emerald-100/70 via-teal-50 to-amber-50 rounded-2xl border border-emerald-300 shadow-2xs space-y-1">
          <div class="flex items-center justify-between text-sm font-bold text-emerald-950">
            <span class="flex items-center gap-1.5">
              <i class="fas fa-clipboard-check text-emerald-700 text-sm"></i>
              <span>สรุปข้อมูลการอบแห้งและประมาณการมูลค่า:</span>
            </span>
            <span id="dry-live-ratio-badge" class="px-2 py-0.5 rounded-md text-sm font-bold bg-white text-emerald-900 border border-emerald-200">
              อัตราส่วนจริง: ${ratio.toFixed(2)} : 1
            </span>
          </div>
          <div id="dry-live-summary-text" class="text-sm font-medium text-gray-800 leading-relaxed pt-0.5">
            <div>
              วันที่ <b>${formatThaiDate(today)}</b>: ใช้<b>${producePrefix}สด</b> <b class="text-amber-950 font-bold font-mono">${pendingFreshWeight.toFixed(2)}</b> กก. (จากทั้งหมด <b>${pendingFreshWeight.toFixed(2)}</b> กก.) ➔ ได้หลังอบเสร็จ <b class="text-emerald-900 font-bold font-mono text-base">${defaultDryWeight}</b> กก.
            </div>
            <div class="mt-2 pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm text-emerald-950">
              <span class="flex items-center gap-1 font-bold">
                <i class="fas fa-coins text-amber-600"></i>
                <span>ประเมินมูลค่าผลผลิตหลังอบแห้ง:</span>
              </span>
              <div class="flex items-baseline gap-2 font-mono flex-wrap">
                <span class="text-gray-700">ขายแบบแห้ง (${pricePerKg} บ./กก.):</span>
                <b class="text-emerald-800 text-sm font-bold">${formatBaht(parseFloat(defaultDryWeight) * pricePerKg)}</b>
                <span class="text-gray-400">|</span>
                <span class="text-gray-700">บรรจุกระป๋อง 50 G (~${Math.floor(parseFloat(defaultDryWeight) * 20)} กป.):</span>
                <b class="text-amber-800 text-sm font-bold">${formatBaht(Math.floor(parseFloat(defaultDryWeight) * 20) * pricePerJar)}</b>
              </div>
            </div>
          </div>
        </div>

        <!-- แถวที่ 3: เตาอบ / หมายเหตุ -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
          <label for="dry-input-note" class="text-sm font-bold text-gray-700 sm:w-28 shrink-0">
            เตาอบ / หมายเหตุ
          </label>
          <input type="text" id="dry-input-note" placeholder="ระบุเตาอบ (เช่น ตู้อบ 1 พลังงานแสงอาทิตย์) หรือรอบการอบ"
            class="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs">
        </div>

        <!-- ปุ่มดำเนินการด้านล่างสุด (Modal Footer) -->
        <div class="pt-3 flex items-center justify-end gap-3 border-t border-gray-200">
          <button type="button" id="cancel-pool-dry-btn" class="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" id="submit-pool-dry-btn" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
            <i class="fas fa-fire-alt"></i>
            <span>ยืนยันบันทึกการอบแห้งเข้าคลัง</span>
          </button>
        </div>

      </form>
    `;

    openGlobalModal({
      title: `♨️ บันทึกนำเข้าเตาอบแห้ง (${producePrefix})`,
      icon: '',
      size: 'max-w-2xl',
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

        const updateSummaryText = () => {
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
          const calculated = (val / ratio).toFixed(2);
          dryInput.value = calculated;
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
    const dryingBatches = appState.getDryingBatches ? appState.getDryingBatches() : [];
    const isChrys = herb === 'เก๊กฮวย' || herb.includes('เก๊กฮวย');
    const isCham = herb === 'คาโมมายล์' || herb.includes('คาโมมายล์');

    const herbBatches = dryingBatches.filter(b => {
      if (b.herbType === herb) return true;
      if (isChrys && b.herbType && b.herbType.includes('เก๊กฮวย')) return true;
      if (isCham && b.herbType && b.herbType.includes('คาโมมายล์')) return true;
      return false;
    });
    const totalDryAvailable = herbBatches.reduce((sum, b) => sum + (parseFloat(b.dryWeightKg) || 0), 0);

    if (totalDryAvailable <= 0) {
      showToast(`ไม่มีดอก${herb}แห้งในคลังสำหรับบรรจุกระป๋อง กรุณาทำการอบแห้งก่อน`, 'warning');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pricePerKg = isChrys ? 250 : (isCham ? 450 : 300);
    const jarPrice50g = appState.getProductPrice(herb, 'กระป๋อง');
    const defaultUsedKg = Math.min(totalDryAvailable, 5.0).toFixed(2);
    const initialJars = Math.floor(parseFloat(defaultUsedKg) * 20);
    const members = appState.getMembers ? appState.getMembers() : [];

    const contentHtml = `
      <form id="pool-canning-form" class="p-5 sm:p-6 space-y-4 bg-white text-gray-800 text-sm">
        
        <!-- แถวที่ 1: ข้อมูลทั่วไป (วันที่บรรจุ + ชนิดพืช + ขนาดบรรจุภัณฑ์) -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border border-emerald-200">
          <div class="flex items-center gap-2">
            <label for="canning-input-date" class="text-sm font-bold text-gray-800 whitespace-nowrap">
              <i class="far fa-calendar-alt text-emerald-700 mr-1"></i> วันที่บรรจุ:
            </label>
            <input type="text" id="canning-input-date" value="${today}" required
              class="w-36 px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs">
            <span class="px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-950 bg-white border border-emerald-300 shadow-2xs whitespace-nowrap">
              🌼 ดอก${herb}แห้ง
            </span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <input type="hidden" id="canning-select-size" value="50">
            <span class="px-3 py-1.5 rounded-xl text-sm font-bold text-teal-950 bg-white border border-teal-300 shadow-2xs flex items-center gap-1.5 whitespace-nowrap">
              <i class="fa-solid fa-jar text-teal-600"></i> ขนาด 50 G
            </span>
            <span class="px-3 py-1.5 rounded-xl text-sm font-bold text-emerald-950 bg-emerald-100 border border-emerald-300 shadow-2xs flex items-center gap-1.5 whitespace-nowrap">
              <i class="fas fa-bolt text-emerald-600"></i> สูตร: 1 กก. = 20 กระป๋อง
            </span>
          </div>
        </div>

        <!-- แถวที่ 2: ช่องระบุข้อมูลตัวเลข (3 ช่องที่จัดระเบียบใหม่ ไม่ล้นขอบ 100%) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          <!-- ช่องที่ 1: ดอกแห้งที่มีในคลัง -->
          <div class="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col justify-between">
            <div>
              <span class="text-sm font-bold text-amber-900 uppercase block">1. ดอกแห้งที่มีทั้งหมด</span>
              <span class="text-xs text-amber-700 block">จากคลังสินค้าอบแห้ง</span>
            </div>
            <div class="my-1.5 text-xl sm:text-2xl font-bold text-amber-950 font-mono">
              ${totalDryAvailable.toFixed(2)} <span class="text-sm font-semibold text-amber-800">กก.</span>
            </div>
            <div class="py-1 px-2 text-xs font-bold text-amber-800 bg-amber-100/70 border border-amber-300 rounded-lg text-center truncate">
              พร้อมนำไปบรรจุกระป๋อง
            </div>
          </div>

          <!-- ช่องที่ 2: ดอกแห้งที่นำมาบรรจุ (กก.) -->
          <div class="p-3.5 bg-white rounded-2xl border-2 border-emerald-500 shadow-2xs flex flex-col justify-between">
            <div>
              <label for="canning-input-used-dry" class="text-sm font-bold text-gray-800 uppercase block">
                2. ใช้ดอกแห้งกี่ กก. *
              </label>
              <span class="text-xs text-gray-500 block mb-1">ระบุน้ำหนักที่นำมาบรรจุ</span>
            </div>
            <div class="relative">
              <input type="number" step="any" min="0.01" max="${totalDryAvailable}" id="canning-input-used-dry" value="${defaultUsedKg}" required
                class="w-full pl-3 pr-10 py-1.5 rounded-xl border border-gray-300 text-lg font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-bold text-gray-500 pointer-events-none">
                กก.
              </span>
            </div>
            <div class="mt-1.5">
              <button type="button" id="use-all-dry-btn" class="w-full py-1 px-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg cursor-pointer transition-colors text-center truncate flex items-center justify-center gap-1">
                <i class="fas fa-bolt text-emerald-600"></i>
                <span>ใช้ทั้งหมด (${totalDryAvailable.toFixed(2)} กก.)</span>
              </button>
            </div>
          </div>

          <!-- ช่องที่ 3: ขนาดบรรจุภัณฑ์ & จำนวนกระป๋องที่ได้ -->
          <div class="p-3.5 bg-white rounded-2xl border-2 border-teal-600 shadow-2xs flex flex-col justify-between">
            <div>
              <label for="canning-input-jars-count" class="text-sm font-bold text-teal-950 uppercase block">
                3. ได้หลังบรรจุ *
              </label>
              <span class="text-xs text-teal-700 block mb-1">จำนวนกระป๋องสำเร็จรูป</span>
            </div>
            <div class="relative">
              <input type="number" step="1" min="1" id="canning-input-jars-count" value="${initialJars}" required
                class="w-full pl-3 pr-16 py-1.5 rounded-xl border border-gray-300 text-lg font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-bold text-teal-700 pointer-events-none">
                กระป๋อง
              </span>
            </div>
            <div class="mt-1.5 py-1 px-2 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg text-center truncate">
              คำนวณอัตโนมัติ (1 กก. = 20 กป.)
            </div>
          </div>

        </div>

        <!-- แถวที่ 2.5: กระป๋อง Live Summary สรุปผลการบรรจุกระป๋องและมูลค่าเศรษฐกิจ -->
        <div id="canning-live-summary-box" class="p-3.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50 rounded-2xl border border-teal-300 shadow-2xs space-y-1">
          <div class="flex items-center justify-between text-sm font-bold text-teal-950">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-jar text-teal-700 text-sm"></i>
              <span>สรุปข้อมูลการบรรจุกระป๋องและมูลค่าสินค้าสำเร็จรูป:</span>
            </span>
            <span id="canning-live-unit-price-badge" class="px-2 py-0.5 rounded-md text-sm font-bold bg-white text-teal-900 border border-teal-200">
              ราคาขาย: ${formatBaht(jarPrice50g)}/กระป๋อง (50 G)
            </span>
          </div>
          <div id="canning-live-summary-text" class="text-sm font-medium text-gray-800 leading-relaxed pt-0.5">
            <div>
              วันที่ <b>${formatThaiDate(today)}</b>: ใช้<b>ดอก${herb}แห้ง</b> <b class="text-amber-950 font-bold font-mono">${defaultUsedKg}</b> กก. ➔ บรรจุได้ <b class="text-teal-900 font-bold font-mono text-base">${initialJars}</b> กระป๋อง (ขนาด 50 G)
            </div>
            <div class="mt-2 pt-2 border-t border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm text-teal-950">
              <span class="flex items-center gap-1 font-bold">
                <i class="fas fa-coins text-amber-600"></i>
                <span>ประเมินมูลค่าสินค้าบรรจุกระป๋องที่ได้:</span>
              </span>
              <div class="flex items-baseline gap-2 font-mono flex-wrap">
                <span class="text-gray-700">มูลค่าเพิ่มเข้าคลัง:</span>
                <b id="canning-live-total-value" class="text-teal-800 text-base font-bold">${formatBaht(initialJars * jarPrice50g)}</b>
                <span class="text-gray-500 font-sans">(@${formatBaht(jarPrice50g)}/กป.)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- แถวที่ 3: ผู้รับผิดชอบ & หมายเหตุ / เลขล็อต -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
          <div>
            <label for="canning-input-operator" class="text-sm font-bold text-gray-700 block mb-1">
              ผู้รับผิดชอบการบรรจุ
            </label>
            <select id="canning-input-operator" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs">
              ${members.map(m => `
                <option value="${m.name}" ${m.role === 'ประธานกลุ่ม' || m.role.includes('ประธาน') ? 'selected' : ''}>
                  ${m.name} (${m.role})
                </option>
              `).join('')}
              <option value="สมาชิกกลุ่มแปรรูป">สมาชิกกลุ่มแปรรูป</option>
            </select>
          </div>

          <div>
            <label for="canning-input-note" class="text-sm font-bold text-gray-700 block mb-1">
              หมายเหตุ / รายละเอียดล็อตบรรจุ
            </label>
            <input type="text" id="canning-input-note" placeholder="เช่น บรรจุกระป๋องซีลฝาดึง ติดสติกเกอร์ฉลาก อย." value="บรรจุกระป๋องมาตรฐาน 50 G ซีลฝาพร้อมจำหน่าย"
              class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs">
          </div>
        </div>

        <!-- ปุ่มดำเนินการด้านล่างสุด (Modal Footer) -->
        <div class="pt-3 flex items-center justify-end gap-3 border-t border-gray-200">
          <button type="button" id="cancel-pool-canning-btn" class="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" id="submit-pool-canning-btn" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
            <i class="fa-solid fa-jar"></i>
            <span>ยืนยันบันทึกการบรรจุกระป๋องเข้าคลัง</span>
          </button>
        </div>

      </form>
    `;

    openGlobalModal({
      title: `🥫 บันทึกกระบวนการบรรจุกระป๋อง (ดอก${herb})`,
      icon: '',
      size: 'max-w-3xl',
      headerColor: 'bg-[#1b4332]',
      content: contentHtml,
      onRender: (dialog) => {
        const dateInput = dialog.querySelector('#canning-input-date');
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

        const dryInput = dialog.querySelector('#canning-input-used-dry');
        const sizeSelect = dialog.querySelector('#canning-select-size');
        const jarsInput = dialog.querySelector('#canning-input-jars-count');
        const use1kgBtn = dialog.querySelector('#use-1kg-btn');
        const use5kgBtn = dialog.querySelector('#use-5kg-btn');
        const useAllBtn = dialog.querySelector('#use-all-dry-btn');
        const operatorSelect = dialog.querySelector('#canning-input-operator');
        const noteInput = dialog.querySelector('#canning-input-note');
        const summaryText = dialog.querySelector('#canning-live-summary-text');
        const unitPriceBadge = dialog.querySelector('#canning-live-unit-price-badge');
        const totalValueEl = dialog.querySelector('#canning-live-total-value');

        const getActiveJarPrice = () => {
          const sz = parseFloat(sizeSelect ? sizeSelect.value : 50) || 50;
          if (sz >= 100) {
            return isChrys ? 280 : 190;
          }
          return jarPrice50g;
        };

        const updateSummaryText = () => {
          if (!summaryText) return;
          const dryVal = parseFloat(dryInput ? dryInput.value : 0) || 0;
          const sz = parseFloat(sizeSelect ? sizeSelect.value : 50) || 50;
          const jarsVal = parseInt(jarsInput ? jarsInput.value : 0) || 0;
          const curPrice = getActiveJarPrice();
          const estVal = jarsVal * curPrice;

          summaryText.innerHTML = `
            <div>
              วันที่ <b>${formatThaiDate(selectedDateStr)}</b>: ใช้<b>ดอก${herb}แห้ง</b> <b class="text-amber-950 font-bold font-mono">${dryVal.toFixed(2)}</b> กก. ➔ บรรจุได้ <b class="text-teal-900 font-bold font-mono text-base">${jarsVal}</b> กระป๋อง (ขนาด ${sz} G)
            </div>
            <div class="mt-2 pt-2 border-t border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm text-teal-950">
              <span class="flex items-center gap-1 font-bold">
                <i class="fas fa-coins text-amber-600"></i>
                <span>ประเมินมูลค่าสินค้าบรรจุกระป๋องที่ได้:</span>
              </span>
              <div class="flex items-baseline gap-2 font-mono flex-wrap">
                <span class="text-gray-700">มูลค่าเพิ่มเข้าคลัง:</span>
                <b class="text-teal-800 text-base font-bold">${formatBaht(estVal)}</b>
                <span class="text-gray-500 font-sans">(@${formatBaht(curPrice)}/กป.)</span>
              </div>
            </div>
          `;
          if (unitPriceBadge) {
            unitPriceBadge.textContent = `ราคาขาย: ${formatBaht(curPrice)}/กระป๋อง (${sz} G)`;
          }
        };

        const sizeBadge = dialog.querySelector('#canning-size-badge');
        const recalculateJars = () => {
          if (!dryInput || !sizeSelect || !jarsInput) return;
          const dryVal = parseFloat(dryInput.value) || 0;
          const sz = parseFloat(sizeSelect.value) || 50;
          const calcJars = Math.floor((dryVal * 1000) / sz);
          jarsInput.value = calcJars;
          if (sizeBadge) {
            sizeBadge.textContent = `ขนาด ${sz} G`;
          }
          updateSummaryText();
        };

        if (dryInput) {
          dryInput.addEventListener('input', recalculateJars);
        }

        if (sizeSelect) {
          sizeSelect.addEventListener('change', recalculateJars);
        }

        if (jarsInput) {
          jarsInput.addEventListener('input', updateSummaryText);
        }

        if (use1kgBtn && dryInput) {
          use1kgBtn.addEventListener('click', () => {
            dryInput.value = (1.0).toFixed(2);
            recalculateJars();
          });
        }

        if (use5kgBtn && dryInput) {
          use5kgBtn.addEventListener('click', () => {
            dryInput.value = Math.min(totalDryAvailable, 5.0).toFixed(2);
            recalculateJars();
          });
        }

        if (useAllBtn && dryInput) {
          useAllBtn.addEventListener('click', () => {
            dryInput.value = totalDryAvailable.toFixed(2);
            recalculateJars();
          });
        }

        const cancelBtn = dialog.querySelector('#cancel-pool-canning-btn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', closeGlobalModal);
        }

        const form = dialog.querySelector('#pool-canning-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const dryWeight = parseFloat(dryInput ? dryInput.value : 0) || 0;
            const sz = parseFloat(sizeSelect ? sizeSelect.value : 50) || 50;
            const jarsCount = parseInt(jarsInput ? jarsInput.value : 0) || 0;
            const date = selectedDateStr || today;
            const operator = operatorSelect ? operatorSelect.value : '';
            const note = noteInput ? noteInput.value.trim() : '';

            if (dryWeight <= 0) {
              showToast('กรุณาระบุน้ำหนักดอกแห้งที่ใช้บรรจุ', 'error');
              return;
            }
            if (dryWeight > totalDryAvailable + 0.05) {
              showToast(`น้ำหนักดอกแห้งที่ระบุ (${dryWeight.toFixed(2)} กก.) เกินกว่ายอดในคลัง (${totalDryAvailable.toFixed(2)} กก.)`, 'warning');
              return;
            }
            if (jarsCount <= 0) {
              showToast('จำนวนกระป๋องต้องมากกว่า 0', 'error');
              return;
            }

            try {
              const res = appState.processHerbCanning(herb, dryWeight, `${sz} G`, jarsCount, operator, note, date);
              closeGlobalModal();
              showToast(`บันทึกการบรรจุกระป๋องสำเร็จ! ได้ ${res.productName} จำนวน ${res.jarsProduced} กระป๋อง เข้าคลังสินค้าเรียบร้อย`, 'success');
              this.refreshView();
            } catch (err) {
              console.error(err);
              showToast(err.message || 'เกิดข้อผิดพลาดในการบันทึกการบรรจุกระป๋อง', 'error');
            }
          });
        }
      }
    });
  }
};
