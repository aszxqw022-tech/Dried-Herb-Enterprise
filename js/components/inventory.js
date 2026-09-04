// Inventory and Cost-Profit Ledger Component
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const InventoryComponent = {
  activeTab: 'fresh', // 'fresh' | 'stock' | 'ledger' | 'sales'
  searchMemberQuery: '',
  sellingCropId: null,
  selectedFreshCropIds: [],

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    const stats = appState.getStats();
    
    let plots = appState.getPlots();
    let crops = appState.getCrops();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
      const plotIds = plots.map(p => p.id);
      crops = crops.filter(c => plotIds.includes(c.plotId));
    }
    const cropIds = crops.map(c => c.id);
    
    const inventory = appState.getInventory().filter(i => cropIds.includes(i.cropId));
    const members = appState.getMembers();
    const sales = appState.getSales().filter(s => cropIds.includes(s.cropId));
    const financialReport = appState.getFinancialReport();

    // 1. Filtered report for members tab
    let filteredReport = financialReport.filter(r => 
      r.name.toLowerCase().includes(this.searchMemberQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(this.searchMemberQuery.toLowerCase())
    );
    if (isMember) {
      filteredReport = filteredReport.filter(r => r.id === currentUser.memberId);
    }

    // 2. Build Inventory Stock Tab HTML (Per-Lot Cards)
    const activeInventoryLots = inventory.filter(inv => inv.dryStockKg > 0);
    const stockTabHtml = activeInventoryLots.length === 0
      ? `<div class="p-8 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">ไม่มีสินค้าอบแห้งคงเหลือในคลังในขณะนี้</div>`
      : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${activeInventoryLots.map(inv => {
            const crop = appState.getCropById(inv.cropId);
            const plot = crop ? appState.getPlotById(crop.plotId) : null;
            const owners = plot ? members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : [];
            const ownersNames = owners.map(o => o.name).join(', ') || '-';
            const herbType = inv.herbType || (crop ? crop.seedlingSource : 'สมุนไพร');
            const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');
            
            return `
              <div class="glass-card bg-white rounded-3xl p-5 border border-gray-100 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all">
                <div>
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-xs font-bold text-gray-400">ล็อต: ${inv.cropId}</span>
                      <button data-crop-id="${inv.cropId}" class="edit-lot-weights-btn text-emerald-600 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors text-[10px] font-bold flex items-center gap-0.5 border border-emerald-100 shadow-sm" title="แก้ไขข้อมูลน้ำหนักสด/แห้ง">
                        <i class="fas fa-weight-hanging"></i> แก้ไขน้ำหนัก
                      </button>
                    </div>
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                      isChrys ? 'badge-chrysanthemum text-amber-800 bg-amber-100' : 'badge-chamomile text-sky-800 bg-sky-100'
                    }">
                      ${herbType}อบแห้ง
                    </span>
                  </div>
                  <h4 class="text-base font-bold text-gray-800">${plot ? plot.name : 'ไม่พบแปลงปลูก'}</h4>
                  <p class="text-xs text-gray-500 mt-1">เกษตรกรเจ้าของ: <b>${ownersNames}</b></p>
                  
                  <div class="mt-4 p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100">
                    <span class="text-xs text-gray-500 font-medium">สต็อกคงเหลือล็อตนี้:</span>
                    <span class="text-2xl font-black text-emerald-800">${inv.dryStockKg.toFixed(2)} <span class="text-xs font-bold text-gray-400">กก.</span></span>
                  </div>
                  <div class="text-[10px] text-gray-400 mt-2 text-right">
                    อบแห้งเสร็จเมื่อ: ${formatThaiDate(inv.processedDate)}
                  </div>
                </div>

                <div class="pt-2">
                  <button data-crop-id="${inv.cropId}" class="sell-stock-btn w-full py-2.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 font-bold">
                    <i class="fas fa-shopping-cart"></i> บันทึกการขาย
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

    // 3. Build Finance Ledger Tab HTML
    const ledgerRowsHtml = filteredReport.length === 0
      ? `<tr><td colspan="7" class="px-6 py-6 text-center text-sm text-gray-500">ไม่พบรายงานการเงินของสมาชิกรายที่ระบุ</td></tr>`
      : filteredReport.map(r => {
          const statusBadge = r.netProfit > 0 
            ? `<span class="px-2.5 py-1 text-xs font-bold bg-green-50 text-green-700 rounded-full border border-green-200"><i class="fas fa-arrow-up mr-0.5"></i> กำไร</span>`
            : r.netProfit < 0
              ? `<span class="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 rounded-full border border-red-200"><i class="fas fa-arrow-down mr-0.5"></i> ขาดทุน</span>`
              : `<span class="px-2.5 py-1 text-xs font-bold bg-gray-50 text-gray-600 rounded-full border border-gray-200">เท่าทุน</span>`;
          
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-4 text-sm font-semibold text-emerald-800">${r.id}</td>
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-gray-900">${r.name}</div>
                <div class="text-[10px] text-gray-400">บทบาท: ${r.role} (${r.villageNumber})</div>
              </td>
              <td class="px-6 py-4 text-center text-sm text-gray-700 font-medium">${r.totalCrops} รอบ</td>
              <td class="px-6 py-4 text-sm text-gray-600 font-medium">${formatBaht(r.totalCost)}</td>
              <td class="px-6 py-4 text-sm text-emerald-800 font-bold">${formatBaht(r.totalRevenue)}</td>
              <td class="px-6 py-4 text-sm font-extrabold ${r.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}">
                ${r.netProfit > 0 ? '+' : ''}${formatBaht(r.netProfit)}
              </td>
              <td class="px-6 py-4 text-center">${statusBadge}</td>
            </tr>
          `;
        }).join('');

    const ledgerTabHtml = `
      <div class="space-y-4">
        <!-- Search and filters -->
        <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="relative flex-1 max-w-md">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search text-xs"></i>
            </span>
            <input type="text" id="member-ledger-search" value="${this.searchMemberQuery}" placeholder="ค้นหาชื่อสมาชิกหรือรหัสทะเบียน..." 
              class="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>
          <div class="text-xs text-gray-400">
            * สรุปยอดสะสมคำนวณจาก (รายได้จากการขายสมุนไพรอบแห้งของล็อตสมาชิก) - (ต้นทุนสะสมรอบการเพาะปลูก)
          </div>
        </div>

        <!-- Table Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                  <th class="px-6 py-4">รหัสสมาชิก</th>
                  <th class="px-6 py-4">ชื่อ - นามสกุล</th>
                  <th class="px-6 py-4 text-center">จำนวนรอบปลูก</th>
                  <th class="px-6 py-4">ต้นทุนสะสม</th>
                  <th class="px-6 py-4">รายได้สะสม</th>
                  <th class="px-6 py-4">กำไรสุทธิสะสม</th>
                  <th class="px-6 py-4 text-center">สถานะการเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${ledgerRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // 4. Build Sales Log Tab HTML
    const salesRowsHtml = sales.length === 0
      ? `<tr><td colspan="8" class="px-6 py-6 text-center text-sm text-gray-500">ยังไม่พบข้อมูลการจำหน่ายผลผลิตในระบบ</td></tr>`
      : sales.map(s => {
          const crop = appState.getCropById(s.cropId);
          const plot = crop ? appState.getPlotById(crop.plotId) : null;
          const owners = plot ? members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : [];
          const ownersNames = owners.map(o => o.name).join(', ') || '-';
          const herbType = crop ? (crop.seedlingSource || (plot ? plot.plantType : '-') || '-') : '-';
          const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');
          
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-3.5 text-sm font-semibold text-emerald-800">${s.id}</td>
              <td class="px-6 py-3.5 text-sm font-medium text-emerald-900">${s.cropId}</td>
              <td class="px-6 py-3.5 text-sm text-gray-800">${ownersNames}</td>
              <td class="px-6 py-3.5">
                <span class="px-2.5 py-0.5 text-[10px] font-semibold border rounded-full ${
                  isChrys ? 'badge-chrysanthemum' : 'badge-chamomile'
                }">${herbType}อบแห้ง</span>
              </td>
              <td class="px-6 py-3.5 text-sm text-gray-700 font-bold text-center">
                ${s.saleType === 'jar' ? `${s.amount || s.amountKg} กระปุก` : `${s.amountKg || s.amount} กก.`}
              </td>
              <td class="px-6 py-3.5 text-sm text-gray-500">
                ${s.saleType === 'jar' ? `${formatBaht(s.price || s.pricePerKg)}/กระปุก` : `${formatBaht(s.pricePerKg || s.price)}/กก.`}
              </td>
              <td class="px-6 py-3.5 text-sm font-black text-emerald-800">${formatBaht(s.totalPrice)}</td>
              <td class="px-6 py-3.5 text-sm text-gray-800">
                <div class="font-bold truncate max-w-[150px]" title="${s.customer}">${s.customer}</div>
                ${s.customerId ? `<span class="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">${s.customerId}</span>` : ''}
              </td>
              <td class="px-6 py-3.5 text-xs text-gray-400">${formatThaiDate(s.date)}</td>
              <td class="px-6 py-3.5 text-center">
                <button class="view-sale-btn text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto" data-sale-id="${s.id}">
                  <i class="fas fa-eye text-[10px]"></i> ใบเสร็จ
                </button>
              </td>
            </tr>
          `;
        }).join('');

    const salesTabHtml = `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 class="font-bold text-gray-800 text-sm">ประวัติการจำหน่ายสมุนไพรอบแห้ง</h3>
          <span class="text-xs text-gray-400">ธุรกรรมการตัดสต็อกคลังสินค้าทั้งหมด</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                <th class="px-6 py-3.5">รหัสรายการ</th>
                <th class="px-6 py-3.5">ล็อตผลผลิต (Crop)</th>
                <th class="px-6 py-3.5">เกษตรกรเจ้าของ</th>
                <th class="px-6 py-3.5">ประเภทพืช</th>
                <th class="px-6 py-3.5 text-center">จำนวนขาย</th>
                <th class="px-6 py-3.5">ราคาต่อหน่วย</th>
                <th class="px-6 py-3.5">ยอดรวมเงิน</th>
                <th class="px-6 py-3.5">ผู้ซื้อ / ช่องทาง</th>
                <th class="px-6 py-3.5">วันที่จำหน่าย</th>
                <th class="px-6 py-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${salesRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 1. Unprocessed fresh harvested crops
    const unprocessedCrops = crops.filter(c => c.status === 'harvested' && !c.isProcessed);

    // Build Fresh Harvested Tab HTML
    const freshTabHtml = unprocessedCrops.length === 0
      ? `<div class="p-8 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">ยังไม่มีผลผลิตดอกสดที่รอเข้าอบแห้งในขณะนี้</div>`
      : `
        <div class="space-y-4">
          <!-- Top Control Header for Batch Dry Process -->
          <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <input type="checkbox" id="select-all-fresh-checkbox" ${this.selectedFreshCropIds.length === unprocessedCrops.length && unprocessedCrops.length > 0 ? 'checked' : ''} 
                class="rounded text-amber-600 focus:ring-amber-500 border-gray-300 w-4 h-4 cursor-pointer">
              <label for="select-all-fresh-checkbox" class="text-xs font-bold text-gray-700 cursor-pointer">
                เลือกทั้งหมด (${this.selectedFreshCropIds.length}/${unprocessedCrops.length} แปลง)
              </label>
            </div>

            <button id="batch-dry-process-btn" ${this.selectedFreshCropIds.length === 0 ? 'disabled' : ''} 
              class="px-4 py-2.5 text-xs font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-400 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-fire-alt"></i> บันทึกอบแห้งพร้อมกัน (${this.selectedFreshCropIds.length} แปลง)
            </button>
          </div>

          <!-- Fresh Crop Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${unprocessedCrops.map(c => {
              const plot = appState.getPlotById(c.plotId);
              const owners = plot ? members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : [];
              const ownersNames = owners.map(o => o.name).join(', ') || '-';
              const herbType = c.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';
              const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');
              const isChecked = this.selectedFreshCropIds.includes(c.id);

              return `
                <div class="glass-card bg-white rounded-3xl p-5 border border-amber-200/70 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all">
                  <div>
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex items-center gap-2">
                        <input type="checkbox" data-crop-id="${c.id}" ${isChecked ? 'checked' : ''} 
                          class="fresh-batch-checkbox rounded text-amber-600 focus:ring-amber-500 border-gray-300 w-4 h-4 cursor-pointer">
                        <span class="text-xs font-bold text-gray-400">ล็อต: ${c.id}</span>
                      </div>
                      <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                        isChrys ? 'badge-chrysanthemum text-amber-800 bg-amber-100' : 'badge-chamomile text-sky-800 bg-sky-100'
                      }">
                        ${herbType} (ดอกสด)
                      </span>
                    </div>
                    <h4 class="text-base font-bold text-gray-800 pl-6">${plot ? plot.name : 'ไม่พบแปลงปลูก'}</h4>
                    <p class="text-xs text-gray-500 mt-1 pl-6">เกษตรกรเจ้าของ: <b>${ownersNames}</b></p>
                    
                    <div class="mt-4 p-4 bg-amber-50/70 rounded-2xl border border-amber-100 flex justify-between items-center">
                      <div>
                        <span class="text-[10px] text-amber-700 font-bold block">น้ำหนักดอกสดเก็บเกี่ยวได้</span>
                        <span class="text-2xl font-black text-amber-900 mt-0.5 block">${(c.yield || 0).toFixed(2)} <span class="text-xs font-bold text-amber-700">กก.</span></span>
                      </div>
                      <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-sm">
                        <i class="fas fa-seedling"></i>
                      </div>
                    </div>
                    
                    <div class="text-[10px] text-gray-400 mt-2 flex justify-between items-center">
                      <span>วันที่เก็บเกี่ยว: ${formatThaiDate(c.harvestDateActual)}</span>
                      <span class="text-amber-700 font-bold"><i class="fas fa-fire mr-1"></i>รออบแห้ง</span>
                    </div>
                  </div>

                  <div class="pt-2">
                    <button data-crop-id="${c.id}" class="open-dry-modal-btn w-full py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5">
                      <i class="fas fa-fire-alt"></i> กรอกข้อมูลการอบแห้ง
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

    // 5. Select tab layout content
    let tabContentHtml = '';
    if (this.activeTab === 'fresh') tabContentHtml = freshTabHtml;
    else if (this.activeTab === 'stock') tabContentHtml = stockTabHtml;
    else if (this.activeTab === 'ledger') tabContentHtml = ledgerTabHtml;
    else if (this.activeTab === 'sales') tabContentHtml = salesTabHtml;

    return `
      <div class="fade-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-warehouse text-emerald-700"></i>
              ระบบบริหารคลังสินค้าและการเงินรายสมาชิก
            </h1>
            <p class="text-sm text-gray-500 mt-1">คลังอบแห้งแยกสิทธิ์ตามล็อตเพาะปลูก และบัญชีวิเคราะห์ทุน-กำไรรายบุคคล</p>
          </div>
        </div>

        <!-- Mini Stats Summary Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block font-medium">สต็อกอบแห้งคงเหลือรวม</span>
              <span class="text-2xl font-bold text-emerald-800">${stats.totalDryStock} <span class="text-sm text-gray-500 font-normal">กิโลกรัม</span></span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><i class="fas fa-dolly"></i></div>
          </div>
          
          <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block font-medium">รายได้จากการขายสะสม</span>
              <span class="text-2xl font-bold text-emerald-800">${formatBaht(stats.totalSalesRevenue)}</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center"><i class="fas fa-cash-register"></i></div>
          </div>

          <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block font-medium">อัตราส่วนอบแห้ง (เฉลี่ย)</span>
              <span class="text-sm font-semibold text-gray-700 block">เก๊กฮวย 8:1 | คาโมมายล์ 6:1</span>
              <span class="text-[10px] text-gray-400 block">คำนวณลดทอนน้ำหนักจากดอกสด</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><i class="fas fa-fire"></i></div>
          </div>
        </div>

        <!-- Dynamic Navigation Tabs -->
        <div class="flex border-b border-gray-200 overflow-x-auto">
          <button id="tab-fresh-btn" class="px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap ${
            this.activeTab === 'fresh' 
              ? 'border-emerald-700 text-emerald-700 font-bold' 
              : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-gray-300'
          }">
            <i class="fas fa-leaf mr-1.5 text-amber-600"></i> ผลผลิตดอกสด (${unprocessedCrops.length})
          </button>

          <button id="tab-stock-btn" class="px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap ${
            this.activeTab === 'stock' 
              ? 'border-emerald-700 text-emerald-700 font-bold' 
              : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-gray-300'
          }">
            <i class="fas fa-dolly-flatbed mr-1.5"></i> สมุนไพรอบแห้งพร้อมขาย
          </button>
          
          <button id="tab-ledger-btn" class="px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap ${
            this.activeTab === 'ledger' 
              ? 'border-emerald-700 text-emerald-700 font-bold' 
              : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-gray-300'
          }">
            <i class="fas fa-calculator mr-1.5"></i> สรุปต้นทุน-กำไรรายสมาชิก
          </button>

          <button id="tab-sales-btn" class="px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap ${
            this.activeTab === 'sales' 
              ? 'border-emerald-700 text-emerald-700 font-bold' 
              : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-gray-300'
          }">
            <i class="fas fa-clipboard-list mr-1.5"></i> ประวัติการจำหน่าย
          </button>
        </div>

        ${tabContentHtml}
      </div>
    `;
  },

  init() {
    this.bindTabEvents();
    
    if (this.activeTab === 'fresh') {
      this.bindFreshEvents();
    } else if (this.activeTab === 'stock') {
      this.bindStockEvents();
    } else if (this.activeTab === 'ledger') {
      this.bindLedgerEvents();
    } else if (this.activeTab === 'sales') {
      this.bindSalesEvents();
    }
  },

  bindTabEvents() {
    const freshBtn = document.getElementById('tab-fresh-btn');
    const stockBtn = document.getElementById('tab-stock-btn');
    const ledgerBtn = document.getElementById('tab-ledger-btn');
    const salesBtn = document.getElementById('tab-sales-btn');

    if (freshBtn) {
      freshBtn.addEventListener('click', () => {
        this.activeTab = 'fresh';
        this.refreshView();
      });
    }

    if (stockBtn) {
      stockBtn.addEventListener('click', () => {
        this.activeTab = 'stock';
        this.refreshView();
      });
    }

    if (ledgerBtn) {
      ledgerBtn.addEventListener('click', () => {
        this.activeTab = 'ledger';
        this.refreshView();
      });
    }

    if (salesBtn) {
      salesBtn.addEventListener('click', () => {
        this.activeTab = 'sales';
        this.refreshView();
      });
    }
  },

  bindFreshEvents() {
    const dryModalBtns = document.querySelectorAll('.open-dry-modal-btn');
    const modalDry = document.getElementById('dry-process-modal');
    const closeDryBtns = document.querySelectorAll('.close-dry-modal-btn');
    const formDry = document.getElementById('dry-process-form');

    let processingCropId = null;

    // Checkbox batch selections for fresh crops
    const freshCheckboxes = document.querySelectorAll('.fresh-batch-checkbox');
    freshCheckboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.getAttribute('data-crop-id');
        if (cb.checked) {
          if (!this.selectedFreshCropIds.includes(id)) this.selectedFreshCropIds.push(id);
        } else {
          this.selectedFreshCropIds = this.selectedFreshCropIds.filter(i => i !== id);
        }
        this.refreshView();
      });
    });

    // Select All Fresh Checkbox
    const selectAllFreshCb = document.getElementById('select-all-fresh-checkbox');
    if (selectAllFreshCb) {
      selectAllFreshCb.addEventListener('change', (e) => {
        const currentUser = appState.getCurrentUser();
        const isMember = currentUser && currentUser.role === 'Member';
        let plots = appState.getPlots();
        let crops = appState.getCrops();
        if (isMember) {
          plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
          const plotIds = plots.map(p => p.id);
          crops = crops.filter(c => plotIds.includes(c.plotId));
        }
        const unprocessedCrops = crops.filter(c => c.status === 'harvested' && !c.isProcessed);

        if (selectAllFreshCb.checked) {
          this.selectedFreshCropIds = unprocessedCrops.map(c => c.id);
        } else {
          this.selectedFreshCropIds = [];
        }
        this.refreshView();
      });
    }

    // Batch Dry Process Button click
    const batchDryBtn = document.getElementById('batch-dry-process-btn');
    if (batchDryBtn) {
      batchDryBtn.addEventListener('click', () => {
        if (this.selectedFreshCropIds.length === 0) return;
        if (confirm(`คุณต้องการบันทึกการอบแห้งและแปรรูปนำเข้าคลังสินค้าพร้อมกันทั้งหมด ${this.selectedFreshCropIds.length} แปลง ใช่หรือไม่?`)) {
          try {
            let totalAdded = 0;
            this.selectedFreshCropIds.forEach(cropId => {
              const crop = appState.getCropById(cropId);
              if (crop && !crop.isProcessed) {
                const added = appState.processDryHerbStock(cropId, crop.yield);
                totalAdded += added;
              }
            });
            showToast(`แปรรูปอบแห้งกลุ่มสำเร็จ! นำเข้าคลังสินค้าพร้อมขายรวมทั้งสิ้น ${totalAdded.toFixed(2)} กก.`, 'success');
            this.selectedFreshCropIds = []; // reset batch selection
            this.activeTab = 'stock'; // Switch automatically to stock tab to view dry stock
            this.refreshView();
          } catch (err) {
            showToast('เกิดข้อผิดพลาดในการอบแห้งกลุ่ม: ' + err.message, 'error');
          }
        }
      });
    }

    dryModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        this.openDryProcessModal(cropId);
      });
    });
  },

  openDryProcessModal(cropId) {
    const crop = appState.getCropById(cropId);
    if (!crop) return;

    const plot = appState.getPlotById(crop.plotId);
    const herbType = crop.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';
    const ratio = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย') ? 8 : 6;
    const estDry = ((crop.yield || 0) / ratio).toFixed(2);

    const formHtml = `
      <form id="global-dry-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex justify-between items-center">
            <div>
              <span class="block text-xs font-semibold text-gray-400 uppercase">ล็อตผลผลิตดอกสด</span>
              <span class="block text-base font-extrabold text-amber-900 mt-0.5">${crop.id} (${herbType})</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-amber-800 font-bold block">น้ำหนักดอกสดเดิม:</span>
              <span class="text-base font-black text-amber-900 block">${(crop.yield || 0).toFixed(2)} กก.</span>
            </div>
          </div>

          <div>
            <label for="global-dry-weight" class="block text-xs font-semibold text-gray-500 uppercase mb-1">น้ำหนักสมุนไพรอบแห้งที่ได้จริง (กิโลกรัม) *</label>
            <input type="number" id="global-dry-weight" name="dryWeight" required min="0.01" step="any" value="${estDry}" placeholder="เช่น 20.5"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-emerald-800">
            <span class="block text-[10px] text-gray-400 mt-1">* หากกรอกแล้ว ระบบจะนำยอดไปเพิ่มใน "สมุนไพรอบแห้งพร้อมขาย" อัตโนมัติ</span>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-check"></i> บันทึกและนำเข้าคลังสินค้า
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: 'บันทึกข้อมูลการอบแห้งผลผลิต',
      icon: 'fas fa-fire-alt',
      size: 'max-w-2xl',
      headerColor: 'bg-amber-600',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-dry-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = dialog.querySelector('#global-dry-weight');
            const customDryWeight = parseFloat(input ? input.value : 0) || 0;
            if (customDryWeight <= 0) {
              showToast('กรุณากรอกน้ำหนักสมุนไพรอบแห้งที่ได้จริง', 'warning');
              return;
            }
            try {
              const addedDryWeight = appState.processDryHerbStock(cropId, null, customDryWeight);
              closeGlobalModal();
              showToast(`บันทึกข้อมูลการอบแห้งสำเร็จ! นำเข้าคลังสินค้าพร้อมขายจำนวน ${addedDryWeight} กก.`, 'success');
              this.selectedFreshCropIds = this.selectedFreshCropIds.filter(i => i !== cropId);
              this.activeTab = 'stock';
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  bindStockEvents() {
    const sellBtns = document.querySelectorAll('.sell-stock-btn');
    sellBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        this.openSaleModal(cropId);
      });
    });

    const editWeightsBtns = document.querySelectorAll('.edit-lot-weights-btn');
    editWeightsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        this.openEditWeightsModal(cropId);
      });
    });
  },

  openSaleModal(cropId) {
    const invItem = appState.getInventoryByCropId(cropId);
    if (!invItem) return;
    this.sellingCropId = cropId;

    const todayStr = new Date().toISOString().split('T')[0];
    const isChrys = invItem.herbType === 'เก๊กฮวย' || invItem.herbType.includes('เก๊กฮวย');
    const jarCapacity = isChrys ? 0.10 : 0.05;
    const maxJars = Math.floor(invItem.dryStockKg / jarCapacity);

    const formHtml = `
      <form id="global-sale-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span class="block text-xs font-semibold text-emerald-800 uppercase">จำหน่ายจากรหัสล็อตสินค้า</span>
              <span class="block text-lg font-black text-emerald-950 mt-0.5">${cropId} (${invItem.herbType}อบแห้ง)</span>
            </div>
            <span id="global-sale-max-display" class="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
              สต็อกคงเหลือ: ${(invItem.dryStockKg || 0).toFixed(2)} กก.
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="global-sale-type" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ประเภทสินค้าที่ขาย *</label>
              <select id="global-sale-type" name="saleType" required
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="bulk" selected>วัตถุดิบอบแห้ง (กิโลกรัม)</option>
                <option value="jar">กระปุกสำเร็จรูป (กระปุก)</option>
              </select>
            </div>

            <div>
              <label id="global-sale-amount-label" for="global-sale-amount" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปริมาณที่ขาย (กิโลกรัม) *</label>
              <input type="number" id="global-sale-amount" name="amount" required min="0.01" max="${invItem.dryStockKg}" step="any" placeholder="เช่น 5.5"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label id="global-sale-price-label" for="global-sale-price" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ราคาต่อกิโลกรัม (บาท) *</label>
              <input type="number" id="global-sale-price" name="price" required min="1" placeholder="เช่น 450"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="global-sale-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่จำหน่าย (วัน/เดือน/ปี) *</label>
              <input type="date" id="global-sale-date" name="date" required value="${todayStr}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <!-- Customer Selection with Quick Add Button -->
            <div class="md:col-span-2 space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="global-sale-customer-select" class="block text-xs font-semibold text-gray-500 uppercase">เลือกลูกค้า / ช่องทางจัดจำหน่าย *</label>
                <button type="button" id="global-quick-add-customer-btn" class="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline">
                  <i class="fas fa-user-plus"></i> + เพิ่มลูกค้าใหม่ทันที
                </button>
              </div>
              <select id="global-sale-customer-select" name="customerId" required
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </select>
              <input type="hidden" id="global-sale-customer" name="customer">

              <div id="global-cust-preview" class="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span class="text-gray-400 block text-[10px]">ประเภทลูกค้า:</span>
                    <span id="global-preview-type" class="font-bold text-gray-700 block">-</span>
                  </div>
                  <div>
                    <span class="text-gray-400 block text-[10px]">เบอร์โทรศัพท์:</span>
                    <span id="global-preview-phone" class="font-bold text-gray-700 block">-</span>
                  </div>
                  <div>
                    <span class="text-gray-400 block text-[10px]">ที่อยู่จัดส่ง:</span>
                    <span id="global-preview-address" class="text-gray-600 block truncate">-</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="md:col-span-2 p-3 bg-green-50 text-green-900 border border-green-100 rounded-xl text-xs leading-relaxed">
              <i class="fas fa-info-circle mr-1 text-green-600"></i>
              การบันทึกขายจะหักยอดคลังสินค้าล็อตนี้ และคำนวณบวกรายรับคืนเข้ากับเกษตรกรเจ้าของสิทธิ์ของล็อตโดยอัตโนมัติ
            </div>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-check"></i> บันทึกขายและหักยอด
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: 'บันทึกรายการขายสินค้าแปรรูป',
      icon: 'fas fa-cash-register',
      size: 'max-w-4xl',
      content: formHtml,
      onRender: (dialog) => {
        const custSelect = dialog.querySelector('#global-sale-customer-select');
        const hiddenCust = dialog.querySelector('#global-sale-customer');
        const typeSpan = dialog.querySelector('#global-preview-type');
        const phoneSpan = dialog.querySelector('#global-preview-phone');
        const addrSpan = dialog.querySelector('#global-preview-address');
        const saleTypeSelect = dialog.querySelector('#global-sale-type');
        const amountLabel = dialog.querySelector('#global-sale-amount-label');
        const amountInput = dialog.querySelector('#global-sale-amount');
        const priceLabel = dialog.querySelector('#global-sale-price-label');
        const priceInput = dialog.querySelector('#global-sale-price');
        const maxDisplay = dialog.querySelector('#global-sale-max-display');

        const updateCustomerPreview = (cust) => {
          if (cust) {
            typeSpan.textContent = cust.customerType || 'ลูกค้าทั่วไป';
            phoneSpan.textContent = cust.phone || '-';
            addrSpan.textContent = cust.address || cust.contactChannel || '-';
            hiddenCust.value = cust.name;
          } else {
            typeSpan.textContent = '-';
            phoneSpan.textContent = '-';
            addrSpan.textContent = '-';
            hiddenCust.value = '';
          }
        };

        const populateCustomers = (selectedId = null) => {
          const customers = appState.getCustomers();
          if (customers.length === 0) {
            custSelect.innerHTML = `<option value="">-- ยังไม่มีรายชื่อลูกค้า กรุณากดเพิ่มลูกค้าใหม่ --</option>`;
            updateCustomerPreview(null);
            return;
          }
          custSelect.innerHTML = `
            <option value="">-- กรุณาเลือกลูกค้า --</option>
            ${customers.map(c => `
              <option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>
                ${c.name} (${c.customerType || 'ลูกค้าทั่วไป'}) - ${c.phone || ''}
              </option>
            `).join('')}
          `;
          if (selectedId) {
            custSelect.value = selectedId;
            const c = customers.find(item => item.id === selectedId);
            updateCustomerPreview(c);
          } else {
            updateCustomerPreview(null);
          }
        };

        populateCustomers();

        custSelect.addEventListener('change', (e) => {
          const cust = appState.getCustomerById(e.target.value);
          updateCustomerPreview(cust);
        });

        saleTypeSelect.addEventListener('change', () => {
          if (saleTypeSelect.value === 'bulk') {
            amountLabel.textContent = 'ปริมาณที่ขาย (กิโลกรัม) *';
            amountInput.placeholder = 'เช่น 5.5';
            amountInput.step = 'any';
            amountInput.max = invItem.dryStockKg;
            priceLabel.textContent = 'ราคาต่อกิโลกรัม (บาท) *';
            priceInput.placeholder = 'เช่น 450';
            maxDisplay.textContent = `สต็อกคงเหลือ: ${(invItem.dryStockKg || 0).toFixed(2)} กก.`;
          } else {
            amountLabel.textContent = 'จำนวนกระปุกที่ขาย (กระปุก) *';
            amountInput.placeholder = 'เช่น 10';
            amountInput.step = '1';
            amountInput.max = maxJars;
            priceLabel.textContent = 'ราคาต่อกระปุก (บาท) *';
            priceInput.placeholder = 'เช่น 80';
            maxDisplay.textContent = `สต็อกคงเหลือสูงสุด: ${maxJars} กระปุก (เทียบเท่าน้ำหนักในคลัง)`;
          }
        });

        const quickAddBtn = dialog.querySelector('#global-quick-add-customer-btn');
        if (quickAddBtn) {
          quickAddBtn.addEventListener('click', () => {
            this.openQuickAddCustomerModal((newCust) => {
              // Re-open sale modal with this new customer pre-selected
              this.openSaleModal(cropId);
              setTimeout(() => {
                const s = document.querySelector('#global-sale-customer-select');
                if (s && newCust) {
                  s.value = newCust.id;
                  s.dispatchEvent(new Event('change'));
                }
              }, 50);
            });
          });
        }

        const form = dialog.querySelector('#global-sale-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const amount = parseFloat(formData.get('amount'));
            const price = parseFloat(formData.get('price'));
            const customerId = formData.get('customerId');
            const customer = formData.get('customer');
            const date = formData.get('date');
            const saleType = formData.get('saleType') || 'bulk';

            if (!customerId || !customer) {
              showToast('กรุณาเลือกลูกค้าหรือเพิ่มลูกค้าใหม่', 'warning');
              return;
            }

            try {
              appState.recordSale(cropId, amount, price, customer, date, saleType, customerId);
              closeGlobalModal();
              showToast(`หักยอดสต็อกล็อต ${cropId} และบันทึกขายสำเร็จ`);
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  openQuickAddCustomerModal(onCustomerAdded) {
    const formHtml = `
      <form id="global-quick-cust-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="q-cust-name" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชื่อลูกค้า / ร้านค้า *</label>
              <input type="text" id="q-cust-name" name="name" required placeholder="เช่น ร้านกาแฟช่อผกา, คุณวิภา"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="q-cust-type" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ประเภทลูกค้า *</label>
              <select id="q-cust-type" name="customerType" required
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="ลูกค้าทั่วไป">ลูกค้าทั่วไป</option>
                <option value="ร้านคาเฟ่/ร้านขายของฝาก">ร้านคาเฟ่/ร้านขายของฝาก</option>
                <option value="ตัวแทนจำหน่าย">ตัวแทนจำหน่าย</option>
                <option value="ซื้อส่งโรงงาน">ซื้อส่งโรงงาน</option>
              </select>
            </div>

            <div>
              <label for="q-cust-phone" class="block text-xs font-semibold text-gray-500 uppercase mb-1">เบอร์โทรศัพท์ *</label>
              <input type="text" id="q-cust-phone" name="phone" required placeholder="เช่น 081-234-5678"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="q-cust-channel" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ช่องทางติดต่ออื่นๆ (Line / Facebook)</label>
              <input type="text" id="q-cust-channel" name="contactChannel" placeholder="เช่น Line: @coffee, FB: ร้านกาแฟ"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div class="md:col-span-2">
              <label for="q-cust-address" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ที่อยู่จัดส่ง / ที่อยู่ร้านค้า</label>
              <textarea id="q-cust-address" name="address" rows="2" placeholder="ระบุที่อยู่จัดส่งสินค้า"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-save"></i> บันทึกและเลือกลูกค้านี้
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: 'เพิ่มข้อมูลลูกค้าใหม่ทันที',
      icon: 'fas fa-user-plus',
      size: 'max-w-3xl',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-quick-cust-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
              name: formData.get('name').trim(),
              customerType: formData.get('customerType'),
              phone: formData.get('phone').trim(),
              contactChannel: formData.get('contactChannel').trim(),
              address: formData.get('address').trim()
            };

            try {
              const added = appState.addCustomer(data);
              showToast(`เพิ่มลูกค้า "${added.name}" เรียบร้อยแล้ว`);
              if (onCustomerAdded) onCustomerAdded(added);
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  openEditWeightsModal(cropId) {
    const invItem = appState.getInventoryByCropId(cropId);
    const crop = appState.getCropById(cropId);
    if (!invItem) return;

    const formHtml = `
      <form id="global-weights-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 font-bold">
            ${cropId} (${invItem.herbType}อบแห้ง)
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="global-weights-fresh" class="block text-xs font-semibold text-gray-500 uppercase mb-1">น้ำหนักดอกสด (กก.) *</label>
              <input type="number" id="global-weights-fresh" name="yieldFresh" required min="0" step="any" value="${crop ? (crop.yield || 0) : 0}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="global-weights-dry" class="block text-xs font-semibold text-gray-500 uppercase mb-1">น้ำหนักแห้งคงคลัง (กก.) *</label>
              <input type="number" id="global-weights-dry" name="dryStock" required min="0" step="any" value="${invItem.dryStockKg || 0}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>

          <p class="text-xs text-gray-400 leading-relaxed">
            <i class="fas fa-info-circle mr-1 text-emerald-600"></i>
            การปรับน้ำหนักนี้จะแก้ไขยอดดอกสดในรอบการเพาะปลูก และยอดสต็อกอบแห้งคงเหลือในคลังสินค้าโดยตรง
          </p>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-save"></i> บันทึกการแก้ไข
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: 'แก้ไขน้ำหนักผลผลิตสดและแห้ง',
      icon: 'fas fa-weight-hanging',
      size: 'max-w-2xl',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-weights-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const yieldFresh = parseFloat(formData.get('yieldFresh')) || 0;
            const dryStock = parseFloat(formData.get('dryStock')) || 0;
            try {
              appState.updateLotWeights(cropId, yieldFresh, dryStock);
              closeGlobalModal();
              showToast(`อัปเดตน้ำหนักล็อต ${cropId} เรียบร้อยแล้ว`);
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  bindLedgerEvents() {
    const searchInput = document.getElementById('member-ledger-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchMemberQuery = e.target.value;
        // Simple update without losing cursor focus
        const financialReport = appState.getFinancialReport();
        const filteredReport = financialReport.filter(r => 
          r.name.toLowerCase().includes(this.searchMemberQuery.toLowerCase()) ||
          r.id.toLowerCase().includes(this.searchMemberQuery.toLowerCase())
        );

        const rowsHtml = filteredReport.length === 0
          ? `<tr><td colspan="7" class="px-6 py-6 text-center text-sm text-gray-500">ไม่พบรายงานการเงินของสมาชิกรายที่ระบุ</td></tr>`
          : filteredReport.map(r => {
              const statusBadge = r.netProfit > 0 
                ? `<span class="px-2.5 py-1 text-xs font-bold bg-green-50 text-green-700 rounded-full border border-green-200"><i class="fas fa-arrow-up mr-0.5"></i> กำไร</span>`
                : r.netProfit < 0
                  ? `<span class="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 rounded-full border border-red-200"><i class="fas fa-arrow-down mr-0.5"></i> ขาดทุน</span>`
                  : `<span class="px-2.5 py-1 text-xs font-bold bg-gray-50 text-gray-600 rounded-full border border-gray-200">เท่าทุน</span>`;
              
              return `
                <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                  <td class="px-6 py-4 text-sm font-semibold text-emerald-800">${r.id}</td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-bold text-gray-900">${r.name}</div>
                    <div class="text-[10px] text-gray-400">บทบาท: ${r.role} (${r.villageNumber})</div>
                  </td>
                  <td class="px-6 py-4 text-center text-sm text-gray-700 font-medium">${r.totalCrops} รอบ</td>
                  <td class="px-6 py-4 text-sm text-gray-600 font-medium">${formatBaht(r.totalCost)}</td>
                  <td class="px-6 py-4 text-sm text-emerald-800 font-bold">${formatBaht(r.totalRevenue)}</td>
                  <td class="px-6 py-4 text-sm font-extrabold ${r.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}">
                    ${r.netProfit > 0 ? '+' : ''}${formatBaht(r.netProfit)}
                  </td>
                  <td class="px-6 py-4 text-center">${statusBadge}</td>
                </tr>
              `;
            }).join('');
        
        const tbody = document.querySelector('table tbody');
        if (tbody) tbody.innerHTML = rowsHtml;
      });
    }
  },

  bindSalesEvents() {
    const viewSaleBtns = document.querySelectorAll('.view-sale-btn');
    viewSaleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const saleId = btn.getAttribute('data-sale-id');
        this.openSaleDetailModal(saleId);
      });
    });
  },

  openSaleDetailModal(saleId) {
    const sale = appState.getSales().find(s => s.id === saleId);
    if (!sale) return;

    const crops = appState.getCrops();
    const plots = appState.getPlots();
    const members = appState.getMembers();
    const crop = crops.find(c => c.id === sale.cropId);
    const plot = crop ? plots.find(p => p.id === crop.plotId) : null;
    const owners = plot ? members.filter(m => plot.memberIds && plot.memberIds.includes(m.id)) : [];
    const custInfo = sale.customerId ? appState.getCustomerById(sale.customerId) : null;

    const ownersListHtml = owners.map(o => `
      <div class="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800">
        <i class="fas fa-user-circle text-lg text-emerald-600"></i>
        <div>
          <div class="font-bold text-gray-800">${o.name} (${o.role})</div>
          <div class="text-[10px] text-emerald-600">${o.villageNumber || '-'} | โทร: ${o.phone || '-'}</div>
        </div>
      </div>
    `).join('') || '<div class="text-xs text-gray-500">-</div>';

    const customerHtml = custInfo ? `
      <span class="font-bold text-gray-800">${custInfo.name}</span>
      <span class="text-xs text-gray-500 font-normal block mt-0.5">${custInfo.customerType} | โทร: ${custInfo.phone || '-'}</span>
      ${custInfo.address ? `<span class="text-[11px] text-gray-400 font-normal block">${custInfo.address}</span>` : ''}
    ` : `<span class="font-bold text-gray-800">${sale.customer || '-'}</span>`;

    const detailContent = `
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          <div class="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <span class="text-xs text-gray-400 font-bold block">รหัสรายการขาย:</span>
              <span class="text-lg font-black text-emerald-800">${sale.id}</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-400 font-bold block">วันที่จำหน่าย:</span>
              <span class="text-sm font-bold text-gray-700">${formatThaiDate(sale.date)}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 md:p-6 rounded-2xl border border-gray-100">
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-200 pb-1">
                <i class="fas fa-leaf mr-1"></i> ข้อมูลผลผลิตและแหล่งที่มา
              </h4>
              <div>
                <span class="text-xs text-gray-400 block">ล็อตสินค้า / แหล่งปลูก:</span>
                <span class="text-sm font-bold text-gray-800">${sale.cropId}</span>
                <span class="text-xs text-gray-500 block mt-0.5">${plot ? plot.name : '-'}</span>
              </div>
              <div>
                <span class="text-xs text-gray-400 block">ชนิดสมุนไพร:</span>
                <span class="text-sm font-bold text-emerald-700">${plot ? `${plot.plantType}อบแห้ง` : '-'}</span>
              </div>
              <div>
                <span class="text-xs text-gray-400 block mb-1.5">เกษตรกรเจ้าของแปลง:</span>
                <div class="space-y-2">
                  ${ownersListHtml}
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-200 pb-1">
                <i class="fas fa-user-tag mr-1"></i> ข้อมูลการขายและลูกค้า
              </h4>
              <div>
                <span class="text-xs text-gray-400 block">ลูกค้าผู้ซื้อ:</span>
                <div class="text-sm mt-0.5">${customerHtml}</div>
              </div>
              <div>
                <span class="text-xs text-gray-400 block">เลขอ้างอิง / ใบเสร็จ:</span>
                <span class="text-xs font-bold text-gray-600">${sale.invoiceNo || `INV-${sale.id.split('-')[1]}`}</span>
              </div>
            </div>
          </div>

          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
            <div class="flex justify-between items-center text-xs text-gray-600">
              <span>จำนวนที่ขาย:</span>
              <span class="font-bold text-gray-800">${sale.saleType === 'jar' ? `${sale.amount || sale.amountKg} กระปุก` : `${sale.amountKg || sale.amount} กก.`}</span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-600">
              <span>ราคาต่อหน่วย:</span>
              <span class="font-bold text-gray-800">${sale.saleType === 'jar' ? `${formatBaht(sale.price || sale.pricePerKg)}/กระปุก` : `${formatBaht(sale.pricePerKg || sale.price)}/กก.`}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
              <span class="text-sm font-bold text-gray-800">ยอดรวมทั้งสิ้น:</span>
              <span class="text-xl font-black text-emerald-800">${formatBaht(sale.totalPrice)}</span>
            </div>
          </div>
        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 text-right flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-6 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: 'รายละเอียดใบเสร็จการจำหน่าย',
      icon: 'fas fa-receipt',
      size: 'max-w-4xl',
      headerColor: 'bg-[#1e4620]',
      content: detailContent
    });
  },

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init(); // rebind events
    }
  }
};
