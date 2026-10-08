// Planting Roadmap Component (แผนการปลูกสมุนไพร)
import { appState } from '../state.js';
import { showToast, openGlobalModal, closeGlobalModal, getHerbDefaultIcon, HERB_GROUPS_PRESETS } from '../helpers.js';

export const PlantingRoadmapComponent = {
  selectedHerb: 'เก๊กฮวย',
  viewMode: 'table', // 'table' | 'timeline'

  render() {
    const roadmaps = appState.getRoadmaps();
    const herbsList = Object.keys(roadmaps);
    
    // Ensure valid selectedHerb
    if (!roadmaps[this.selectedHerb] && herbsList.length > 0) {
      this.selectedHerb = herbsList[0];
    }
    
    const currentRoadmap = roadmaps[this.selectedHerb] || {
      name: this.selectedHerb,
      icon: '🌿',
      description: 'แผนการปลูกสมุนไพรมาตรฐาน',
      durationDays: 90,
      cycleText: 'ระยะเวลาประมาณ 90 วัน',
      steps: []
    };

    const steps = currentRoadmap.steps || [];
    const currentUser = appState.getCurrentUser();
    const isAdminOrOfficer = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Officer' || !currentUser.role);

    return `
      <div class="space-y-6 pb-12">
        
        <!-- Header -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2.5">
              <i class="fa-solid fa-route text-emerald-700"></i>
              <span>แผนการปลูก</span>
            </h1>
          </div>
        </div>

        <!-- Plant Selection Pill Tabs -->
        <div class="flex items-center justify-between gap-4 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-emerald-100">
          <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <span class="text-sm font-bold text-gray-400 uppercase tracking-wider pl-2 pr-1 shrink-0">
              <i class="fas fa-leaf text-emerald-600 mr-1"></i>เลือกชนิดพืช:
            </span>
            ${herbsList.map(h => {
              const isActive = h === this.selectedHerb;
              const hIcon = roadmaps[h]?.icon || getHerbDefaultIcon(h);
              return `
                <button data-herb="${h}" class="herb-pill-tab px-4 py-2 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 scale-102 ring-2 ring-emerald-600 ring-offset-1' 
                    : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border border-gray-200/80'
                }">
                  <span class="text-base">${hIcon}</span>
                  <span>${h}</span>
                  ${isActive ? `<span class="w-2 h-2 rounded-full bg-emerald-300 ml-0.5 animate-ping"></span>` : ''}
                </button>
              `;
            }).join('')}

            <button id="add-herb-btn" class="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-dashed border-emerald-300 font-bold text-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer" title="เพิ่มชนิดพืชใหม่">
              <i class="fas fa-plus text-sm"></i>
              <span>+ เพิ่มพืชใหม่</span>
            </button>
          </div>
        </div>

        <!-- Herb Summary Header -->
        <div class="bg-white rounded-2xl px-5 py-3.5 border border-emerald-100 shadow-sm flex items-center justify-between gap-4">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">${currentRoadmap.icon || getHerbDefaultIcon(currentRoadmap.name)}</span>
            <h2 class="text-lg md:text-xl font-bold text-gray-900">${currentRoadmap.name}</h2>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              ${steps.length} ขั้นตอนหลัก
            </span>
          </div>

          <div class="flex items-center gap-2">
            ${herbsList.length > 1 && this.selectedHerb !== 'เก๊กฮวย' && this.selectedHerb !== 'คาโมมายล์' ? `
              <button id="delete-current-herb-btn" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer" title="ลบชนิดพืชนี้ออกจากระบบ">
                <i class="fas fa-trash-can text-xs"></i>
                <span>ลบพืช ${this.selectedHerb}</span>
              </button>
            ` : ''}
            <button id="add-step-btn" class="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer" title="เพิ่มขั้นตอนใหม่">
              <i class="fas fa-plus text-xs"></i>
              <span>+ เพิ่มขั้นตอน</span>
            </button>
          </div>
        </div>

        <!-- Main Content Area: Table View -->
        ${this.renderTableView(steps)}

      </div>
    `;
  },

  // 1. Table View (Planting Schedule Table)
  renderTableView(steps) {
    if (!steps || steps.length === 0) {
      return `
        <div class="bg-white rounded-2xl p-12 text-center border border-emerald-100 shadow-sm">
          <i class="fas fa-calendar-xmark text-5xl text-gray-300 mb-3"></i>
          <h3 class="text-xl font-bold text-gray-700">ยังไม่มีขั้นตอนแผนการปลูกสำหรับ "${this.selectedHerb}"</h3>
          <p class="text-gray-500 text-base mt-1">ท่านสามารถเริ่มกำหนดขั้นตอนการดูแลด้วยตนเองได้ทันที</p>
          <button class="add-step-empty-btn mt-5 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-sm md:text-base shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5">
            <i class="fas fa-plus-circle text-lg"></i>
            <span>+ เพิ่มขั้นตอนแรก</span>
          </button>
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <!-- Table Header Notice -->
        <div class="px-6 py-4 bg-emerald-900/5 border-b border-emerald-100 flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2 text-emerald-950 font-bold text-base md:text-lg">
            <i class="fas fa-list-check text-emerald-700"></i>
            <span>ตารางขั้นตอนแผนการปลูก: ${this.selectedHerb}</span>
          </div>
          <span class="text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-1.5 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            <i class="fas fa-arrows-up-down text-emerald-600"></i>
            <span>ลากขึ้น-ลง หรือกดลูกศรเพื่อสลับลำดับขั้นตอนได้</span>
          </span>
        </div>

        <!-- Table Responsive Container -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-sm md:text-base font-bold">
                <th class="py-4 px-4 md:px-6 w-32 text-center">ลำดับ</th>
                <th class="py-4 px-4 md:px-6 min-w-[240px]">รายการกิจกรรม</th>
                <th class="py-4 px-4 md:px-6 min-w-[180px]">ระยะเวลา / รอบวัน</th>
                <th class="py-4 px-4 md:px-6 min-w-[260px]">คำแนะนำ / หมายเหตุ</th>
                <th class="py-4 px-4 md:px-6 w-36 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody id="roadmap-steps-tbody" class="divide-y divide-gray-100">
              ${steps.map((step, index) => {
                const stepColors = this.getStepTheme(step.color || 'emerald');
                const prevStep = index > 0 ? steps[index - 1] : null;
                const intervalDays = prevStep ? (step.dayNumber - prevStep.dayNumber) : 0;

                return `
                  <tr draggable="true" data-step-index="${index}" data-step-no="${step.stepNo}"
                    class="step-draggable-row hover:bg-emerald-50/50 transition-all group border-b border-gray-100 select-none">
                    
                    <!-- Column 1: Step Badge Number + Drag Handle -->
                    <td class="py-5 px-4 md:px-6 text-center align-top">
                      <div class="flex items-center justify-center gap-2">
                        <!-- Drag Handle -->
                        <span class="step-drag-handle p-1.5 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-100 transition-colors cursor-grab active:cursor-grabbing" title="คลิกค้างแล้วลากขึ้น-ลงเพื่อสลับลำดับ">
                          <i class="fas fa-grip-vertical text-lg"></i>
                        </span>
                        <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl ${stepColors.badgeBg} text-white font-bold text-xl md:text-2xl flex items-center justify-center shadow-sm ring-4 ${stepColors.ring}">
                          ${step.stepNo}
                        </div>
                      </div>
                      ${index < steps.length - 1 ? `
                        <div class="w-0.5 h-6 bg-emerald-200 mx-auto mt-2 hidden sm:block"></div>
                      ` : ''}
                    </td>

                    <!-- Column 2: Activity Details -->
                    <td class="py-5 px-4 md:px-6 align-top">
                      <div>
                        <h3 class="text-base md:text-lg font-bold text-gray-900 leading-snug">
                          ${step.title}
                        </h3>
                      </div>
                    </td>

                    <!-- Column 3: Day / Duration -->
                    <td class="py-5 px-4 md:px-6 align-top">
                      <div class="inline-flex flex-col gap-1.5">
                        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${stepColors.pillBg} ${stepColors.pillText} font-bold text-base md:text-lg border ${stepColors.pillBorder} shadow-2xs">
                          <i class="fas fa-calendar-day text-sm"></i>
                          <span>${step.dayLabel || `วันที่ ${step.dayNumber}`}</span>
                        </span>
                        
                        ${intervalDays > 0 ? `
                          <span class="text-sm text-gray-500 font-semibold pl-1 flex items-center gap-1">
                            <i class="fas fa-clock-rotate-left text-sm text-emerald-600"></i>
                            ห่างจากขั้นก่อน ${intervalDays} วัน
                          </span>
                        ` : `
                          <span class="text-sm text-emerald-700 font-bold pl-1">
                            • จุดเริ่มต้นรอบการปลูก
                          </span>
                        `}
                      </div>
                    </td>

                    <!-- Column 4: Activity Advice / Guidance / Note -->
                    <td class="py-5 px-4 md:px-6 align-top">
                      ${step.advice ? `
                        <div class="p-3.5 rounded-xl ${stepColors.adviceBg} border ${stepColors.adviceBorder}">
                          <div class="flex items-center gap-2 font-bold text-sm md:text-base ${stepColors.adviceTitle}">
                            <i class="fas fa-lightbulb"></i>
                            <span>${step.advice}</span>
                          </div>
                          ${step.detail ? `
                            <div class="text-sm text-gray-700 mt-1 font-medium leading-relaxed">
                              ${step.detail}
                            </div>
                          ` : ''}
                        </div>
                      ` : (step.detail ? `
                        <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 text-gray-700 text-sm leading-relaxed">
                          <span class="font-bold text-gray-500 block mb-0.5">หมายเหตุ:</span>
                          ${step.detail}
                        </div>
                      ` : `
                        <span class="text-gray-400 text-sm font-medium">-</span>
                      `)}
                    </td>

                    <!-- Column 5: Actions -->
                    <td class="py-5 px-4 md:px-6 text-center align-middle">
                      <div class="flex items-center justify-center gap-1.5">
                        <!-- Up / Down Reorder Buttons -->
                        <div class="flex flex-col gap-0.5 mr-1">
                          <button data-from-index="${index}" data-to-index="${index - 1}" ${index === 0 ? 'disabled' : ''} 
                            class="move-step-up-btn p-1 rounded-md ${index === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer'} transition-all" title="เลื่อนขึ้น">
                            <i class="fas fa-chevron-up text-xs"></i>
                          </button>
                          <button data-from-index="${index}" data-to-index="${index + 1}" ${index === steps.length - 1 ? 'disabled' : ''} 
                            class="move-step-down-btn p-1 rounded-md ${index === steps.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer'} transition-all" title="เลื่อนลง">
                            <i class="fas fa-chevron-down text-xs"></i>
                          </button>
                        </div>

                        <button data-step-no="${step.stepNo}" class="edit-step-btn p-2.5 rounded-xl bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white transition-all shadow-2xs cursor-pointer" title="แก้ไขขั้นตอนนี้">
                          <i class="fas fa-pencil text-sm"></i>
                        </button>
                        <button data-step-no="${step.stepNo}" class="delete-step-btn p-2.5 rounded-xl bg-gray-100 hover:bg-red-500 text-gray-500 hover:text-white transition-all shadow-2xs cursor-pointer" title="ลบขั้นตอนนี้">
                          <i class="fas fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </td>

                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 2. Timeline View (Interactive Step Timeline Cards)
  renderTimelineView(steps) {
    if (!steps || steps.length === 0) {
      return this.renderTableView(steps);
    }

    return `
      <div class="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-emerald-100">
        <div class="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div>
            <h3 class="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              <i class="fas fa-route text-emerald-700"></i>
              <span>เส้นทางการเติบโตและเก็บเกี่ยว: ${this.selectedHerb}</span>
            </h3>
            <p class="text-sm text-gray-500 mt-0.5">ไล่เรียงตามลำดับเวลาตั้งแต่วันเริ่มต้นจนถึงวันส่งโรงอบ</p>
          </div>
          <span class="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            รวม ${steps.length} หมุดหมาย
          </span>
        </div>

        <div class="relative">
          <!-- Central Connecting Vertical Line -->
          <div class="absolute left-6 md:left-8 top-6 bottom-6 w-1 bg-gradient-to-b from-emerald-500 via-teal-500 to-emerald-700 rounded-full"></div>

          <div class="space-y-8 relative">
            ${steps.map((step, index) => {
              const stepColors = this.getStepTheme(step.color || 'emerald');
              return `
                <div class="flex items-start gap-4 md:gap-6 group">
                  
                  <!-- Milestone Circle Marker -->
                  <div class="w-12 h-12 md:w-16 md:h-16 rounded-2xl ${stepColors.badgeBg} text-white font-bold text-xl md:text-2xl flex items-center justify-center shrink-0 z-10 shadow-md ring-4 ${stepColors.ring}">
                    ${step.stepNo}
                  </div>

                  <!-- Timeline Card Content -->
                  <div class="flex-1 bg-gradient-to-br from-white to-gray-50/80 rounded-2xl p-5 md:p-6 border border-gray-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div class="flex items-center gap-3">
                        <h4 class="text-lg md:text-xl font-bold text-gray-900">${step.title}</h4>
                      </div>

                      <div class="flex items-center gap-3">
                        <span class="px-3 py-1 rounded-xl ${stepColors.pillBg} ${stepColors.pillText} font-bold text-sm md:text-base border ${stepColors.pillBorder}">
                          <i class="fas fa-calendar-day mr-1.5"></i>${step.dayLabel || `วันที่ ${step.dayNumber}`}
                        </span>
                        <button data-step-no="${step.stepNo}" class="edit-step-btn text-sm font-bold text-gray-500 hover:text-emerald-700 underline cursor-pointer">
                          แก้ไข
                        </button>
                      </div>
                    </div>

                    <div class="${step.advice ? 'grid grid-cols-1 lg:grid-cols-3 gap-4' : ''} mt-4">
                      <!-- Detail / Note -->
                      <div class="${step.advice ? 'lg:col-span-2' : ''}">
                        <span class="text-sm font-bold text-gray-400 uppercase tracking-wider block mb-1">หมายเหตุ:</span>
                        <p class="text-base text-gray-700 leading-relaxed font-normal">
                          ${step.detail || '-'}
                        </p>
                      </div>

                      ${step.advice ? `
                        <!-- Advice Card -->
                        <div class="p-4 rounded-xl ${stepColors.adviceBg} border ${stepColors.adviceBorder}">
                          <div class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">แนวทางสำคัญ:</div>
                          <div class="font-bold text-base ${stepColors.adviceTitle} flex items-center gap-1.5">
                            <i class="fas fa-check-circle"></i>
                            <span>${step.advice}</span>
                          </div>
                          <p class="text-sm text-gray-600 mt-1">
                            ${this.getAdviceHelperText(step.advice, step.detail)}
                          </p>
                        </div>
                      ` : ''}
                    </div>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // Helpers for Color Themes
  getStepTheme(color) {
    switch (color) {
      case 'teal':
        return {
          badgeBg: 'bg-gradient-to-br from-teal-500 to-teal-700',
          ring: 'ring-teal-100',
          iconBg: 'bg-teal-100',
          iconText: 'text-teal-800',
          pillBg: 'bg-teal-50',
          pillText: 'text-teal-900',
          pillBorder: 'border-teal-200',
          adviceBg: 'bg-teal-50/70',
          adviceBorder: 'border-teal-200',
          adviceTitle: 'text-teal-900'
        };
      case 'amber':
        return {
          badgeBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
          ring: 'ring-amber-100',
          iconBg: 'bg-amber-100',
          iconText: 'text-amber-800',
          pillBg: 'bg-amber-50',
          pillText: 'text-amber-900',
          pillBorder: 'border-amber-200',
          adviceBg: 'bg-amber-50/70',
          adviceBorder: 'border-amber-200',
          adviceTitle: 'text-amber-900'
        };
      case 'rose':
        return {
          badgeBg: 'bg-gradient-to-br from-rose-500 to-rose-700',
          ring: 'ring-rose-100',
          iconBg: 'bg-rose-100',
          iconText: 'text-rose-800',
          pillBg: 'bg-rose-50',
          pillText: 'text-rose-900',
          pillBorder: 'border-rose-200',
          adviceBg: 'bg-rose-50/70',
          adviceBorder: 'border-rose-200',
          adviceTitle: 'text-rose-900'
        };
      case 'emerald':
      default:
        return {
          badgeBg: 'bg-gradient-to-br from-emerald-600 to-[#1e4620]',
          ring: 'ring-emerald-100',
          iconBg: 'bg-emerald-100',
          iconText: 'text-emerald-800',
          pillBg: 'bg-emerald-50',
          pillText: 'text-emerald-950',
          pillBorder: 'border-emerald-200',
          adviceBg: 'bg-emerald-50/70',
          adviceBorder: 'border-emerald-200',
          adviceTitle: 'text-emerald-900'
        };
    }
  },

  getAdviceHelperText(advice, detail) {
    if (!advice) return 'ปฏิบัติตามมาตรฐานอินทรีย์';
    if (advice.includes('รองก้นหลุม') || advice.includes('เริ่มปลูก')) {
      return 'เน้นการเตรียมดินให้โปร่ง ระบายน้ำดี คลุมฟางรักษาความชื้น รดน้ำให้สม่ำเสมอ';
    }
    if (advice.includes('เร่งต้น') || advice.includes('ใบ') || advice.includes('ราก')) {
      return 'เสริมสร้างการเจริญเติบโตของกิ่งก้าน พรวนดินรอบโคนต้นเพื่อเพิ่มออกซิเจนให้ราก';
    }
    if (advice.includes('เร่งตาดอก')) {
      return 'เสริมธาตุฟอสฟอรัสและโพแทสเซียมอินทรีย์ ป้องกันโรคราน้ำค้าง รักษาระดับความชื้นให้พอเหมาะ';
    }
    if (advice.includes('เก็บเกี่ยว') || advice.includes('โรงอบ')) {
      return 'คัดดอกสมบูรณ์ เก็บช่วงเช้าไร้น้ำค้าง รีบส่งเข้าตู้อบแห้งเพื่อรักษาสารสำคัญและกลิ่นหอม';
    }
    return detail ? detail.substring(0, 70) + '...' : 'ตรวจสอบคุณภาพและความสมบูรณ์ของต้นสมุนไพร';
  },

  init() {
    // 1. Bind Herb Tabs Click
    const herbTabs = document.querySelectorAll('.herb-pill-tab');
    herbTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const herb = tab.getAttribute('data-herb');
        if (herb) {
          this.selectedHerb = herb;
          this.refresh();
        }
      });
    });

    // 2. View Mode Toggle
    const tableBtn = document.getElementById('view-table-btn');
    const timelineBtn = document.getElementById('view-timeline-btn');
    if (tableBtn && timelineBtn) {
      tableBtn.addEventListener('click', () => {
        this.viewMode = 'table';
        this.refresh();
      });
      timelineBtn.addEventListener('click', () => {
        this.viewMode = 'timeline';
        this.refresh();
      });
    }

    // 3. Add / Edit Step Master Button
    const addStepBtn = document.getElementById('add-step-btn');
    if (addStepBtn) {
      addStepBtn.addEventListener('click', () => {
        this.openStepModal(null);
      });
    }

    // 3.1 Add First Step from Empty State
    const emptyStepBtns = document.querySelectorAll('.add-step-empty-btn');
    emptyStepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.openStepModal(null);
      });
    });

    // 4. Edit Step Buttons on rows
    const editBtns = document.querySelectorAll('.edit-step-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stepNo = Number(btn.getAttribute('data-step-no'));
        const roadmaps = appState.getRoadmaps();
        const steps = (roadmaps[this.selectedHerb] || {}).steps || [];
        const step = steps.find(s => s.stepNo === stepNo);
        if (step) {
          this.openStepModal(step);
        }
      });
    });

    // 5. Delete Step Buttons
    const deleteBtns = document.querySelectorAll('.delete-step-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stepNo = Number(btn.getAttribute('data-step-no'));
        if (confirm(`คุณต้องการลบขั้นตอนที่ ${stepNo} ของ "${this.selectedHerb}" ใช่หรือไม่?`)) {
          appState.deleteHerbStep(this.selectedHerb, stepNo);
          showToast(`ลบขั้นตอนที่ ${stepNo} เรียบร้อยแล้ว`, 'success');
          this.refresh();
        }
      });
    });

    // 6. Reset Roadmap to default
    const resetBtn = document.getElementById('reset-roadmap-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการคืนค่าแผนการปลูกทั้งหมดกลับสู่ค่าเริ่มต้นของระบบใช่หรือไม่? ข้อมูลขั้นตอนที่ปรับแต่งไว้จะถูกรีเซ็ต')) {
          appState.resetDefaultRoadmaps();
          showToast('คืนค่าแผนการปลูกเริ่มต้นเรียบร้อยแล้ว', 'info');
          this.refresh();
        }
      });
    }

    // 7. Add Herb Buttons (Header & Tabs)
    const headerAddHerbBtn = document.getElementById('header-add-herb-btn');
    if (headerAddHerbBtn) {
      headerAddHerbBtn.addEventListener('click', () => {
        this.openAddHerbModal();
      });
    }

    const addHerbBtn = document.getElementById('add-herb-btn');
    if (addHerbBtn) {
      addHerbBtn.addEventListener('click', () => {
        this.openAddHerbModal();
      });
    }

    // 8. Delete Current Custom Herb Button
    const deleteHerbBtn = document.getElementById('delete-current-herb-btn');
    if (deleteHerbBtn) {
      deleteHerbBtn.addEventListener('click', () => {
        if (confirm(`คุณต้องการลบชนิดพืช "${this.selectedHerb}" ออกจากแผนการปลูกใช่หรือไม่?`)) {
          const herbToDelete = this.selectedHerb;
          appState.deleteHerbRoadmap(herbToDelete);
          const roadmaps = appState.getRoadmaps();
          this.selectedHerb = Object.keys(roadmaps)[0] || 'เก๊กฮวย';
          showToast(`ลบชนิดพืช "${herbToDelete}" เรียบร้อยแล้ว`, 'info');
          this.refresh();
        }
      });
    }

    // 9. Drag & Drop Reordering of Steps (ลากขึ้นลากลงได้แต่ละขั้นตอน)
    const stepRows = document.querySelectorAll('.step-draggable-row');
    let draggedIndex = null;

    stepRows.forEach(row => {
      row.addEventListener('dragstart', (e) => {
        draggedIndex = Number(row.getAttribute('data-step-index'));
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedIndex));
        setTimeout(() => {
          row.classList.add('opacity-40', 'bg-emerald-50', 'ring-2', 'ring-emerald-400');
        }, 0);
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const targetRow = e.currentTarget;
        const targetIndex = Number(targetRow.getAttribute('data-step-index'));
        if (targetIndex !== draggedIndex) {
          targetRow.classList.add('bg-emerald-100/70');
          if (draggedIndex < targetIndex) {
            targetRow.classList.add('border-b-4', 'border-emerald-600');
            targetRow.classList.remove('border-t-4');
          } else {
            targetRow.classList.add('border-t-4', 'border-emerald-600');
            targetRow.classList.remove('border-b-4');
          }
        }
      });

      row.addEventListener('dragleave', (e) => {
        const targetRow = e.currentTarget;
        targetRow.classList.remove('bg-emerald-100/70', 'border-t-4', 'border-b-4', 'border-emerald-600');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetRow = e.currentTarget;
        targetRow.classList.remove('bg-emerald-100/70', 'border-t-4', 'border-b-4', 'border-emerald-600');
        const targetIndex = Number(targetRow.getAttribute('data-step-index'));
        const fromIndex = draggedIndex !== null ? draggedIndex : Number(e.dataTransfer.getData('text/plain'));

        if (!isNaN(fromIndex) && !isNaN(targetIndex) && fromIndex !== targetIndex) {
          appState.reorderHerbSteps(this.selectedHerb, fromIndex, targetIndex);
          showToast(`สลับลำดับขั้นตอนเป็นลำดับที่ ${targetIndex + 1} เรียบร้อยแล้ว`, 'success');
          this.refresh();
        }
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('opacity-40', 'bg-emerald-50', 'ring-2', 'ring-emerald-400');
        stepRows.forEach(r => r.classList.remove('bg-emerald-100/70', 'border-t-4', 'border-b-4', 'border-emerald-600'));
        draggedIndex = null;
      });
    });

    // 10. Quick Move Up / Down Buttons (ปุ่มเลื่อนขึ้น-เลื่อนลง)
    const moveUpBtns = document.querySelectorAll('.move-step-up-btn');
    moveUpBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fromIndex = Number(btn.getAttribute('data-from-index'));
        const toIndex = Number(btn.getAttribute('data-to-index'));
        if (!isNaN(fromIndex) && !isNaN(toIndex) && toIndex >= 0) {
          appState.reorderHerbSteps(this.selectedHerb, fromIndex, toIndex);
          showToast(`เลื่อนขั้นตอนขึ้นเรียบร้อยแล้ว`, 'success');
          this.refresh();
        }
      });
    });

    const moveDownBtns = document.querySelectorAll('.move-step-down-btn');
    moveDownBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fromIndex = Number(btn.getAttribute('data-from-index'));
        const toIndex = Number(btn.getAttribute('data-to-index'));
        const roadmaps = appState.getRoadmaps();
        const currentSteps = (roadmaps[this.selectedHerb] || {}).steps || [];
        if (!isNaN(fromIndex) && !isNaN(toIndex) && toIndex < currentSteps.length) {
          appState.reorderHerbSteps(this.selectedHerb, fromIndex, toIndex);
          showToast(`เลื่อนขั้นตอนลงเรียบร้อยแล้ว`, 'success');
          this.refresh();
        }
      });
    });
  },

  refresh() {
    const container = document.getElementById('app-view');
    if (container) {
      container.innerHTML = this.render();
      this.init();
    }
  },

  // Modal: Add or Edit Step
  openStepModal(step = null) {
    const isEdit = !!step;
    const roadmaps = appState.getRoadmaps();
    const currentHerbRoadmap = roadmaps[this.selectedHerb] || { steps: [] };
    const existingSteps = currentHerbRoadmap.steps || [];
    const nextStepNo = isEdit ? step.stepNo : (existingSteps.length + 1);

    // คำนวณรอบวันเริ่มต้น: หากมีขั้นตอนก่อนหน้าให้บวกห่างออกไป 30 วัน และแก้ไขตัวเลขได้อิสระ
    let defaultDay = 1;
    if (isEdit) {
      defaultDay = step.dayNumber;
    } else if (existingSteps.length > 0) {
      const maxExistingDay = Math.max(...existingSteps.map(s => Number(s.dayNumber) || 0));
      defaultDay = maxExistingDay + 30;
    } else {
      defaultDay = 1;
    }

    const formHtml = `
      <form id="step-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4 text-sm">
          <input type="hidden" id="modal-original-step-no" value="${isEdit ? step.stepNo : ''}">

          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
            <span class="text-sm font-bold text-emerald-800 uppercase">
              <i class="fas fa-leaf mr-1"></i>พืชสมุนไพร: <b class="text-sm text-emerald-950">${this.selectedHerb}</b>
            </span>
            <span class="text-sm text-gray-500 font-semibold">
              ${isEdit ? `แก้ไขขั้นตอนที่ ${step.stepNo}` : `เพิ่มเป็นขั้นตอนที่ ${nextStepNo}`}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1.5">ลำดับขั้นตอน *</label>
              <input type="number" id="modal-step-no" min="1" max="20" required
                value="${nextStepNo}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-base">
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1.5">รอบวัน (วันที่เท่าไหร่) *</label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-gray-400 text-sm">วันที่</span>
                <input type="number" id="modal-day-number" min="1" max="365" required
                  value="${defaultDay}"
                  class="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-base text-emerald-900">
              </div>
              <p class="text-xs text-gray-500 mt-1">
                ${!isEdit && existingSteps.length > 0 ? '💡 ค่าเริ่มต้นห่างจากขั้นตอนก่อนหน้า +30 วัน (สามารถแก้ไขตัวเลขได้ตามต้องการ)' : '💡 ระบุวันที่ดำเนินกิจกรรม (สามารถแก้ไขตัวเลขได้ตามต้องการ)'}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1.5">ชื่อกิจกรรมหลัก *</label>
            <input type="text" id="modal-step-title" required
              value="${isEdit ? step.title : ''}"
              placeholder="เช่น ใส่ปุ๋ยบำรุงครั้งที่ 1, ตัดแต่งกิ่ง, เก็บเกี่ยวผลผลิต"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-base">
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1.5">
              หมายเหตุ <span class="text-gray-400 font-normal">(จะใส่หรือไม่ใส่ก็ได้)</span>
            </label>
            <textarea id="modal-step-detail" rows="3"
              placeholder="ระบุหมายเหตุหรือข้อควรระวังเพิ่มเติม (ถ้ามี)..."
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm leading-relaxed">${isEdit ? (step.detail || '') : ''}</textarea>
          </div>
        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-all cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer">
            <i class="fas fa-save"></i>
            <span>${isEdit ? 'บันทึกการแก้ไข' : 'บันทึกขั้นตอนใหม่'}</span>
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: isEdit ? `แก้ไขขั้นตอน: ${step.title}` : `เพิ่มขั้นตอนแผนการปลูก (${this.selectedHerb})`,
      icon: isEdit ? 'fas fa-pen-to-square' : 'fas fa-plus-circle',
      size: 'max-w-2xl',
      headerColor: 'bg-[#1e4620]',
      content: formHtml,
      onRender: (dialog) => {
        // Form Submit
        const form = dialog.querySelector('#step-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const stepNo = Number(dialog.querySelector('#modal-step-no').value);
            const originalStepNo = dialog.querySelector('#modal-original-step-no').value;
            const dayNumber = Number(dialog.querySelector('#modal-day-number').value);
            const title = dialog.querySelector('#modal-step-title').value.trim();
            const advice = isEdit ? (step.advice || '') : '';
            const detail = (dialog.querySelector('#modal-step-detail')?.value || '').trim();

            // Auto-assign step color theme automatically without manual input
            const autoColor = (() => {
              if (isEdit && step.color) return step.color;
              const t = (title + ' ' + detail).toLowerCase();
              if (t.includes('เก็บเกี่ยว') || t.includes('โรงอบ') || t.includes('ตัดดอก') || t.includes('ผลผลิต')) return 'rose';
              if (t.includes('ดอก') || t.includes('ตาดอก') || t.includes('ช่อ')) return 'amber';
              if (t.includes('ปุ๋ย') || t.includes('น้ำ') || t.includes('บำรุง') || t.includes('กิ่ง') || t.includes('ใบ') || t.includes('พรวน')) return 'teal';
              if (t.includes('ปลูก') || t.includes('กล้า') || t.includes('ดิน') || t.includes('ย้าย')) return 'emerald';
              const palette = ['emerald', 'teal', 'amber', 'rose'];
              return palette[(Math.max(1, stepNo) - 1) % palette.length] || 'emerald';
            })();
            const color = autoColor;

            const autoIcon = (() => {
              if (isEdit && step.icon) return step.icon;
              if (color === 'rose') return 'fa-basket-shopping';
              if (color === 'amber') return 'fa-spa';
              if (color === 'teal') return 'fa-water';
              return 'fa-seedling';
            })();
            const icon = autoIcon;

            appState.saveHerbStep(this.selectedHerb, {
              stepNo,
              originalStepNo,
              dayNumber,
              dayLabel: `วันที่ ${dayNumber}`,
              title,
              advice,
              detail,
              color,
              icon
            });

            closeGlobalModal();
            showToast(`บันทึกขั้นตอนแผนการปลูกของ "${this.selectedHerb}" เรียบร้อยแล้ว`, 'success');
            this.refresh();
          });
        }
      }
    });
  },

  // Modal: Add New Herb (เพิ่มชนิดพืชสมุนไพร)
  openAddHerbModal() {
    const formHtml = `
      <form id="add-herb-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 text-sm">
          
          <!-- 1. Herb Name & Live Auto Matching Icon -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <div class="md:col-span-3">
              <label class="block text-sm font-bold text-gray-800 mb-1.5">ชื่อพืชสมุนไพร *</label>
              <div class="relative">
                <input type="text" id="modal-herb-name" required placeholder="เช่น อัญชัน, ฟ้าทะลายโจร, ขมิ้นชัน, มะกรูด"
                  class="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-base text-gray-900 shadow-2xs">
                <div class="absolute right-3 top-2.5">
                  <span id="modal-herb-icon-mini" class="text-2xl select-none">🌿</span>
                </div>
              </div>
            </div>

            <!-- Auto Icon Display -->
            <div class="md:col-span-1">
              <label class="block text-sm font-bold text-gray-800 mb-1.5 text-center">ไอคอนประจำพืช</label>
              <div class="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 border border-gray-200">
                <div id="modal-herb-icon-preview" class="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center justify-center text-3xl select-none transition-transform hover:scale-110">
                  🌿
                </div>
                <input type="hidden" id="modal-herb-icon-val" value="🌿">
                <span class="text-[11px] text-emerald-700 font-bold mt-1">ออโต้ตามชื่อพืช</span>
              </div>
            </div>
          </div>

          <!-- 2. Total Duration -->
          <div>
            <label class="block text-sm font-bold text-gray-800 mb-1.5">ระยะเวลาเพาะปลูกรวม (วัน) *</label>
            <div class="relative">
              <input type="number" id="modal-herb-duration" min="1" max="365" value="90" required
                class="w-full pl-4 pr-16 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-lg text-emerald-900 shadow-2xs">
              <span class="absolute right-4 top-3 text-gray-500 text-base font-bold">วัน</span>
            </div>
          </div>

          <div class="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <i class="fas fa-circle-info text-blue-600 mt-0.5 text-sm"></i>
            <div>
              <span class="font-bold">ระบบกำหนดการอิสระ:</span>
              <span> เมื่อบันทึกชนิดพืชแล้ว ท่านสามารถกดปุ่ม <b class="text-blue-950 font-bold">"+ เพิ่มขั้นตอนแรก"</b> เพื่อกำหนดขั้นตอนและรอบวันเพาะปลูกได้ด้วยตนเองอย่างอิสระ</span>
            </div>
          </div>

        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-all cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer">
            <i class="fas fa-plus-circle"></i>
            <span>บันทึกชนิดพืช</span>
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: 'เพิ่มชนิดพืชสมุนไพร (กำหนดไอคอนอัตโนมัติ)',
      icon: 'fas fa-seedling',
      size: 'max-w-lg',
      headerColor: 'bg-[#1e4620]',
      content: formHtml,
      onRender: (dialog) => {
        const nameInput = dialog.querySelector('#modal-herb-name');
        const iconValInput = dialog.querySelector('#modal-herb-icon-val');
        const iconPreview = dialog.querySelector('#modal-herb-icon-preview');
        const iconMini = dialog.querySelector('#modal-herb-icon-mini');
        const durationInput = dialog.querySelector('#modal-herb-duration');

        const updateAutoIcon = (customName) => {
          const autoIcon = getHerbDefaultIcon(customName);
          iconValInput.value = autoIcon;
          if (iconPreview) iconPreview.textContent = autoIcon;
          if (iconMini) iconMini.textContent = autoIcon;
        };

        if (nameInput) {
          nameInput.addEventListener('input', (e) => {
            updateAutoIcon(e.target.value);
          });
        }

        const form = dialog.querySelector('#add-herb-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = nameInput.value.trim();
            const duration = Number(durationInput.value) || 90;
            const icon = iconValInput ? iconValInput.value : getHerbDefaultIcon(name);

            if (!name) return;

            // Auto-detect group category if matches preset groups, otherwise default to 'สมุนไพรทั่วไป'
            let category = 'สมุนไพรทั่วไป';
            if (Array.isArray(HERB_GROUPS_PRESETS)) {
              for (const grp of HERB_GROUPS_PRESETS) {
                if (grp.herbs && grp.herbs.some(h => name.includes(h.name) || h.name.includes(name))) {
                  category = grp.groupName;
                  break;
                }
              }
            }

            // ไม่สร้างขั้นตอนอัตโนมัติ ให้ผู้ใช้เพิ่มขั้นตอนและกำหนดการเอง
            appState.saveHerbRoadmap(name, {
              name,
              category,
              icon,
              description: `แผนการเพาะปลูกและกำหนดการดูแลรักษาสำหรับ ${name}`,
              durationDays: duration,
              cycleText: `ระยะเวลาเพาะปลูกรวมประมาณ ${duration} วัน`,
              steps: []
            });

            this.selectedHerb = name;
            closeGlobalModal();
            showToast(`เพิ่มพืช "${name}" (${icon}) เรียบร้อยแล้ว กรุณากด "+ เพิ่มขั้นตอนแรก" เพื่อกำหนดขั้นตอนด้วยตนเอง`, 'success');
            this.refresh();
          });
        }
      }
    });
  }
};
