// Crops Component - Planting Workflow Matrix Table & Mobile Responsive Cards
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, formatThaiArea, showToast, openGlobalModal, closeGlobalModal, formatCropSeasonId } from '../helpers.js';

export const CropsComponent = {
  selectedYear: new Date().getFullYear() + 543, // Default to current BE year (e.g. 2569)
  selectedCycle: 1, // 1 | 2
  selectedHerb: 'เก๊กฮวย',
  searchQuery: '',
  viewMode: (function() {
    try {
      localStorage.setItem('crops_view_mode', 'table');
      return 'table';
    } catch (e) {
      return 'table';
    }
  })(), // 'table' (ตารางสรุป ดูง่าย เป็นหลัก)

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    // 1. Fetch available roadmaps and herbs from Master Herbs Catalog
    const roadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
    const masterHerbs = appState.getHerbsCatalog ? appState.getHerbsCatalog() : [];
    const herbList = Array.from(new Set([
      ...masterHerbs.map(h => h.name).filter(Boolean),
      ...Object.keys(roadmaps)
    ]));
    if (!herbList.includes('เก๊กฮวย')) herbList.unshift('เก๊กฮวย');
    if (!herbList.includes('คาโมมายล์')) herbList.splice(1, 0, 'คาโมมายล์');

    if (!herbList.includes(this.selectedHerb) && herbList.length > 0) {
      this.selectedHerb = herbList[0];
    }
    const currentRoadmap = appState.getRoadmapByHerb(this.selectedHerb) || {
      name: this.selectedHerb,
      durationDays: 90,
      steps: []
    };
    const roadmapSteps = currentRoadmap.steps || [];

    // 2. Fetch plots and members
    let plots = appState.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const members = appState.getMembers();
    const allCrops = appState.getCrops();

    // 3. Filter plots matching search query
    const query = this.searchQuery.toLowerCase().trim();
    const filteredPlots = plots.filter(p => {
      if (!query) return true;
      const owner = members.find(m => (p.memberIds && p.memberIds.includes(m.id)) || p.memberId === m.id);
      const ownerName = owner ? owner.name.toLowerCase() : '';
      return (
        p.id.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        ownerName.includes(query)
      );
    });

    // 4. Match all crops for the selected Year and Cycle (regardless of herb)
    const allCropsThisPeriod = allCrops.filter(c => {
      const matchYear = Number(c.cropYear) === Number(this.selectedYear);
      const matchCycle = Number(c.cropCycle || 1) === Number(this.selectedCycle);
      return matchYear && matchCycle;
    });

    // Match crops for the selected Year, Cycle, and Herb
    const activeMatrixCrops = allCropsThisPeriod.filter(c => {
      return (c.seedlingSource || 'เก๊กฮวย') === this.selectedHerb;
    });

    // Summary statistics (1 plot = at most 1 planting per cycle)
    const totalPlotsCount = plots.length;
    let plantedPlotsCount = 0;
    let harvestingPlotsCount = 0;
    let notStartedPlotsCount = 0;

    plots.forEach(p => {
      const crop = activeMatrixCrops.find(c => c.plotId === p.id);
      const otherCrop = allCropsThisPeriod.find(c => c.plotId === p.id);
      if (crop) {
        if (crop.status === 'harvested') {
          harvestingPlotsCount++;
        } else {
          plantedPlotsCount++;
        }
      } else if (otherCrop) {
        plantedPlotsCount++;
      } else {
        notStartedPlotsCount++;
      }
    });

    // Year selection range (e.g., 2567 to 2571)
    const currentYear = new Date().getFullYear() + 543;
    const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    const showCardsClass = 'hidden';
    const showCleanTableClass = 'block'; // ตารางสรุป (ดูง่าย) เป็นหลัก
    const showMatrixTableClass = 'hidden';

    return `
      <div class="space-y-5 sm:space-y-6 pb-12 fade-in">
        
        <!-- Header Title & Overview -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2.5">
              <i class="fa-solid fa-seedling text-emerald-700"></i>
              <span>บันทึกรอบเพาะปลูกสมุนไพร</span>
            </h1>
          </div>
        </div>

        <!-- 1. แถบตัวกรองและเลือกเงื่อนไขด้านบน พร้อมสรุปภาพรวม (Top Filters & Summary) -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-100/80 space-y-4">
          <!-- แถวตัวกรอง: ช่องใส่ข้อมูลปรับขนาดให้พอดีกับข้อมูลแต่ละช่อง ไม่กว้างเกินไป -->
          <div class="flex flex-wrap items-end gap-3 sm:gap-4">
            <!-- 1.1 ปีการเพาะปลูก -->
            <div class="w-full sm:w-auto">
              <label for="filter-crop-year" class="block text-xs font-bold text-gray-700 uppercase mb-1">
                <i class="fas fa-calendar-alt text-emerald-600 mr-1"></i> 1. ปีการเพาะปลูก (พ.ศ.) *
              </label>
              <select id="filter-crop-year" class="w-full sm:w-52 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer">
                ${yearOptions.map(y => `
                  <option value="${y}" ${Number(this.selectedYear) === Number(y) ? 'selected' : ''}>
                    พ.ศ. ${y} ${Number(y) === currentYear ? '(ปีปัจจุบัน)' : ''}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- 1.2 รอบที่ปลูก -->
            <div class="w-full sm:w-auto">
              <label for="filter-crop-cycle" class="block text-xs font-bold text-gray-700 uppercase mb-1">
                <i class="fas fa-rotate text-emerald-600 mr-1"></i> 2. รอบที่ปลูก (2 รอบ/ปี) *
              </label>
              <select id="filter-crop-cycle" class="w-full sm:w-52 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer">
                <option value="1" ${Number(this.selectedCycle) === 1 ? 'selected' : ''}>รอบที่ 1 (ม.ค. - มิ.ย.)</option>
                <option value="2" ${Number(this.selectedCycle) === 2 ? 'selected' : ''}>รอบที่ 2 (ก.ค. - ธ.ค.)</option>
              </select>
            </div>

            <!-- 1.3 ชนิดพืช -->
            <div class="w-full sm:w-auto">
              <label for="filter-crop-herb" class="block text-xs font-bold text-gray-700 uppercase mb-1">
                <i class="fas fa-leaf text-emerald-600 mr-1"></i> 3. ชนิดพืชสมุนไพร *
              </label>
              <select id="filter-crop-herb" class="w-full sm:w-44 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer">
                ${herbList.map(h => `
                  <option value="${h}" ${this.selectedHerb === h ? 'selected' : ''}>${h}</option>
                `).join('')}
              </select>
            </div>

            <!-- 1.4 ค้นหาแปลงปลูก -->
            <div class="w-full sm:w-auto sm:flex-1 min-w-[220px] max-w-sm">
              <label for="filter-crop-search" class="block text-xs font-bold text-gray-700 uppercase mb-1">
                <i class="fas fa-search text-gray-400 mr-1"></i> ค้นหาแปลง / เจ้าของ
              </label>
              <input type="text" id="filter-crop-search" value="${this.searchQuery}" placeholder="รหัสแปลง หรือชื่อเกษตรกร..." 
                class="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
            </div>
          </div>

          <!-- ช่องสรุปข้อมูล (Summary KPI Badges): พอดีกับข้อมูล ไม่กินพื้นที่หน้าจอ -->
          <div class="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 sm:gap-3">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 text-gray-700 transition-all shadow-2xs">
              <i class="fas fa-map-marked text-gray-400 text-sm"></i>
              <span class="text-xs font-semibold text-gray-500">แปลงทั้งหมด:</span>
              <span class="text-sm font-bold text-gray-900">${totalPlotsCount} แปลง</span>
            </div>

            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200 text-emerald-900 transition-all shadow-2xs">
              <i class="fas fa-seedling text-emerald-600 text-sm"></i>
              <span class="text-xs font-semibold text-emerald-700">กำลังปลูกรอบนี้:</span>
              <span class="text-sm font-bold text-emerald-900">${plantedPlotsCount} แปลง</span>
            </div>

            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 rounded-xl border border-amber-200 text-amber-900 transition-all shadow-2xs">
              <i class="fas fa-hourglass-start text-amber-600 text-sm"></i>
              <span class="text-xs font-semibold text-amber-700">ยังไม่เริ่มปลูก:</span>
              <span class="text-sm font-bold text-amber-900">${notStartedPlotsCount} แปลง</span>
            </div>

            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100/80 rounded-xl border border-sky-200 text-sky-900 transition-all shadow-2xs">
              <i class="fas fa-box-open text-sky-600 text-sm"></i>
              <span class="text-xs font-semibold text-sky-700">เก็บเกี่ยวแล้วเสร็จ:</span>
              <span class="text-sm font-bold text-sky-900">${harvestingPlotsCount} แปลง</span>
            </div>
          </div>
        </div>

        <!-- 2.1 มุมมองการ์ดมือถือ (Mobile Responsive Workflow Cards) -->
        <div class="${showCardsClass} space-y-4">
          
          <!-- Mobile Batch Actions Toolbar (บาร์บันทึกกลุ่มสำหรับมือถือ) -->
          <div class="p-3.5 bg-gradient-to-r from-emerald-900/10 via-emerald-800/5 to-transparent rounded-2xl border border-emerald-100 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fas fa-check-double text-emerald-700"></i> บันทึกกลุ่มตามขั้นตอน (Batch Actions)
              </span>
              <span class="text-sm text-emerald-700 font-bold">แตะเพื่อบันทึกหลายแปลง</span>
            </div>
            <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              ${roadmapSteps.map(step => `
                <button data-step-no="${step.stepNo}" class="batch-step-header-btn px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-700 text-emerald-900 hover:text-white border border-emerald-200 font-bold text-sm shrink-0 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer" title="คลิกเพื่อบันทึกขั้นตอนที่ ${step.stepNo}: ${step.title} แบบกลุ่ม">
                  <span class="w-4 h-4 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">${step.stepNo}</span>
                  <span>ขั้น ${step.stepNo}: ${step.title}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- List of Mobile Plot Cards -->
          <div class="space-y-4">
            ${this.renderMobileCards(filteredPlots, activeMatrixCrops, members, roadmapSteps, allCropsThisPeriod)}
          </div>
        </div>

        <!-- 2.2 มุมมองตารางสรุปดูง่าย (Clean Standard Table - Default) -->
        <div class="${showCleanTableClass}">
          <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            
            <!-- Clean Table Header with Overview & Batch Action Buttons -->
            <div class="px-5 py-4 bg-gradient-to-r from-emerald-50 via-teal-50/30 to-transparent border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 class="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <i class="fas fa-table-list text-emerald-700"></i>
                  <span>ตารางภาพรวมการปลูก: ${this.selectedHerb} (พ.ศ. ${this.selectedYear} รอบที่ ${this.selectedCycle})</span>
                </h3>
                <p class="text-sm text-gray-500 mt-0.5">
                  แสดงรายการแปลงปลูก แถบความคืบหน้า และปุ่มบันทึกขั้นตอนถัดไปในคลิกเดียว
                </p>
              </div>

              <!-- Top Batch Action Buttons with Step Names -->
              <div class="flex items-center gap-1.5 flex-wrap">
                ${roadmapSteps.length > 0 ? `
                  <button class="row-start-step1-btn px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer" title="บันทึกขั้นตอนที่ 1: ${roadmapSteps[0].title} แบบกลุ่ม">
                    <i class="fas fa-plus text-xs"></i>
                    <span class="w-4 h-4 rounded-full bg-white text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
                    <span>ขั้น 1: ${roadmapSteps[0].title}</span>
                  </button>
                  ${roadmapSteps.slice(1).map(s => `
                    <button data-step-no="${s.stepNo}" class="batch-step-header-btn px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-sm rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors" title="คลิกเพื่อบันทึกขั้นตอนที่ ${s.stepNo}: ${s.title} แบบกลุ่ม">
                      <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">${s.stepNo}</span>
                      <span>ขั้น ${s.stepNo}: ${s.title}</span>
                    </button>
                  `).join('')}
                ` : ''}
              </div>
            </div>

            <!-- Clean Table Body -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[980px]">
                <thead>
                  <tr class="bg-gray-50/90 border-b border-gray-200 text-gray-700 text-sm font-bold">
                    <th class="py-3.5 px-4 min-w-[340px]">รหัสการปลูก / แปลง</th>
                    <th class="py-3.5 px-4 min-w-[140px]">พืชที่ปลูก</th>
                    <th class="py-3.5 px-4 min-w-[200px]">ความคืบหน้า (${roadmapSteps.length} ขั้นตอน)</th>
                    <th class="py-3.5 px-4 min-w-[200px]">ขั้นตอนถัดไป / ผลผลิตที่เก็บเกี่ยว</th>
                    <th class="py-3.5 px-4 min-w-[190px]">วันที่ทำจริง / ปรับปรุงแก้ไข</th>
                    <th class="py-3.5 px-4 min-w-[170px] text-center">จัดการ / บันทึกขั้นตอน</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  ${this.renderCleanTableRows(filteredPlots, activeMatrixCrops, members, roadmapSteps, allCropsThisPeriod)}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        <!-- 2.3 มุมมองตาราง Matrix ละเอียดทุกขั้นตอน (Detailed Matrix View) -->
        <div class="${showMatrixTableClass}">
          <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            
            <!-- Matrix Table Header Notice & Explanation -->
            <div class="px-5 py-4 bg-gradient-to-r from-emerald-900/10 via-emerald-800/5 to-transparent border-b border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 class="text-base md:text-lg font-bold text-emerald-950 flex items-center gap-2">
                  <i class="fas fa-table-cells text-emerald-700"></i>
                  <span>ตารางติดตามขั้นตอนการปลูกพืช: ${this.selectedHerb} (พ.ศ. ${this.selectedYear} รอบที่ ${this.selectedCycle})</span>
                </h3>
                <p class="text-sm text-gray-500 mt-0.5">
                  คลิกปุ่ม <b>[+] บันทึกกลุ่ม</b> ที่หัวแต่ละขั้นตอนเพื่อบันทึกหลายแปลงพร้อมกัน | <span class="text-emerald-700 font-bold">ห้ามข้ามขั้นตอน (Step Validation)</span>
                </p>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="inline-flex items-center gap-1 text-emerald-800 font-bold">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> ทำเสร็จแล้ว
                </span>
                <span class="inline-flex items-center gap-1 text-amber-800 font-bold">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse"></span> คิวปัจจุบัน
                </span>
                <span class="inline-flex items-center gap-1 text-gray-400 font-bold">
                  <i class="fas fa-lock text-sm"></i> ล็อก (รอขั้นก่อน)
                </span>
              </div>
            </div>

            <!-- Hint for mobile users viewing table -->
            <div class="md:hidden flex items-center justify-between text-sm text-gray-500 bg-gray-50 px-4 py-2 border-b border-gray-100">
              <span class="flex items-center gap-1.5">
                <i class="fas fa-arrows-left-right text-emerald-600"></i> ปัดซ้าย-ขวาเพื่อดูขั้นตอนทั้งหมด
              </span>
            </div>

            <!-- Responsive Matrix Table Container with Touch Scrolling -->
            <div class="overflow-x-auto" style="-webkit-overflow-scrolling: touch;">
              <table class="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr class="bg-gray-50/90 border-b border-gray-200 text-gray-700 text-sm font-bold">
                    
                    <!-- Column 1: แปลงปลูกและเจ้าของ -->
                    <th class="py-4 px-5 min-w-[340px] border-r border-gray-200/80">
                      <div class="flex items-center gap-2">
                        <i class="fas fa-map-location-dot text-emerald-700"></i>
                        <span>แปลงปลูก / เกษตรกร</span>
                      </div>
                    </th>

                    <!-- Dynamic Columns: Steps from Roadmap -->
                    ${roadmapSteps.map(step => `
                      <th class="py-4 px-4 min-w-[210px] border-r border-gray-200/80 align-top">
                        <div class="flex flex-col gap-1.5">
                          <div class="flex items-center justify-between gap-1">
                            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-sm shrink-0">
                              ${step.stepNo}
                            </span>
                            <span class="text-sm font-bold text-gray-500">
                              ${step.dayLabel || `วันที่ ${step.dayNumber}`}
                            </span>
                            <!-- Header [+] Batch Button -->
                            <button data-step-no="${step.stepNo}" class="batch-step-header-btn px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-700 text-emerald-900 hover:text-white font-bold text-sm transition-all flex items-center gap-1 cursor-pointer shadow-2xs" title="คลิกเพื่อบันทึกขั้นตอนที่ ${step.stepNo} แบบกลุ่ม">
                              <i class="fas fa-plus text-sm"></i>
                              <span>บันทึกกลุ่ม</span>
                            </button>
                          </div>
                          <div class="text-sm font-bold text-gray-900 leading-snug">
                            ${step.title}
                          </div>
                        </div>
                      </th>
                    `).join('')}

                    <!-- Actions Column -->
                    <th class="py-4 px-4 w-28 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  ${this.renderMatrixRows(filteredPlots, activeMatrixCrops, members, roadmapSteps, allCropsThisPeriod)}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  // -------------------------------------------------------------
  // Render Mobile Cards View (สำหรับหน้าจอโทรศัพท์)
  // -------------------------------------------------------------
  renderMobileCards(plots, activeCrops, members, roadmapSteps, allCropsThisPeriod = []) {
    if (plots.length === 0) {
      return `
        <div class="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-500">
          <i class="fas fa-search text-3xl text-gray-300 mb-2 block"></i>
          ไม่พบข้อมูลแปลงปลูกตามเงื่อนไขที่ระบุ
        </div>
      `;
    }

    return plots.map(plot => {
      const owner = members.find(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id);
      const ownerName = owner ? owner.name : 'ไม่พบชื่อเจ้าของ';
      const areaFormatted = formatThaiArea(plot.sizeRai, plot.sizeNgan, plot.sizeSqWah);
      const crop = activeCrops.find(c => c.plotId === plot.id);
      const otherHerbCrop = !crop ? allCropsThisPeriod.find(c => c.plotId === plot.id) : null;

      return `
        <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 space-y-3.5 hover:border-emerald-300 transition-all">
          
          <!-- Card Header: Plot Code & Status -->
          <div class="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-base font-bold text-emerald-950 tracking-normal" title="รหัสการปลูก (ถ้ามี) / รหัสแปลง">
                  ${crop ? formatCropSeasonId(crop.id, crop.cropYear, crop.cropCycle) : (otherHerbCrop ? formatCropSeasonId(otherHerbCrop.id, otherHerbCrop.cropYear, otherHerbCrop.cropCycle) : plot.id)}
                </span>
                ${crop ? `
                  <span class="px-2 py-0.5 rounded-full text-sm font-bold ${
                    crop.status === 'harvested' ? 'bg-sky-100 text-sky-900' : 'bg-emerald-100 text-emerald-900'
                  }">
                    ${crop.status === 'harvested' ? 'เก็บเกี่ยวแล้ว' : 'กำลังเพาะปลูก'}
                  </span>
                ` : (otherHerbCrop ? `
                  <span class="px-2 py-0.5 rounded-full text-sm font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <i class="fas fa-lock text-sm mr-1"></i>ปลูกแล้ว (${otherHerbCrop.seedlingSource || 'พืชอื่น'})
                  </span>
                ` : `
                  <span class="px-2 py-0.5 rounded-full text-sm font-bold bg-gray-100 text-gray-600">
                    ยังไม่เริ่ม
                  </span>
                `)}
              </div>
              <h4 class="text-base font-bold text-gray-900 mt-1">${plot.name}</h4>
              <div class="text-sm text-gray-600 flex items-center gap-1.5 mt-1 flex-wrap">
                <span class="flex items-center gap-1">
                  <i class="fas fa-user-circle text-gray-400"></i>
                  <b>${ownerName}</b>
                </span>
                <span class="text-gray-300">•</span>
                <span class="text-gray-500">ขนาด: ${areaFormatted}</span>
              </div>
            </div>

            <!-- Action Buttons on Mobile Card -->
            <div class="flex items-center gap-1.5 shrink-0">
              ${crop ? `
                ${crop.status !== 'harvested' ? `
                  <button data-crop-id="${crop.id}" data-plot-id="${plot.id}" class="reschedule-crop-btn p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 border border-amber-200/80 transition-all shadow-2xs cursor-pointer" title="เลื่อนกำหนดการปลูก / เลื่อนขั้นตอน (กรณีไม่ว่างหรือปลูกคนละวัน)">
                    <i class="fas fa-calendar-alt text-base"></i>
                  </button>
                ` : ''}
                <button data-crop-id="${crop.id}" class="view-crop-detail-btn p-2 rounded-xl bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white transition-all shadow-2xs cursor-pointer" title="ดูรายละเอียดและ QR Code">
                  <i class="fas fa-eye text-base"></i>
                </button>
                <button data-crop-id="${crop.id}" class="delete-crop-season-btn p-2 rounded-xl bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white transition-all shadow-2xs cursor-pointer" title="ลบรอบการปลูกนี้">
                  <i class="fas fa-trash-alt text-base"></i>
                </button>
              ` : (otherHerbCrop ? `
                <button data-crop-id="${otherHerbCrop.id}" class="view-crop-detail-btn p-2 rounded-xl bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white transition-all shadow-2xs cursor-pointer" title="ดูรายละเอียด (${otherHerbCrop.seedlingSource})">
                  <i class="fas fa-eye text-base"></i>
                </button>
                <button data-crop-id="${otherHerbCrop.id}" class="delete-crop-season-btn p-2 rounded-xl bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white transition-all shadow-2xs cursor-pointer" title="ลบรอบการปลูกนี้">
                  <i class="fas fa-trash-alt text-base"></i>
                </button>
              ` : `
                <button data-plot-id="${plot.id}" class="row-start-step1-btn px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center gap-1 shadow-2xs cursor-pointer">
                  <i class="fas fa-seedling text-emerald-200"></i>
                  <span>เริ่มปลูก</span>
                </button>
              `)}
            </div>
          </div>

          <!-- Vertical Workflow Stepper on Mobile -->
          <div class="space-y-2.5 pt-1">
            <span class="text-sm font-bold text-gray-400 uppercase tracking-wider block">
              ขั้นตอนการดำเนินงานตามรอบ (${roadmapSteps.length} ขั้นตอน)
            </span>

            ${otherHerbCrop ? `
              <div class="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-sm text-amber-900 space-y-1">
                <div class="font-bold flex items-center gap-1.5 text-amber-800">
                  <i class="fas fa-lock text-sm"></i>
                  <span>แปลงนี้บันทึกปลูก "${otherHerbCrop.seedlingSource || 'พืชอื่น'}" ในรอบนี้แล้ว</span>
                </div>
                <p class="text-sm text-amber-700 leading-relaxed">
                  1 รอบการเพาะปลูกอนุญาตให้บันทึกได้ 1 แปลงเท่านั้น ระบบล็อกไม่ให้บันทึกซ้ำหรือลงพืชชนิดอื่นซ้อนในแปลงเดียวกัน
                </p>
              </div>
            ` : roadmapSteps.map((step, idx) => {
              const stepInfo = this.evaluateStepState(crop, step, idx, roadmapSteps);
              return this.renderMobileStepItem(plot, crop, step, stepInfo);
            }).join('')}
          </div>

        </div>
      `;
    }).join('');
  },

  // Render individual step card inside mobile plot card
  renderMobileStepItem(plot, crop, step, stepInfo) {
    if (stepInfo.state === 'completed') {
      return `
        <div class="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl text-sm flex items-start gap-2.5">
          <div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 text-sm shadow-2xs mt-0.5">
            <i class="fas fa-check"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <span class="font-bold text-emerald-950 text-sm leading-tight">
                ขั้นที่ ${step.stepNo}: ${step.title}
              </span>
              <span class="text-sm font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <i class="fas fa-lock text-sm"></i> เสร็จแล้ว (ล็อก)
              </span>
            </div>
            <div class="text-sm text-gray-700 font-bold mt-1">
              <i class="far fa-calendar-check text-emerald-600 mr-1"></i>
              ${formatThaiDate(stepInfo.date)}
            </div>
            ${stepInfo.note ? `
              <div class="text-sm text-gray-500 mt-1 bg-white/70 p-1.5 rounded-lg border border-emerald-100/80">
                ${stepInfo.note}
              </div>
            ` : ''}
            <div class="mt-2 pt-1.5 border-t border-emerald-200/60 flex items-center text-sm text-emerald-800 font-bold">
              <i class="fas fa-shield-alt mr-1 text-emerald-600"></i> บันทึกเสร็จสิ้นแล้ว (ล็อกห้ามทำซ้ำ)
            </div>
          </div>
        </div>
      `;
    }

    if (stepInfo.state === 'current_active') {
      return `
        <div class="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/40 border-2 border-amber-400 rounded-xl text-sm shadow-xs space-y-2.5">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 text-sm shadow-2xs animate-pulse">
                ${step.stepNo}
              </div>
              <div>
                <span class="font-bold text-gray-900 text-sm block leading-tight">ขั้นที่ ${step.stepNo}: ${step.title}</span>
                <span class="text-sm text-gray-500 font-medium">${step.dayLabel || `วันที่ ${step.dayNumber}`}</span>
              </div>
            </div>
            <span class="text-sm font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
              ถึงคิวทำ
            </span>
          </div>

          <div class="flex items-center justify-between text-sm text-gray-700 bg-white/80 p-2 rounded-lg border border-amber-200/80">
            <span class="text-gray-500 font-medium">กำหนดวันรอบแผนงาน:</span>
            <b class="text-gray-900 font-bold">${formatThaiDate(stepInfo.targetDate)}</b>
          </div>

          <button data-plot-id="${plot.id}" data-step-no="${step.stepNo}" data-crop-id="${crop ? crop.id : ''}"
            class="action-single-step-btn w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer">
            <i class="fas fa-check-circle"></i>
            <span>+ บันทึกขั้นตอนนี้</span>
          </button>
        </div>
      `;
    }

    if (stepInfo.state === 'not_started_first_step') {
      return `
        <div class="p-3 bg-gray-50 border border-dashed border-emerald-300 rounded-xl text-center space-y-2">
          <span class="text-sm text-gray-600 font-bold block">ยังไม่เริ่มรอบปลูกสำหรับแปลงนี้</span>
          <button data-plot-id="${plot.id}" class="row-start-step1-btn w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
            <i class="fas fa-seedling text-emerald-200"></i>
            <span>+ เริ่มลงต้นกล้า (ขั้นตอนที่ 1)</span>
          </button>
        </div>
      `;
    }

    // Locked / Disabled (บล็อกห้ามข้ามขั้นตอน)
    return `
      <div class="flex items-center gap-2.5 p-2.5 bg-gray-50/70 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 opacity-60 select-none">
        <div class="w-5 h-5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold shrink-0 text-sm">
          <i class="fas fa-lock"></i>
        </div>
        <div class="flex-1 min-w-0">
          <span class="font-bold text-gray-500">ขั้นที่ ${step.stepNo}: ${step.title}</span>
          <span class="text-sm text-gray-400 block">${stepInfo.reason || 'รอทำขั้นตอนก่อนหน้า'}</span>
        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // Render Rows for Clean Standard Table (ตารางสรุปดูง่าย มาตรฐาน)
  // -------------------------------------------------------------
  renderCleanTableRows(plots, activeCrops, members, roadmapSteps, allCropsThisPeriod = []) {
    if (plots.length === 0) {
      return `
        <tr>
          <td colspan="6" class="py-12 px-6 text-center text-gray-500 font-medium bg-gray-50/50">
            <i class="fas fa-search text-3xl text-gray-300 mb-2 block"></i>
            ไม่พบข้อมูลแปลงปลูกตามเงื่อนไขที่ระบุ
          </td>
        </tr>
      `;
    }

    return plots.map(plot => {
      const owner = members.find(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id);
      const ownerName = owner ? owner.name : 'ไม่พบชื่อเจ้าของ';
      const areaFormatted = formatThaiArea(plot.sizeRai, plot.sizeNgan, plot.sizeSqWah);

      const crop = activeCrops.find(c => c.plotId === plot.id);
      const otherHerbCrop = !crop ? allCropsThisPeriod.find(c => c.plotId === plot.id) : null;

      // Calculate progress and steps
      let completedCount = 0;
      let currentActiveStep = null;
      let lastActionDate = null;
      let lastCorrection = '';

      if (crop) {
        roadmapSteps.forEach((step, idx) => {
          const stepInfo = this.evaluateStepState(crop, step, idx, roadmapSteps);
          if (stepInfo.state === 'completed') {
            completedCount++;
            if (stepInfo.date) lastActionDate = stepInfo.date;
            if (stepInfo.note) lastCorrection = stepInfo.note;
          } else if (stepInfo.state === 'current_active' && !currentActiveStep) {
            currentActiveStep = { step, stepInfo };
          }
        });
        if (crop.status === 'harvested') {
          completedCount = roadmapSteps.length;
          if (crop.harvestDateActual) lastActionDate = crop.harvestDateActual;
          if (crop.harvestNote) lastCorrection = crop.harvestNote;
        }
      }

      const totalSteps = roadmapSteps.length || 1;
      const percent = Math.min(100, Math.round((completedCount / totalSteps) * 100));

      return `
        <tr class="hover:bg-emerald-50/30 border-b border-gray-100 last:border-0 transition-colors">
          
          <!-- Column 1: รหัสการปลูก / แปลงปลูก -->
          <td class="py-3.5 px-4 align-middle">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-sm font-bold text-emerald-950 font-mono tracking-normal" title="รหัสการปลูก (ถ้ามี) / รหัสแปลง">
                  ${crop ? formatCropSeasonId(crop.id, crop.cropYear, crop.cropCycle) : (otherHerbCrop ? formatCropSeasonId(otherHerbCrop.id, otherHerbCrop.cropYear, otherHerbCrop.cropCycle) : plot.id)}
                </span>
                ${crop ? `
                  <span class="px-2 py-0.5 rounded-full text-sm font-bold ${
                    crop.status === 'harvested' ? 'bg-sky-100 text-sky-900 border border-sky-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }">
                    ${crop.status === 'harvested' ? 'เก็บเกี่ยวแล้ว' : 'กำลังปลูก'}
                  </span>
                ` : (otherHerbCrop ? `
                  <span class="px-2 py-0.5 rounded-full text-sm font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    ปลูกแล้ว (${otherHerbCrop.seedlingSource || 'พืชอื่น'})
                  </span>
                ` : `
                  <span class="px-2 py-0.5 rounded-full text-sm font-bold bg-gray-100 text-gray-600">
                    ยังไม่เริ่ม
                  </span>
                `)}
              </div>
              <div class="text-base font-bold text-gray-900 leading-snug">
                ${plot.name}
              </div>
              <div class="text-sm text-gray-600 flex items-center gap-2 flex-wrap pt-0.5">
                <span class="inline-flex items-center gap-1 whitespace-nowrap">
                  <i class="fas fa-user-circle text-gray-400"></i>
                  <span class="font-medium text-gray-800">${ownerName}</span>
                </span>
                <span class="text-gray-300">•</span>
                <span class="whitespace-nowrap font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  ${areaFormatted}
                </span>
              </div>
            </div>
          </td>

          <!-- Column 2: พืชที่ปลูก & วันที่เริ่ม -->
          <td class="py-3.5 px-4 align-middle">
            ${crop ? `
              <div class="space-y-1">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-900 border border-emerald-200/80">
                  <i class="fas fa-leaf text-emerald-600 text-sm"></i>
                  <span>${crop.seedlingSource || this.selectedHerb}</span>
                </span>
                <div class="text-sm text-gray-600">
                  เริ่ม: <b class="text-gray-800">${formatThaiDate(crop.plantDate)}</b>
                </div>
              </div>
            ` : (otherHerbCrop ? `
              <div class="space-y-1">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  <i class="fas fa-lock text-amber-600 text-sm"></i>
                  <span>${otherHerbCrop.seedlingSource || 'พืชอื่น'}</span>
                </span>
                <div class="text-sm text-gray-400">เริ่ม: ${formatThaiDate(otherHerbCrop.plantDate)}</div>
              </div>
            ` : `
              <div class="space-y-0.5">
                <span class="text-sm text-gray-400 font-medium block">รอเริ่มรอบปลูก</span>
                <span class="text-sm text-emerald-700 font-semibold">${this.selectedHerb}</span>
              </div>
            `)}
          </td>

          <!-- Column 3: ความคืบหน้า (4 ขั้นตอน) -->
          <td class="py-3.5 px-4 align-middle min-w-[200px]">
            ${crop ? `
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-bold text-gray-700">${completedCount} จาก ${totalSteps} ขั้น</span>
                  <span class="font-bold ${percent === 100 ? 'text-sky-700' : 'text-emerald-700'}">${percent}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/60">
                  <div class="h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-sky-500' : 'bg-emerald-600'}" style="width: ${percent}%"></div>
                </div>
                <!-- Mini Step Badges -->
                <div class="flex items-center gap-1.5 pt-0.5">
                  ${roadmapSteps.map((s, idx) => {
                    const info = this.evaluateStepState(crop, s, idx, roadmapSteps);
                    if (info.state === 'completed') {
                      return `<span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-2xs" title="ขั้นที่ ${s.stepNo}: ${s.title} (เสร็จแล้ว)"><i class="fas fa-check"></i></span>`;
                    } else if (info.state === 'current_active') {
                      return `<span class="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold animate-pulse shadow-2xs" title="ขั้นที่ ${s.stepNo}: ${s.title} (ถึงคิวทำ)">${s.stepNo}</span>`;
                    } else {
                      return `<span class="w-5 h-5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-bold" title="ขั้นที่ ${s.stepNo}: ${s.title} (รอดำเนินการ)">${s.stepNo}</span>`;
                    }
                  }).join('<i class="fas fa-chevron-right text-sm text-gray-300"></i>')}
                </div>
              </div>
            ` : `
              <div class="space-y-1.5 opacity-60">
                <div class="flex items-center justify-between text-sm text-gray-400">
                  <span>0 จาก ${totalSteps} ขั้น</span>
                  <span>0%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/60">
                  <div class="h-full rounded-full bg-gray-300 w-0"></div>
                </div>
                <div class="flex items-center gap-1.5 pt-0.5">
                  ${roadmapSteps.map(s => `
                    <span class="w-5 h-5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 flex items-center justify-center text-sm font-bold">${s.stepNo}</span>
                  `).join('<i class="fas fa-chevron-right text-sm text-gray-200"></i>')}
                </div>
              </div>
            `}
          </td>

          <!-- Column 4: ขั้นตอนถัดไป -->
          <td class="py-3.5 px-4 align-middle min-w-[170px]">
            ${crop ? (
              crop.status === 'harvested' ? `
                <div class="p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300 space-y-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-sm font-bold text-amber-900 flex items-center gap-1">
                      <i class="fas fa-box-open text-amber-600"></i> เก็บเกี่ยวแล้ว
                    </span>
                    <span class="text-sm bg-amber-200/80 text-amber-950 font-bold px-1.5 py-0.2 rounded">
                      ${formatThaiDate(crop.harvestDateActual || crop.harvestDateEst)}
                    </span>
                  </div>
                  <div class="text-sm font-bold text-emerald-950 truncate max-w-[170px]" title="${crop.produceName || (crop.seedlingSource ? `ผลผลิต${crop.seedlingSource}สด` : 'ผลผลิตสด')}">
                    🏷️ ${crop.produceName || (crop.seedlingSource ? (crop.seedlingSource.includes('ชา') ? `ใบ${crop.seedlingSource}สด` : `ดอก${crop.seedlingSource}สด`) : 'ดอกเก๊กฮวยสด')}
                  </div>
                  <div class="text-sm font-bold text-amber-950 flex items-center gap-1">
                    <i class="fas fa-weight-hanging text-amber-600 text-sm"></i>
                    <span>ปริมาณ: <b class="text-sm font-bold text-amber-900">${(parseFloat(crop.yield) || 0).toLocaleString()}</b> กก.</span>
                  </div>
                </div>
              ` : (currentActiveStep ? `
                <div class="space-y-0.5">
                  <div class="text-sm font-bold text-emerald-950 flex items-center gap-1">
                    <span class="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      ${currentActiveStep.step.stepNo}
                    </span>
                    <span class="truncate max-w-[150px]">${currentActiveStep.step.title}</span>
                  </div>
                  <div class="text-sm text-gray-500">
                    กำหนด: <b class="text-gray-800">${formatThaiDate(currentActiveStep.stepInfo.targetDate)}</b>
                  </div>
                </div>
              ` : `
                <span class="text-sm text-gray-400">รอดำเนินการ</span>
              `)
            ) : (otherHerbCrop ? `
              <span class="text-sm text-amber-700 font-bold">บันทึกกับพืชอื่นแล้ว</span>
            ` : `
              <div class="text-sm text-emerald-700 font-bold flex items-center gap-1">
                <i class="fas fa-arrow-right text-sm"></i>
                <span>ขั้น 1: ${roadmapSteps[0]?.title || 'ลงต้นกล้า'}</span>
              </div>
            `)}
          </td>

          <!-- Column 5: วันที่ทำจริงล่าสุด / สิ่งที่ปรับปรุงแก้ไข -->
          <td class="py-3.5 px-4 align-middle min-w-[190px]">
            ${crop ? `
              <div class="space-y-0.5">
                <div class="text-sm text-gray-800 font-bold flex items-center gap-1">
                  <i class="far fa-calendar-check text-emerald-600 text-sm"></i>
                  <span>${lastActionDate ? formatThaiDate(lastActionDate) : '-'}</span>
                </div>
                ${crop.rescheduleHistory && crop.rescheduleHistory.length > 0 ? `
                  <div class="inline-flex items-center gap-1 text-sm font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 truncate max-w-[190px]" title="เลื่อนกำหนดการล่าสุด: ${crop.rescheduleHistory[crop.rescheduleHistory.length - 1].reason}">
                    <i class="fas fa-calendar-alt text-amber-600 text-sm"></i>
                    <span>เลื่อนวัน: ${crop.rescheduleHistory[crop.rescheduleHistory.length - 1].reason}</span>
                  </div>
                ` : ''}
                ${lastCorrection ? `
                  <div class="text-sm text-gray-600 truncate max-w-[180px] bg-gray-50 px-2 py-0.5 rounded border border-gray-100" title="${lastCorrection}">
                    ${lastCorrection}
                  </div>
                ` : `
                  <span class="text-sm text-gray-400">ไม่มีบันทึกแก้ไข</span>
                `}
              </div>
            ` : `
              <span class="text-sm text-gray-300">-</span>
            `}
          </td>

          <!-- Column 6: จัดการ / บันทึก (Action) -->
          <td class="py-3.5 px-4 align-middle text-center min-w-[170px]">
            ${crop ? `
              <div class="flex items-center justify-center gap-1.5">
                ${crop.status !== 'harvested' && currentActiveStep ? `
                  <button data-plot-id="${plot.id}" data-step-no="${currentActiveStep.step.stepNo}" data-crop-id="${crop.id}"
                    class="action-single-step-btn px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1 shadow-2xs cursor-pointer" title="บันทึกขั้นที่ ${currentActiveStep.step.stepNo}: ${currentActiveStep.step.title}">
                    <i class="fas fa-plus text-xs"></i>
                    <span>ขั้น ${currentActiveStep.step.stepNo}: ${currentActiveStep.step.title}</span>
                  </button>
                ` : ''}
                ${crop.status !== 'harvested' ? `
                  <button data-crop-id="${crop.id}" data-plot-id="${plot.id}" class="reschedule-crop-btn p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 border border-amber-200 transition-all shadow-2xs cursor-pointer" title="เลื่อนกำหนดการปลูก / เลื่อนขั้นตอน (กรณีไม่ว่างหรือปลูกคนละวัน)">
                    <i class="fas fa-calendar-alt text-sm"></i>
                  </button>
                ` : ''}
                <button data-crop-id="${crop.id}" class="view-crop-detail-btn p-1.5 rounded-xl bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white transition-all shadow-2xs cursor-pointer" title="ดูรายละเอียดและ QR Code">
                  <i class="fas fa-eye text-sm"></i>
                </button>
                <button data-crop-id="${crop.id}" class="delete-crop-season-btn p-1.5 rounded-xl bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white transition-all shadow-2xs cursor-pointer" title="ลบรอบการปลูกนี้">
                  <i class="fas fa-trash-alt text-sm"></i>
                </button>
              </div>
            ` : (otherHerbCrop ? `
              <div class="flex items-center justify-center gap-1.5">
                <button data-crop-id="${otherHerbCrop.id}" class="view-crop-detail-btn p-1.5 rounded-xl bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white transition-all shadow-2xs cursor-pointer" title="ดูรายละเอียด (${otherHerbCrop.seedlingSource})">
                  <i class="fas fa-eye text-sm"></i>
                </button>
                <button data-crop-id="${otherHerbCrop.id}" class="delete-crop-season-btn p-1.5 rounded-xl bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white transition-all shadow-2xs cursor-pointer" title="ลบรอบการปลูกนี้">
                  <i class="fas fa-trash-alt text-sm"></i>
                </button>
              </div>
            ` : `
              <button data-plot-id="${plot.id}" class="row-start-step1-btn px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center gap-1 shadow-2xs cursor-pointer mx-auto">
                <i class="fas fa-seedling text-emerald-200"></i>
                <span>เริ่มปลูก</span>
              </button>
            `)}
          </td>

        </tr>
      `;
    }).join('');
  },

  // -------------------------------------------------------------
  // Render Rows for Matrix Table (Desktop / Tablet)
  // -------------------------------------------------------------
  renderMatrixRows(plots, activeCrops, members, roadmapSteps, allCropsThisPeriod = []) {
    if (plots.length === 0) {
      const colSpan = (roadmapSteps.length || 4) + 2;
      return `
        <tr>
          <td colspan="${colSpan}" class="py-12 px-6 text-center text-gray-500 font-medium bg-gray-50/50">
            <i class="fas fa-search text-3xl text-gray-300 mb-2 block"></i>
            ไม่พบข้อมูลแปลงปลูกตามเงื่อนไขที่ระบุ
          </td>
        </tr>
      `;
    }

    return plots.map(plot => {
      // Find owner of this plot
      const owner = members.find(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id);
      const ownerName = owner ? owner.name : 'ไม่พบชื่อเจ้าของ';
      const areaFormatted = formatThaiArea(plot.sizeRai, plot.sizeNgan, plot.sizeSqWah);

      // Match crop for this plot
      const crop = activeCrops.find(c => c.plotId === plot.id);
      const otherHerbCrop = !crop ? allCropsThisPeriod.find(c => c.plotId === plot.id) : null;

      // Check step status for each step
      return `
        <tr class="hover:bg-emerald-50/20 border-b border-gray-100 last:border-0 transition-colors group">
          
          <!-- Column 1: Plot Details & Owner -->
          <td class="py-4 px-5 align-top border-r border-gray-200/80 bg-gray-50/30">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-sm font-bold text-emerald-900" title="รหัสการปลูก (ถ้ามี) / รหัสแปลง">
                  ${crop ? formatCropSeasonId(crop.id, crop.cropYear, crop.cropCycle) : (otherHerbCrop ? formatCropSeasonId(otherHerbCrop.id, otherHerbCrop.cropYear, otherHerbCrop.cropCycle) : plot.id)}
                </span>
                ${crop ? `
                  <span class="px-2 py-0.5 rounded text-sm font-bold ${
                    crop.status === 'harvested' ? 'bg-sky-100 text-sky-900' : 'bg-emerald-100 text-emerald-900'
                  }">
                    ${crop.status === 'harvested' ? 'เก็บเกี่ยวแล้ว' : 'กำลังปลูก'}
                  </span>
                ` : (otherHerbCrop ? `
                  <span class="px-2 py-0.5 rounded text-sm font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <i class="fas fa-lock text-sm mr-1"></i>ปลูกแล้ว (${otherHerbCrop.seedlingSource || 'พืชอื่น'})
                  </span>
                ` : `
                  <span class="px-2 py-0.5 rounded text-sm font-bold bg-gray-100 text-gray-600">
                    ยังไม่เริ่ม
                  </span>
                `)}
              </div>
              <div class="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                ${plot.name}
              </div>
              <div class="text-sm text-gray-600 flex items-center gap-2 flex-wrap pt-0.5">
                <span class="inline-flex items-center gap-1 whitespace-nowrap">
                  <i class="fas fa-user-circle text-gray-400"></i>
                  <span class="font-medium text-gray-800">${ownerName}</span>
                </span>
                <span class="text-gray-300">•</span>
                <span class="whitespace-nowrap font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  ${areaFormatted}
                </span>
              </div>
            </div>
          </td>

          <!-- Step Columns (Matrix Cells) or Locked Banner if planted with other herb -->
          ${otherHerbCrop ? `
            <td colspan="${roadmapSteps.length}" class="py-3 px-4 align-middle bg-amber-50/30 border-r border-gray-200/80">
              <div class="p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/90 text-center flex items-center justify-center gap-2 text-sm font-bold text-amber-800">
                <i class="fas fa-lock text-amber-600 text-sm"></i>
                <span>แปลงนี้บันทึกปลูก <b>${otherHerbCrop.seedlingSource || 'พืชอื่น'}</b> ในรอบนี้แล้ว (1 รอบบันทึกได้ 1 แปลงเท่านั้น ระบบล็อกห้ามปลูกซ้ำ)</span>
              </div>
            </td>
          ` : roadmapSteps.map((step, idx) => {
            const stepInfo = this.evaluateStepState(crop, step, idx, roadmapSteps);
            return `
              <td class="py-3 px-3 align-top border-r border-gray-200/80">
                ${this.renderStepCell(plot, crop, step, stepInfo)}
              </td>
            `;
          }).join('')}

          <!-- Actions Column -->
          <td class="py-4 px-4 text-center align-middle">
            <div class="flex items-center justify-center gap-1.5">
              ${crop ? `
                <button data-crop-id="${crop.id}" class="view-crop-detail-btn p-2 rounded-xl bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white transition-all shadow-2xs cursor-pointer" title="ดูรายละเอียดไทม์ไลน์และ QR Code">
                  <i class="fas fa-eye text-sm"></i>
                </button>
                <button data-crop-id="${crop.id}" class="delete-crop-season-btn p-2 rounded-xl bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white transition-all shadow-2xs cursor-pointer" title="ลบรอบการปลูกนี้">
                  <i class="fas fa-trash-alt text-sm"></i>
                </button>
              ` : (otherHerbCrop ? `
                <button data-crop-id="${otherHerbCrop.id}" class="view-crop-detail-btn p-2 rounded-xl bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white transition-all shadow-2xs cursor-pointer" title="ดูรายละเอียด (${otherHerbCrop.seedlingSource})">
                  <i class="fas fa-eye text-sm"></i>
                </button>
                <button data-crop-id="${otherHerbCrop.id}" class="delete-crop-season-btn p-2 rounded-xl bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white transition-all shadow-2xs cursor-pointer" title="ลบรอบการปลูกนี้">
                  <i class="fas fa-trash-alt text-sm"></i>
                </button>
              ` : `
                <button data-plot-id="${plot.id}" class="row-start-step1-btn p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white transition-all shadow-2xs cursor-pointer" title="เริ่มลงต้นกล้าสำหรับแปลงนี้">
                  <i class="fas fa-plus text-sm"></i>
                </button>
              `)}
            </div>
          </td>

        </tr>
      `;
    }).join('');
  },

  // Helper to evaluate step state for validation (ห้ามข้ามขั้นตอน)
  evaluateStepState(crop, step, stepIdx, allSteps) {
    if (!crop || !crop.plantDate) {
      // Crop has not started yet
      if (stepIdx === 0) {
        return { state: 'not_started_first_step' };
      }
      return { state: 'disabled_locked', reason: 'ยังไม่ได้เริ่มขั้นตอนที่ 1' };
    }

    const stepNo = step.stepNo;
    const progress = crop.stepProgress || {};

    // 1. Check if this step is already completed
    let isCompleted = false;
    let completedDate = null;
    let note = '';

    if (progress[stepNo] && progress[stepNo].completed) {
      isCompleted = true;
      completedDate = progress[stepNo].date || progress[stepNo].completedDate;
      note = progress[stepNo].note || '';
    } else {
      // Backward compatibility with legacy crop objects
      if (stepNo === 1 && crop.plantDate) {
        isCompleted = true;
        completedDate = crop.plantDate;
        note = crop.note || 'ลงต้นกล้า';
      } else if (stepNo === 2 && (crop.fertilizingLog || []).length >= 1) {
        isCompleted = true;
        completedDate = crop.fertilizingLog[0].date;
        note = crop.fertilizingLog[0].type || '';
      } else if (stepNo === 3 && (crop.fertilizingLog || []).length >= 2) {
        isCompleted = true;
        completedDate = crop.fertilizingLog[1].date;
        note = crop.fertilizingLog[1].type || '';
      } else if (stepNo === allSteps.length && crop.status === 'harvested') {
        isCompleted = true;
        completedDate = crop.harvestDateActual || crop.harvestDateEst;
        note = crop.yield ? `ผลผลิต: ${crop.yield} กก.` : (crop.harvestNote || 'เก็บเกี่ยวสำเร็จ');
      }
    }

    if (isCompleted) {
      return {
        state: 'completed',
        date: completedDate,
        note: note
      };
    }

    // 2. If not completed, check if previous step is completed (Step Validation Rule)
    if (stepIdx === 0) {
      // Step 1: Ready to start
      return {
        state: 'current_active',
        targetDate: crop.plantDate || new Date().toISOString().split('T')[0]
      };
    }

    const prevStep = allSteps[stepIdx - 1];
    const prevInfo = this.evaluateStepState(crop, prevStep, stepIdx - 1, allSteps);

    if (prevInfo.state === 'completed') {
      // Previous step is completed, so THIS step is now the CURRENT ACTIVE step!
      let targetDate = null;
      if (progress[stepNo] && progress[stepNo].targetDate) {
        targetDate = progress[stepNo].targetDate;
      } else if (crop.plantDate) {
        const base = new Date(crop.plantDate);
        base.setDate(base.getDate() + (step.dayNumber - 1));
        targetDate = base.toISOString().split('T')[0];
      }
      return {
        state: 'current_active',
        targetDate: targetDate
      };
    }

    // Previous step is NOT completed: BLOCKED / DISABLED
    return {
      state: 'disabled_locked',
      reason: `ต้องทำขั้นตอนที่ ${prevStep.stepNo} ให้เสร็จก่อน`
    };
  },

  // Render individual matrix cell in table view
  renderStepCell(plot, crop, step, stepInfo) {
    if (stepInfo.state === 'completed') {
      return `
        <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-sm text-emerald-950 shadow-2xs">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="inline-flex items-center gap-1 font-bold text-emerald-800">
              <i class="fas fa-check-circle text-emerald-600"></i> เสร็จแล้ว
            </span>
            <span class="text-sm bg-emerald-200 text-emerald-950 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
              <i class="fas fa-lock text-sm"></i> ขั้นที่ ${step.stepNo}
            </span>
          </div>
          <div class="font-bold text-gray-900 text-sm">
            ${formatThaiDate(stepInfo.date)}
          </div>
          ${stepInfo.note ? `
            <div class="text-sm text-gray-600 mt-1 truncate max-w-[170px]" title="${stepInfo.note}">
              ${stepInfo.note}
            </div>
          ` : ''}
          <div class="mt-2 pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-sm text-emerald-800 font-semibold">
            <span class="flex items-center gap-1">
              <i class="fas fa-lock text-sm"></i> บันทึกแล้ว (ห้ามทำซ้ำ)
            </span>
          </div>
        </div>
      `;
    }

    if (stepInfo.state === 'current_active') {
      return `
        <div class="p-3 bg-amber-50/90 border-2 border-amber-300 rounded-xl text-sm text-amber-950 shadow-xs relative">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="inline-flex items-center gap-1 font-bold text-amber-900 uppercase">
              <i class="fas fa-clock text-amber-600 animate-pulse"></i> ถึงคิวทำ
            </span>
            <span class="text-sm bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
              ขั้นที่ ${step.stepNo}
            </span>
          </div>
          <div class="text-sm text-gray-700">
            กำหนด: <b class="text-gray-900">${formatThaiDate(stepInfo.targetDate)}</b>
          </div>
          <button data-plot-id="${plot.id}" data-step-no="${step.stepNo}" data-crop-id="${crop ? crop.id : ''}"
            class="action-single-step-btn mt-2.5 w-full py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-sm shadow-2xs cursor-pointer">
            <i class="fas fa-check text-sm"></i>
            <span>+ บันทึกขั้นตอนนี้</span>
          </button>
        </div>
      `;
    }

    if (stepInfo.state === 'not_started_first_step') {
      return `
        <div class="p-3 bg-gray-50 border border-dashed border-emerald-300 rounded-xl text-sm text-gray-500 text-center flex flex-col items-center justify-center min-h-[90px]">
          <span class="text-gray-400 font-semibold mb-1.5">ยังไม่เริ่มรอบปลูก</span>
          <button data-plot-id="${plot.id}" class="row-start-step1-btn py-1.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-sm shadow-2xs">
            <i class="fas fa-seedling text-emerald-700"></i>
            <span>+ เริ่มลงกล้า</span>
          </button>
        </div>
      `;
    }

    // Locked / Disabled (ห้ามข้ามขั้นตอน)
    return `
      <div class="p-3 bg-gray-50/70 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 opacity-60 cursor-not-allowed select-none flex flex-col items-center justify-center min-h-[90px] text-center"
        title="บล็อก: ${stepInfo.reason || 'กรุณาทำขั้นตอนก่อนหน้าให้เสร็จก่อน'}">
        <i class="fas fa-lock text-gray-300 text-sm mb-1"></i>
        <span class="font-bold text-gray-400">ยังไม่ถึงคิว</span>
        <span class="text-sm text-gray-400 mt-0.5">${stepInfo.reason || 'รอขั้นก่อนหน้า'}</span>
      </div>
    `;
  },

  init() {
    this.bindFilters();
    this.bindMatrixActions();
  },

  bindFilters() {
    const yearSelect = document.getElementById('filter-crop-year');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.selectedYear = parseInt(e.target.value);
        this.refreshView();
      });
    }

    const cycleSelect = document.getElementById('filter-crop-cycle');
    if (cycleSelect) {
      cycleSelect.addEventListener('change', (e) => {
        this.selectedCycle = parseInt(e.target.value);
        this.refreshView();
      });
    }

    const herbSelect = document.getElementById('filter-crop-herb');
    if (herbSelect) {
      herbSelect.addEventListener('change', (e) => {
        this.selectedHerb = e.target.value;
        this.refreshView();
      });
    }

    const searchInput = document.getElementById('filter-crop-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }

    const quickStep1Btn = document.getElementById('quick-start-step1-btn');
    if (quickStep1Btn) {
      quickStep1Btn.addEventListener('click', () => {
        this.openStep1Modal();
      });
    }

    // View Switcher Handlers (ตาราง Matrix เป็นหลัก / ตารางสรุปย่อ)
    const toggleMatrixBtn = document.getElementById('toggle-view-matrix-btn');
    if (toggleMatrixBtn) {
      toggleMatrixBtn.addEventListener('click', () => {
        this.viewMode = 'matrix';
        try { localStorage.setItem('crops_view_mode', 'matrix'); } catch (e) {}
        this.refreshView();
      });
    }

    const toggleCleanBtn = document.getElementById('toggle-view-clean-btn');
    if (toggleCleanBtn) {
      toggleCleanBtn.addEventListener('click', () => {
        this.viewMode = 'table';
        try { localStorage.setItem('crops_view_mode', 'table'); } catch (e) {}
        this.refreshView();
      });
    }
  },

  bindMatrixActions() {
    // 1. Header & Mobile Batch Buttons
    const batchBtns = document.querySelectorAll('.batch-step-header-btn');
    batchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const stepNo = parseInt(btn.getAttribute('data-step-no'));
        if (stepNo === 1) {
          this.openStep1Modal();
        } else {
          this.openSubsequentStepBatchModal(stepNo);
        }
      });
    });

    // 2. Row Start Step 1 Buttons (both Table and Mobile Cards)
    const rowStep1Btns = document.querySelectorAll('.row-start-step1-btn');
    rowStep1Btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const plotId = btn.getAttribute('data-plot-id');
        this.openStep1Modal(plotId);
      });
    });

    // 3. Row Action Single Step Buttons (both Table and Mobile Cards)
    const actionStepBtns = document.querySelectorAll('.action-single-step-btn');
    actionStepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const plotId = btn.getAttribute('data-plot-id');
        const stepNo = parseInt(btn.getAttribute('data-step-no'));
        const cropId = btn.getAttribute('data-crop-id');
        this.openSingleStepActionModal(plotId, stepNo, cropId);
      });
    });

    // 4. View Detail / QR Code Buttons (both Table and Mobile Cards)
    const detailBtns = document.querySelectorAll('.view-crop-detail-btn');
    detailBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        this.openCropDetailModal(cropId);
      });
    });

    // 4.1 Reschedule Crop Buttons (เลื่อนกำหนดการ / เลื่อนวันปลูก)
    const rescheduleBtns = document.querySelectorAll('.reschedule-crop-btn');
    rescheduleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        const plotId = btn.getAttribute('data-plot-id');
        this.openRescheduleModal(cropId, plotId);
      });
    });

    // 5. Delete Crop Buttons (both Table and Mobile Cards)
    const deleteBtns = document.querySelectorAll('.delete-crop-season-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        if (confirm(`คุณต้องการลบข้อมูลรอบการเพาะปลูกรหัส "${cropId}" ใช่หรือไม่?`)) {
          try {
            appState.deleteCrop(cropId);
            showToast(`ลบรอบการปลูก ${cropId} สำเร็จ`);
            this.refreshView();
          } catch (err) {
            showToast('ไม่สามารถลบรายการได้: ' + err.message, 'error');
          }
        }
      });
    });
  },

  // -------------------------------------------------------------
  // 3. หน้าต่างป๊อปอัปเมื่อกดปุ่ม [+] ในขั้นตอนที่ 1 (Modal ขั้นตอนที่ 1 - เริ่มลงต้นกล้า)
  // -------------------------------------------------------------
  openStep1Modal(preSelectedPlotId = null) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Current herb roadmap steps
    const currentRoadmap = appState.getRoadmapByHerb(this.selectedHerb) || {
      name: this.selectedHerb,
      durationDays: 90,
      steps: []
    };
    const steps = currentRoadmap.steps || [];

    // Plots list
    const plots = appState.getPlots();
    const members = appState.getMembers();
    const allCrops = appState.getCrops();

    // Find active crops for this Year & Cycle to flag already planted plots
    const existingCropsThisPeriod = allCrops.filter(c => 
      Number(c.cropYear) === Number(this.selectedYear) && 
      Number(c.cropCycle || 1) === Number(this.selectedCycle)
    );

    // Check if pre-selected plot has already been planted
    if (preSelectedPlotId) {
      const existingCrop = existingCropsThisPeriod.find(c => c.plotId === preSelectedPlotId);
      if (existingCrop) {
        showToast(`แปลง ${preSelectedPlotId} บันทึกรอบเพาะปลูกในรอบนี้แล้ว (${existingCrop.seedlingSource || 'พืชอื่น'}) ระบบล็อกห้ามทำซ้ำ (1 รอบบันทึกได้ 1 แปลงเท่านั้น)`, 'warning');
        return;
      }
    }

    // Check if all plots in this view are already planted
    const unplantedPlots = plots.filter(p => !existingCropsThisPeriod.some(c => c.plotId === p.id));
    if (unplantedPlots.length === 0) {
      showToast(`ทุกแปลงได้บันทึกรอบเพาะปลูกในรอบนี้เรียบร้อยแล้ว ระบบล็อกห้ามทำซ้ำ (1 รอบบันทึกได้ 1 แปลงเท่านั้น)`, 'info');
      return;
    }

    // Calculate dates helper: baseDate + (dayNumber - 1)
    const calculateStepDates = (baseDateStr) => {
      const result = {};
      const base = new Date(baseDateStr);
      steps.forEach(s => {
        const d = new Date(base);
        d.setDate(d.getDate() + (s.dayNumber - 1));
        result[s.stepNo] = d.toISOString().split('T')[0];
      });
      return result;
    };

    const initialCalculatedDates = calculateStepDates(todayStr);

    // Dynamic Roadmap Preview Cards HTML
    const renderRoadmapPreviewCards = (calculatedDates) => {
      return steps.map((s, idx) => {
        const dateStr = calculatedDates[s.stepNo] || todayStr;
        const isStep1 = idx === 0;
        return `
          <div class="p-3 rounded-xl border ${isStep1 ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-gray-200'} shadow-2xs flex-1 min-w-[130px]">
            <div class="flex items-center justify-between text-sm font-bold ${isStep1 ? 'text-emerald-800' : 'text-gray-500'} mb-0.5">
              <span>ขั้นที่ ${s.stepNo}</span>
              <span class="text-sm px-1.5 py-0.5 rounded bg-gray-100">${s.dayLabel || `วันที่ ${s.dayNumber}`}</span>
            </div>
            <div class="font-bold text-sm text-gray-900 leading-tight truncate">
              ${s.title}
            </div>
            <div class="mt-1.5 text-sm font-bold ${isStep1 ? 'text-emerald-700' : 'text-gray-700'}">
              <i class="far fa-calendar-alt mr-1"></i>
              <span class="step-preview-date-${s.stepNo}">${formatThaiDate(dateStr)}</span>
            </div>
          </div>
        `;
      }).join('');
    };

    // Plots Selection Checkbox List with Horizontal Table-like Rows and Coordinates
    const plotsCheckboxesHtml = plots.map(p => {
      const owner = members.find(m => (p.memberIds && p.memberIds.includes(m.id)) || p.memberId === m.id);
      const ownerName = owner ? owner.name : 'ไม่พบเจ้าของ';
      const existingCrop = existingCropsThisPeriod.find(c => c.plotId === p.id);
      const isAlreadyPlanted = !!existingCrop;
      const isPreSelected = preSelectedPlotId && preSelectedPlotId === p.id;
      const isChecked = !isAlreadyPlanted && (isPreSelected || !preSelectedPlotId);

      // Area in square wah for proportional calculation (1 ไร่ = 400 ตร.ว.)
      const totalSqWah = (parseFloat(p.sizeRai || 0) * 400) + (parseFloat(p.sizeNgan || 0) * 100) + parseFloat(p.sizeSqWah || 0);
      const initialSeedlings = 0;
      const initialCost = 0;

      const coordsStr = (p.lat && p.lng) ? `${parseFloat(p.lat).toFixed(4)}, ${parseFloat(p.lng).toFixed(4)}` : '-';
      const searchData = `${p.id} ${p.name} ${ownerName} ${p.sizeRai || ''}`.toLowerCase();

      const safePlotId = String(p.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `
        <div class="plot-item-card py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-xl border ${isAlreadyPlanted ? 'bg-gray-100/90 border-gray-200 opacity-60' : (isChecked ? 'bg-emerald-50/30 border-emerald-400 ring-1 ring-emerald-400/40' : 'bg-white border-gray-200 hover:border-emerald-300')} transition-all shadow-2xs cursor-pointer select-none"
          data-search="${searchData}" data-plot-id="${p.id}">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-3">
            
            <!-- Left Info (Wrapped in clickable label) -->
            <label for="plot-cb-${safePlotId}" class="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0 cursor-pointer select-none">
              <input type="checkbox" id="plot-cb-${safePlotId}" name="selected_plots" value="${p.id}" 
                ${isChecked ? 'checked' : ''}
                ${isAlreadyPlanted ? 'disabled' : ''}
                class="modal-plot-checkbox w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500 ${isAlreadyPlanted ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} shrink-0 transition-transform active:scale-90">
              
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-1 flex-1 items-center">
                <!-- Col 1: Code & Status -->
                <div>
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">รหัสแปลง</div>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="font-extrabold text-emerald-950 font-mono text-sm sm:text-base leading-none">${p.id}</span>
                    ${isAlreadyPlanted ? `
                      <span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded leading-none">
                        <i class="fas fa-lock text-[8px]"></i> ปลูกแล้ว
                      </span>
                    ` : `
                      <span class="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded leading-none">
                        ว่างพร้อมปลูก
                      </span>
                    `}
                  </div>
                </div>

                <!-- Col 2: Name -->
                <div>
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">ชื่อแปลง</div>
                  <div class="font-bold text-gray-900 text-xs sm:text-sm truncate mt-0.5 leading-tight" title="${p.name}">${p.name}</div>
                </div>

                <!-- Col 3: Owner -->
                <div>
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">เจ้าของแปลง</div>
                  <div class="font-semibold text-gray-800 text-xs sm:text-sm truncate mt-0.5 leading-tight" title="${ownerName}">${ownerName}</div>
                </div>

                <!-- Col 4: Area -->
                <div>
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">ขนาดพื้นที่</div>
                  <div class="font-bold text-emerald-900 text-xs sm:text-sm mt-0.5 leading-tight">${formatThaiArea(p.sizeRai, p.sizeNgan, p.sizeSqWah)}</div>
                </div>
              </div>
            </label>

            <!-- Right: Seedlings & Cost Inputs -->
            ${!isAlreadyPlanted ? `
              <div class="plot-inputs-wrapper flex items-center gap-2 bg-gray-50/90 px-2.5 py-1.5 rounded-lg border border-gray-200 shrink-0 cursor-default ${isChecked ? '' : 'opacity-50'}">
                <div class="w-24 sm:w-28">
                  <label class="block text-[10px] font-bold text-gray-600 mb-0.5 whitespace-nowrap">
                    🌱 ต้นกล้า:
                  </label>
                  <div class="relative">
                    <input type="number" 
                      data-plot-id="${p.id}" 
                      data-field="seedlingCount" 
                      data-base-sqwah="${totalSqWah}"
                      min="0" 
                      value="${initialSeedlings}" 
                      class="plot-seedling-input w-full px-2 py-1 pr-6 rounded-md border border-gray-300 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-text">
                    <span class="absolute right-1.5 top-1 text-[10px] text-gray-400 font-medium pointer-events-none">ต้น</span>
                  </div>
                </div>
                <div class="w-28 sm:w-32">
                  <label class="block text-[10px] font-bold text-gray-600 mb-0.5 whitespace-nowrap">
                    💵 ค่าใช้จ่าย:
                  </label>
                  <div class="relative">
                    <input type="number" 
                      data-plot-id="${p.id}" 
                      data-field="cost" 
                      data-base-sqwah="${totalSqWah}"
                      min="0" 
                      value="${initialCost}" 
                      class="plot-cost-input w-full px-2 py-1 pr-7 rounded-md border border-gray-300 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-text">
                    <span class="absolute right-1.5 top-1 text-[10px] text-gray-400 font-medium pointer-events-none">บาท</span>
                  </div>
                </div>
              </div>
            ` : ''}

          </div>
        </div>
      `;
    }).join('');

    const modalContent = `
      <form id="step1-planting-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 space-y-3.5 sm:space-y-4">
          
          <!-- Date Input -->
          <div class="max-w-xs">
            <label for="step1-plant-date" class="block text-sm font-bold text-gray-700 uppercase mb-1">
              วันที่ลงต้นกล้า (ขั้นตอนที่ 1) *
            </label>
            <input type="date" id="step1-plant-date" name="plantDate" required value="${todayStr}"
              class="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 text-base sm:text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <span class="text-xs text-gray-400 mt-0.5 block">* สามารถเลือกวันที่ย้อนหลังได้</span>
          </div>

          <!-- เลือกแปลงที่จะปลูก (Batch Processing with Checkboxes) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between flex-wrap gap-2.5">
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <label class="text-xs sm:text-sm font-bold text-gray-700 uppercase whitespace-nowrap flex items-center gap-1.5">
                  <i class="fas fa-check-double text-emerald-600"></i> เลือกแปลงและต้นกล้า *
                </label>
                <div class="flex items-center gap-1.5 text-xs font-bold bg-gray-100/90 px-2 py-1 rounded-lg border border-gray-200/70">
                  <button type="button" id="select-all-plots-btn" class="text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer">
                    เลือกทั้งหมด
                  </button>
                  <span class="text-gray-300">|</span>
                  <button type="button" id="deselect-all-plots-btn" class="text-red-500 hover:text-red-700 hover:underline cursor-pointer">
                    ยกเลิกทั้งหมด
                  </button>
                </div>
              </div>

              <!-- Search & Filter Bar -->
              <div class="relative flex-1 sm:max-w-xs min-w-[170px]">
                <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                  <i class="fas fa-search text-xs"></i>
                </span>
                <input type="text" id="step1-plot-search-input" placeholder="ค้นหาชื่อแปลง, รหัสแปลง..."
                  class="w-full pl-7 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs">
              </div>
            </div>

            <!-- Summary Bar -->
            <div id="plots-selection-summary-bar" class="flex items-center justify-between px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900">
              <span class="flex items-center gap-1.5"><i class="fas fa-layer-group text-emerald-600"></i> เลือก: <b id="summary-selected-count" class="text-emerald-800 text-sm">0</b> แปลง</span>
              <span class="flex items-center gap-1.5"><i class="fas fa-seedling text-emerald-600"></i> ต้นกล้ารวม: <b id="summary-total-seedlings" class="text-emerald-800 text-sm">0</b> ต้น</span>
              <span class="flex items-center gap-1.5"><i class="fas fa-coins text-emerald-600"></i> ค่าใช้จ่ายรวม: <b id="summary-total-cost" class="text-emerald-800 text-sm">0</b> บาท</span>
            </div>

            <!-- Plot rows list (Long horizontal rows) -->
            <div id="step1-plots-list-container" class="flex flex-col gap-1.5 max-h-[380px] sm:max-h-[460px] overflow-y-auto p-1.5 border border-gray-200 rounded-xl bg-gray-50/50">
              ${plotsCheckboxesHtml}
            </div>
          </div>

          <!-- หมายเหตุ -->
          <div>
            <label for="step1-note" class="block text-sm font-bold text-gray-700 uppercase mb-1">
              หมายเหตุ (จะใส่หรือไม่ใส่ก็ได้)
            </label>
            <input type="text" id="step1-note" name="note" placeholder="เช่น รองก้นหลุมด้วยปุ๋ยหมักอินทรีย์และรดน้ำชุ่มชื้น"
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>

        </div>

        <div class="flex flex-col-reverse sm:flex-row justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2 flex-shrink-0">
          <button type="button" class="close-global-modal-btn w-full sm:w-auto px-5 py-3 sm:py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-center">
            ยกเลิก
          </button>
          <button type="submit" class="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fas fa-check-circle"></i> ยืนยันบันทึกขั้นตอนที่ 1
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `บันทึกขั้นตอนที่ 1: เริ่มลงต้นกล้า (${this.selectedHerb})`,
      icon: 'fas fa-seedling',
      size: 'max-w-5xl',
      content: modalContent,
      onRender: (dialog) => {
        const plantDateInput = dialog.querySelector('#step1-plant-date');
        
        // Auto-calculate subsequent step dates when user changes plant date
        if (plantDateInput) {
          plantDateInput.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val) {
              const updatedDates = calculateStepDates(val);
              steps.forEach(s => {
                const previewSpan = dialog.querySelector(`.step-preview-date-${s.stepNo}`);
                if (previewSpan && updatedDates[s.stepNo]) {
                  previewSpan.textContent = formatThaiDate(updatedDates[s.stepNo]);
                }
              });
            }
          });
        }

        // Summary Calculator
        const updateSummary = () => {
          let selCount = 0;
          let totalSeedlings = 0;
          let totalCost = 0;

          dialog.querySelectorAll('.modal-plot-checkbox:not(:disabled)').forEach(cb => {
            const card = cb.closest('.plot-item-card');
            const inputsWrapper = card ? card.querySelector('.plot-inputs-wrapper') : null;
            const sInput = card ? card.querySelector('.plot-seedling-input') : null;
            const cInput = card ? card.querySelector('.plot-cost-input') : null;

            if (cb.checked) {
              selCount++;
              if (card) {
                card.classList.add('bg-emerald-50/30', 'border-emerald-400', 'ring-1', 'ring-emerald-400/40');
                card.classList.remove('bg-white', 'border-gray-200');
              }
              if (inputsWrapper) {
                inputsWrapper.classList.remove('opacity-50', 'pointer-events-none');
              }
              if (sInput) sInput.disabled = false;
              if (cInput) cInput.disabled = false;
              totalSeedlings += sInput ? (parseInt(sInput.value) || 0) : 0;
              totalCost += cInput ? (parseFloat(cInput.value) || 0) : 0;
            } else {
              if (card) {
                card.classList.remove('bg-emerald-50/30', 'border-emerald-400', 'ring-1', 'ring-emerald-400/40');
                card.classList.add('bg-white', 'border-gray-200');
              }
              if (inputsWrapper) {
                inputsWrapper.classList.add('opacity-50');
              }
              if (sInput) sInput.disabled = true;
              if (cInput) cInput.disabled = true;
            }
          });

          const countSpan = dialog.querySelector('#summary-selected-count');
          const seedlingsSpan = dialog.querySelector('#summary-total-seedlings');
          const costSpan = dialog.querySelector('#summary-total-cost');
          if (countSpan) countSpan.textContent = selCount;
          if (seedlingsSpan) seedlingsSpan.textContent = totalSeedlings.toLocaleString();
          if (costSpan) costSpan.textContent = totalCost.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        };

        // Listen for checkbox toggle
        dialog.querySelectorAll('.modal-plot-checkbox:not(:disabled)').forEach(cb => {
          cb.addEventListener('change', updateSummary);
          cb.addEventListener('click', (e) => {
            e.stopPropagation();
            updateSummary();
          });
        });

        // Click anywhere on card (or label) to toggle checkbox
        dialog.querySelectorAll('.plot-item-card').forEach(card => {
          card.addEventListener('click', (e) => {
            if (e.target.closest('.plot-inputs-wrapper') || e.target.tagName === 'INPUT' || e.target.closest('label')) {
              return;
            }
            const cb = card.querySelector('.modal-plot-checkbox:not(:disabled)');
            if (cb) {
              cb.checked = !cb.checked;
              updateSummary();
            }
          });

          // Auto-check when clicking input wrapper if unchecked
          const inputsWrapper = card.querySelector('.plot-inputs-wrapper');
          if (inputsWrapper) {
            inputsWrapper.addEventListener('click', (e) => {
              const cb = card.querySelector('.modal-plot-checkbox:not(:disabled)');
              if (cb && !cb.checked) {
                cb.checked = true;
                updateSummary();
                if (e.target.tagName === 'INPUT') {
                  e.target.focus();
                }
              }
            });
          }
        });

        // Listen for individual plot inputs change
        dialog.querySelectorAll('.plot-seedling-input, .plot-cost-input').forEach(inp => {
          inp.addEventListener('input', updateSummary);
        });

        // Calculate proportional by area button
        const calcAreaBtn = dialog.querySelector('#calc-by-area-btn');
        if (calcAreaBtn) {
          calcAreaBtn.addEventListener('click', () => {
            const baseSeedlings = 500;
            const baseCost = 2500;

            dialog.querySelectorAll('.plot-seedling-input').forEach(inp => {
              const sqWah = parseFloat(inp.getAttribute('data-base-sqwah')) || 400;
              inp.value = Math.max(50, Math.round((sqWah / 400) * baseSeedlings));
            });
            dialog.querySelectorAll('.plot-cost-input').forEach(inp => {
              const sqWah = parseFloat(inp.getAttribute('data-base-sqwah')) || 400;
              inp.value = Math.max(200, Math.round((sqWah / 400) * baseCost));
            });
            updateSummary();
            showToast('คำนวณต้นกล้าและต้นทุนตามขนาดพื้นที่ (ไร่/งาน) ของแต่ละแปลงเรียบร้อย', 'info');
          });
        }

        // Search & Filter plots listener
        const searchInput = dialog.querySelector('#step1-plot-search-input');
        if (searchInput) {
          searchInput.addEventListener('input', (e) => {
            const query = (e.target.value || '').trim().toLowerCase();
            dialog.querySelectorAll('.plot-item-card').forEach(card => {
              const searchContent = card.getAttribute('data-search') || '';
              if (!query || searchContent.includes(query)) {
                card.classList.remove('hidden');
              } else {
                card.classList.add('hidden');
              }
            });
          });
        }

        // Initial summary calculation
        updateSummary();

        // Select All / Deselect All Plot Checkboxes (Only non-disabled)
        const selectAllBtn = dialog.querySelector('#select-all-plots-btn');
        const deselectAllBtn = dialog.querySelector('#deselect-all-plots-btn');

        if (selectAllBtn) {
          selectAllBtn.addEventListener('click', () => {
            dialog.querySelectorAll('.modal-plot-checkbox:not(:disabled)').forEach(cb => cb.checked = true);
            updateSummary();
          });
        }
        if (deselectAllBtn) {
          deselectAllBtn.addEventListener('click', () => {
            dialog.querySelectorAll('.modal-plot-checkbox:not(:disabled)').forEach(cb => cb.checked = false);
            updateSummary();
          });
        }

        // Form Submit
        const form = dialog.querySelector('#step1-planting-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const plantDateStr = formData.get('plantDate');
            const defaultSeedlingCount = parseInt(formData.get('seedlingCount')) || 500;
            const defaultCost = parseFloat(formData.get('cost')) || 0;
            const note = (formData.get('note') || '').trim();

            const selectedPlotCheckboxes = dialog.querySelectorAll('.modal-plot-checkbox:checked:not(:disabled)');
            const selectedPlotIds = Array.from(selectedPlotCheckboxes).map(cb => cb.value);

            if (selectedPlotIds.length === 0) {
              showToast('กรุณาเลือกแปลงที่พร้อมปลูกอย่างน้อย 1 แปลง', 'warning');
              return;
            }

            // Strictly fetch fresh crops from appState to verify no duplicate
            const freshAllCrops = appState.getCrops();
            const freshCropsThisPeriod = freshAllCrops.filter(c =>
              Number(c.cropYear) === Number(this.selectedYear) &&
              Number(c.cropCycle || 1) === Number(this.selectedCycle)
            );

            // Strictly filter out any plot that already has a crop this period
            const eligiblePlotIds = selectedPlotIds.filter(plotId => {
              return !freshCropsThisPeriod.some(c => c.plotId === plotId);
            });

            if (eligiblePlotIds.length === 0) {
              showToast('ทุกแปลงที่เลือกได้บันทึกรอบเพาะปลูกในรอบนี้ไปแล้ว ระบบล็อกห้ามทำซ้ำ (1 รอบบันทึกได้ 1 แปลงเท่านั้น)', 'warning');
              return;
            }

            // Calculate dates for all steps
            const calculatedDates = calculateStepDates(plantDateStr);
            const lastStepNo = steps.length > 0 ? steps[steps.length - 1].stepNo : 4;
            const harvestDateEstStr = calculatedDates[lastStepNo] || calculatedDates[4] || plantDateStr;
            const step2DateStr = calculatedDates[2] || plantDateStr;

            let successCount = 0;
            let lastErrorMsg = '';

            eligiblePlotIds.forEach(plotId => {
              try {
                const stepProgress = {
                  1: {
                    stepNo: 1,
                    completed: true,
                    date: plantDateStr,
                    completedDate: plantDateStr,
                    targetDate: plantDateStr,
                    note: note || 'เริ่มลงต้นกล้า'
                  }
                };

                // Add scheduled target dates for remaining steps
                steps.forEach(s => {
                  if (s.stepNo > 1) {
                    stepProgress[s.stepNo] = {
                      stepNo: s.stepNo,
                      completed: false,
                      targetDate: calculatedDates[s.stepNo]
                    };
                  }
                });

                // Read individual plot seedlingCount and cost (fallback to default)
                const seedlingInput = dialog.querySelector(`.plot-seedling-input[data-plot-id="${plotId}"]`);
                const costInput = dialog.querySelector(`.plot-cost-input[data-plot-id="${plotId}"]`);
                
                const plotSeedlingCount = seedlingInput && !isNaN(parseInt(seedlingInput.value)) ? parseInt(seedlingInput.value) : 0;
                const plotCost = costInput && !isNaN(parseFloat(costInput.value)) ? parseFloat(costInput.value) : 0;

                // Create new crop season (strictly 1 round = 1 plot)
                appState.addCrop({
                  plotId: plotId,
                  cropYear: this.selectedYear,
                  cropCycle: this.selectedCycle,
                  seedlingSource: this.selectedHerb,
                  plantDate: plantDateStr,
                  harvestDateEst: harvestDateEstStr,
                  fertDateEst: step2DateStr,
                  seedlingCount: plotSeedlingCount,
                  cost: plotCost,
                  status: 'growing',
                  note: note,
                  stepProgress: stepProgress
                });
                successCount++;
              } catch (err) {
                lastErrorMsg = err.message;
                console.error(err);
              }
            });

            if (successCount > 0) {
              closeGlobalModal();
              showToast(`บันทึกเริ่มลงต้นกล้าสำเร็จ ${successCount} แปลงเรียบร้อย`);
              this.refreshView();
            } else {
              showToast(lastErrorMsg || 'ไม่สามารถบันทึกได้ เนื่องจากแปลงที่เลือกมีรอบการปลูกในรอบนี้อยู่แล้ว', 'warning');
            }
          });
        }
      }
    });
  },

  // -------------------------------------------------------------
  // 4. Modal บันทึกขั้นตอนที่ 2, 3, 4 แบบกลุ่ม (Batch Modal)
  // -------------------------------------------------------------
  openSubsequentStepBatchModal(targetStepNo) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const currentRoadmap = appState.getRoadmapByHerb(this.selectedHerb);
    const steps = currentRoadmap ? currentRoadmap.steps || [] : [];
    const targetStep = steps.find(s => s.stepNo === targetStepNo) || {
      stepNo: targetStepNo,
      title: `ขั้นตอนที่ ${targetStepNo}`
    };

    // Find all plots eligible for this step (Step Validation Rule)
    const plots = appState.getPlots();
    const members = appState.getMembers();
    const allCrops = appState.getCrops();

    const matrixCrops = allCrops.filter(c => 
      Number(c.cropYear) === Number(this.selectedYear) && 
      Number(c.cropCycle || 1) === Number(this.selectedCycle) &&
      (c.seedlingSource || 'เก๊กฮวย') === this.selectedHerb
    );

    // Eligible plots: plots that have completed previous step AND have not completed this step
    const eligibleList = [];
    plots.forEach(p => {
      const crop = matrixCrops.find(c => c.plotId === p.id);
      if (crop) {
        const stepIdx = steps.findIndex(s => s.stepNo === targetStepNo);
        if (stepIdx >= 0) {
          const stepInfo = this.evaluateStepState(crop, targetStep, stepIdx, steps);
          if (stepInfo.state === 'current_active') {
            const owner = members.find(m => (p.memberIds && p.memberIds.includes(m.id)) || p.memberId === m.id);
            eligibleList.push({
              plot: p,
              crop: crop,
              ownerName: owner ? owner.name : '-',
              targetDate: stepInfo.targetDate || todayStr
            });
          }
        }
      }
    });

    if (eligibleList.length === 0) {
      const allCompletedCount = matrixCrops.filter(c => c.stepProgress && c.stepProgress[targetStepNo]?.completed).length;
      const isAllDone = matrixCrops.length > 0 && allCompletedCount === matrixCrops.length;

      openGlobalModal({
        title: `บันทึกกลุ่ม: ${targetStep.title}`,
        icon: isAllDone ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle',
        headerColor: isAllDone ? 'bg-emerald-800' : 'bg-amber-600',
        content: `
          <div class="p-6 md:p-8 text-center space-y-4">
            <div class="w-16 h-16 rounded-full ${isAllDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-600'} flex items-center justify-center mx-auto text-2xl">
              <i class="fas ${isAllDone ? 'fa-lock' : 'fa-lock'}"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-800">
              ${isAllDone ? `ทุกแปลงบันทึกขั้นตอนที่ ${targetStepNo} เสร็จสิ้นแล้ว` : `ยังไม่มีแปลงที่พร้อมทำขั้นตอนที่ ${targetStepNo}`}
            </h3>
            <p class="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              ${isAllDone 
                ? `ทุกแปลงในรอบนี้ได้บันทึกขั้นตอนที่ ${targetStepNo} เรียบร้อยแล้ว ระบบทำการล็อกขั้นตอน ไม่สามารถบันทึกซ้ำได้` 
                : `ตามกฎการควบคุมกระบวนการเพาะปลูก (Step Validation) แปลงจะต้อง <b>ทำขั้นตอนที่ ${targetStepNo - 1} ให้เสร็จสิ้นก่อน</b> จึงจะสามารถบันทึกขั้นตอนที่ ${targetStepNo} ได้`}
            </p>
            <div class="pt-2">
              <button type="button" class="close-global-modal-btn px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm transition-colors cursor-pointer">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        `
      });
      return;
    }

    const isHarvestStep = targetStepNo === steps.length || targetStep.title.includes('เก็บเกี่ยว');

    const eligibleCheckboxesHtml = eligibleList.map(item => {
      const totalSqWah = (parseFloat(item.plot.sizeRai || 0) * 400) + (parseFloat(item.plot.sizeNgan || 0) * 100) + parseFloat(item.plot.sizeSqWah || 0);
      const initAmountNum = totalSqWah > 0 ? Math.max(5, Math.round((totalSqWah / 400) * 25)) : 25;
      const initCost = totalSqWah > 0 ? Math.max(100, Math.round((totalSqWah / 400) * 300)) : 300;
      const initYield = totalSqWah > 0 ? (Math.round((totalSqWah / 400) * 120 * 10) / 10).toFixed(1) : '100.0';
      const produceNameDefault = item.crop.produceName || (item.crop.seedlingSource ? (item.crop.seedlingSource.includes('ชา') ? `ใบ${item.crop.seedlingSource}สด` : `ดอก${item.crop.seedlingSource}สด`) : (this.selectedHerb.includes('ชา') ? `ใบ${this.selectedHerb}สด` : `ดอก${this.selectedHerb}สด`));

      const coordsStr = (item.plot.lat && item.plot.lng) ? `${parseFloat(item.plot.lat).toFixed(4)}, ${parseFloat(item.plot.lng).toFixed(4)}` : '-';
      const searchData = `${item.plot.id} ${item.plot.name} ${item.ownerName} ${item.plot.sizeRai || ''}`.toLowerCase();
      const safeCropId = String(item.crop.id).replace(/[^a-zA-Z0-9_-]/g, '_');

      return `
        <div class="batch-plot-card py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-xl border ${isHarvestStep ? 'bg-amber-50/30 border-amber-400 ring-1 ring-amber-400/40' : 'bg-emerald-50/30 border-emerald-400 ring-1 ring-emerald-400/40'} transition-all shadow-2xs cursor-pointer select-none"
          data-search="${searchData}" data-crop-id="${item.crop.id}">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-3">
            
            <!-- Left Info (Wrapped in clickable label) -->
            <label for="batch-cb-${safeCropId}" class="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0 cursor-pointer select-none">
              <input type="checkbox" id="batch-cb-${safeCropId}" name="eligible_plots" value="${item.crop.id}" checked
                class="batch-step-checkbox w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-gray-300 ${isHarvestStep ? 'text-amber-600 focus:ring-amber-500' : 'text-emerald-600 focus:ring-emerald-500'} cursor-pointer shrink-0 transition-transform active:scale-90">
              
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-1 flex-1 items-center">
                <!-- Col 1: Code & Target Date -->
                <div>
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">รหัสแปลง</div>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="font-extrabold ${isHarvestStep ? 'text-amber-950' : 'text-emerald-950'} font-mono text-sm sm:text-base leading-none">${item.plot.id}</span>
                    <span class="inline-flex items-center text-[9px] font-bold ${isHarvestStep ? 'text-amber-800 bg-amber-100 border border-amber-200' : 'text-emerald-800 bg-emerald-100/80 border border-emerald-200'} px-1.5 py-0.5 rounded leading-none">
                      กำหนด: ${formatThaiDate(item.targetDate)}
                    </span>
                  </div>
                </div>

                <!-- Col 2: Name -->
                <div>
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">ชื่อแปลง</div>
                  <div class="font-bold text-gray-900 text-xs sm:text-sm truncate mt-0.5 leading-tight" title="${item.plot.name}">${item.plot.name}</div>
                </div>

                <!-- Col 3: Owner -->
                <div>
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">เจ้าของแปลง</div>
                  <div class="font-semibold text-gray-800 text-xs sm:text-sm truncate mt-0.5 leading-tight" title="${item.ownerName}">${item.ownerName}</div>
                </div>

                <!-- Col 4: Area -->
                <div>
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">ขนาดพื้นที่</div>
                  <div class="font-bold ${isHarvestStep ? 'text-amber-900' : 'text-emerald-900'} text-xs sm:text-sm mt-0.5 leading-tight">${formatThaiArea(item.plot.sizeRai, item.plot.sizeNgan, item.plot.sizeSqWah)}</div>
                </div>
              </div>
            </label>

            <!-- Right: Inputs per plot -->
            <div class="batch-plot-inputs-wrapper flex items-center gap-2 bg-gray-50/90 px-2.5 py-1.5 rounded-lg border border-gray-200 shrink-0 cursor-default">
              ${isHarvestStep ? `
                <div class="w-32 sm:w-36">
                  <label class="block text-[10px] font-bold text-gray-600 mb-0.5 whitespace-nowrap">
                    <i class="fas fa-tag text-amber-600"></i> ชื่อผลผลิต:
                  </label>
                  <input type="text" 
                    data-plot-id="${item.crop.id}" 
                    name="produce_name_${item.crop.id}" 
                    value="${produceNameDefault}" 
                    placeholder="ชื่อผลผลิต"
                    class="batch-plot-producename-input w-full px-2 py-1 rounded-md border border-gray-300 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white cursor-text">
                </div>
                <div class="w-28 sm:w-32">
                  <label class="block text-[10px] font-bold text-gray-600 mb-0.5 whitespace-nowrap">
                    <i class="fas fa-weight-hanging text-amber-600"></i> น้ำหนักสด (กก.) *:
                  </label>
                  <div class="relative">
                    <input type="number" 
                      step="any" 
                      min="0.1" 
                      data-plot-id="${item.crop.id}" 
                      data-field="yield"
                      data-base-sqwah="${totalSqWah}"
                      name="yield_${item.crop.id}" 
                      value="${initYield}" 
                      required 
                      placeholder="เช่น 120.0"
                      class="batch-plot-yield-input w-full px-2 py-1 pr-7 rounded-md border border-gray-300 text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white cursor-text">
                    <span class="absolute right-1.5 top-1 text-[10px] text-gray-400 font-medium pointer-events-none">กก.</span>
                  </div>
                </div>
              ` : `
                <div class="w-24 sm:w-28">
                  <label class="block text-[10px] font-bold text-gray-600 mb-0.5 whitespace-nowrap">
                    🌿 ปริมาณเฉพาะแปลง:
                  </label>
                  <input type="text" 
                    data-plot-id="${item.crop.id}" 
                    data-field="amount" 
                    data-base-sqwah="${totalSqWah}"
                    name="amount_${item.crop.id}" 
                    value="${initAmountNum} กก." 
                    class="batch-plot-amount-input w-full px-2 py-1 rounded-md border border-gray-300 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-text"
                    placeholder="เช่น 25 กก.">
                </div>
                <div class="w-28 sm:w-32">
                  <label class="block text-[10px] font-bold text-gray-600 mb-0.5 whitespace-nowrap">
                    💵 ค่าใช้จ่ายเฉพาะแปลง:
                  </label>
                  <div class="relative">
                    <input type="number" 
                    data-plot-id="${item.crop.id}" 
                    data-field="cost" 
                    data-base-sqwah="${totalSqWah}"
                    name="cost_${item.crop.id}" 
                    min="0" 
                    value="${initCost}" 
                    class="batch-plot-cost-input w-full px-2 py-1 pr-7 rounded-md border border-gray-300 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-text"
                    placeholder="เช่น 300">
                    <span class="absolute right-1.5 top-1 text-[10px] text-gray-400 font-medium pointer-events-none">บาท</span>
                  </div>
                </div>
              `}
            </div>

          </div>
        </div>
      `;
    }).join('');

    const modalContent = `
      <form id="batch-subsequent-step-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 space-y-3.5 sm:space-y-4">
          
          <div class="p-3.5 sm:p-4 ${isHarvestStep ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'} rounded-2xl border space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold ${isHarvestStep ? 'text-amber-900' : 'text-emerald-900'} uppercase">
                <i class="fas fa-check-double mr-1"></i> บันทึกความคืบหน้าแบบกลุ่ม
              </span>
              <span class="px-2.5 py-0.5 rounded-full ${isHarvestStep ? 'bg-amber-200 text-amber-950' : 'bg-emerald-200 text-emerald-950'} font-bold text-xs">
                พร้อมบันทึก ${eligibleList.length} แปลง
              </span>
            </div>
            <h4 class="text-base font-bold text-gray-900 mt-1">
              ขั้นตอนที่ ${targetStep.stepNo}: ${targetStep.title}
            </h4>
            <p class="text-xs sm:text-sm text-gray-600">
              ทุกแปลงด้านล่างผ่านขั้นตอนก่อนหน้าเรียบร้อยแล้วและพร้อมบันทึกความคืบหน้า
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label for="batch-step-date" class="block text-xs font-bold text-gray-700 uppercase mb-1">วันที่ดำเนินการจริง *</label>
              <input type="date" id="batch-step-date" name="actionDate" required value="${todayStr}"
                class="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="batch-step-activity" class="block text-xs font-bold text-gray-700 uppercase mb-1">กิจกรรม / สูตรปุ๋ย *</label>
              <input type="text" id="batch-step-activity" name="activityName" required value="${targetStep.advice || targetStep.title}"
                class="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="batch-step-correction" class="block text-xs font-bold text-gray-700 uppercase mb-1">ปัญหาที่พบ / บันทึกแก้ไข (ถ้ามี)</label>
              <input type="text" id="batch-step-correction" name="correction" placeholder="เช่น สภาพอากาศแห้งแล้ง..."
                class="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>

            ${!isHarvestStep ? `
              <div class="hidden">
                <input type="hidden" id="batch-step-amount" name="amount" value="25 กิโลกรัม">
                <input type="hidden" id="batch-step-cost" name="cost" value="300">
              </div>
            ` : ''}
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between flex-wrap gap-2.5">
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <label class="text-xs sm:text-sm font-bold text-gray-700 uppercase whitespace-nowrap flex items-center gap-1.5">
                  <i class="fas fa-check-double ${isHarvestStep ? 'text-amber-600' : 'text-emerald-600'}"></i> เลือกแปลง (${eligibleList.length} แปลงที่พร้อม) *
                </label>
                <div class="flex items-center gap-1.5 text-xs font-bold bg-gray-100/90 px-2 py-1 rounded-lg border border-gray-200/70">
                  <button type="button" id="batch-select-all-btn" class="text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer">
                    เลือกทั้งหมด
                  </button>
                  <span class="text-gray-300">|</span>
                  <button type="button" id="batch-deselect-all-btn" class="text-red-500 hover:text-red-700 hover:underline cursor-pointer">
                    ยกเลิกทั้งหมด
                  </button>
                </div>
                ${!isHarvestStep ? `
                  <button type="button" id="batch-calc-by-area-btn" class="text-xs font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" title="คำนวณสัดส่วนปริมาณและค่าใช้จ่ายตามขนาดพื้นที่แปลง (1 ไร่ = ค่าเฉลี่ย)">
                    <i class="fas fa-calculator"></i> คำนวณตามพื้นที่
                  </button>
                  <button type="button" id="batch-apply-defaults-all-btn" class="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" title="ใช้ค่าเริ่มต้นให้เท่ากันทุกแปลง">
                    <i class="fas fa-clone"></i> ใช้ค่าเฉลี่ยทุกแปลง
                  </button>
                ` : `
                  <button type="button" id="batch-calc-harvest-by-area-btn" class="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" title="คำนวณผลผลิตสดประมาณการตามขนาดพื้นที่แปลง (1 ไร่ = 120 กก.)">
                    <i class="fas fa-calculator"></i> คำนวณผลผลิตตามพื้นที่
                  </button>
                `}
              </div>

              <!-- Search & Filter Bar -->
              <div class="relative flex-1 sm:max-w-xs min-w-[170px]">
                <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                  <i class="fas fa-search text-xs"></i>
                </span>
                <input type="text" id="batch-step-search-input" placeholder="ค้นหาชื่อแปลง, รหัสแปลง..."
                  class="w-full pl-7 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${isHarvestStep ? 'focus:ring-amber-500' : 'focus:ring-emerald-500'} bg-white shadow-2xs">
              </div>
            </div>

            <!-- Summary Bar -->
            <div id="batch-plots-summary-bar" class="flex items-center justify-between px-3.5 py-1.5 sm:py-2 bg-gradient-to-r ${isHarvestStep ? 'from-amber-50 to-orange-50 border-amber-200 text-amber-900' : 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900'} rounded-xl border text-xs font-bold">
              <span class="flex items-center gap-1.5"><i class="fas fa-layer-group ${isHarvestStep ? 'text-amber-600' : 'text-emerald-600'}"></i> เลือก: <b id="batch-summary-count" class="${isHarvestStep ? 'text-amber-800' : 'text-emerald-800'} text-sm">0</b> แปลง</span>
              ${isHarvestStep ? `
                <span class="flex items-center gap-1.5"><i class="fas fa-weight-hanging text-amber-600"></i> ผลผลิตสดรวม: <b id="batch-summary-harvest-yield" class="text-amber-800 text-sm">0</b> กก.</span>
              ` : `
                <span class="flex items-center gap-1.5"><i class="fas fa-coins text-emerald-600"></i> ค่าใช้จ่ายบำรุงรวม: <b id="batch-summary-total-cost" class="text-emerald-800 text-sm">0</b> บาท</span>
              `}
            </div>

            <!-- Plots list (Long horizontal rows) -->
            <div id="batch-step-plots-list-container" class="flex flex-col gap-1.5 max-h-[380px] sm:max-h-[460px] overflow-y-auto p-1.5 border border-gray-200 rounded-xl bg-gray-50/50">
              ${eligibleCheckboxesHtml}
            </div>
          </div>

          <div>
            <label for="batch-step-note" class="block text-sm font-bold text-gray-700 uppercase mb-1">หมายเหตุเพิ่มเติม</label>
            <input type="text" id="batch-step-note" name="note" placeholder="ระบุข้อสังเกต หรือสภาพต้นพืช (ถ้ามี)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>

        </div>

        <div class="flex flex-col-reverse sm:flex-row justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2 flex-shrink-0">
          <button type="button" class="close-global-modal-btn w-full sm:w-auto px-5 py-3 sm:py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-center">
            ยกเลิก
          </button>
          <button type="submit" class="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm font-bold text-white ${isHarvestStep ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-700 hover:bg-emerald-800'} rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fas fa-check-double"></i> บันทึกขั้นตอนที่ ${targetStep.stepNo}
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `บันทึกกลุ่ม: ขั้นตอนที่ ${targetStep.stepNo} - ${targetStep.title}`,
      icon: isHarvestStep ? 'fas fa-box-open' : 'fas fa-hand-holding-seedling',
      size: 'max-w-5xl',
      headerColor: isHarvestStep ? 'bg-amber-600' : 'bg-emerald-800',
      content: modalContent,
      onRender: (dialog) => {
        // Summary Calculator
        const updateBatchSummary = () => {
          let selCount = 0;
          let totalCost = 0;
          let totalYield = 0;

          dialog.querySelectorAll('.batch-step-checkbox').forEach(cb => {
            const card = cb.closest('.batch-plot-card');
            const inputsWrapper = card ? card.querySelector('.batch-plot-inputs-wrapper') : null;
            if (cb.checked) {
              selCount++;
              if (card) {
                card.classList.add(isHarvestStep ? 'bg-amber-50/30' : 'bg-emerald-50/30', isHarvestStep ? 'border-amber-400' : 'border-emerald-400', 'ring-1', isHarvestStep ? 'ring-amber-400/40' : 'ring-emerald-400/40');
                card.classList.remove('bg-white', 'border-gray-200');
              }
              if (inputsWrapper) inputsWrapper.classList.remove('opacity-50');
              card?.querySelectorAll('input:not(.batch-step-checkbox)').forEach(inp => inp.disabled = false);
              
              if (isHarvestStep) {
                const yInp = card ? card.querySelector('.batch-plot-yield-input') : null;
                totalYield += yInp ? (parseFloat(yInp.value) || 0) : 0;
              } else {
                const cInp = card ? card.querySelector('.batch-plot-cost-input') : null;
                totalCost += cInp ? (parseFloat(cInp.value) || 0) : 0;
              }
            } else {
              if (card) {
                card.classList.remove(isHarvestStep ? 'bg-amber-50/30' : 'bg-emerald-50/30', isHarvestStep ? 'border-amber-400' : 'border-emerald-400', 'ring-1', isHarvestStep ? 'ring-amber-400/40' : 'ring-emerald-400/40');
                card.classList.add('bg-white', 'border-gray-200');
              }
              if (inputsWrapper) inputsWrapper.classList.add('opacity-50');
              card?.querySelectorAll('input:not(.batch-step-checkbox)').forEach(inp => inp.disabled = true);
            }
          });

          const countEl = dialog.querySelector('#batch-summary-count');
          const costEl = dialog.querySelector('#batch-summary-total-cost');
          const yieldEl = dialog.querySelector('#batch-summary-harvest-yield');
          if (countEl) countEl.textContent = selCount;
          if (costEl) costEl.textContent = totalCost.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
          if (yieldEl) yieldEl.textContent = totalYield.toFixed(2);
        };

        // Listen for checkbox toggle
        dialog.querySelectorAll('.batch-step-checkbox').forEach(cb => {
          cb.addEventListener('change', updateBatchSummary);
          cb.addEventListener('click', (e) => {
            e.stopPropagation();
            updateBatchSummary();
          });
        });

        // Click anywhere on card (or label) to toggle checkbox
        dialog.querySelectorAll('.batch-plot-card').forEach(card => {
          card.addEventListener('click', (e) => {
            if (e.target.closest('.batch-plot-inputs-wrapper') || e.target.tagName === 'INPUT' || e.target.closest('label')) {
              return;
            }
            const cb = card.querySelector('.batch-step-checkbox');
            if (cb) {
              cb.checked = !cb.checked;
              updateBatchSummary();
            }
          });

          // Auto-check when clicking input wrapper if unchecked
          const inputsWrapper = card.querySelector('.batch-plot-inputs-wrapper');
          if (inputsWrapper) {
            inputsWrapper.addEventListener('click', (e) => {
              const cb = card.querySelector('.batch-step-checkbox');
              if (cb && !cb.checked) {
                cb.checked = true;
                updateBatchSummary();
                if (e.target.tagName === 'INPUT') {
                  e.target.focus();
                }
              }
            });
          }
        });

        // Listen for input changes
        dialog.querySelectorAll('.batch-plot-cost-input, .batch-plot-yield-input').forEach(inp => {
          inp.addEventListener('input', updateBatchSummary);
        });

        // Search & Filter plots listener
        const searchInput = dialog.querySelector('#batch-step-search-input');
        if (searchInput) {
          searchInput.addEventListener('input', (e) => {
            const query = (e.target.value || '').trim().toLowerCase();
            dialog.querySelectorAll('.batch-plot-card').forEach(card => {
              const searchContent = card.getAttribute('data-search') || '';
              if (!query || searchContent.includes(query)) {
                card.classList.remove('hidden');
              } else {
                card.classList.add('hidden');
              }
            });
          });
        }

        // Calculate by area buttons
        const calcAreaBtn = dialog.querySelector('#batch-calc-by-area-btn');
        if (calcAreaBtn) {
          calcAreaBtn.addEventListener('click', () => {
            const baseCost = parseFloat(dialog.querySelector('#batch-step-cost')?.value) || 300;
            dialog.querySelectorAll('.batch-plot-cost-input').forEach(inp => {
              const sqWah = parseFloat(inp.getAttribute('data-base-sqwah')) || 400;
              inp.value = Math.max(100, Math.round((sqWah / 400) * baseCost));
            });
            dialog.querySelectorAll('.batch-plot-amount-input').forEach(inp => {
              const sqWah = parseFloat(inp.getAttribute('data-base-sqwah')) || 400;
              inp.value = `${Math.max(5, Math.round((sqWah / 400) * 25))} กก.`;
            });
            updateBatchSummary();
            showToast('คำนวณปริมาณและค่าใช้จ่ายตามขนาดพื้นที่แปลงเรียบร้อย', 'info');
          });
        }

        const calcHarvestAreaBtn = dialog.querySelector('#batch-calc-harvest-by-area-btn');
        if (calcHarvestAreaBtn) {
          calcHarvestAreaBtn.addEventListener('click', () => {
            dialog.querySelectorAll('.batch-plot-yield-input').forEach(inp => {
              const sqWah = parseFloat(inp.getAttribute('data-base-sqwah')) || 400;
              inp.value = (Math.round((sqWah / 400) * 120 * 10) / 10).toFixed(1);
            });
            updateBatchSummary();
            showToast('คำนวณผลผลิตสดประมาณการตามขนาดพื้นที่แปลงเรียบร้อย', 'info');
          });
        }

        const applyDefaultsBtn = dialog.querySelector('#batch-apply-defaults-all-btn');
        if (applyDefaultsBtn) {
          applyDefaultsBtn.addEventListener('click', () => {
            const baseAmount = dialog.querySelector('#batch-step-amount')?.value || '25 กิโลกรัม';
            const baseCost = parseFloat(dialog.querySelector('#batch-step-cost')?.value) || 300;
            dialog.querySelectorAll('.batch-plot-amount-input').forEach(inp => inp.value = baseAmount);
            dialog.querySelectorAll('.batch-plot-cost-input').forEach(inp => inp.value = baseCost);
            updateBatchSummary();
            showToast('ปรับค่าเท่ากันทุกแปลงเรียบร้อย', 'info');
          });
        }

        const selectAllBtn = dialog.querySelector('#batch-select-all-btn');
        const deselectAllBtn = dialog.querySelector('#batch-deselect-all-btn');
        if (selectAllBtn) {
          selectAllBtn.addEventListener('click', () => {
            dialog.querySelectorAll('.batch-step-checkbox').forEach(cb => cb.checked = true);
            updateBatchSummary();
          });
        }
        if (deselectAllBtn) {
          deselectAllBtn.addEventListener('click', () => {
            dialog.querySelectorAll('.batch-step-checkbox').forEach(cb => cb.checked = false);
            updateBatchSummary();
          });
        }

        updateBatchSummary();

        const form = dialog.querySelector('#batch-subsequent-step-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const actionDate = formData.get('actionDate');
            const activityName = formData.get('activityName');
            const amountVal = formData.get('amount') || '';
            const costVal = parseFloat(formData.get('cost')) || 0;
            const correctionVal = (formData.get('correction') || '').trim();
            const noteVal = (formData.get('note') || '').trim();
            const fullNote = activityName + (correctionVal ? ` [แก้ไข: ${correctionVal}]` : '') + (noteVal ? ` (${noteVal})` : '');

            const checkedBoxes = dialog.querySelectorAll('.batch-step-checkbox:checked');
            const targetCropIds = Array.from(checkedBoxes).map(cb => cb.value);

            if (targetCropIds.length === 0) {
              showToast('กรุณาเลือกแปลงอย่างน้อย 1 แปลง', 'warning');
              return;
            }

            let successCount = 0;
            targetCropIds.forEach(cropId => {
              const crop = appState.getCropById(cropId);
              if (crop) {
                const stepProgress = crop.stepProgress || {};
                
                // STRICT LOCK GUARD: If this step is already completed, strictly ignore and do not repeat!
                if (stepProgress[targetStepNo] && stepProgress[targetStepNo].completed) {
                  return;
                }

                stepProgress[targetStepNo] = {
                  stepNo: targetStepNo,
                  completed: true,
                  date: actionDate,
                  completedDate: actionDate,
                  note: fullNote
                };

                const updatePayload = {
                  stepProgress: stepProgress
                };

                if (isHarvestStep) {
                  const produceNameInput = dialog.querySelector(`.batch-plot-producename-input[data-plot-id="${cropId}"]`);
                  const yieldInput = dialog.querySelector(`.batch-plot-yield-input[data-plot-id="${cropId}"]`);
                  const produceNameVal = (produceNameInput ? produceNameInput.value : '').trim() || (crop.seedlingSource ? (crop.seedlingSource.includes('ชา') ? `ใบ${crop.seedlingSource}สด` : `ดอก${crop.seedlingSource}สด`) : 'ผลผลิตสด');
                  const yieldVal = parseFloat(yieldInput ? yieldInput.value : 0) || 0;
                  
                  updatePayload.status = 'harvested';
                  updatePayload.harvestDateActual = actionDate;
                  updatePayload.produceName = produceNameVal;
                  updatePayload.yield = yieldVal;
                  updatePayload.harvestNote = `${produceNameVal} ${yieldVal} กก.` + (correctionVal ? ` [แก้ไข: ${correctionVal}]` : '') + (noteVal ? ` - ${noteVal}` : '');
                } else {
                  // Read plot specific amount and cost
                  const amountInput = dialog.querySelector(`.batch-plot-amount-input[data-plot-id="${cropId}"]`);
                  const costInput = dialog.querySelector(`.batch-plot-cost-input[data-plot-id="${cropId}"]`);
                  const plotAmount = amountInput ? amountInput.value : amountVal;
                  const plotCost = costInput ? (parseFloat(costInput.value) || 0) : costVal;

                  // Add to fertilizingLog
                  const fertilizingLog = crop.fertilizingLog || [];
                  fertilizingLog.push({
                    date: actionDate,
                    type: activityName + (correctionVal ? ` [แก้ไข: ${correctionVal}]` : ''),
                    amount: plotAmount,
                    cost: plotCost,
                    note: noteVal || correctionVal
                  });
                  updatePayload.fertilizingLog = fertilizingLog;
                }

                appState.updateCrop(cropId, updatePayload);
                successCount++;
              }
            });

            closeGlobalModal();
            showToast(`บันทึกขั้นตอนที่ ${targetStepNo} สำเร็จจำนวน ${successCount} แปลง`);
            this.refreshView();
          });
        }
      }
    });
  },

  // -------------------------------------------------------------
  // 5. Modal บันทึกเดี่ยวสำหรับแปลงใดแปลงหนึ่ง
  // -------------------------------------------------------------
  openSingleStepActionModal(plotId, stepNo, cropId) {
    const todayStr = new Date().toISOString().split('T')[0];
    const crop = cropId ? appState.getCropById(cropId) : null;
    const plot = appState.getPlotById(plotId);
    if (!plot) return;

    if (!crop) {
      showToast('ไม่พบข้อมูลรอบการปลูกของแปลงนี้ กรุณาเริ่มขั้นตอนที่ 1 ก่อน', 'warning');
      return;
    }

    // STRICT LOCK GUARD: Check if step is already completed
    if (crop.stepProgress && crop.stepProgress[stepNo] && crop.stepProgress[stepNo].completed) {
      showToast(`ขั้นตอนที่ ${stepNo} ของแปลงนี้บันทึกเสร็จสิ้นแล้ว ระบบล็อกห้ามทำซ้ำเด็ดขาด`, 'warning');
      return;
    }

    const currentRoadmap = appState.getRoadmapByHerb(this.selectedHerb);
    const steps = currentRoadmap ? currentRoadmap.steps || [] : [];
    const step = steps.find(s => s.stepNo === stepNo) || { stepNo: stepNo, title: `ขั้นตอนที่ ${stepNo}` };
    const isHarvest = stepNo === steps.length || step.title.includes('เก็บเกี่ยว');

    // Calculate smart initial default based on plot area
    const totalSqWah = (parseFloat(plot.sizeRai || 0) * 400) + (parseFloat(plot.sizeNgan || 0) * 100) + parseFloat(plot.sizeSqWah || 0);
    const singleDefaultCost = totalSqWah > 0 ? Math.max(100, Math.round((totalSqWah / 400) * 300)) : 300;
    const singleDefaultAmount = totalSqWah > 0 ? `${Math.max(5, Math.round((totalSqWah / 400) * 25))} กิโลกรัม` : '25 กิโลกรัม';
    const singleDefaultYield = totalSqWah > 0 ? (Math.round((totalSqWah / 400) * 120 * 10) / 10).toFixed(1) : '120.0';

    let herbRatio = 7;
    const herbSource = (crop.seedlingSource || (plot ? plot.plantType : '') || this.selectedHerb || '').toLowerCase();
    if (herbSource.includes('เก๊กฮวย')) herbRatio = 8;
    else if (herbSource.includes('คาโมมายล์')) herbRatio = 6;
    else if (herbSource.includes('ชา')) herbRatio = 4.5;
    else if (herbSource.includes('ดาวเรือง')) herbRatio = 7;
    else if (herbSource.includes('ฟ้าทะลายโจร')) herbRatio = 5;

    const modalContent = `
      <form id="single-step-action-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-4 sm:p-6 md:p-8 space-y-4 overflow-y-auto flex-1">
          <div class="p-3.5 sm:p-4 ${isHarvest ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'} rounded-2xl border space-y-1">
            <span class="text-sm font-bold ${isHarvest ? 'text-amber-800' : 'text-emerald-800'} uppercase">
              บันทึกขั้นตอน: ${plot.id} (${plot.name})
            </span>
            <h4 class="text-base font-bold text-gray-900">
              ขั้นตอนที่ ${step.stepNo}: ${step.title}
            </h4>
            <p class="text-xs text-emerald-800 font-semibold mt-0.5">
              ขนาดแปลง: <b>${formatThaiArea(plot.sizeRai, plot.sizeNgan, plot.sizeSqWah)}</b> (คำนวณปริมาณและต้นทุนตามขนาดพื้นที่ให้อัตโนมัติ)
            </p>
            <p class="text-sm text-gray-500">
              ${step.detail || 'บันทึกข้อมูลการปฏิบัติงานเพื่อติดตามประวัติ'}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label for="single-step-date" class="block text-sm font-bold text-gray-700 uppercase mb-1">วันที่ดำเนินการจริง *</label>
              <input type="date" id="single-step-date" name="actionDate" required value="${todayStr}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="single-step-activity" class="block text-sm font-bold text-gray-700 uppercase mb-1">กิจกรรม / รายละเอียด *</label>
              <input type="text" id="single-step-activity" name="activityName" required value="${step.advice || step.title}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div class="sm:col-span-2">
              <label for="single-step-correction" class="block text-sm font-bold text-gray-700 uppercase mb-1">ปัญหาที่พบ / ปรับปรุงแก้ไข (ถ้ามี)</label>
              <input type="text" id="single-step-correction" name="correction" placeholder="เช่น พบแมลงรบกวน จึงได้ฉีดพ่นน้ำส้มควันไม้..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm font-medium text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>

            ${isHarvest ? `
              <div>
                <label for="single-step-produce-name" class="block text-sm font-bold text-gray-700 uppercase mb-1">
                  <i class="fas fa-tag text-amber-600 mr-1"></i> ชื่อผลผลิตที่เก็บเกี่ยว *
                </label>
                <input type="text" id="single-step-produce-name" name="produceName" required 
                  value="${crop.produceName || (crop.seedlingSource ? (crop.seedlingSource.includes('ชา') ? `ใบ${crop.seedlingSource}สด` : `ดอก${crop.seedlingSource}สด`) : (this.selectedHerb.includes('ชา') ? `ใบ${this.selectedHerb}สด` : `ดอก${this.selectedHerb}สด`))}" 
                  placeholder="เช่น ดอกเก๊กฮวยสด, ใบชาอัสสัมสด"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500">
              </div>

              <div>
                <label for="single-step-yield" class="block text-sm font-bold text-gray-700 uppercase mb-1">
                  <i class="fas fa-weight-hanging text-amber-600 mr-1"></i> ปริมาณผลผลิตสดที่เก็บเกี่ยวได้ (กก.) *
                </label>
                <input type="number" step="any" min="0.1" id="single-step-yield" name="yieldAmount" required value="${singleDefaultYield}" placeholder="เช่น 120.00"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
              </div>

              <!-- ผลผลิตสดส่งต่อเข้าโรงอบแห้งกลาง -->
              <div class="sm:col-span-2 p-3.5 bg-amber-50 rounded-xl border border-amber-200/90 flex items-center gap-2.5 text-xs sm:text-sm text-amber-900 shadow-2xs">
                <i class="fas fa-info-circle text-amber-600 text-base shrink-0"></i>
                <span>ผลผลิตสดที่บันทึกจะถูกรวบรวมเข้าสู่ระบบ เพื่อนำไปผ่านกระบวนการอบแห้งในเมนู <b>"จัดการโรงอบแห้ง"</b> ต่อไป</span>
              </div>
            ` : `
              <div>
                <label for="single-step-amount" class="block text-sm font-bold text-gray-700 uppercase mb-1">ปริมาณที่ใช้</label>
                <input type="text" id="single-step-amount" name="amount" placeholder="เช่น 20 กก." value="${singleDefaultAmount}"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <div>
                <label for="single-step-cost" class="block text-sm font-bold text-gray-700 uppercase mb-1">ค่าใช้จ่าย (บาท)</label>
                <input type="number" id="single-step-cost" name="cost" min="0" value="${singleDefaultCost}" placeholder="เช่น 300"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            `}

            <div class="sm:col-span-2">
              <label for="single-step-note" class="block text-sm font-bold text-gray-700 uppercase mb-1">หมายเหตุ</label>
              <textarea id="single-step-note" name="note" rows="2" placeholder="ระบุข้อสังเกต หรือสภาพต้นพืช (ถ้ามี)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>
          </div>
        </div>

        <div class="flex flex-col-reverse sm:flex-row justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2 flex-shrink-0">
          <button type="button" class="close-global-modal-btn w-full sm:w-auto px-5 py-3 sm:py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-center">
            ยกเลิก
          </button>
          <button type="submit" class="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm font-bold text-white ${isHarvest ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-700 hover:bg-emerald-800'} rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fas fa-save"></i> บันทึกข้อมูล
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `บันทึกขั้นตอน: ${plot.name} (ขั้นที่ ${stepNo})`,
      icon: isHarvest ? 'fas fa-box-open' : 'fas fa-clipboard-check',
      size: isHarvest ? 'max-w-2xl' : 'max-w-xl',
      headerColor: isHarvest ? 'bg-amber-600' : 'bg-emerald-800',
      content: modalContent,
      onRender: (dialog) => {
        const form = dialog.querySelector('#single-step-action-form');

        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const actionDate = formData.get('actionDate');
            const activityName = formData.get('activityName');
            const noteVal = (formData.get('note') || '').trim();

            if (!crop) {
              showToast('ไม่พบข้อมูลรอบการปลูกของแปลงนี้', 'error');
              return;
            }

            // STRICT LOCK GUARD: If already completed, block repeat!
            if (crop.stepProgress && crop.stepProgress[stepNo] && crop.stepProgress[stepNo].completed) {
              showToast(`ขั้นตอนที่ ${stepNo} ของแปลงนี้ถูกบันทึกไปแล้ว ไม่สามารถบันทึกซ้ำได้`, 'error');
              closeGlobalModal();
              return;
            }

            const correctionVal = formData.get('correction') || '';
            const fullNote = activityName + (correctionVal ? ` [แก้ไข: ${correctionVal}]` : '') + (noteVal ? ` (${noteVal})` : '');

            const stepProgress = crop.stepProgress || {};
            stepProgress[stepNo] = {
              stepNo: stepNo,
              completed: true,
              date: actionDate,
              completedDate: actionDate,
              note: fullNote
            };

            const updatePayload = {
              stepProgress: stepProgress
            };

            let produceNameVal = '';
            let yieldVal = 0;

            if (isHarvest) {
              produceNameVal = (formData.get('produceName') || '').trim() || (crop.seedlingSource ? (crop.seedlingSource.includes('ชา') ? `ใบ${crop.seedlingSource}สด` : `ดอก${crop.seedlingSource}สด`) : 'ผลผลิตสด');
              yieldVal = parseFloat(formData.get('yieldAmount')) || 0;

              updatePayload.status = 'harvested';
              updatePayload.harvestDateActual = actionDate;
              updatePayload.produceName = produceNameVal;
              updatePayload.yield = yieldVal;
              updatePayload.harvestNote = `${produceNameVal} ${yieldVal} กก.` + (correctionVal ? ` [แก้ไข: ${correctionVal}]` : '') + (noteVal ? ` - ${noteVal}` : '');
              updatePayload.isProcessed = false;
            } else {
              const amountVal = formData.get('amount') || '';
              const costVal = parseFloat(formData.get('cost')) || 0;
              const fertilizingLog = crop.fertilizingLog || [];
              fertilizingLog.push({
                date: actionDate,
                type: activityName + (correctionVal ? ` [แก้ไข: ${correctionVal}]` : ''),
                amount: amountVal,
                cost: costVal,
                note: noteVal || correctionVal
              });
              updatePayload.fertilizingLog = fertilizingLog;
            }

            try {
              appState.updateCrop(crop.id, updatePayload);
            } catch (err) {
              console.error("updateCrop error:", err);
            }
            closeGlobalModal();
            showToast(isHarvest 
              ? `บันทึกการเก็บเกี่ยว${produceNameVal} (${yieldVal} กก.) สำเร็จ (ส่งเข้า "จัดการโรงอบแห้ง" เรียบร้อย)` 
              : `บันทึกขั้นตอนที่ ${stepNo} ของแปลง ${plot.name} สำเร็จ`);
            this.refreshView();
          });
        }
      }
    });
  },

  // -------------------------------------------------------------
  // 5.5 Modal เลื่อนกำหนดการเพาะปลูก (Reschedule / Postpone Planting)
  // -------------------------------------------------------------
  openRescheduleModal(cropId, plotId) {
    const crop = appState.getCropById(cropId);
    if (!crop) {
      showToast('ไม่พบข้อมูลรอบการปลูกนี้', 'error');
      return;
    }
    const plot = plotId ? appState.getPlotById(plotId) : appState.getPlotById(crop.plotId);
    const members = appState.getMembers();
    const owner = plot ? members.find(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : null;
    const ownerName = owner ? owner.name : '-';
    const herbType = crop.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';
    const currentRoadmap = appState.getRoadmapByHerb(herbType);
    const steps = currentRoadmap ? currentRoadmap.steps || [] : [];
    const stepProgress = crop.stepProgress || {};

    // Find uncompleted steps
    const uncompletedSteps = steps.filter(s => !stepProgress[s.stepNo] || !stepProgress[s.stepNo].completed);

    // Current plant date
    const currentPlantDate = crop.plantDate || new Date().toISOString().split('T')[0];

    // Reschedule history list
    const historyList = crop.rescheduleHistory || [];
    const historyHtml = historyList.length > 0 ? `
      <div class="space-y-1.5 pt-2 border-t border-gray-100">
        <label class="block text-sm font-bold text-gray-600 uppercase">
          <i class="fas fa-history text-amber-600 mr-1"></i> ประวัติการเลื่อนกำหนดการที่ผ่านมา (${historyList.length} ครั้ง)
        </label>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          ${historyList.map(h => `
            <div class="text-sm p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between flex-wrap gap-1">
              <div>
                <b class="text-amber-950">${h.target === 'step' ? `ขั้นที่ ${h.stepNo}` : 'วันเริ่มปลูก'}</b>: 
                <span class="line-through text-gray-400">${formatThaiDate(h.oldDate)}</span> 
                <i class="fas fa-arrow-right text-sm text-amber-600 mx-1"></i>
                <b class="text-emerald-800">${formatThaiDate(h.newDate)}</b>
                <span class="text-gray-500 block">เหตุผล: ${h.reason}</span>
              </div>
              <span class="text-sm text-gray-400 font-mono">${formatThaiDate(h.date)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const modalContent = `
      <form id="reschedule-crop-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-4 sm:p-6 md:p-8 space-y-4 overflow-y-auto flex-1">
          
          <!-- Summary Info Banner -->
          <div class="p-4 bg-gradient-to-r from-amber-50 to-orange-50/40 rounded-2xl border border-amber-200 space-y-1.5">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="text-sm font-bold text-amber-900 uppercase flex items-center gap-1.5">
                <i class="fas fa-calendar-alt text-amber-600"></i> เลื่อนกำหนดการ / วันที่ปลูก
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold text-sm font-mono">
                ${crop.id}
              </span>
            </div>
            <div class="text-sm text-gray-700">
              แปลง: <b>${plot ? plot.name : '-'}</b> (${plot ? plot.id : '-'}) • ผู้ดูแล: <b>${ownerName}</b>
            </div>
            <div class="text-sm text-gray-500">
              * สำหรับกรณีเกษตรกรปลูกคนละวันกัน ติดภารกิจ หรือสภาพอากาศไม่อำนวย ระบบจะปรับเลื่อนวันของแผนงานให้ทันที
            </div>
          </div>

          <!-- Reschedule Type Selection -->
          <div class="space-y-1.5">
            <label class="block text-sm font-bold text-gray-700 uppercase">
              เลือกลักษณะการเลื่อนกำหนดการ *
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label class="p-3 rounded-xl border border-emerald-300 bg-emerald-50/50 flex items-start gap-2.5 cursor-pointer">
                <input type="radio" name="rescheduleType" value="plantDate" checked class="mt-0.5 text-emerald-600 focus:ring-emerald-500">
                <div class="text-sm">
                  <b class="text-emerald-950 block">เลื่อนวันเริ่มปลูก (คำนวณใหม่ทั้งรอบ)</b>
                  <span class="text-gray-500 text-sm">ปรับวันลงกล้าใหม่ ทุกขั้นตอนที่เหลือจะเลื่อนตามอัตโนมัติ</span>
                </div>
              </label>
              ${uncompletedSteps.length > 0 ? `
                <label class="p-3 rounded-xl border border-gray-200 hover:border-emerald-200 bg-white flex items-start gap-2.5 cursor-pointer">
                  <input type="radio" name="rescheduleType" value="step" class="mt-0.5 text-emerald-600 focus:ring-emerald-500">
                  <div class="text-sm">
                    <b class="text-gray-800 block">เลื่อนเฉพาะขั้นตอนปัจจุบัน</b>
                    <span class="text-gray-500 text-sm">เช่น เลื่อนวันใส่ปุ๋ย หรือวันเก็บเกี่ยวของขั้นนี้</span>
                  </div>
                </label>
              ` : ''}
            </div>
          </div>

          <!-- Section A: New Plant Date -->
          <div id="section-plant-date-reschedule" class="space-y-2.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
            <div class="flex items-center justify-between flex-wrap gap-1 text-sm">
              <span class="text-gray-600 font-bold">วันเริ่มปลูกเดิม: <b class="text-gray-900">${formatThaiDate(currentPlantDate)}</b></span>
              <span class="text-sm text-emerald-700 font-bold"><i class="fas fa-calculator mr-1"></i>จะคำนวณวันขั้นตอนถัดไปใหม่</span>
            </div>
            
            <div>
              <label for="reschedule-new-plant-date" class="block text-sm font-bold text-gray-700 uppercase mb-1">
                กำหนดวันที่เริ่มปลูกใหม่ *
              </label>
              <input type="date" id="reschedule-new-plant-date" name="newPlantDate" value="${currentPlantDate}" required
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <!-- Quick Postpone Buttons (+3, +7, +14, +30 วัน) -->
            <div class="flex items-center gap-1.5 flex-wrap pt-1">
              <span class="text-sm text-gray-500 font-bold">ปุ่มลัดเลื่อนวัน:</span>
              <button type="button" data-days="3" class="btn-quick-shift-days px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-sm font-bold text-emerald-800 shadow-2xs cursor-pointer">
                +3 วัน
              </button>
              <button type="button" data-days="7" class="btn-quick-shift-days px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-sm font-bold text-emerald-800 shadow-2xs cursor-pointer">
                +7 วัน (1 สัปดาห์)
              </button>
              <button type="button" data-days="14" class="btn-quick-shift-days px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-sm font-bold text-emerald-800 shadow-2xs cursor-pointer">
                +14 วัน (2 สัปดาห์)
              </button>
              <button type="button" data-days="30" class="btn-quick-shift-days px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-sm font-bold text-emerald-800 shadow-2xs cursor-pointer">
                +30 วัน (1 เดือน)
              </button>
            </div>
          </div>

          <!-- Section B: Step Reschedule (Hidden by default unless selected) -->
          <div id="section-step-reschedule" class="space-y-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200 hidden">
            <div>
              <label for="reschedule-step-select" class="block text-sm font-bold text-gray-700 uppercase mb-1">
                เลือกขั้นตอนที่ต้องการเลื่อนวัน *
              </label>
              <select id="reschedule-step-select" name="targetStepNo" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                ${uncompletedSteps.map(s => `
                  <option value="${s.stepNo}">ขั้นที่ ${s.stepNo}: ${s.title}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label for="reschedule-new-step-date" class="block text-sm font-bold text-gray-700 uppercase mb-1">
                กำหนดวันดำเนินการใหม่ของขั้นตอนนี้ *
              </label>
              <input type="date" id="reschedule-new-step-date" name="newStepDate" value="${new Date().toISOString().split('T')[0]}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>

          <!-- Reason Field -->
          <div class="space-y-1.5">
            <label for="reschedule-reason-select" class="block text-sm font-bold text-gray-700 uppercase">
              เหตุผลในการเลื่อนกำหนดการ *
            </label>
            <select id="reschedule-reason-select" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="เกษตรกรติดภารกิจ / ไม่ว่างตามกำหนดเดิม">เกษตรกรติดภารกิจ / ไม่ว่างตามกำหนดเดิม</option>
              <option value="เวลาการปลูกคนละวันกันกับแปลงอื่น">เวลาการปลูกคนละวันกันกับแปลงอื่น</option>
              <option value="สภาพอากาศไม่เอื้ออำนวย (ฝนตกชุก / ดินแฉะ / แล้ง)">สภาพอากาศไม่เอื้ออำนวย (ฝนตกชุก / ดินแฉะ / แล้ง)</option>
              <option value="รอต้นกล้าหรือปัจจัยการผลิตพร้อม">รอต้นกล้าหรือปัจจัยการผลิตพร้อม</option>
              <option value="ปรับตามอัตราการเจริญเติบโตจริงของพืช">ปรับตามอัตราการเจริญเติบโตจริงของพืช</option>
              <option value="other">อื่นๆ (ระบุเอง)</option>
            </select>
            <input type="text" id="reschedule-custom-reason" name="customReason" placeholder="ระบุเหตุผลเพิ่มเติม..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 hidden mt-1.5">
          </div>

          <!-- History if any -->
          ${historyHtml}

        </div>

        <div class="flex flex-col-reverse sm:flex-row justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2 flex-shrink-0">
          <button type="button" class="close-global-modal-btn w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-center">
            ยกเลิก
          </button>
          <button type="submit" class="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fas fa-calendar-check"></i> บันทึกการเลื่อนกำหนดการ
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `เลื่อนกำหนดการเพาะปลูก: ${crop.id}`,
      icon: 'fas fa-calendar-alt',
      headerColor: 'bg-amber-600',
      size: 'max-w-xl',
      content: modalContent,
      onRender: (dialog) => {
        // Toggle Sections
        const radioPlant = dialog.querySelector('input[value="plantDate"]');
        const radioStep = dialog.querySelector('input[value="step"]');
        const sectionPlant = dialog.querySelector('#section-plant-date-reschedule');
        const sectionStep = dialog.querySelector('#section-step-reschedule');

        if (radioPlant && radioStep) {
          radioPlant.addEventListener('change', () => {
            if (radioPlant.checked) {
              sectionPlant.classList.remove('hidden');
              sectionStep.classList.add('hidden');
            }
          });
          radioStep.addEventListener('change', () => {
            if (radioStep.checked) {
              sectionPlant.classList.add('hidden');
              sectionStep.classList.remove('hidden');
            }
          });
        }

        // Quick days shift buttons
        const plantDateInput = dialog.querySelector('#reschedule-new-plant-date');
        const shiftBtns = dialog.querySelectorAll('.btn-quick-shift-days');
        shiftBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const days = parseInt(btn.getAttribute('data-days')) || 0;
            const currentVal = plantDateInput.value ? new Date(plantDateInput.value) : new Date(currentPlantDate);
            currentVal.setDate(currentVal.getDate() + days);
            plantDateInput.value = currentVal.toISOString().split('T')[0];
          });
        });

        // Reason select other toggle
        const reasonSelect = dialog.querySelector('#reschedule-reason-select');
        const customReasonInput = dialog.querySelector('#reschedule-custom-reason');
        if (reasonSelect && customReasonInput) {
          reasonSelect.addEventListener('change', () => {
            if (reasonSelect.value === 'other') {
              customReasonInput.classList.remove('hidden');
              customReasonInput.required = true;
              customReasonInput.focus();
            } else {
              customReasonInput.classList.add('hidden');
              customReasonInput.required = false;
            }
          });
        }

        // Submit form
        const form = dialog.querySelector('#reschedule-crop-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const rescheduleType = formData.get('rescheduleType') || 'plantDate';
            const selectedReason = reasonSelect.value;
            const finalReason = selectedReason === 'other' ? (formData.get('customReason') || '').trim() : selectedReason;

            if (!finalReason) {
              showToast('กรุณาระบุเหตุผลการเลื่อนกำหนดการ', 'warning');
              return;
            }

            const updatePayload = {
              rescheduleHistory: [
                ...(crop.rescheduleHistory || [])
              ]
            };

            if (rescheduleType === 'plantDate') {
              const newPlantDate = formData.get('newPlantDate');
              if (!newPlantDate) {
                showToast('กรุณาระบุวันที่เริ่มปลูกใหม่', 'warning');
                return;
              }

              // Calculate new harvest date
              let newEstHarvest = crop.harvestDateEst;
              if (currentRoadmap && currentRoadmap.durationDays) {
                const estDate = new Date(newPlantDate);
                estDate.setDate(estDate.getDate() + (currentRoadmap.durationDays - 1));
                newEstHarvest = estDate.toISOString().split('T')[0];
              }

              // Recalculate target dates for uncompleted steps
              const updatedProgress = { ...(crop.stepProgress || {}) };
              steps.forEach(s => {
                if (!updatedProgress[s.stepNo] || !updatedProgress[s.stepNo].completed) {
                  const base = new Date(newPlantDate);
                  base.setDate(base.getDate() + (s.dayNumber - 1));
                  updatedProgress[s.stepNo] = {
                    ...(updatedProgress[s.stepNo] || {}),
                    stepNo: s.stepNo,
                    targetDate: base.toISOString().split('T')[0]
                  };
                }
              });

              updatePayload.plantDate = newPlantDate;
              updatePayload.harvestDateEst = newEstHarvest;
              updatePayload.stepProgress = updatedProgress;
              updatePayload.rescheduleHistory.push({
                date: new Date().toISOString().split('T')[0],
                target: 'plantDate',
                oldDate: currentPlantDate,
                newDate: newPlantDate,
                reason: finalReason
              });

              showToast(`เลื่อนวันเริ่มปลูกของแปลง ${plot ? plot.name : crop.id} เป็น ${formatThaiDate(newPlantDate)} เรียบร้อย`);
            } else {
              const targetStepNo = parseInt(formData.get('targetStepNo'));
              const newStepDate = formData.get('newStepDate');
              if (!newStepDate) {
                showToast('กรุณาระบุวันที่ของขั้นตอนนี้', 'warning');
                return;
              }

              const updatedProgress = { ...(crop.stepProgress || {}) };
              const oldTargetDate = updatedProgress[targetStepNo]?.targetDate || '-';
              updatedProgress[targetStepNo] = {
                ...(updatedProgress[targetStepNo] || {}),
                stepNo: targetStepNo,
                targetDate: newStepDate,
                rescheduled: true,
                rescheduleReason: finalReason
              };

              updatePayload.stepProgress = updatedProgress;
              updatePayload.rescheduleHistory.push({
                date: new Date().toISOString().split('T')[0],
                target: 'step',
                stepNo: targetStepNo,
                oldDate: oldTargetDate,
                newDate: newStepDate,
                reason: finalReason
              });

              showToast(`เลื่อนกำหนดการขั้นตอนที่ ${targetStepNo} เป็น ${formatThaiDate(newStepDate)} เรียบร้อย`);
            }

            appState.updateCrop(crop.id, updatePayload);
            closeGlobalModal();
            this.refreshView();
          });
        }
      }
    });
  },

  // -------------------------------------------------------------
  // 6. Modal รายละเอียดและ Traceability QR Code
  // -------------------------------------------------------------
  openCropDetailModal(cropId) {
    const crop = appState.getCropById(cropId);
    if (!crop) return;

    const plot = appState.getPlotById(crop.plotId);
    const members = appState.getMembers();
    const owner = plot ? members.find(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : null;
    const ownerName = owner ? owner.name : '-';
    const herbType = crop.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';

    const currentRoadmap = appState.getRoadmapByHerb(herbType);
    const steps = currentRoadmap ? currentRoadmap.steps || [] : [];
    const progress = crop.stepProgress || {};

    const traceUrl = `${window.location.origin}${window.location.pathname}#trace/${crop.id}`;
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(traceUrl)}`;

    const stepsTimelineHtml = steps.map(s => {
      const p = progress[s.stepNo];
      const isDone = p && p.completed;
      return `
        <div class="relative pl-6 pb-4 last:pb-0 border-l-2 ${isDone ? 'border-emerald-500' : 'border-gray-200'} last:border-0">
          <div class="absolute -left-[7px] top-1 w-3 h-3 rounded-full ${isDone ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-gray-300'} border-2 border-white"></div>
          <div class="text-sm font-bold ${isDone ? 'text-emerald-700' : 'text-gray-400'}">
            ขั้นที่ ${s.stepNo}: ${s.title}
          </div>
          <div class="text-sm font-bold text-gray-800 mt-0.5">
            ${isDone ? formatThaiDate(p.date || p.completedDate) : 'ยังไม่ดำเนินการ'}
          </div>
          ${p && p.note ? `<div class="text-sm text-gray-500 mt-0.5">${p.note}</div>` : ''}
        </div>
      `;
    }).join('');

    const modalContent = `
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="p-4 sm:p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-gray-900">${formatCropSeasonId(crop.id, crop.cropYear, crop.cropCycle)}</h3>
                <span class="px-2.5 py-0.5 text-sm font-bold rounded-full bg-emerald-100 text-emerald-900">
                  ${herbType}
                </span>
                <span class="px-2.5 py-0.5 text-sm font-bold rounded-full ${crop.status === 'harvested' ? 'bg-sky-100 text-sky-900' : 'bg-emerald-100 text-emerald-900'}">
                  ${crop.status === 'harvested' ? 'เก็บเกี่ยวแล้ว' : 'กำลังเพาะปลูก'}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1">แปลง: <b>${plot ? plot.name : '-'}</b> | ผู้ดูแล: <b>${ownerName}</b></p>
            </div>
            <div class="text-left sm:text-right">
              <span class="text-sm text-gray-400 block font-medium">ปีเพาะปลูก</span>
              <span class="text-sm font-bold text-emerald-800">พ.ศ. ${crop.cropYear || '-'} (รอบที่ ${crop.cropCycle || 1})</span>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
            <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span class="text-sm text-emerald-700 font-bold block">จำนวนต้นกล้า</span>
              <span class="text-sm sm:text-base font-bold text-emerald-950 mt-0.5 block">${(crop.seedlingCount || 0).toLocaleString()} ต้น</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span class="text-sm text-gray-500 font-bold block">ต้นทุนเริ่มต้น</span>
              <span class="text-sm sm:text-base font-bold text-gray-800 mt-0.5 block">${formatBaht(crop.cost || 0)}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span class="text-sm text-gray-500 font-bold block">วันเริ่มลงกล้า</span>
              <span class="text-sm sm:text-base font-bold text-gray-800 mt-0.5 block">${formatThaiDate(crop.plantDate)}</span>
            </div>
            <div class="p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <span class="text-sm text-amber-700 font-bold block">${crop.status === 'harvested' ? 'ผลผลิตสดจริง' : 'วันคาดการณ์เก็บเกี่ยว'}</span>
              <span class="text-sm sm:text-base font-bold text-amber-900 mt-0.5 block">${crop.status === 'harvested' ? `${(crop.yield || 0).toFixed(2)} กก.` : formatThaiDate(crop.harvestDateEst)}</span>
            </div>
          </div>

          <div class="space-y-2">
            <span class="text-sm font-bold text-gray-700 uppercase tracking-wider block">
              <i class="fas fa-stream text-emerald-600 mr-1"></i> ประวัติขั้นตอนการปลูกตาม Roadmap
            </span>
            <div class="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              ${stepsTimelineHtml}
            </div>
          </div>

          ${(crop.isProcessed || crop.dryWeight) ? `
            <div class="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border border-emerald-300 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <i class="fas fa-fire-alt text-amber-600"></i> ข้อมูลการอบแห้ง (แปรรูปเข้าคลังเรียบร้อย)
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-sm font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                  อบแห้งเสร็จสิ้น
                </span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-center">
                <div class="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span class="text-sm text-gray-500 font-bold block">วันที่อบ</span>
                  <span class="text-sm font-bold text-gray-900 mt-0.5 block">${formatThaiDate(crop.dryingDate || crop.harvestDateActual)}</span>
                </div>
                <div class="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span class="text-sm text-gray-500 font-bold block">ใช้ผลผลิตสด</span>
                  <span class="text-sm font-bold text-amber-950 mt-0.5 block">${parseFloat(crop.freshUsed || crop.yield || 0).toFixed(2)} กก.</span>
                  <span class="text-sm text-gray-500 block">จากทั้งหมด ${parseFloat(crop.yield || 0).toFixed(2)} กก.</span>
                </div>
                <div class="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span class="text-sm text-gray-500 font-bold block">ได้หลังอบเสร็จ</span>
                  <span class="text-sm sm:text-base font-bold text-emerald-800 mt-0.5 block">${parseFloat(crop.dryWeight || 0).toFixed(2)} กก.</span>
                </div>
              </div>
            </div>
          ` : ''}

          ${crop.rescheduleHistory && crop.rescheduleHistory.length > 0 ? `
            <div class="space-y-1.5 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80">
              <span class="text-sm font-bold text-amber-900 uppercase flex items-center gap-1.5">
                <i class="fas fa-history text-amber-600"></i> ประวัติการเลื่อนกำหนดการ (${crop.rescheduleHistory.length} ครั้ง)
              </span>
              <div class="space-y-1 mt-1 text-sm">
                ${crop.rescheduleHistory.map(h => `
                  <div class="p-2 bg-white rounded-xl border border-amber-100 flex items-center justify-between flex-wrap gap-1">
                    <div>
                      <b class="text-gray-900">${h.target === 'step' ? `ขั้นที่ ${h.stepNo}` : 'วันเริ่มปลูก'}</b>: 
                      <span class="line-through text-gray-400">${formatThaiDate(h.oldDate)}</span> 
                      <i class="fas fa-arrow-right text-sm text-amber-600 mx-1"></i>
                      <b class="text-emerald-800">${formatThaiDate(h.newDate)}</b>
                      <span class="text-gray-500 block text-sm">เหตุผล: ${h.reason}</span>
                    </div>
                    <span class="text-sm text-gray-400 font-mono">${formatThaiDate(h.date)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="p-4 border border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div class="space-y-1 flex-1">
              <span class="text-sm font-bold text-emerald-900 block">รหัสตรวจสอบย้อนกลับ (Traceability QR Code)</span>
              <p class="text-sm text-gray-500">ผู้บริโภคสามารถสแกนเพื่อตรวจสอบความโปร่งใสและแหล่งที่มาของสมุนไพร</p>
              <a href="#trace/${crop.id}" class="text-sm font-bold text-emerald-700 hover:text-emerald-950 underline pt-1 block">
                <i class="fas fa-external-link-alt"></i> เปิดหน้าจอตรวจสอบย้อนกลับ
              </a>
            </div>
            <img src="${qrCodeApiUrl}" alt="QR Code" class="w-16 h-16 bg-white p-1 rounded-xl border border-gray-200 shadow-sm shrink-0">
          </div>
        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 flex-shrink-0 flex-wrap">
          <div>
            ${crop.status !== 'harvested' ? `
              <button type="button" id="modal-detail-reschedule-btn" class="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs">
                <i class="fas fa-calendar-alt text-amber-700"></i>
                <span>เลื่อนกำหนดการปลูก</span>
              </button>
            ` : ''}
          </div>
          <button type="button" class="close-global-modal-btn w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors cursor-pointer text-center">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: `รายละเอียดรอบการเพาะปลูก: ${crop.id}`,
      icon: 'fas fa-info-circle',
      size: 'max-w-2xl',
      content: modalContent,
      onRender: (dialog) => {
        const rescheduleBtn = dialog.querySelector('#modal-detail-reschedule-btn');
        if (rescheduleBtn) {
          rescheduleBtn.addEventListener('click', () => {
            closeGlobalModal();
            this.openRescheduleModal(crop.id, crop.plotId);
          });
        }
      }
    });
  },

  refreshView() {
    const viewContainer = document.getElementById('app-view');
    if (viewContainer) {
      viewContainer.innerHTML = this.render();
      this.init();
    }
  }
};
