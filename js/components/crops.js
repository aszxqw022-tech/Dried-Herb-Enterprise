// Crops Component for Crop Season Log, Timeline, and Traceability QR Code
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast } from '../helpers.js';

export const CropsComponent = {
  selectedCropId: null,
  statusFilter: '',

  render() {
    const crops = appState.getCrops();
    const plots = appState.getPlots();
    const members = appState.getMembers();

    // Filter crops
    const filtered = crops.filter(c => {
      return this.statusFilter ? c.status === this.statusFilter : true;
    });

    // Auto-select first crop if none is selected
    if (!this.selectedCropId && filtered.length > 0) {
      this.selectedCropId = filtered[0].id;
    }

    const selectedCrop = crops.find(c => c.id === this.selectedCropId);
    let selectedPlot = null;
    let selectedOwner = null;
    if (selectedCrop) {
      selectedPlot = plots.find(p => p.id === selectedCrop.plotId);
      if (selectedPlot) {
        selectedOwner = members.find(m => m.id === selectedPlot.memberId);
      }
    }

    // Plots options for new crop form
    const plotsDropdown = plots
      .filter(p => p.status === 'active')
      .map(p => {
        const owner = members.find(m => m.id === p.memberId);
        return `<option value="${p.id}">${p.name} - ${p.plantType} (${owner ? owner.name : '-'})</option>`;
      })
      .join('');

    // Crop Season cards/list for left panel
    const cropCardsHtml = filtered.length === 0
      ? `<div class="p-8 text-center text-sm text-gray-500">ไม่พบรอบการเพาะปลูกในระบบ</div>`
      : filtered.map(c => {
          const plot = plots.find(p => p.id === c.plotId);
          const isSelected = c.id === this.selectedCropId;
          const statusText = c.status === 'growing' ? 'กำลังเติบโต' : 'เก็บเกี่ยวแล้ว';
          const statusColor = c.status === 'growing' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-gray-100 text-gray-600 border-gray-200';

          return `
            <div data-id="${c.id}" class="crop-select-card p-4 rounded-2xl border transition-all cursor-pointer ${
              isSelected 
                ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' 
                : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
            }">
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-emerald-800">${c.id}</span>
                <span class="px-2 py-0.5 text-[10px] font-semibold border rounded-full ${statusColor}">${statusText}</span>
              </div>
              <h4 class="text-sm font-bold text-gray-800">${plot ? plot.name : 'ไม่พบแปลงปลูก'}</h4>
              <div class="flex justify-between items-center mt-3 text-xs text-gray-500">
                <span>เริ่มปลูก: ${formatThaiDate(c.plantDate)}</span>
                <span class="font-bold text-gray-700">${plot ? plot.plantType : '-'}</span>
              </div>
            </div>
          `;
        }).join('');

    // Detailed Timeline and Logs for right panel
    let detailPanelHtml = '';
    if (selectedCrop) {
      const fertilizingTimeline = (selectedCrop.fertilizingLog || []).map(f => `
        <div class="relative pl-6 pb-4 last:pb-0 border-l-2 border-dashed border-gray-200 last:border-0">
          <!-- Dot -->
          <div class="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border border-white"></div>
          
          <div class="text-xs text-gray-400 font-medium">${formatThaiDate(f.date)}</div>
          <div class="text-sm font-semibold text-gray-800 mt-0.5">${f.type}</div>
          <div class="text-xs text-gray-500 mt-0.5">ปริมาณ: ${f.amount}</div>
        </div>
      `).join('');

      const fertLogLength = selectedCrop.fertilizingLog ? selectedCrop.fertilizingLog.length : 0;
      const timelineHtml = fertLogLength === 0
        ? `<div class="text-center py-6 text-xs text-gray-400">ยังไม่มีบันทึกประวัติการใส่ปุ๋ยและบำรุงแปลง</div>`
        : `<div class="space-y-1 mt-3">${fertilizingTimeline}</div>`;

      // Harvest action box or result (Enhanced for Phase 2: Processing and QR)
      let harvestBoxHtml = '';
      if (selectedCrop.status === 'growing') {
        harvestBoxHtml = `
          <div class="p-5 bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-2xl text-white shadow-md space-y-3">
            <div class="flex items-center gap-2">
              <i class="fas fa-box text-xl text-amber-300"></i>
              <h4 class="font-bold text-sm">รอบการปลูกกำลังเติบโต</h4>
            </div>
            <p class="text-xs text-emerald-100 leading-relaxed">
              คาดว่าจะเก็บเกี่ยวผลผลิตได้ในวันที่: <b>${formatThaiDate(selectedCrop.harvestDateEst)}</b>
            </p>
            <div class="flex gap-2 pt-1.5">
              <button id="add-fert-btn" class="w-1/2 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors border border-emerald-500/30 flex items-center justify-center gap-1">
                <i class="fas fa-hand-holding-seedling"></i> ใส่ปุ๋ย/บำรุง
              </button>
              <button id="record-harvest-btn" class="w-1/2 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-lg transition-colors flex items-center justify-center gap-1 font-bold">
                <i class="fas fa-check-circle"></i> บันทึกเก็บเกี่ยว
              </button>
            </div>
          </div>
        `;
      } else {
        // Harvested - Check if dried processed
        let processingActionHtml = '';
        let qrCodeHtml = '';

        if (!selectedCrop.isProcessed) {
          processingActionHtml = `
            <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div class="text-xs font-bold text-amber-800 flex items-center gap-1">
                <i class="fas fa-fire-alt text-amber-600"></i> รอการแปรรูปอบแห้ง
              </div>
              <p class="text-[10px] text-gray-500 leading-relaxed">
                เก็บเกี่ยวดอกสดได้ <b>${selectedCrop.yield} กก.</b> รอส่งเข้าเตาอบแปรรูปเพื่อหักยอดน้ำหนักเป็นดอกแห้งเข้าสต็อก
              </p>
              <button id="dry-process-btn" data-id="${selectedCrop.id}" class="w-full mt-2 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-lg transition-colors flex items-center justify-center gap-1 font-bold">
                <i class="fas fa-arrow-right"></i> ส่งไปอบแห้งและตัดสต็อกเข้าคลัง
              </button>
            </div>
          `;
        } else {
          const ratio = selectedPlot ? (selectedPlot.plantType === 'เก๊กฮวย' ? 8 : 6) : 8;
          const dryWeight = (selectedCrop.yield / ratio).toFixed(2);
          
          // Generate real QR code image source using free public qr API
          const traceUrl = `${window.location.origin}${window.location.pathname}#trace/${selectedCrop.id}`;
          const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(traceUrl)}`;

          processingActionHtml = `
            <div class="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2 flex justify-between items-center gap-4">
              <div class="space-y-1 flex-1">
                <div class="text-xs font-bold text-green-800 flex items-center gap-1">
                  <i class="fas fa-check-circle text-green-600"></i> แปรรูปและนำเข้าคลังแล้ว
                </div>
                <p class="text-[10px] text-gray-500 leading-relaxed">
                  อบแห้งอัตราส่วน <b>${ratio}:1</b> ได้น้ำหนักสินค้าอบแห้งสำเร็จรูป:
                </p>
                <div class="text-base font-black text-green-800 mt-1">${dryWeight} กิโลกรัม</div>
              </div>
              <div class="text-center bg-white p-2 rounded-xl border border-gray-100 flex flex-col items-center">
                <img src="${qrCodeApiUrl}" alt="Traceability QR Code" class="w-20 h-20">
                <span class="text-[8px] text-gray-400 font-semibold mt-1">สแกนตรวจสอบที่มา</span>
              </div>
            </div>
          `;

          qrCodeHtml = `
            <div class="mt-4 p-4 border border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 flex flex-col items-center text-center space-y-2">
              <span class="text-xs font-bold text-emerald-800">ฉลากติดบรรจุภัณฑ์ล็อตตรวจสอบย้อนกลับ</span>
              <img src="${qrCodeApiUrl}" alt="Traceability QR Code" class="w-24 h-24 shadow-sm rounded-lg bg-white p-1">
              <button data-id="${selectedCrop.id}" class="test-trace-link-btn text-xs font-bold text-emerald-700 hover:text-emerald-950 hover:underline">
                <i class="fas fa-external-link-alt"></i> เปิดหน้าจอลูกค้าเพื่อตรวจสอบที่มา (จำลองการสแกน)
              </button>
            </div>
          `;
        }

        harvestBoxHtml = `
          <div class="space-y-4">
            <div class="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-2.5">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-wide block">สรุปข้อมูลการเก็บเกี่ยว</span>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-[10px] text-gray-400 block">วันที่เก็บเกี่ยวจริง</span>
                  <span class="text-sm font-bold text-gray-800">${formatThaiDate(selectedCrop.harvestDateActual)}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">ปริมาณผลผลิตสด</span>
                  <span class="text-lg font-black text-emerald-700">${selectedCrop.yield} <span class="text-xs text-gray-500 font-normal">กิโลกรัม</span></span>
                </div>
              </div>
            </div>
            
            ${processingActionHtml}
            ${qrCodeHtml}
          </div>
        `;
      }

      detailPanelHtml = `
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          
          <!-- Detailed Header -->
          <div class="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <span class="text-xs font-bold text-gray-400">${selectedCrop.id}</span>
              <h2 class="text-xl font-bold text-emerald-900 mt-0.5">${selectedPlot ? selectedPlot.name : '-'}</h2>
              <p class="text-xs text-gray-500 mt-1">เกษตรกรผู้ดูแล: <b>${selectedOwner ? selectedOwner.name : '-'}</b></p>
            </div>
            
            <button id="delete-crop-btn" data-id="${selectedCrop.id}" class="text-red-500 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm" title="ลบรอบการปลูกนี้">
              <i class="fas fa-trash-alt"></i> ลบรอบการปลูก
            </button>
          </div>

          <!-- Quick Statistics -->
          <div class="grid grid-cols-3 gap-4">
            <div class="p-3 bg-gray-50 rounded-2xl text-center">
              <span class="text-[10px] text-gray-400 block">สมุนไพร</span>
              <span class="text-sm font-bold text-gray-800">${selectedPlot ? selectedPlot.plantType : '-'}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-2xl text-center">
              <span class="text-[10px] text-gray-400 block">ต้นทุนเบื้องต้น</span>
              <span class="text-sm font-bold text-gray-800">${formatBaht(selectedCrop.cost)}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-2xl text-center">
              <span class="text-[10px] text-gray-400 block">ระยะเวลารอบปลูก</span>
              <span class="text-sm font-bold text-gray-800">~ 100 วัน</span>
            </div>
          </div>

          <!-- Harvest box -->
          ${harvestBoxHtml}

          <!-- Timeline Section -->
          <div>
            <div class="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 class="text-sm font-bold text-gray-700">ประวัติการดูแลและกิจกรรมแปลง</h4>
              <span class="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">ปุ๋ยชีวภาพ/อินทรีย์</span>
            </div>

            <!-- Start Planting event -->
            <div class="mt-4 pl-6 relative border-l-2 border-gray-200 pb-4">
              <div class="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-emerald-800 border border-white"></div>
              <div class="text-xs text-gray-400 font-medium">${formatThaiDate(selectedCrop.plantDate)}</div>
              <div class="text-sm font-bold text-gray-800 mt-0.5">เริ่มลงกล้าสมุนไพร</div>
              <div class="text-xs text-gray-500 mt-0.5">เตรียมดินด้วยปุ๋ยคอก บันทึกต้นทุนรอบปลูกเริ่มต้น</div>
            </div>

            <!-- Custom Fertilizer events list -->
            ${timelineHtml}

            <!-- Actual Harvest Event in timeline if harvested -->
            ${selectedCrop.status === 'harvested' ? `
              <div class="pl-6 relative border-l-2 border-gray-200 pb-4">
                <div class="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-amber-500 border border-white"></div>
                <div class="text-xs text-gray-400 font-medium">${formatThaiDate(selectedCrop.harvestDateActual)}</div>
                <div class="text-sm font-bold text-gray-800 mt-0.5">ดำเนินการเก็บเกี่ยวผลผลิตสำเร็จ</div>
                <div class="text-xs text-emerald-600 font-bold mt-0.5">ผลผลิตเก็บเกี่ยว: +${selectedCrop.yield} กิโลกรัม (น้ำหนักดอกสด)</div>
              </div>
            ` : ''}

            <!-- Drying Process event in timeline -->
            ${selectedCrop.isProcessed ? `
              <div class="pl-6 relative border-l-2 border-gray-200">
                <div class="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-green-600 border border-white"></div>
                <div class="text-xs text-gray-400 font-medium">${formatThaiDate(selectedCrop.harvestDateActual)}</div>
                <div class="text-sm font-bold text-gray-800 mt-0.5">ผ่านการอบแห้งแปรรูปและนำส่งสต็อกคลังสินค้าแล้ว</div>
                <div class="text-[10px] text-gray-500 mt-0.5">บันทึกอัตราส่วนความชื้น ดอกแห้งพร้อมสแกนตรวจสอบที่มา</div>
              </div>
            ` : ''}
          </div>

        </div>
      `;
    } else {
      detailPanelHtml = `
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full min-h-[300px]">
          <i class="fas fa-info-circle text-4xl mb-3 text-emerald-200"></i>
          <p class="text-sm">กรุณาเลือกรอบการปลูกจากเมนูด้านซ้าย หรือลงทะเบียนรอบการเพาะปลูกใหม่ในระบบ</p>
        </div>
      `;
    }

    return `
      <div class="fade-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-history text-emerald-700"></i>
              ระบบบันทึกรอบเพาะปลูก (Crop Seasons)
            </h1>
            <p class="text-sm text-gray-500 mt-1">บันทึกขั้นตอนการเจริญเติบโต ต้นทุนสะสม ประวัติการใส่ปุ๋ยบำรุง และบันทึกเก็บเกี่ยวผลผลิต</p>
          </div>
          <div>
            <button id="add-crop-season-btn" class="px-4 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-plus-circle"></i> เริ่มรอบการปลูกใหม่
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Panel: Filter & Crop Seasons List -->
          <div class="lg:col-span-1 space-y-4">
            
            <!-- Filters -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label for="crops-status-filter" class="block text-xs font-semibold text-gray-400 uppercase mb-2">ตัวกรองสถานะรอบปลูก</label>
              <select id="crops-status-filter" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">ทั้งหมด (${crops.length})</option>
                <option value="growing" ${this.statusFilter === 'growing' ? 'selected' : ''}>กำลังเติบโต (${crops.filter(c => c.status === 'growing').length})</option>
                <option value="harvested" ${this.statusFilter === 'harvested' ? 'selected' : ''}>เก็บเกี่ยวเสร็จสิ้น (${crops.filter(c => c.status === 'harvested').length})</option>
              </select>
            </div>

            <!-- List -->
            <div class="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              ${cropCardsHtml}
            </div>

          </div>

          <!-- Right Panel: Crop Detail Timeline -->
          <div class="lg:col-span-2">
            ${detailPanelHtml}
          </div>
        </div>

        <!-- Start New Season Modal -->
        <div id="new-crop-modal" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center p-4 bg-black bg-opacity-40 transition-opacity">
          <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100">
            <!-- Modal Header -->
            <div class="bg-emerald-800 px-6 py-4 text-white flex justify-between items-center">
              <h3 class="font-bold text-lg flex items-center gap-2">
                <i class="fas fa-leaf"></i> ลงทะเบียนรอบการปลูกใหม่
              </h3>
              <button type="button" class="close-crop-modal-btn text-white opacity-80 hover:opacity-100 text-xl focus:outline-none">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- Modal Body Form -->
            <form id="new-crop-form" class="p-6 space-y-4">
              <!-- Plot Select -->
              <div>
                <label for="crop-plotId" class="block text-xs font-semibold text-gray-500 uppercase mb-1">เลือกแปลงปลูกเป้าหมาย *</label>
                <select id="crop-plotId" name="plotId" required
                  class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="" disabled selected>-- เลือกแปลงของสมาชิก --</option>
                  ${plotsDropdown}
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Plant Date -->
                <div>
                  <label for="crop-plantDate" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่เริ่มปลูก *</label>
                  <input type="date" id="crop-plantDate" name="plantDate" required
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>

                <!-- Cost -->
                <div>
                  <label for="crop-cost" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ต้นทุนเริ่มต้น (บาท) *</label>
                  <input type="number" id="crop-cost" name="cost" required min="0" placeholder="เช่น 2500"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
              </div>

              <!-- Footer Buttons -->
              <div class="flex justify-end pt-4 gap-2.5">
                <button type="button" class="close-crop-modal-btn px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm">
                  <i class="fas fa-plus"></i> เริ่มเพาะปลูก
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Add Fertilizer Log Modal -->
        <div id="fert-modal" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center p-4 bg-black bg-opacity-40 transition-opacity">
          <div class="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100">
            <!-- Modal Header -->
            <div class="bg-emerald-800 px-6 py-4 text-white flex justify-between items-center">
              <h3 class="font-bold text-sm flex items-center gap-1.5">
                <i class="fas fa-hand-holding-seedling"></i> บันทึกกิจกรรมใส่ปุ๋ยและดูแลแปลง
              </h3>
              <button type="button" class="close-fert-modal-btn text-white opacity-80 hover:opacity-100 text-xl focus:outline-none">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- Modal Body Form -->
            <form id="fert-form" class="p-6 space-y-4">
              <!-- Fertilizer Type -->
              <div>
                <label for="fert-type" class="block text-xs font-semibold text-gray-500 uppercase mb-1">กิจกรรม / ประเภทปุ๋ยที่ใส่ *</label>
                <input type="text" id="fert-type" name="type" required placeholder="เช่น ปุ๋ยหมักชีวภาพ, ฉีดพ่นน้ำสะเดา"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Date -->
                <div>
                  <label for="fert-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่ใส่ *</label>
                  <input type="date" id="fert-date" name="date" required
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>

                <!-- Amount -->
                <div>
                  <label for="fert-amount" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปริมาณที่ใช้ *</label>
                  <input type="text" id="fert-amount" name="amount" required placeholder="เช่น 15 กิโลกรัม, 3 ลิตร"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
              </div>

              <!-- Footer Buttons -->
              <div class="flex justify-end pt-4 gap-2.5">
                <button type="button" class="close-fert-modal-btn px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm">
                  <i class="fas fa-save"></i> บันทึกกิจกรรม
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Record Harvest Modal -->
        <div id="harvest-modal" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center p-4 bg-black bg-opacity-40 transition-opacity">
          <div class="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100">
            <!-- Modal Header -->
            <div class="bg-emerald-800 px-6 py-4 text-white flex justify-between items-center">
              <h3 class="font-bold text-sm flex items-center gap-1.5">
                <i class="fas fa-box-open"></i> บันทึกการเก็บเกี่ยวสมุนไพร
              </h3>
              <button type="button" class="close-harvest-modal-btn text-white opacity-80 hover:opacity-100 text-xl focus:outline-none">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- Modal Body Form -->
            <form id="harvest-form" class="p-6 space-y-4">
              <!-- Actual Harvest Date -->
              <div>
                <label for="harvest-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่เก็บเกี่ยวจริง *</label>
                <input type="date" id="harvest-date" name="harvestDateActual" required
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Yield Amount -->
              <div>
                <label for="harvest-yield" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปริมาณน้ำหนักดอกสด (กิโลกรัม) *</label>
                <input type="number" id="harvest-yield" name="yield" required min="0" step="any" placeholder="เช่น 150.5"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Info hint -->
              <div class="p-3 bg-blue-50 text-blue-900 border border-blue-100 rounded-xl text-[10px] leading-relaxed">
                <i class="fas fa-info-circle mr-1 text-blue-600"></i>
                เมื่อบันทึกการเก็บเกี่ยว ระบบจะปรับเปลี่ยนสถานะของรอบการเพาะปลูกนี้เป็น "เก็บเกี่ยวเสร็จสิ้น" อัตโนมัติ
              </div>

              <!-- Footer Buttons -->
              <div class="flex justify-end pt-4 gap-2.5">
                <button type="button" class="close-harvest-modal-btn px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm font-bold">
                  <i class="fas fa-check"></i> บันทึกเก็บเกี่ยวสำเร็จ
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  },

  init() {
    this.bindFilter();
    this.bindSelection();
    this.bindModals();
    this.bindOperations();
    this.bindPhase2Actions();
  },

  bindFilter() {
    const filter = document.getElementById('crops-status-filter');
    if (filter) {
      filter.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        const crops = appState.getCrops();
        const filtered = crops.filter(c => this.statusFilter ? c.status === this.statusFilter : true);
        if (filtered.length > 0) {
          this.selectedCropId = filtered[0].id;
        } else {
          this.selectedCropId = null;
        }
        this.refreshView();
      });
    }
  },

  bindSelection() {
    const cards = document.querySelectorAll('.crop-select-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        this.selectedCropId = id;
        this.refreshView();
      });
    });
  },

  bindModals() {
    // New Crop Modal
    const modalNew = document.getElementById('new-crop-modal');
    const openNewBtn = document.getElementById('add-crop-season-btn');
    const closeNewBtns = document.querySelectorAll('.close-crop-modal-btn');
    const formNew = document.getElementById('new-crop-form');

    if (openNewBtn && modalNew) {
      openNewBtn.addEventListener('click', () => {
        if (formNew) {
          formNew.reset();
          document.getElementById('crop-plantDate').value = new Date().toISOString().split('T')[0];
        }
        modalNew.classList.remove('hidden');
      });
    }

    closeNewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (modalNew) modalNew.classList.add('hidden');
      });
    });

    if (formNew) {
      formNew.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formNew);
        const data = {
          plotId: formData.get('plotId'),
          plantDate: formData.get('plantDate'),
          cost: parseFloat(formData.get('cost')) || 0,
          status: 'growing'
        };

        try {
          const added = appState.addCrop(data);
          this.selectedCropId = added.id;
          if (modalNew) modalNew.classList.add('hidden');
          showToast(`เริ่มรอบการปลูกใหม่สำเร็จ (${added.id})`);
          this.refreshView();
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการลงทะเบียน', 'error');
        }
      });
    }

    // Fertilizer Modal
    const modalFert = document.getElementById('fert-modal');
    const openFertBtn = document.getElementById('add-fert-btn');
    const closeFertBtns = document.querySelectorAll('.close-fert-modal-btn');
    const formFert = document.getElementById('fert-form');

    if (openFertBtn && modalFert) {
      openFertBtn.addEventListener('click', () => {
        if (formFert) {
          formFert.reset();
          document.getElementById('fert-date').value = new Date().toISOString().split('T')[0];
        }
        modalFert.classList.remove('hidden');
      });
    }

    closeFertBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (modalFert) modalFert.classList.add('hidden');
      });
    });

    if (formFert) {
      formFert.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formFert);
        const logEntry = {
          date: formData.get('date'),
          type: formData.get('type'),
          amount: formData.get('amount')
        };

        if (this.selectedCropId) {
          try {
            appState.addFertilizerLog(this.selectedCropId, logEntry);
            if (modalFert) modalFert.classList.add('hidden');
            showToast('บันทึกประวัติการบำรุงเรียบร้อย');
            this.refreshView();
          } catch (err) {
            showToast('เกิดข้อผิดพลาดในการบันทึกกิจกรรม', 'error');
          }
        }
      });
    }

    // Harvest Modal
    const modalHarvest = document.getElementById('harvest-modal');
    const openHarvestBtn = document.getElementById('record-harvest-btn');
    const closeHarvestBtns = document.querySelectorAll('.close-harvest-modal-btn');
    const formHarvest = document.getElementById('harvest-form');

    if (openHarvestBtn && modalHarvest) {
      openHarvestBtn.addEventListener('click', () => {
        if (formHarvest) {
          formHarvest.reset();
          document.getElementById('harvest-date').value = new Date().toISOString().split('T')[0];
        }
        modalHarvest.classList.remove('hidden');
      });
    }

    closeHarvestBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (modalHarvest) modalHarvest.classList.add('hidden');
      });
    });

    if (formHarvest) {
      formHarvest.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formHarvest);
        const data = {
          harvestDateActual: formData.get('harvestDateActual'),
          yield: parseFloat(formData.get('yield')) || 0,
          status: 'harvested'
        };

        if (this.selectedCropId) {
          try {
            appState.updateCrop(this.selectedCropId, data);
            if (modalHarvest) modalHarvest.classList.add('hidden');
            showToast('บันทึกผลผลิตการเก็บเกี่ยวและปรับสถานะรอบปลูกเรียบร้อย');
            this.refreshView();
          } catch (err) {
            showToast('เกิดข้อผิดพลาด', 'error');
          }
        }
      });
    }
  },

  bindOperations() {
    const deleteBtn = document.getElementById('delete-crop-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const id = deleteBtn.getAttribute('data-id');
        if (confirm(`คุณต้องการลบข้อมูลรอบเพาะปลูกรหัส "${id}" ใช่หรือไม่?`)) {
          try {
            appState.deleteCrop(id);
            showToast(`ลบรอบการปลูก ${id} สำเร็จ`);
            this.selectedCropId = null;
            this.refreshView();
          } catch (err) {
            showToast('ไม่สามารถลบรายการได้', 'error');
          }
        }
      });
    }
  },

  bindPhase2Actions() {
    // 1. Process to dry stock action
    const dryBtn = document.getElementById('dry-process-btn');
    if (dryBtn) {
      dryBtn.addEventListener('click', () => {
        const id = dryBtn.getAttribute('data-id');
        const crop = appState.getCropById(id);
        
        if (crop) {
          try {
            const dryWeight = appState.processDryHerbStock(id, crop.yield);
            showToast(`แปรรูปอบแห้งสำเร็จ! นำเข้าคลังสินค้าแล้วจำนวน ${dryWeight} กก. (หักตามอัตราส่วนความชื้น)`);
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    }

    // 2. Test trace link simulation (open consumer trace view)
    const traceBtn = document.querySelector('.test-trace-link-btn');
    if (traceBtn) {
      traceBtn.addEventListener('click', () => {
        const id = traceBtn.getAttribute('data-id');
        window.location.hash = `#trace/${id}`; // Trigger routing update
      });
    }
  },

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init(); // rebind events
    }
  }
};
