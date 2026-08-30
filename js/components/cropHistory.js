// Crop History Component (Completed Seasons & Traceability Logs)
import { appState } from '../state.js';
import { formatThaiDate, formatBaht } from '../helpers.js';

export const CropHistoryComponent = {
  searchQuery: '',
  yearFilter: '',
  selectedCropId: null,

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    let plots = appState.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const plotIds = plots.map(p => p.id);
    let crops = appState.getCrops().filter(c => plotIds.includes(c.plotId) && c.status === 'harvested');
    const members = appState.getMembers();

    // Extract available crop years for filter dropdown
    const availableYears = [...new Set(crops.map(c => c.cropYear).filter(Boolean))].sort((a, b) => b - a);

    // Apply Search and Year Filter
    let filteredCrops = crops.filter(c => {
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

      const matchesYear = !this.yearFilter || String(c.cropYear) === String(this.yearFilter);

      return matchesSearch && matchesYear;
    });

    // Table rows HTML
    const tableRowsHtml = filteredCrops.length === 0
      ? `<tr><td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500">ไม่พบประวัติการปลูกที่เก็บเกี่ยวเสร็จสิ้นตามเงื่อนไขที่ระบุ</td></tr>`
      : filteredCrops.map(c => {
          const plot = plots.find(p => p.id === c.plotId);
          const owners = plot ? members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : [];
          const ownersNames = owners.map(o => o.name).join(', ') || '-';
          const herbType = c.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';
          const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');

          const totalCost = (parseFloat(c.cost) || 0) + (c.fertilizingLog || []).reduce((sum, f) => sum + (parseFloat(f.cost) || 0), 0);

          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-4">
                <span class="text-sm font-extrabold text-emerald-800">${c.id}</span>
                <span class="block text-[10px] text-gray-400">ปี ${c.cropYear || '-'} (รอบที่ ${c.cropCycle || 1})</span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-gray-800">${plot ? plot.name : 'ไม่พบแปลงปลูก'}</div>
                <div class="text-xs text-gray-500">เจ้าของ: ${ownersNames}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                  isChrys ? 'badge-chrysanthemum text-amber-800 bg-amber-100' : 'badge-chamomile text-sky-800 bg-sky-100'
                }">
                  ${herbType}
                </span>
              </td>
              <td class="px-6 py-4 text-xs text-gray-600">
                <div>เริ่ม: <b>${formatThaiDate(c.plantDate)}</b></div>
                <div>เก็บเกี่ยว: <b>${formatThaiDate(c.harvestDateActual)}</b></div>
              </td>
              <td class="px-6 py-4 text-sm font-black text-amber-900">
                ${(c.yield || 0).toFixed(2)} <span class="text-xs font-semibold text-amber-700">กก.สด</span>
                ${c.isProcessed ? `<span class="block text-[10px] text-emerald-700 font-bold"><i class="fas fa-check-circle mr-0.5"></i>อบแห้งเข้าคลังแล้ว</span>` : `<span class="block text-[10px] text-amber-600 font-semibold"><i class="fas fa-clock mr-0.5"></i>รออบแห้ง</span>`}
              </td>
              <td class="px-6 py-4 text-sm font-bold text-emerald-800">
                ${formatBaht(totalCost)}
                <span class="block text-[10px] text-gray-400">บำรุง ${c.fertilizingLog ? c.fertilizingLog.length : 0} ครั้ง</span>
              </td>
              <td class="px-6 py-4 text-center">
                <button data-crop-id="${c.id}" class="view-history-detail-btn px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-sm flex items-center gap-1 mx-auto">
                  <i class="fas fa-eye"></i> ดูรายละเอียด
                </button>
              </td>
            </tr>
          `;
        }).join('');

    // Modal Details Content
    let modalDetailHtml = '';
    if (this.selectedCropId) {
      const selectedCrop = crops.find(c => c.id === this.selectedCropId);
      if (selectedCrop) {
        const plot = plots.find(p => p.id === selectedCrop.plotId);
        const owners = plot ? members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : [];
        const ownersNames = owners.map(o => o.name).join(', ') || '-';
        const herbType = selectedCrop.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';
        const totalCost = (parseFloat(selectedCrop.cost) || 0) + (selectedCrop.fertilizingLog || []).reduce((sum, f) => sum + (parseFloat(f.cost) || 0), 0);

        const logsHtml = (selectedCrop.fertilizingLog || []).length === 0
          ? `<div class="text-center py-4 text-xs text-gray-400">ไม่มีบันทึกประวัติการใส่ปุ๋ยและดูแล</div>`
          : (selectedCrop.fertilizingLog || []).map(f => `
              <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs">
                <div class="flex justify-between font-bold text-gray-700">
                  <span>${f.type}</span>
                  <span class="text-emerald-700">${formatBaht(f.cost || 0)}</span>
                </div>
                <div class="flex justify-between text-gray-500 text-[11px]">
                  <span>วันที่: ${formatThaiDate(f.date)}</span>
                  <span>ปริมาณ: ${f.amount}</span>
                </div>
                ${f.note ? `<div class="text-[10px] text-amber-700 mt-1"><i class="far fa-sticky-note mr-1"></i>${f.note}</div>` : ''}
              </div>
            `).join('');

        const traceUrl = `${window.location.origin}${window.location.pathname}#trace/${selectedCrop.id}`;
        const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(traceUrl)}`;

        modalDetailHtml = `
          <div id="history-modal" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black bg-opacity-40 transition-opacity">
            <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-slide-in">
              <!-- Modal Header -->
              <div class="bg-[#1e4620] px-6 py-4 text-white flex justify-between items-center">
                <h3 class="font-bold text-sm flex items-center gap-1.5">
                  <i class="fas fa-clock-rotate-left"></i> ประวัติและบันทึกย้อนหลัง ${selectedCrop.id}
                </h3>
                <button type="button" class="close-history-modal-btn text-white opacity-80 hover:opacity-100 text-xl focus:outline-none">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              
              <!-- Modal Body -->
              <div class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <span class="text-xs font-bold text-gray-400">ปีเพาะปลูก พ.ศ. ${selectedCrop.cropYear || '-'} (รอบที่ ${selectedCrop.cropCycle || 1})</span>
                    <h4 class="text-lg font-bold text-emerald-900 mt-0.5">${plot ? plot.name : '-'}</h4>
                    <p class="text-xs text-gray-500 mt-0.5">เจ้าของแปลง: <b>${ownersNames}</b></p>
                  </div>
                  <span class="px-2.5 py-1 text-xs font-bold bg-green-100 text-green-800 rounded-full">
                    เก็บเกี่ยวแล้ว
                  </span>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-3 gap-3 text-center">
                  <div class="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                    <span class="text-[10px] text-amber-700 font-bold block">ผลผลิตสดที่ได้</span>
                    <span class="text-base font-black text-amber-900">${(selectedCrop.yield || 0).toFixed(2)} กก.</span>
                  </div>
                  <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span class="text-[10px] text-emerald-700 font-bold block">จำนวนต้นกล้า</span>
                    <span class="text-base font-black text-emerald-900">${selectedCrop.seedlingCount || 0} ต้น</span>
                  </div>
                  <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span class="text-[10px] text-gray-500 font-bold block">ต้นทุนสะสมรวม</span>
                    <span class="text-base font-black text-emerald-800">${formatBaht(totalCost)}</span>
                  </div>
                </div>

                <!-- Planting Dates -->
                <div class="p-4 bg-gray-50 rounded-2xl text-xs space-y-1.5 border border-gray-100">
                  <div class="flex justify-between text-gray-600">
                    <span>วันที่ลงต้นกล้าเริ่มปลูก:</span>
                    <span class="font-bold text-gray-800">${formatThaiDate(selectedCrop.plantDate)}</span>
                  </div>
                  <div class="flex justify-between text-gray-600">
                    <span>วันที่เก็บเกี่ยวผลผลิตจริง:</span>
                    <span class="font-bold text-gray-800">${formatThaiDate(selectedCrop.harvestDateActual)}</span>
                  </div>
                  ${selectedCrop.note ? `<div class="pt-1.5 border-t border-gray-200 text-gray-500">หมายเหตุรอบปลูก: ${selectedCrop.note}</div>` : ''}
                  ${selectedCrop.harvestNote ? `<div class="text-emerald-700">หมายเหตุเก็บเกี่ยว: ${selectedCrop.harvestNote}</div>` : ''}
                </div>

                <!-- Fertilizing & Care Logs -->
                <div class="space-y-2">
                  <span class="text-xs font-bold text-gray-700 block">ประวัติการใส่ปุ๋ยและการบำรุง (${(selectedCrop.fertilizingLog || []).length} รายการ)</span>
                  <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
                    ${logsHtml}
                  </div>
                </div>

                <!-- Traceability Section -->
                <div class="p-4 border border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 flex items-center justify-between gap-4">
                  <div class="space-y-1 flex-1">
                    <span class="text-xs font-bold text-emerald-800 block">รหัสตรวจสอบย้อนกลับ (Traceability)</span>
                    <p class="text-[10px] text-gray-500">สามารถใช้ QR Code เพื่อให้ผู้บริโภคสแกนตรวจที่มาผลผลิต</p>
                    <button data-id="${selectedCrop.id}" class="test-trace-btn text-xs font-bold text-emerald-700 hover:text-emerald-950 underline pt-1 block">
                      <i class="fas fa-external-link-alt"></i> เปิดหน้าจอตรวจสอบย้อนกลับ
                    </button>
                  </div>
                  <img src="${qrCodeApiUrl}" alt="QR" class="w-16 h-16 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                </div>

                <div class="pt-2 text-right">
                  <button type="button" class="close-history-modal-btn px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }

    return `
      <div class="fade-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-emerald-700"></i>
              ประวัติการปลูก
            </h1>
            <p class="text-sm text-gray-500 mt-1">รวบรวมข้อมูลรอบการเพาะปลูกที่เก็บเกี่ยวเสร็จสิ้นทั้งหมด เพื่อใช้ในการวิเคราะห์และตรวจสอบย้อนกลับ</p>
          </div>
        </div>

        <!-- Controls: Search & Filters -->
        <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Search box -->
          <div class="relative flex-1 max-w-md">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search text-xs"></i>
            </span>
            <input type="text" id="history-search-input" value="${this.searchQuery}" placeholder="ค้นหาชื่อแปลง, สมาชิก หรือชนิดสมุนไพร..." 
              class="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>

          <!-- Year filter -->
          <div class="flex items-center gap-2">
            <label for="history-year-filter" class="text-xs font-bold text-gray-500 whitespace-nowrap">ปีการปลูก:</label>
            <select id="history-year-filter" class="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">ทุกปีการปลูก</option>
              ${availableYears.map(y => `<option value="${y}" ${String(this.yearFilter) === String(y) ? 'selected' : ''}>พ.ศ. ${y}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                  <th class="px-6 py-3.5">รหัสรอบ</th>
                  <th class="px-6 py-3.5">แปลงปลูก / เกษตรกร</th>
                  <th class="px-6 py-3.5">ชนิดสมุนไพร</th>
                  <th class="px-6 py-3.5">ระยะเวลาปลูก</th>
                  <th class="px-6 py-3.5">ผลผลิตสดที่ได้</th>
                  <th class="px-6 py-3.5">ต้นทุนสะสมรวม</th>
                  <th class="px-6 py-3.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        ${modalDetailHtml}
      </div>
    `;
  },

  init() {
    // 1. Search input event
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }

    // 2. Year filter event
    const yearSelect = document.getElementById('history-year-filter');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.yearFilter = e.target.value;
        this.refreshView();
      });
    }

    // 3. View detail modal buttons
    const detailBtns = document.querySelectorAll('.view-history-detail-btn');
    detailBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCropId = btn.getAttribute('data-crop-id');
        this.refreshView();
      });
    });

    // 4. Close modal buttons
    const closeBtns = document.querySelectorAll('.close-history-modal-btn');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCropId = null;
        this.refreshView();
      });
    });

    // 5. Test trace link btn inside modal
    const testTraceBtn = document.querySelector('.test-trace-btn');
    if (testTraceBtn) {
      testTraceBtn.addEventListener('click', () => {
        const id = testTraceBtn.getAttribute('data-id');
        this.selectedCropId = null;
        window.location.hash = `#trace/${id}`;
      });
    }
  },

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init();
    }
  }
};
