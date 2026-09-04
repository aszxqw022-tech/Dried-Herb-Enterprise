// Crops Component for Crop Season Log, Timeline, and Traceability QR Code
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const CropsComponent = {
  searchQuery: '',
  statusFilter: '',
  selectedCropId: null,
  selectedCrops: new Set(),

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';
    const isOfficer = currentUser && currentUser.role === 'Officer';

    let plots = appState.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const plotIds = plots.map(p => p.id);
    let allCrops = appState.getCrops().filter(c => plotIds.includes(c.plotId));
    const members = appState.getMembers();

    // Only show active / growing crops by default (Harvested crops are stored in "ประวัติการปลูก")
    let activeCrops = allCrops.filter(c => c.status === 'growing');
    if (this.statusFilter === 'harvested') {
      activeCrops = allCrops.filter(c => c.status === 'harvested');
    }

    // Summary count statistics
    const totalCount = allCrops.length;
    const growingCount = allCrops.filter(c => c.status === 'growing').length;
    const harvestedCount = allCrops.filter(c => c.status === 'harvested').length;

    // Filter by search query & status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = activeCrops.filter(c => {
      const plot = plots.find(p => p.id === c.plotId);
      const owners = plot ? members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : [];
      const ownersNames = owners.map(o => o.name).join(' ');
      const herbType = c.seedlingSource || (plot ? plot.plantType : '') || '';

      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        c.id.toLowerCase().includes(query) ||
        (plot && plot.name.toLowerCase().includes(query)) ||
        ownersNames.toLowerCase().includes(query) ||
        herbType.toLowerCase().includes(query);

      let matchesStatus = true;
      if (this.statusFilter === 'ready_harvest') {
        if (!c.harvestDateEst) {
          matchesStatus = false;
        } else {
          const est = new Date(c.harvestDateEst);
          est.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((est - today) / (1000 * 60 * 60 * 24));
          matchesStatus = diffDays <= 7;
        }
      } else if (this.statusFilter === 'ready_fert') {
        let nextFert = c.fertDateEst;
        if (!nextFert && c.plantDate) {
          const fertCount = (c.fertilizingLog || []).length;
          const pDate = new Date(c.plantDate);
          pDate.setMonth(pDate.getMonth() + (fertCount + 1));
          nextFert = pDate.toISOString().split('T')[0];
        }
        if (!nextFert) {
          matchesStatus = false;
        } else {
          const fertDate = new Date(nextFert);
          fertDate.setHours(0, 0, 0, 0);
          const fertDiffDays = Math.ceil((fertDate - today) / (1000 * 60 * 60 * 24));
          matchesStatus = fertDiffDays <= 7;
        }
      }

      return matchesSearch && matchesStatus;
    });

    // Check if all filtered rows are selected
    const allFilteredSelected = filtered.length > 0 && filtered.every(c => this.selectedCrops.has(c.id));
    const selectedCount = this.selectedCrops.size;

    // Table rows generation
    const tableRowsHtml = filtered.length === 0
      ? `<tr><td colspan="7" class="px-6 py-12 text-center text-lg text-gray-500 font-medium">ไม่พบข้อมูลรอบการเพาะปลูกตามเงื่อนไขที่ระบุ</td></tr>`
      : filtered.map(c => {
          const plot = plots.find(p => p.id === c.plotId);
          const owners = plot ? members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : [];
          const ownersNames = owners.map(o => o.name).join(', ') || '-';
          const herbType = c.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';
          const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');

          // Accumulated cost
          const totalCost = (parseFloat(c.cost) || 0) + (c.fertilizingLog || []).reduce((sum, f) => sum + (parseFloat(f.cost) || 0), 0);

          // Calculate fertilizing schedule (Fertilize: monthly)
          let fertScheduleText = '';
          const fertCount = (c.fertilizingLog || []).length;

          if (c.status === 'growing') {
            // Next fertilizing schedule
            let nextFertDateStr = c.fertDateEst;
            if (!nextFertDateStr && c.plantDate) {
              // Month 1, Month 2 after planting
              const pDate = new Date(c.plantDate);
              pDate.setMonth(pDate.getMonth() + (fertCount + 1));
              nextFertDateStr = pDate.toISOString().split('T')[0];
            }

            if (nextFertDateStr) {
              const fertDate = new Date(nextFertDateStr);
              fertDate.setHours(0, 0, 0, 0);
              const fertDiffDays = Math.ceil((fertDate - today) / (1000 * 60 * 60 * 24));

              let badgeContent = '';
              if (fertDiffDays > 0) {
                badgeContent = `
                  <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-sm">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs text-emerald-800 font-bold uppercase">รอบถัดไป (เดือนละครั้ง)</span>
                      <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs">อีก ${fertDiffDays} วัน</span>
                    </div>
                    <div class="text-base font-bold text-gray-900 mt-1">
                      ${formatThaiDate(nextFertDateStr)}
                    </div>
                    <div class="text-xs text-emerald-700 font-semibold mt-1 flex items-center justify-between">
                      <span><i class="fas fa-check-circle mr-1"></i>ใส่แล้ว ${fertCount} ครั้ง</span>
                      <button data-id="${c.id}" class="add-crop-fert-btn text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer">
                        + ใส่ปุ๋ย
                      </button>
                    </div>
                  </div>
                `;
              } else if (fertDiffDays === 0) {
                badgeContent = `
                  <div class="p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-sm animate-pulse">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs text-amber-900 font-bold uppercase"><i class="fas fa-bell mr-1"></i>ถึงกำหนดวันนี้</span>
                      <span class="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-black text-xs">ครบ 1 เดือน</span>
                    </div>
                    <div class="text-base font-black text-amber-950 mt-1">
                      ${formatThaiDate(nextFertDateStr)}
                    </div>
                    <div class="text-xs text-amber-900 font-bold mt-1.5 flex items-center justify-between">
                      <span>ใส่แล้ว ${fertCount} ครั้ง</span>
                      <button data-id="${c.id}" class="add-crop-fert-btn px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm">
                        + บันทึกใส่ปุ๋ย
                      </button>
                    </div>
                  </div>
                `;
              } else {
                badgeContent = `
                  <div class="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-sm">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs text-rose-800 font-bold uppercase"><i class="fas fa-exclamation-triangle mr-1"></i>เลยกำหนด</span>
                      <span class="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-xs">เกิน ${Math.abs(fertDiffDays)} วัน</span>
                    </div>
                    <div class="text-base font-bold text-gray-900 mt-1">
                      ${formatThaiDate(nextFertDateStr)}
                    </div>
                    <div class="text-xs text-rose-700 font-bold mt-1.5 flex items-center justify-between">
                      <span>ใส่แล้ว ${fertCount} ครั้ง</span>
                      <button data-id="${c.id}" class="add-crop-fert-btn px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm">
                        + บันทึกใส่ปุ๋ย
                      </button>
                    </div>
                  </div>
                `;
              }
              fertScheduleText = badgeContent;
            }
          } else if (c.status === 'harvested') {
            fertScheduleText = `
              <div class="p-2 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 font-medium">
                <i class="fas fa-check-circle text-emerald-600 mr-1"></i>จบรอบเพาะปลูกแล้ว (ใส่ปุ๋ยรวม ${fertCount} ครั้ง)
              </div>
            `;
          }

          // Calculate harvest countdown (3 months)
          let harvestScheduleText = '';
          if (c.status === 'growing' && c.harvestDateEst) {
            const estDate = new Date(c.harvestDateEst);
            estDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((estDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
              harvestScheduleText = `<span class="text-sm text-amber-800 font-bold inline-flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"><i class="far fa-clock text-amber-600"></i> เก็บเกี่ยวในอีก ${diffDays} วัน</span>`;
            } else if (diffDays === 0) {
              harvestScheduleText = `<span class="text-sm text-red-700 font-black inline-flex items-center gap-1 bg-red-100 px-2.5 py-1 rounded-lg border border-red-300 animate-pulse"><i class="fas fa-box-open text-red-600"></i> ครบ 3 เดือน พร้อมเก็บเกี่ยววันนี้</span>`;
            } else {
              harvestScheduleText = `<span class="text-sm text-red-700 font-bold inline-flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200"><i class="fas fa-exclamation-triangle text-red-600"></i> เกินกำหนด 3 เดือน (${Math.abs(diffDays)} วัน)</span>`;
            }
          } else if (c.status === 'harvested') {
            harvestScheduleText = `<span class="text-sm text-emerald-800 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"><i class="fas fa-check-circle text-emerald-600"></i> เก็บเกี่ยวแล้ว (${(c.yield || 0).toFixed(2)} กก.)</span>`;
          }

          const isChecked = this.selectedCrops.has(c.id);

          return `
            <tr class="hover:bg-emerald-50/30 border-b border-gray-100 last:border-0 transition-colors group ${isChecked ? 'bg-emerald-50/40' : ''}">
              <!-- 0. เลือกติ๊กถูก (Checkbox) -->
              <td class="px-4 py-5 whitespace-nowrap text-center align-top">
                <input type="checkbox" data-id="${c.id}" class="crop-row-checkbox w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" ${isChecked ? 'checked' : ''}>
              </td>

              <!-- 1. รหัสรอบปลูก -->
              <td class="px-5 py-5 whitespace-nowrap align-top">
                <div class="view-crop-timeline-btn cursor-pointer group-hover:text-emerald-700" data-id="${c.id}" title="คลิกดูประวัติกิจกรรม">
                  <span class="text-base md:text-lg font-black text-emerald-800 tracking-tight group-hover:underline">${c.id}</span>
                  <span class="block text-sm text-gray-500 font-medium mt-0.5">ปี พ.ศ. ${c.cropYear || '-'} (รอบที่ ${c.cropCycle || 1})</span>
                </div>
              </td>

              <!-- 2. แปลงปลูก / เจ้าของ -->
              <td class="px-5 py-5 align-top">
                <div class="view-crop-timeline-btn cursor-pointer" data-id="${c.id}">
                  <div class="text-base md:text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">${plot ? plot.name : 'ไม่พบแปลงปลูก'}</div>
                  <div class="text-base text-gray-600 mt-1 flex items-center gap-1.5 font-medium">
                    <i class="fas fa-user-circle text-gray-400 text-sm"></i>
                    <span>${ownersNames}</span>
                  </div>
                </div>
              </td>

              <!-- 3. ชนิดสมุนไพร -->
              <td class="px-5 py-5 whitespace-nowrap align-top">
                <span class="px-3.5 py-1.5 text-base font-bold rounded-full inline-block shadow-sm ${
                  isChrys ? 'badge-chrysanthemum bg-amber-100 text-amber-900 border border-amber-200' : 'badge-chamomile bg-sky-100 text-sky-900 border border-sky-200'
                }">
                  ${herbType}
                </span>
                <span class="text-sm text-gray-500 font-medium block mt-1.5">${(c.seedlingCount || 0).toLocaleString()} ต้นกล้า</span>
              </td>

              <!-- 4. วันเริ่มปลูก & วันเก็บเกี่ยว (3 เดือน) -->
              <td class="px-5 py-5 align-top min-w-[210px]">
                <div class="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span class="text-gray-500 font-medium text-sm">📅 เริ่มปลูก:</span> 
                  <span>${formatThaiDate(c.plantDate)}</span>
                </div>
                <div class="text-base font-semibold text-gray-900 mt-1 flex items-center gap-2">
                  <span class="text-gray-500 font-medium text-sm">📦 เก็บเกี่ยว (3 ด.):</span> 
                  <span>${formatThaiDate(c.status === 'harvested' ? c.harvestDateActual : c.harvestDateEst)}</span>
                </div>
                <div class="mt-2">
                  ${harvestScheduleText}
                </div>
              </td>

              <!-- 5. การใส่ปุ๋ยบำรุง (เดือนละ 1 ครั้ง) แยกคอลัมน์ชัดเจน -->
              <td class="px-5 py-5 align-top min-w-[220px]">
                ${fertScheduleText}
              </td>

              <!-- 6. จัดการ (Actions) -->
              <td class="px-5 py-5 whitespace-nowrap text-right space-x-1.5 align-top">
                <button data-id="${c.id}" class="view-crop-timeline-btn p-2.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all" title="ดูรายละเอียดและไทม์ไลน์">
                  <i class="fas fa-eye text-base"></i>
                </button>
                ${c.status === 'growing' ? `
                  <button data-id="${c.id}" class="add-crop-fert-btn p-2.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all" title="บันทึกใส่ปุ๋ย/บำรุง">
                    <i class="fas fa-hand-holding-seedling text-base"></i>
                  </button>
                  <button data-id="${c.id}" class="record-crop-harvest-btn p-2.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-all font-bold" title="บันทึกผลผลิตเก็บเกี่ยว">
                    <i class="fas fa-box-open text-base"></i>
                  </button>
                ` : ''}
                <button data-id="${c.id}" class="edit-crop-btn p-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all" title="แก้ไขข้อมูลรอบปลูก">
                  <i class="fas fa-edit text-base"></i>
                </button>
                <button data-id="${c.id}" class="delete-crop-btn p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all" title="ลบรอบการปลูก">
                  <i class="fas fa-trash-alt text-base"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-history text-emerald-700"></i>
              บันทึกรอบเพาะปลูกสมุนไพร
            </h1>
            <p class="text-sm text-gray-500 mt-1">ทะเบียนติดตามรอบการเจริญเติบโต การใส่ปุ๋ยบำรุง ต้นทุนสะสม และบันทึกผลผลิตเก็บเกี่ยว (ทั้งหมด ${totalCount} รอบ)</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <!-- ปุ่มจัดการแบบกลุ่ม (Batch Actions) -->
            <button id="batch-fertilize-btn" class="px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-2 shadow-sm ${selectedCount > 0 ? '' : 'opacity-90'}">
              <i class="fas fa-hand-holding-seedling"></i> ใส่ปุ๋ยทั้งหมด ${selectedCount > 0 ? `(${selectedCount})` : ''}
            </button>
            <button id="batch-harvest-btn" class="px-4 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all flex items-center gap-2 shadow-sm ${selectedCount > 0 ? '' : 'opacity-90'}">
              <i class="fas fa-box-open"></i> เก็บเกี่ยวทั้งหมด ${selectedCount > 0 ? `(${selectedCount})` : ''}
            </button>
            <button id="add-crop-season-btn" class="px-4 py-2.5 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all flex items-center gap-2 shadow-sm">
              <i class="fas fa-plus-circle"></i> เริ่มรอบการปลูกใหม่
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-emerald-600 block uppercase">รอบที่กำลังเพาะปลูกในแปลง</span>
              <span class="text-2xl font-black text-emerald-700 mt-1 block">${growingCount} แปลง</span>
            </div>
            <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
              <i class="fas fa-seedling"></i>
            </div>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-gray-400 block uppercase">เก็บเกี่ยวแล้ว (ดูที่เมนูประวัติการปลูก)</span>
              <span class="text-2xl font-black text-gray-500 mt-1 block">${harvestedCount} รอบ</span>
            </div>
            <a href="#crop-history" class="w-12 h-12 bg-gray-50 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-2xl flex items-center justify-center text-xl transition-colors" title="ไปที่หน้าประวัติการปลูก">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </a>
          </div>
        </div>

        <!-- แถบเครื่องมือค้นหาและตัวเลือกแบบกลุ่ม -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="relative flex-1 max-w-lg">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <i class="fas fa-search text-xs"></i>
            </span>
            <input type="text" id="crops-search-input" value="${this.searchQuery}" placeholder="ค้นหารหัสรอบ, ชื่อแปลง, เกษตรกรผู้ดูแล หรือชนิดพืช..." 
              class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
          </div>
          <div class="flex flex-wrap items-center gap-3">
            ${selectedCount > 0 ? `
              <div class="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <span class="text-xs font-bold text-emerald-800">เลือกอยู่ <b>${selectedCount}</b> รายการ</span>
                <button id="clear-selected-crops-btn" class="text-xs text-red-500 hover:text-red-700 font-bold underline ml-1">ยกเลิกการเลือก</button>
              </div>
            ` : ''}
            <div class="flex items-center gap-2">
              <label for="crops-status-filter" class="text-xs font-bold text-gray-500 whitespace-nowrap">สถานะ:</label>
              <select id="crops-status-filter" class="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium">
                <option value="" ${this.statusFilter === '' ? 'selected' : ''}>กำลังเพาะปลูกทั้งหมด (${growingCount})</option>
                <option value="ready_fert" ${this.statusFilter === 'ready_fert' ? 'selected' : ''}>🌱 ถึงกำหนดใส่ปุ๋ย (ภายใน 7 วัน / เลยกำหนด)</option>
                <option value="ready_harvest" ${this.statusFilter === 'ready_harvest' ? 'selected' : ''}>📦 ใกล้ถึงกำหนดเก็บเกี่ยว 3 เดือน (ภายใน 7 วัน)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50/90 text-base md:text-lg font-bold text-gray-800 border-b border-gray-200">
                  <th class="px-4 py-4.5 text-center w-12">
                    <input type="checkbox" id="select-all-crops-checkbox" title="เลือกติ๊กถูกทั้งหมด"
                      class="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" ${allFilteredSelected ? 'checked' : ''}>
                  </th>
                  <th class="px-5 py-4.5">รหัสรอบปลูก</th>
                  <th class="px-5 py-4.5">แปลงปลูก / เจ้าของ</th>
                  <th class="px-5 py-4.5">ชนิดสมุนไพร</th>
                  <th class="px-5 py-4.5">วันเริ่มปลูก - เก็บเกี่ยว (3 เดือน)</th>
                  <th class="px-5 py-4.5">กำหนดใส่ปุ๋ย (เดือนละ 1 ครั้ง)</th>
                  <th class="px-5 py-4.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    this.bindSearchAndFilter();
    this.bindBatchActions();
    this.bindActionButtons();
  },

  bindBatchActions() {
    // 1. Select All Checkbox
    const selectAllCheckbox = document.getElementById('select-all-crops-checkbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        const rowCheckboxes = document.querySelectorAll('.crop-row-checkbox');
        rowCheckboxes.forEach(cb => {
          cb.checked = checked;
          const id = cb.getAttribute('data-id');
          if (checked) {
            this.selectedCrops.add(id);
          } else {
            this.selectedCrops.delete(id);
          }
        });
        this.refreshView();
      });
    }

    // 2. Individual Row Checkboxes
    const rowCheckboxes = document.querySelectorAll('.crop-row-checkbox');
    rowCheckboxes.forEach(cb => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      cb.addEventListener('change', (e) => {
        const id = cb.getAttribute('data-id');
        if (e.target.checked) {
          this.selectedCrops.add(id);
        } else {
          this.selectedCrops.delete(id);
        }
        this.refreshView();
      });
    });

    // 3. Clear Selected Button
    const clearBtn = document.getElementById('clear-selected-crops-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.selectedCrops.clear();
        this.refreshView();
      });
    }

    // 4. Batch Fertilize Button
    const batchFertBtn = document.getElementById('batch-fertilize-btn');
    if (batchFertBtn) {
      batchFertBtn.addEventListener('click', () => {
        this.openBatchFertilizerModal();
      });
    }

    // 5. Batch Harvest Button
    const batchHarvestBtn = document.getElementById('batch-harvest-btn');
    if (batchHarvestBtn) {
      batchHarvestBtn.addEventListener('click', () => {
        this.openBatchHarvestModal();
      });
    }
  },

  openBatchFertilizerModal() {
    // Get target crops (either selected ones, or all currently growing crops)
    let targetCrops = [];
    if (this.selectedCrops.size > 0) {
      targetCrops = Array.from(this.selectedCrops)
        .map(id => appState.getCropById(id))
        .filter(c => c && c.status === 'growing');
    } else {
      targetCrops = appState.getCrops().filter(c => c.status === 'growing');
    }

    if (targetCrops.length === 0) {
      showToast('ไม่พบรอบการปลูกที่กำลังเพาะปลูกเพื่อใส่ปุ๋ย', 'warning');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const cropBadgesHtml = targetCrops.map(c => `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold">
        ${c.id} (${c.seedlingSource || 'สมุนไพร'})
      </span>
    `).join(' ');

    const formHtml = `
      <form id="global-batch-fert-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                <i class="fas fa-check-double mr-1"></i> รอบปลูกเป้าหมายที่จะบันทึกใส่ปุ๋ยพร้อมกัน
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-black text-xs">
                ${targetCrops.length} แปลง
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
              ${cropBadgesHtml}
            </div>
            <p class="text-[11px] text-emerald-700 font-medium">
              * ข้อมูลกิจกรรมการใส่ปุ๋ยนี้จะถูกบันทึกลงประวัติของทุกรอบปลูกข้างต้น และกำหนดวันใส่ปุ๋ยรอบถัดไปจะขยับ +1 เดือนให้อัตโนมัติ
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label for="batch-fert-type" class="block text-xs font-semibold text-gray-500 uppercase mb-1">กิจกรรม / ประเภทปุ๋ยที่ใส่ *</label>
              <input type="text" id="batch-fert-type" name="type" required placeholder="เช่น ปุ๋ยหมักชีวภาพสูตรใบ, น้ำหมักจุลินทรีย์สังเคราะห์แสง"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label for="batch-fert-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่ใส่ (วัน/เดือน/ปี) *</label>
              <input type="date" id="batch-fert-date" name="date" required value="${todayStr}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label for="batch-fert-amount" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปริมาณที่ใช้ต่อแปลง *</label>
              <input type="text" id="batch-fert-amount" name="amount" required placeholder="เช่น 20 กก./แปลง หรือ 3 ลิตร/แปลง"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="md:col-span-2">
              <label for="batch-fert-cost" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ค่าใช้จ่ายบำรุงเฉลี่ยต่อแปลง (บาท) *</label>
              <input type="number" id="batch-fert-cost" name="cost" required min="0" placeholder="เช่น 300"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="md:col-span-2">
              <label for="batch-fert-note" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หมายเหตุบันทึกกิจกรรม</label>
              <textarea id="batch-fert-note" name="note" rows="2" placeholder="ระบุข้อสังเกต หรือสภาพการเจริญเติบโตรวม (ถ้ามี)"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>
          </div>
        </div>
        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-check-double"></i> บันทึกใส่ปุ๋ยทั้ง ${targetCrops.length} แปลง
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `บันทึกใส่ปุ๋ยทั้งหมดพร้อมกัน (${targetCrops.length} รอบการปลูก)`,
      icon: 'fas fa-hand-holding-seedling',
      size: 'max-w-2xl',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-batch-fert-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const dateVal = formData.get('date');
            const typeVal = formData.get('type');
            const amountVal = formData.get('amount');
            const costVal = parseFloat(formData.get('cost')) || 0;
            const noteVal = formData.get('note') ? formData.get('note').trim() : '';

            const logDate = new Date(dateVal || new Date());
            logDate.setMonth(logDate.getMonth() + 1);
            const nextFertStr = logDate.toISOString().split('T')[0];

            let successCount = 0;
            targetCrops.forEach(c => {
              try {
                const logEntry = {
                  date: dateVal,
                  type: typeVal,
                  amount: amountVal,
                  cost: costVal,
                  note: noteVal
                };
                appState.addFertilizerLog(c.id, logEntry);

                // Auto-advance next fertilizing date (+1 month)
                if (!c.harvestDateEst || nextFertStr <= c.harvestDateEst) {
                  appState.updateCrop(c.id, { fertDateEst: nextFertStr });
                }
                successCount++;
              } catch (err) {
                console.error(err);
              }
            });

            this.selectedCrops.clear();
            closeGlobalModal();
            showToast(`บันทึกใส่ปุ๋ยสำเร็จจำนวน ${successCount} แปลงเรียบร้อย (กำหนดรอบถัดไป +1 เดือน)`);
            this.refreshView();
          });
        }
      }
    });
  },

  openBatchHarvestModal() {
    // Get target crops (either selected ones, or all currently growing crops)
    let targetCrops = [];
    if (this.selectedCrops.size > 0) {
      targetCrops = Array.from(this.selectedCrops)
        .map(id => appState.getCropById(id))
        .filter(c => c && c.status === 'growing');
    } else {
      targetCrops = appState.getCrops().filter(c => c.status === 'growing');
    }

    if (targetCrops.length === 0) {
      showToast('ไม่พบรอบการปลูกที่กำลังเพาะปลูกเพื่อเก็บเกี่ยว', 'warning');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Build row inputs for each crop so user can specify weight for each or use a default
    const cropInputsHtml = targetCrops.map(c => `
      <div class="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-black text-gray-900">${c.id}</span>
            <span class="px-2 py-0.5 rounded text-xs font-bold ${c.seedlingSource === 'คาโมมายล์' ? 'bg-sky-100 text-sky-900' : 'bg-amber-100 text-amber-900'}">
              ${c.seedlingSource || 'เก๊กฮวย'}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-0.5">
            ลงกล้า: ${(c.seedlingCount || 0).toLocaleString()} ต้น | ปลูกเมื่อ: ${formatThaiDate(c.plantDate)}
          </div>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <label class="text-xs font-bold text-gray-700 whitespace-nowrap">ผลผลิตสด (กก.):</label>
          <input type="number" step="any" min="0.1" name="yield_${c.id}" required placeholder="เช่น 120"
            class="batch-yield-input w-28 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none">
        </div>
      </div>
    `).join('');

    const formHtml = `
      <form id="global-batch-harvest-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-amber-900 uppercase tracking-wide">
                <i class="fas fa-box-open mr-1"></i> เก็บเกี่ยวผลผลิตทั้งหมดพร้อมกัน
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black text-xs">
                ${targetCrops.length} แปลง
              </span>
            </div>
            <p class="text-xs text-amber-800">
              กรอกปริมาณน้ำหนักผลผลิตสดของแต่ละแปลง หรือใส่ค่าประมาณเฉลี่ยด้านล่างเพื่อเติมให้อัตโนมัติ ทุกรอบที่บันทึกจะย้ายไปที่ <b>"ประวัติการปลูก"</b>
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="batch-harvest-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่เก็บเกี่ยวจริง (วัน/เดือน/ปี) *</label>
              <input type="date" id="batch-harvest-date" name="harvestDateActual" required value="${todayStr}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">ตัวช่วยเติมน้ำหนักเฉลี่ยทุกแปลง (กก.)</label>
              <div class="flex items-center gap-2">
                <input type="number" id="quick-fill-yield" step="any" min="0" placeholder="เช่น 150"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                <button type="button" id="quick-fill-yield-btn" class="px-3 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl whitespace-nowrap transition-colors">
                  เติมทุกแปลง
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <span class="text-xs font-bold text-gray-700 uppercase block tracking-wider">
              น้ำหนักผลผลิตสดแยกตามแปลง (${targetCrops.length} รายการ) *
            </span>
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
              ${cropInputsHtml}
            </div>
          </div>

          <div>
            <label for="batch-harvest-note" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หมายเหตุการเก็บเกี่ยวรวม</label>
            <textarea id="batch-harvest-note" name="note" rows="2" placeholder="ระบุสภาพอากาศ คุณภาพผลผลิต หรือข้อสังเกตเพิ่มเติม"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-check-double"></i> บันทึกเก็บเกี่ยวทั้ง ${targetCrops.length} แปลง
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `บันทึกเก็บเกี่ยวผลผลิตทั้งหมดพร้อมกัน (${targetCrops.length} รอบการปลูก)`,
      icon: 'fas fa-box-open',
      size: 'max-w-3xl',
      headerColor: 'bg-amber-600',
      content: formHtml,
      onRender: (dialog) => {
        // Quick Fill Yield Button
        const quickFillBtn = dialog.querySelector('#quick-fill-yield-btn');
        const quickFillInput = dialog.querySelector('#quick-fill-yield');
        if (quickFillBtn && quickFillInput) {
          quickFillBtn.addEventListener('click', () => {
            const val = quickFillInput.value;
            if (val) {
              const inputs = dialog.querySelectorAll('.batch-yield-input');
              inputs.forEach(inp => {
                inp.value = val;
              });
            }
          });
        }

        const form = dialog.querySelector('#global-batch-harvest-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const dateVal = formData.get('harvestDateActual');
            const noteVal = formData.get('note') ? formData.get('note').trim() : '';

            let successCount = 0;
            targetCrops.forEach(c => {
              const yieldVal = parseFloat(formData.get(`yield_${c.id}`)) || 0;
              try {
                appState.updateCrop(c.id, {
                  harvestDateActual: dateVal,
                  yield: yieldVal,
                  harvestNote: noteVal ? `${noteVal} (บันทึกพร้อมกัน)` : 'เก็บเกี่ยวพร้อมกัน',
                  status: 'harvested'
                });
                successCount++;
              } catch (err) {
                console.error(err);
              }
            });

            this.selectedCrops.clear();
            closeGlobalModal();
            showToast(`บันทึกเก็บเกี่ยวสำเร็จ ${successCount} แปลงเรียบร้อย (ย้ายไปประวัติการปลูกแล้ว)`);
            this.refreshView();
          });
        }
      }
    });
  },

  bindSearchAndFilter() {
    const searchInput = document.getElementById('crops-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }

    const filter = document.getElementById('crops-status-filter');
    if (filter) {
      filter.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.refreshView();
      });
    }

    const addCropBtn = document.getElementById('add-crop-season-btn');
    if (addCropBtn) {
      addCropBtn.addEventListener('click', () => {
        this.openCropFormModal(null);
      });
    }
  },

  bindActionButtons() {
    const viewBtns = document.querySelectorAll('.view-crop-timeline-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openCropTimelineModal(id);
      });
    });

    const fertBtns = document.querySelectorAll('.add-crop-fert-btn');
    fertBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openFertilizerModal(id);
      });
    });

    const harvestBtns = document.querySelectorAll('.record-crop-harvest-btn');
    harvestBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openHarvestModal(id);
      });
    });

    const editBtns = document.querySelectorAll('.edit-crop-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openCropFormModal(id);
      });
    });

    const deleteBtns = document.querySelectorAll('.delete-crop-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm(`คุณต้องการลบข้อมูลรอบเพาะปลูกรหัส "${id}" ใช่หรือไม่?`)) {
          try {
            appState.deleteCrop(id);
            showToast(`ลบรอบการปลูก ${id} สำเร็จ`);
            this.refreshView();
          } catch (err) {
            showToast('ไม่สามารถลบรายการได้: ' + err.message, 'error');
          }
        }
      });
    });
  },

  openCropTimelineModal(cropId) {
    const crop = appState.getCropById(cropId);
    if (!crop) return;

    const plot = appState.getPlotById(crop.plotId);
    const members = appState.getMembers();
    const owners = plot ? members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : [];
    const ownersNames = owners.map(o => o.name).join(', ') || '-';
    const herbType = crop.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';
    const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');

    const totalFertCost = (crop.fertilizingLog || []).reduce((sum, f) => sum + (parseFloat(f.cost) || 0), 0);
    const totalCost = (parseFloat(crop.cost) || 0) + totalFertCost;

    const fertilizingTimeline = (crop.fertilizingLog || []).map(f => `
      <div class="relative pl-6 pb-4 last:pb-0 border-l-2 border-dashed border-gray-200 last:border-0">
        <div class="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></div>
        <div class="text-xs text-gray-400 font-medium">${formatThaiDate(f.date)}</div>
        <div class="text-sm font-bold text-gray-800 mt-0.5">${f.type}</div>
        <div class="text-xs text-gray-500 mt-0.5">ปริมาณ: <b class="text-emerald-700">${f.amount}</b> | ค่าใช้จ่าย: <b>${formatBaht(f.cost || 0)}</b></div>
        ${f.note ? `<div class="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg mt-1 inline-block border border-amber-200/60"><i class="far fa-sticky-note mr-1"></i>หมายเหตุ: ${f.note}</div>` : ''}
      </div>
    `).join('');

    const timelineHtml = (crop.fertilizingLog || []).length === 0
      ? `<div class="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">ยังไม่มีบันทึกประวัติการใส่ปุ๋ยและบำรุงแปลงในรอบนี้</div>`
      : `<div class="space-y-1 mt-2">${fertilizingTimeline}</div>`;

    const traceUrl = `${window.location.origin}${window.location.pathname}#trace/${crop.id}`;
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(traceUrl)}`;

    const detailContent = `
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-black text-gray-900">${crop.id}</h3>
                <span class="px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  isChrys ? 'badge-chrysanthemum bg-amber-100 text-amber-900' : 'badge-chamomile bg-sky-100 text-sky-900'
                }">
                  ${herbType}
                </span>
                <span class="px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  crop.status === 'harvested' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-800'
                }">
                  ${crop.status === 'harvested' ? 'เก็บเกี่ยวแล้ว' : 'กำลังเติบโต'}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1">แปลง: <b>${plot ? plot.name : '-'}</b> | เจ้าของแปลง: <b>${ownersNames}</b></p>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-400 block font-medium">ปีเพาะปลูก</span>
              <span class="text-sm font-black text-emerald-800">พ.ศ. ${crop.cropYear || '-'} (รอบที่ ${crop.cropCycle || 1})</span>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span class="text-[11px] text-emerald-700 font-bold block">จำนวนต้นกล้า</span>
              <span class="text-lg font-black text-emerald-950 mt-0.5 block">${(crop.seedlingCount || 0).toLocaleString()} ต้น</span>
            </div>
            <div class="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <span class="text-[11px] text-gray-500 font-bold block">ต้นทุนเริ่มต้น</span>
              <span class="text-lg font-black text-gray-800 mt-0.5 block">${formatBaht(crop.cost || 0)}</span>
            </div>
            <div class="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <span class="text-[11px] text-gray-500 font-bold block">ต้นทุนบำรุงสะสม</span>
              <span class="text-lg font-black text-emerald-800 mt-0.5 block">${formatBaht(totalFertCost)}</span>
            </div>
            <div class="p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
              <span class="text-[11px] text-amber-700 font-bold block">${crop.status === 'harvested' ? 'ผลผลิตดอกสดจริง' : 'ต้นทุนรวมทั้งหมด'}</span>
              <span class="text-lg font-black text-amber-900 mt-0.5 block">${crop.status === 'harvested' ? `${(crop.yield || 0).toFixed(2)} กก.` : formatBaht(totalCost)}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-gray-50 rounded-2xl text-xs space-y-2 border border-gray-100">
              <span class="font-bold text-gray-700 block"><i class="far fa-calendar-alt text-emerald-600 mr-1"></i> กำหนดเวลาเพาะปลูก & บำรุงรักษา</span>
              <div class="flex justify-between text-gray-600">
                <span>วันที่เริ่มปลูก:</span>
                <span class="font-bold text-gray-800">${formatThaiDate(crop.plantDate)}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>วันคาดการณ์เก็บเกี่ยว (3 เดือน):</span>
                <span class="font-bold text-gray-800">${formatThaiDate(crop.harvestDateEst)}</span>
              </div>
              ${crop.status === 'harvested' ? `
                <div class="flex justify-between text-gray-600 pt-1 border-t border-gray-200">
                  <span>วันที่เก็บเกี่ยวจริง:</span>
                  <span class="font-bold text-emerald-700">${formatThaiDate(crop.harvestDateActual)}</span>
                </div>
              ` : `
                <div class="flex justify-between text-gray-600">
                  <span>วันใส่ปุ๋ย/บำรุงถัดไป (เดือนละ 1 ครั้ง):</span>
                  <span class="font-bold text-emerald-800">${formatThaiDate(crop.fertDateEst)}</span>
                </div>
              `}
            </div>
            <div class="p-4 bg-gray-50 rounded-2xl text-xs space-y-2 border border-gray-100">
              <span class="font-bold text-gray-700 block"><i class="fas fa-clipboard text-emerald-600 mr-1"></i> บันทึกและหมายเหตุ</span>
              <div class="text-gray-600">
                <span>หมายเหตุรอบปลูก:</span>
                <span class="font-medium text-gray-800 ml-1">${crop.note || '-'}</span>
              </div>
              ${crop.harvestNote ? `
                <div class="text-gray-600">
                  <span>หมายเหตุเก็บเกี่ยว:</span>
                  <span class="font-medium text-emerald-700 ml-1">${crop.harvestNote}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">
                <i class="fas fa-stream text-emerald-600 mr-1"></i> ไทม์ไลน์ประวัติการบำรุงและใส่ปุ๋ย (${(crop.fertilizingLog || []).length} รายการ)
              </span>
              ${crop.status === 'growing' ? `
                <button id="modal-quick-fert-btn" class="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline">
                  <i class="fas fa-plus"></i> เพิ่มรายการใส่ปุ๋ย
                </button>
              ` : ''}
            </div>
            <div class="max-h-56 overflow-y-auto pr-1">
              ${timelineHtml}
            </div>
          </div>

          <div class="p-4 border border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 flex items-center justify-between gap-4">
            <div class="space-y-1 flex-1">
              <span class="text-xs font-bold text-emerald-900 block">รหัสตรวจสอบย้อนกลับผลผลิต (Traceability)</span>
              <p class="text-[11px] text-gray-500">ผู้บริโภคสามารถสแกน QR Code นี้เพื่อตรวจดูแหล่งกำเนิดแปลงปลูก เกษตรกรผู้ดูแล และประวัติการใส่ปุ๋ย</p>
              <button id="modal-open-trace-btn" class="text-xs font-bold text-emerald-700 hover:text-emerald-950 underline pt-1 block">
                <i class="fas fa-external-link-alt"></i> เปิดหน้าจอตรวจสอบย้อนกลับ
              </button>
            </div>
            <img src="${qrCodeApiUrl}" alt="QR Code" class="w-16 h-16 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          </div>
        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2 flex-shrink-0">
          <div class="flex gap-2">
            ${crop.status === 'growing' ? `
              <button id="modal-action-harvest-btn" class="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                <i class="fas fa-box-open"></i> บันทึกเก็บเกี่ยวผลผลิต
              </button>
            ` : ''}
          </div>
          <button type="button" class="close-global-modal-btn px-6 py-2 text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: `รายละเอียดรอบการเพาะปลูก ${crop.id}`,
      icon: 'fas fa-history',
      size: 'max-w-4xl',
      content: detailContent,
      onRender: (dialog) => {
        const quickFertBtn = dialog.querySelector('#modal-quick-fert-btn');
        if (quickFertBtn) {
          quickFertBtn.addEventListener('click', () => {
            closeGlobalModal();
            this.openFertilizerModal(cropId);
          });
        }

        const harvestBtn = dialog.querySelector('#modal-action-harvest-btn');
        if (harvestBtn) {
          harvestBtn.addEventListener('click', () => {
            closeGlobalModal();
            this.openHarvestModal(cropId);
          });
        }

        const traceBtn = dialog.querySelector('#modal-open-trace-btn');
        if (traceBtn) {
          traceBtn.addEventListener('click', () => {
            closeGlobalModal();
            window.location.hash = `#trace/${cropId}`;
          });
        }
      }
    });
  },

  openCropFormModal(cropId = null) {
    const isEdit = !!cropId;
    const crop = isEdit ? appState.getCropById(cropId) : null;

    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';
    let plots = appState.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const members = appState.getMembers();

    const plotsDropdown = plots.map(p => {
      const owners = members.filter(m => (p.memberIds && p.memberIds.includes(m.id)) || p.memberId === m.id);
      const ownersNames = owners.map(o => o.name).join(', ') || '-';
      const isSelected = crop && crop.plotId === p.id;
      return `<option value="${p.id}" ${isSelected ? 'selected' : ''}>${p.name} (${p.id}) - โดย ${ownersNames}</option>`;
    }).join('');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Auto-calculate: Harvest = +3 months (90 days), Next Fertilizer = +1 month (30 days)
    const calcAddMonths = (baseDateStr, months) => {
      const d = new Date(baseDateStr);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
    };

    const initialPlantDate = crop ? crop.plantDate : todayStr;
    const defaultHarvestEstStr = crop ? crop.harvestDateEst : calcAddMonths(initialPlantDate, 3);
    const defaultFertEstStr = crop ? (crop.fertDateEst || calcAddMonths(initialPlantDate, 1)) : calcAddMonths(initialPlantDate, 1);
    const currentYear = today.getFullYear() + 543;

    const formHtml = `
      <form id="global-new-crop-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div>
            <label for="crop-plotId" class="block text-xs font-semibold text-gray-500 uppercase mb-1">เลือกแปลงปลูกเป้าหมาย *</label>
            <select id="crop-plotId" name="plotId" required
              class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="" disabled ${!crop ? 'selected' : ''}>-- เลือกแปลงของสมาชิก --</option>
              ${plotsDropdown}
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="crop-cycle" class="block text-xs font-semibold text-gray-500 uppercase mb-1">รอบปลูกประจำปี *</label>
              <select id="crop-cycle" name="cropCycle" required
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="1" ${crop && String(crop.cropCycle) === '1' ? 'selected' : ''}>รอบที่ 1 (ช่วงครึ่งปีแรก)</option>
                <option value="2" ${crop && String(crop.cropCycle) === '2' ? 'selected' : ''}>รอบที่ 2 (ช่วงครึ่งปีหลัง)</option>
              </select>
            </div>

            <div>
              <label for="crop-year" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปีการเพาะปลูก (พ.ศ.) *</label>
              <input type="number" id="crop-year" name="cropYear" required min="2500" max="2600" value="${crop ? crop.cropYear : currentYear}" placeholder="เช่น 2569"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <span class="text-xs text-gray-400 mt-0.5 block">* รหัสรอบปลูกจะใช้ปี พ.ศ. ท้าย 2 หลัก ต่อด้วยลำดับ เช่น <b>6901</b></span>
            </div>

            <div>
              <label for="crop-plantDate" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่เริ่มปลูก (วัน/เดือน/ปี) *</label>
              <input type="date" id="crop-plantDate" name="plantDate" required value="${initialPlantDate}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <span class="text-xs text-gray-400 mt-0.5 block">* ระบบจะคำนวณวันใส่ปุ๋ย (+1 เดือน) และวันเก็บเกี่ยว (+3 เดือน) ให้อัตโนมัติ</span>
            </div>

            <div>
              <label for="crop-harvestDateEst" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันคาดการณ์เก็บเกี่ยว 3 เดือน (วัน/เดือน/ปี) *</label>
              <input type="date" id="crop-harvestDateEst" name="harvestDateEst" required value="${defaultHarvestEstStr}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="crop-fertDateEst" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันคาดการณ์ใส่ปุ๋ยถัดไป 1 เดือน (วัน/เดือน/ปี)</label>
              <input type="date" id="crop-fertDateEst" name="fertDateEst" value="${defaultFertEstStr}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="crop-seedlingSource" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชนิดสมุนไพรต้นกล้า *</label>
              <select id="crop-seedlingSource" name="seedlingSource" required
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="เก๊กฮวย" ${!crop || crop.seedlingSource === 'เก๊กฮวย' ? 'selected' : ''}>เก๊กฮวย</option>
                <option value="คาโมมายล์" ${crop && crop.seedlingSource === 'คาโมมายล์' ? 'selected' : ''}>คาโมมายล์</option>
              </select>
            </div>

            <div>
              <label for="crop-seedlingCount" class="block text-xs font-semibold text-gray-500 uppercase mb-1">จำนวนต้นกล้าที่ลง (ต้น) *</label>
              <input type="number" id="crop-seedlingCount" name="seedlingCount" required min="1" value="${crop ? crop.seedlingCount : ''}" placeholder="เช่น 500"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="crop-cost" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ต้นทุนเริ่มต้น/ค่ากล้าพันธุ์ (บาท) *</label>
              <input type="number" id="crop-cost" name="cost" required min="0" value="${crop ? crop.cost : ''}" placeholder="เช่น 2500"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div class="md:col-span-2">
              <label for="crop-note" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หมายเหตุ</label>
              <textarea id="crop-note" name="note" rows="2" placeholder="ระบุรายละเอียดเพิ่มเติม หรือหมายเหตุเพิ่มเติม (ถ้ามี)"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">${crop ? (crop.note || '') : ''}</textarea>
            </div>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-save"></i> ${isEdit ? 'บันทึกการแก้ไข' : 'เริ่มเพาะปลูก'}
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: isEdit ? `แก้ไขข้อมูลรอบการปลูก (${crop.id})` : 'ลงทะเบียนรอบการปลูกใหม่',
      icon: isEdit ? 'fas fa-edit' : 'fas fa-leaf',
      size: 'max-w-4xl',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-new-crop-form');
        const plantDateInput = dialog.querySelector('#crop-plantDate');
        const harvestDateInput = dialog.querySelector('#crop-harvestDateEst');
        const fertDateInput = dialog.querySelector('#crop-fertDateEst');

        // Dynamic auto-calculate on plant date change
        if (plantDateInput) {
          plantDateInput.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val) {
              const harvestVal = calcAddMonths(val, 3);
              const fertVal = calcAddMonths(val, 1);
              if (harvestDateInput) {
                if (harvestDateInput._flatpickr) {
                  harvestDateInput._flatpickr.setDate(harvestVal, true);
                } else {
                  harvestDateInput.value = harvestVal;
                }
              }
              if (fertDateInput) {
                if (fertDateInput._flatpickr) {
                  fertDateInput._flatpickr.setDate(fertVal, true);
                } else {
                  fertDateInput.value = fertVal;
                }
              }
            }
          });
        }

        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const plotId = formData.get('plotId');
            const plantDateStr = formData.get('plantDate');
            const harvestDateEstStr = formData.get('harvestDateEst');

            if (harvestDateEstStr < plantDateStr) {
              showToast('วันคาดการณ์เก็บเกี่ยวต้องไม่มาก่อนวันที่เริ่มปลูก', 'warning');
              return;
            }

            const cropYear = parseInt(formData.get('cropYear')) || (new Date(plantDateStr).getFullYear() + 543);
            const cropCycle = parseInt(formData.get('cropCycle')) || 1;

            if (!isEdit) {
              const existingCropsForPlotYear = appState.getCrops().filter(c => c.plotId === plotId && c.cropYear === cropYear);
              if (existingCropsForPlotYear.length >= 2) {
                showToast(`แปลงนี้มีรอบการปลูกครบ 2 ครั้งในปี พ.ศ. ${cropYear} แล้ว`, 'warning');
                return;
              }

              const duplicateCycle = existingCropsForPlotYear.find(c => (c.cropCycle || 1) === cropCycle);
              if (duplicateCycle) {
                showToast(`แปลงนี้มีรอบที่ ${cropCycle} ในปี พ.ศ. ${cropYear} แล้ว`, 'warning');
                return;
              }
            }

            const data = {
              plotId: plotId,
              plantDate: formData.get('plantDate'),
              harvestDateEst: formData.get('harvestDateEst'),
              fertDateEst: formData.get('fertDateEst') || null,
              cropCycle: cropCycle,
              seedlingCount: parseInt(formData.get('seedlingCount')) || 0,
              seedlingSource: formData.get('seedlingSource') ? formData.get('seedlingSource').trim() : '',
              cost: parseFloat(formData.get('cost')) || 0,
              cropYear: cropYear,
              note: formData.get('note') ? formData.get('note').trim() : ''
            };

            try {
              if (isEdit) {
                appState.updateCrop(cropId, data);
                showToast(`แก้ไขข้อมูลรอบการปลูก ${cropId} สำเร็จ`);
              } else {
                data.status = 'growing';
                const added = appState.addCrop(data);
                showToast(`เริ่มรอบการปลูกใหม่สำเร็จ (${added.id}) รอบที่ ${cropCycle}/${cropYear}`);
              }
              closeGlobalModal();
              this.refreshView();
            } catch (err) {
              showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message, 'error');
            }
          });
        }
      }
    });
  },

  openFertilizerModal(cropId) {
    const crop = appState.getCropById(cropId);
    if (!crop) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const formHtml = `
      <form id="global-fert-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 font-bold">
            รอบปลูก: ${crop.id} (${crop.seedlingSource || 'สมุนไพร'})
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label for="fert-type" class="block text-xs font-semibold text-gray-500 uppercase mb-1">กิจกรรม / ประเภทปุ๋ยที่ใส่ *</label>
              <input type="text" id="fert-type" name="type" required placeholder="เช่น ปุ๋ยหมักชีวภาพ, ฉีดพ่นน้ำสกัดสะเดา"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label for="fert-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่ใส่ (วัน/เดือน/ปี) *</label>
              <input type="date" id="fert-date" name="date" required value="${todayStr}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label for="fert-amount" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปริมาณที่ใช้ *</label>
              <input type="text" id="fert-amount" name="amount" required placeholder="เช่น 15 กิโลกรัม, 3 ลิตร"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="md:col-span-2">
              <label for="fert-cost" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ค่าใช้จ่าย / ต้นทุนการบำรุง (บาท) *</label>
              <input type="number" id="fert-cost" name="cost" required min="0" placeholder="เช่น 350"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="md:col-span-2">
              <label for="fert-note" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หมายเหตุ</label>
              <textarea id="fert-note" name="note" rows="2" placeholder="ระบุสภาพแปลง หรือข้อสังเกตเพิ่มเติม (ถ้ามี)"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>
          </div>
        </div>
        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-save"></i> บันทึกกิจกรรม
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `บันทึกกิจกรรมใส่ปุ๋ยและดูแลแปลง (${cropId})`,
      icon: 'fas fa-hand-holding-seedling',
      size: 'max-w-2xl',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-fert-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const logEntry = {
              date: formData.get('date'),
              type: formData.get('type'),
              amount: formData.get('amount'),
              cost: parseFloat(formData.get('cost')) || 0,
              note: formData.get('note') ? formData.get('note').trim() : ''
            };
            try {
              appState.addFertilizerLog(cropId, logEntry);

              // Auto-advance next fertilizing date by +1 month from current log date
              const logDate = new Date(logEntry.date || new Date());
              logDate.setMonth(logDate.getMonth() + 1);
              const nextFertStr = logDate.toISOString().split('T')[0];

              // If next fertilizing date is still before or equal to harvest date, advance it
              if (!crop.harvestDateEst || nextFertStr <= crop.harvestDateEst) {
                appState.updateCrop(cropId, { fertDateEst: nextFertStr });
              }

              closeGlobalModal();
              showToast('บันทึกประวัติการบำรุงเรียบร้อยแล้ว (กำหนดรอบถัดไป +1 เดือน)');
              this.refreshView();
            } catch (err) {
              showToast('เกิดข้อผิดพลาดในการบันทึกกิจกรรม', 'error');
            }
          });
        }
      }
    });
  },

  openHarvestModal(cropId) {
    const crop = appState.getCropById(cropId);
    if (!crop) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const formHtml = `
      <form id="global-harvest-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-900 font-bold">
            บันทึกผลผลิตสำหรับ: ${crop.id} (${crop.seedlingSource || 'สมุนไพร'})
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="harvest-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่เก็บเกี่ยวจริง (วัน/เดือน/ปี) *</label>
              <input type="date" id="harvest-date" name="harvestDateActual" required value="${todayStr}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label for="harvest-yield" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปริมาณน้ำหนักดอกสด (กิโลกรัม) *</label>
              <input type="number" id="harvest-yield" name="yield" required min="0.01" step="any" placeholder="เช่น 150.5"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="md:col-span-2">
              <label for="harvest-note" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หมายเหตุ</label>
              <textarea id="harvest-note" name="note" rows="2" placeholder="ระบุคุณภาพดอกสด สภาพความสมบูรณ์ หรือหมายเหตุเพิ่มเติม"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>
            <div class="md:col-span-2 p-3.5 bg-blue-50 text-blue-900 border border-blue-100 rounded-xl text-xs leading-relaxed">
              <i class="fas fa-info-circle mr-1 text-blue-600"></i>
              เมื่อบันทึกการเก็บเกี่ยว ระบบจะปรับเปลี่ยนสถานะของรอบการเพาะปลูกนี้เป็น "เก็บเกี่ยวเสร็จสิ้น" อัตโนมัติ
            </div>
          </div>
        </div>
        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-check"></i> บันทึกเก็บเกี่ยวสำเร็จ
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `บันทึกการเก็บเกี่ยวสมุนไพร (${cropId})`,
      icon: 'fas fa-box-open',
      size: 'max-w-2xl',
      headerColor: 'bg-amber-600',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-harvest-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
              harvestDateActual: formData.get('harvestDateActual'),
              yield: parseFloat(formData.get('yield')) || 0,
              harvestNote: formData.get('note') ? formData.get('note').trim() : '',
              status: 'harvested'
            };

            try {
              appState.updateCrop(cropId, data);
              closeGlobalModal();
              showToast('บันทึกผลผลิตการเก็บเกี่ยวและปรับสถานะรอบปลูกเรียบร้อย');
              this.refreshView();
            } catch (err) {
              showToast('เกิดข้อผิดพลาดในการบันทึกเก็บเกี่ยว: ' + err.message, 'error');
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
