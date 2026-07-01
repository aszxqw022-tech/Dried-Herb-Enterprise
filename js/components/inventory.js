// Inventory and Cost-Profit Ledger Component
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast } from '../helpers.js';

export const InventoryComponent = {
  activeTab: 'stock', // 'stock' | 'ledger' | 'sales'
  searchMemberQuery: '',
  sellingCropId: null,

  render() {
    const stats = appState.getStats();
    const inventory = appState.getInventory();
    const plots = appState.getPlots();
    const members = appState.getMembers();
    const sales = appState.getSales();
    const crops = appState.getCrops(); // Added to fix ReferenceError
    const financialReport = appState.getFinancialReport();

    // 1. Filtered report for members tab
    const filteredReport = financialReport.filter(r => 
      r.name.toLowerCase().includes(this.searchMemberQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(this.searchMemberQuery.toLowerCase())
    );

    // 2. Build Inventory Stock Tab HTML
    const activeInventoryLots = inventory.filter(inv => inv.dryStockKg > 0);
    const stockTabHtml = activeInventoryLots.length === 0
      ? `<div class="p-8 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">ไม่มีสินค้าอบแห้งคงเหลือในคลังในขณะนี้</div>`
      : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${activeInventoryLots.map(inv => {
            const crop = appState.getCropById(inv.cropId);
            const plot = crop ? plots.find(p => p.id === crop.plotId) : null;
            const owner = plot ? members.find(m => m.id === plot.memberId) : null;
            const isChrys = inv.herbType === 'เก๊กฮวย';
            
            return `
              <div class="glass-card bg-white rounded-2xl p-5 border border-gray-100 flex flex-col justify-between space-y-4">
                <div>
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold text-gray-400">ล็อต: ${inv.cropId}</span>
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                      isChrys ? 'badge-chrysanthemum' : 'badge-chamomile'
                    }">
                      ${inv.herbType}อบแห้ง
                    </span>
                  </div>
                  <h4 class="text-base font-bold text-gray-800">${plot ? plot.name : 'ไม่พบแปลงปลูก'}</h4>
                  <p class="text-xs text-gray-500 mt-1">เกษตรกรเจ้าของ: <b>${owner ? owner.name : '-'}</b></p>
                  
                  <div class="mt-4 p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                    <span class="text-xs text-gray-500">สต็อกคงเหลือล็อตนี้:</span>
                    <span class="text-2xl font-black text-emerald-800">${inv.dryStockKg.toFixed(2)} <span class="text-xs font-bold text-gray-400">กก.</span></span>
                  </div>
                  <div class="text-[10px] text-gray-400 mt-2 text-right">
                    อบแห้งเสร็จเมื่อ: ${formatThaiDate(inv.processedDate)}
                  </div>
                </div>

                <div class="pt-2">
                  <button data-crop-id="${inv.cropId}" class="sell-stock-btn w-full py-2.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5">
                    <i class="fas fa-shopping-cart"></i> บันทึกขายจากล็อตนี้
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
          const crop = crops.find(c => c.id === s.cropId);
          const plot = crop ? plots.find(p => p.id === crop.plotId) : null;
          const owner = plot ? members.find(m => m.id === plot.memberId) : null;
          
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-3.5 text-sm font-semibold text-emerald-800">${s.id}</td>
              <td class="px-6 py-3.5 text-sm font-medium text-emerald-900">${s.cropId}</td>
              <td class="px-6 py-3.5 text-sm text-gray-800">${owner ? owner.name : '-'}</td>
              <td class="px-6 py-3.5">
                <span class="px-2 py-0.5 text-[10px] font-semibold border rounded-full ${
                  plot && plot.plantType === 'เก๊กฮวย' ? 'badge-chrysanthemum' : 'badge-chamomile'
                }">${plot ? plot.plantType : '-'}อบแห้ง</span>
              </td>
              <td class="px-6 py-3.5 text-sm text-gray-700 font-bold text-center">${s.amountKg} กก.</td>
              <td class="px-6 py-3.5 text-sm text-gray-500">${formatBaht(s.pricePerKg)}/กก.</td>
              <td class="px-6 py-3.5 text-sm text-emerald-800 font-black">${formatBaht(s.totalPrice)}</td>
              <td class="px-6 py-3.5 text-sm text-gray-600 truncate max-w-[120px]" title="${s.customer}">${s.customer}</td>
              <td class="px-6 py-3.5 text-xs text-gray-400">${formatThaiDate(s.date)}</td>
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
              </tr>
            </thead>
            <tbody>
              ${salesRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 5. Select tab layout content
    let tabContentHtml = '';
    if (this.activeTab === 'stock') tabContentHtml = stockTabHtml;
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
        <div class="flex border-b border-gray-200">
          <button id="tab-stock-btn" class="px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none ${
            this.activeTab === 'stock' 
              ? 'border-emerald-700 text-emerald-700 font-bold' 
              : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-gray-300'
          }">
            <i class="fas fa-dolly-flatbed mr-1.5"></i> สมุนไพรอบแห้งพร้อมขาย
          </button>
          
          <button id="tab-ledger-btn" class="px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none ${
            this.activeTab === 'ledger' 
              ? 'border-emerald-700 text-emerald-700 font-bold' 
              : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-gray-300'
          }">
            <i class="fas fa-calculator mr-1.5"></i> สรุปต้นทุน-กำไรรายสมาชิก
          </button>

          <button id="tab-sales-btn" class="px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none ${
            this.activeTab === 'sales' 
              ? 'border-emerald-700 text-emerald-700 font-bold' 
              : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-gray-300'
          }">
            <i class="fas fa-clipboard-list mr-1.5"></i> ประวัติการจำหน่าย
          </button>
        </div>

        <!-- Rendered tab view -->
        ${tabContentHtml}

        <!-- Record Sale Modal -->
        <div id="sale-record-modal" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center p-4 bg-black bg-opacity-40 transition-opacity">
          <div class="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100">
            <!-- Modal Header -->
            <div class="bg-emerald-800 px-6 py-4 text-white flex justify-between items-center">
              <h3 class="font-bold text-sm flex items-center gap-1.5">
                <i class="fas fa-cash-register"></i> บันทึกรายการขายสินค้าแปรรูป
              </h3>
              <button type="button" class="close-sale-modal-btn text-white opacity-80 hover:opacity-100 text-xl focus:outline-none">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- Modal Body Form -->
            <form id="sale-form" class="p-6 space-y-4">
              <!-- Lot Code Display -->
              <div>
                <span class="block text-xs font-semibold text-gray-400 uppercase">จำหน่ายจากรหัสล็อตสินค้า</span>
                <span id="sale-crop-display" class="block text-base font-extrabold text-emerald-800 mt-1">CROP-XXX</span>
              </div>

              <!-- Sale Quantity Kg -->
              <div>
                <label for="sale-amount" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปริมาณที่ขาย (กิโลกรัม) *</label>
                <input type="number" id="sale-amount" name="amount" required min="0.01" step="any" placeholder="เช่น 5.5"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <span id="sale-max-stock-display" class="block text-[10px] text-gray-400 mt-1">สต็อกล็อตนี้คงเหลือสูงสุด: - กก.</span>
              </div>

              <!-- Price per kg -->
              <div>
                <label for="sale-price" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ราคาต่อกิโลกรัม (บาท) *</label>
                <input type="number" id="sale-price" name="price" required min="1" placeholder="เช่น 450"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Customer Info -->
              <div>
                <label for="sale-customer" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ลูกค้า / ช่องทางจัดจำหน่าย *</label>
                <input type="text" id="sale-customer" name="customer" required placeholder="เช่น ร้านกาแฟสวนร่มรื่น, แฟนเพจกลุ่ม"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Date -->
              <div>
                <label for="sale-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่จำหน่าย *</label>
                <input type="date" id="sale-date" name="date" required
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Info hint -->
              <div class="p-3 bg-green-50 text-green-900 border border-green-100 rounded-xl text-[10px] leading-relaxed">
                <i class="fas fa-info-circle mr-1 text-green-600"></i>
                การบันทึกขายจะหักยอดคลังสินค้าล็อตนี้ และคำนวณบวกรายรับคืนเข้ากับเกษตรกรเจ้าของสิทธิ์ของล็อตโดยอัตโนมัติ
              </div>

              <!-- Footer Buttons -->
              <div class="flex justify-end pt-4 gap-2.5">
                <button type="button" class="close-sale-modal-btn px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm font-bold">
                  <i class="fas fa-check"></i> บันทึกขายและหักยอด
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  },

  init() {
    this.bindTabEvents();
    
    if (this.activeTab === 'stock') {
      this.bindStockEvents();
    } else if (this.activeTab === 'ledger') {
      this.bindLedgerEvents();
    }
  },

  bindTabEvents() {
    const stockBtn = document.getElementById('tab-stock-btn');
    const ledgerBtn = document.getElementById('tab-ledger-btn');
    const salesBtn = document.getElementById('tab-sales-btn');

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

  bindStockEvents() {
    const sellBtns = document.querySelectorAll('.sell-stock-btn');
    const modal = document.getElementById('sale-record-modal');
    const closeBtns = document.querySelectorAll('.close-sale-modal-btn');
    const form = document.getElementById('sale-form');

    sellBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        const invItem = appState.getInventoryByCropId(cropId);
        
        if (invItem && modal) {
          this.sellingCropId = cropId;
          document.getElementById('sale-crop-display').textContent = `${cropId} (${invItem.herbType}อบแห้ง)`;
          document.getElementById('sale-max-stock-display').textContent = `สต็อกล็อตนี้คงเหลือสูงสุด: ${invItem.dryStockKg} กก.`;
          
          if (form) {
            form.reset();
            document.getElementById('sale-amount').max = invItem.dryStockKg;
            document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
          }

          modal.classList.remove('hidden');
        }
      });
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (modal) modal.classList.add('hidden');
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const amount = parseFloat(formData.get('amount'));
        const price = parseFloat(formData.get('price'));
        const customer = formData.get('customer');
        const date = formData.get('date');

        if (this.sellingCropId) {
          try {
            appState.recordSale(this.sellingCropId, amount, price, customer, date);
            showToast(`หักยอดสต็อกล็อต ${this.sellingCropId} และบันทึกขายสำเร็จ`);
            if (modal) modal.classList.add('hidden');
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    }
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

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init(); // rebind events
    }
  }
};
