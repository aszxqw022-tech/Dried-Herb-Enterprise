// หน้าการขาย — Sales Recording & Receipt Component
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

// ---- LocalStorage key for direct product sales ----
const DIRECT_SALES_KEY = 'herb_enterprise_direct_sales_v1';

function normalizeSales(raw) {
  if (!Array.isArray(raw)) return [];
  const ordersMap = new Map();
  const result = [];

  for (const s of raw) {
    if (!s) continue;
    // Base invoice ID without split suffixes like -1, -2
    const baseId = s.invoiceNo || (s.id ? s.id.replace(/-\d+$/, '') : ('INV-' + Date.now()));

    const itemEntry = {
      productId: s.productId || (s.items && s.items[0] ? s.items[0].productId : ''),
      productName: s.productName || (s.items && s.items[0] ? s.items[0].productName : 'สินค้า'),
      unit: s.unit || (s.items && s.items[0] ? s.items[0].unit : 'หน่วย'),
      quantity: parseFloat(s.quantity) || (s.items && s.items[0] ? parseFloat(s.items[0].quantity) : 1),
      unitPrice: parseFloat(s.unitPrice) || (s.items && s.items[0] ? parseFloat(s.items[0].unitPrice) : 0),
      totalPrice: parseFloat(s.totalPrice) || (s.items && s.items[0] ? parseFloat(s.items[0].totalPrice) : 0)
    };

    if (ordersMap.has(baseId)) {
      const order = ordersMap.get(baseId);
      const incomingItems = (s.items && Array.isArray(s.items) && s.items.length > 0) ? s.items : [itemEntry];
      order.items.push(...incomingItems);
      order.totalPrice += (parseFloat(s.totalPrice) || incomingItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0));
      order.totalAmount = order.totalPrice;
      order.totalQuantity += (parseFloat(s.quantity) || incomingItems.reduce((acc, it) => acc + (it.quantity || 0), 0));
    } else {
      const orderItems = (s.items && Array.isArray(s.items) && s.items.length > 0) ? [...s.items] : [itemEntry];
      const totalAmount = parseFloat(s.totalPrice) || orderItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
      const totalQty = parseFloat(s.totalQuantity) || orderItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
      const order = {
        ...s,
        id: baseId,
        invoiceNo: baseId,
        receiptNo: baseId,
        items: orderItems,
        totalPrice: totalAmount,
        totalAmount: totalAmount,
        totalQuantity: totalQty
      };
      ordersMap.set(baseId, order);
      result.push(order);
    }
  }

  return result;
}

function getDirectSales() {
  try {
    const raw = JSON.parse(localStorage.getItem(DIRECT_SALES_KEY)) || [];
    return normalizeSales(raw);
  } catch { return []; }
}

function saveDirectSales(sales) {
  localStorage.setItem(DIRECT_SALES_KEY, JSON.stringify(sales));
}

function generateSaleId() {
  const sales = getDirectSales();
  const currentThaiYear = new Date().getFullYear() + 543;
  const prefix = `INV-${currentThaiYear}-`;
  let maxNum = 0;
  sales.forEach(s => {
    const id = s.invoiceNo || s.id || '';
    if (id.startsWith(prefix)) {
      const numPart = id.replace(prefix, '').split('-')[0];
      const n = parseInt(numPart) || 0;
      if (n > maxNum) maxNum = n;
    }
  });
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

// ---- Thai helpers ----
const THAI_MONTHS = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function toThaiDateLong(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${THAI_MONTHS[parseInt(m)]} พ.ศ. ${parseInt(y) + 543}`;
}

function toThaiDateTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const date = toThaiDateLong(d.toISOString().split('T')[0]);
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${date}  เวลา ${h}:${mi} น.`;
}

export const SalesComponent = {
  searchQuery: '',
  filterYear: '',
  filterMonth: '',

  currentCart: [],

  render() {
    const currentUser = appState.getCurrentUser();
    const enterprise = appState.getEnterprise();
    const products = appState.getProducts();
    const customers = appState.getCustomers ? appState.getCustomers() : [];
    const members   = appState.getMembers();
    const sales = getDirectSales();

    // Generate next invoice No (PK)
    const nextInvoiceNo = generateSaleId();

    // à¸£à¸²à¸¢à¸à¸²à¸£à¸›à¸µ (à¸ž.à¸¨.) à¸ªà¸³à¸«à¸£à¸±à¸šà¸•à¸±à¸§à¸à¸£à¸­à¸‡
    const currentYearBE = new Date().getFullYear() + 543;
    const saleYears = sales.map(s => {
      const d = s.date || s.saleDate || (s.createdAt ? s.createdAt.substring(0, 4) : '');
      if (d && d.length >= 4) {
        const y = parseInt(d.substring(0, 4));
        return !isNaN(y) ? (y > 2400 ? y : y + 543) : null;
      }
      return null;
    }).filter(Boolean);
    const availableYears = [...new Set([currentYearBE, 2569, 2568, ...saleYears])].sort().reverse();

    // Month options (01-12)
    const MONTH_OPTIONS = Array.from({ length: 12 }, function(_, i) {
      var m = i + 1;
      return { value: (m < 10 ? "0" + m : "" + m), name: THAI_MONTHS[m] };
    });

    // Filter
    let filtered = sales.filter(s => {
      const q = this.searchQuery.toLowerCase();
      if (q) {
        const matchesId = (s.id||'').toLowerCase().includes(q) || (s.invoiceNo||'').toLowerCase().includes(q);
        const matchesCustomer = (s.customerName||'').toLowerCase().includes(q);
        const matchesSeller = (s.sellerName||'').toLowerCase().includes(q);
        const matchesProducts = s.items
          ? s.items.some(it => (it.productName||'').toLowerCase().includes(q) || (it.productId||'').toLowerCase().includes(q))
          : ((s.productName||'').toLowerCase().includes(q) || (s.productId||'').toLowerCase().includes(q));
        if (!matchesId && !matchesCustomer && !matchesSeller && !matchesProducts) return false;
      }
      
      const d = s.date || s.saleDate || (s.createdAt ? s.createdAt.substring(0, 10) : '');
      if (d && d.length >= 7) {
        const parts = d.split('-');
        const yNum = parseInt(parts[0]);
        const saleYearBE = yNum > 2400 ? yNum : yNum + 543;
        const saleMonth = parts[1]; // '01' - '12'

        if (this.filterYear && String(saleYearBE) !== String(this.filterYear)) {
          return false;
        }
        if (this.filterMonth && String(saleMonth) !== String(this.filterMonth)) {
          return false;
        }
      }
      return true;
    });

    // Totals
    const totalRevenue = filtered.reduce((s, x) => s + (parseFloat(x.totalPrice || x.totalAmount) || 0), 0);
    const totalQty     = filtered.reduce((s, x) => s + (parseFloat(x.totalQuantity) || (x.items ? x.items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0) : (parseFloat(x.quantity) || 0))), 0);

    // Summary cards
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => (s.date || s.saleDate) === today);
    const todayRevenue = todaySales.reduce((s, x) => s + (parseFloat(x.totalPrice || x.totalAmount) || 0), 0);
    const allRevenue   = sales.reduce((s, x) => s + (parseFloat(x.totalPrice || x.totalAmount) || 0), 0);

    const summaryHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-5 bg-white border border-emerald-200/90 shadow-sm rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
          <div class="space-y-1">
            <span class="text-sm font-bold text-gray-600 block">ยอดขายวันนี้</span>
            <div class="text-3xl font-bold text-emerald-800 font-mono tabular-nums">${formatBaht(todayRevenue)}</div>
            <span class="text-sm text-emerald-700 font-semibold block pt-0.5">${todaySales.length} รายการขายวันนี้</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            <i class="fas fa-sun"></i>
          </div>
        </div>

        <div class="p-5 bg-white border border-sky-200/90 shadow-sm rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
          <div class="space-y-1">
            <span class="text-sm font-bold text-gray-600 block">ยอดขายสะสมรวมทั้งหมด</span>
            <div class="text-3xl font-bold text-sky-900 font-mono tabular-nums">${formatBaht(allRevenue)}</div>
            <span class="text-sm text-sky-700 font-semibold block pt-0.5">${sales.length} รายการขายทั้งหมด</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            <i class="fas fa-cash-register"></i>
          </div>
        </div>

        <div class="p-5 bg-white border border-amber-200/90 shadow-sm rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
          <div class="space-y-1">
            <span class="text-sm font-bold text-gray-600 block">สินค้าในคลังพร้อมจำหน่าย</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-bold text-amber-950 font-mono">${products.length}</span>
              <span class="text-sm font-bold text-gray-500">รายการ</span>
            </div>
            <span class="text-sm text-amber-800 font-semibold block pt-0.5">ตัดสต็อกอัตโนมัติเมื่อขาย</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            <i class="fas fa-boxes-stacked"></i>
          </div>
        </div>
      </div>
    `;

    // Product options with [PRD-XXX] badge
    const productOptions = products.map(p =>
      `<option value="${p.id}" data-price="${p.price}" data-unit="${p.unit}" data-stock="${p.stock}">
        [${p.id}] ${p.name} (${p.price.toLocaleString()} บาท/${p.unit}) — คงเหลือ ${p.unit === 'กก.' ? p.stock.toFixed(2) : p.stock} ${p.unit}
      </option>`
    ).join('');

    // Customer options with [CUST-XXX] badge
    const customerOptions = customers.map(c =>
      `<option value="${c.id || c.name}" data-id="${c.id || ''}" data-name="${c.name}">
        ${c.id ? `[${c.id}] ` : ''}${c.name} (${c.customerType || 'ลูกค้าทั่วไป'})
      </option>`
    ).join('');

    // Member options for seller with [MEM-XXX] badge
    const sellerOptions = members.map(m =>
      `<option value="${m.memberId || m.name}" data-id="${m.memberId || ''}" data-name="${m.name}" ${currentUser && (currentUser.name === m.name || currentUser.memberId === m.memberId) ? 'selected' : ''}>
        ${m.memberId ? `[${m.memberId}] ` : ''}${m.name} (${m.roleDisplay || m.role})
      </option>`
    ).join('');

    // Unique months for filter
    const months = [...new Set(sales.map(s => (s.date||'').substring(0,7)))].sort().reverse();

    // Table rows: 1 Order = 1 Row
    const tableRowsHtml = filtered.length === 0
      ? `<tr><td colspan="7" class="py-14 text-center">
           <div class="flex flex-col items-center gap-2 text-gray-400">
             <i class="fas fa-receipt text-4xl opacity-30"></i>
             <p class="text-sm font-bold text-gray-500">ยังไม่มีรายการขาย</p>
             <p class="text-sm">กรอกแบบฟอร์มด้านบนเพื่อบันทึกการขายครั้งแรก</p>
           </div>
         </td></tr>`
      : [...filtered].map(s => {
          const items = (s.items && Array.isArray(s.items) && s.items.length > 0)
            ? s.items
            : [{
                productId: s.productId,
                productName: s.productName,
                unit: s.unit,
                quantity: s.quantity || 1,
                unitPrice: s.unitPrice || 0,
                totalPrice: s.totalPrice || 0
              }];

          const docId = s.invoiceNo || s.id;
          const totalBillAmount = parseFloat(s.totalPrice || s.totalAmount) || items.reduce((sum, it) => sum + (parseFloat(it.totalPrice) || 0), 0);
          const totalOrderQty = parseFloat(s.totalQuantity) || items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);

          // Units summary
          const units = [...new Set(items.map(it => it.unit).filter(Boolean))].join(', ');

          // Products summary display
          const itemsSummaryHtml = items.map(it => `
            <div class="flex items-center gap-1.5 text-sm text-gray-800">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
              <span class="font-medium text-gray-900">${it.productName || 'สินค้า'}</span>
              <span class="text-xs text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                ${it.quantity} ${it.unit}
              </span>
            </div>
          `).join('');

          return `
            <tr class="border-b border-gray-100 last:border-0 hover:bg-emerald-50/20 transition-colors group">
              <!-- เลขที่ใบเสร็จ -->
              <td class="py-3.5 px-4 align-top">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-bold font-mono text-emerald-800 text-sm">
                  <i class="fas fa-receipt text-emerald-600 text-xs"></i>${docId}
                </span>
                <div class="text-xs text-gray-400 mt-1">${items.length} รายการในบิล</div>
              </td>

              <!-- วันที่ขาย -->
              <td class="py-3.5 px-4 align-top">
                <div class="text-sm font-bold text-gray-900">${toThaiDateLong(s.date || s.saleDate)}</div>
                <div class="text-xs text-gray-500 font-medium mt-0.5">
                  ${s.createdAt ? new Date(s.createdAt).toLocaleTimeString('th-TH', {hour:'2-digit',minute:'2-digit'}) + ' น.' : ''}
                </div>
              </td>

              <!-- รายการสินค้า -->
              <td class="py-3.5 px-4 align-top">
                <div class="space-y-1">
                  ${itemsSummaryHtml}
                </div>
              </td>

              <!-- จำนวนรวม -->
              <td class="py-3.5 px-4 text-center align-top">
                <div class="font-bold text-gray-900 text-base tabular-nums">${totalOrderQty.toLocaleString()}</div>
                <div class="text-xs text-gray-500 font-medium">${units || 'รายการ'}</div>
              </td>

              <!-- ยอดรวมทั้งบิล -->
              <td class="py-3.5 px-4 text-right align-top">
                <div class="text-base sm:text-lg font-bold text-emerald-800 font-mono tabular-nums">${formatBaht(totalBillAmount)}</div>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 mt-0.5 inline-block">
                  ${s.paymentMethod || s.payment || 'เงินสด'}
                </span>
              </td>

              <!-- ผู้ซื้อ / ผู้ขาย -->
              <td class="py-3.5 px-4 align-top">
                <div class="font-bold text-gray-900 text-sm">${s.customerName || '-'}</div>
                <div class="text-xs text-gray-500 font-medium mt-0.5">${s.sellerName ? 'โดย: ' + s.sellerName : ''}</div>
              </td>

              <!-- จัดการ -->
              <td class="py-3.5 px-4 text-right align-top">
                <div class="flex items-center justify-end gap-1.5 flex-wrap">
                  <button class="download-direct-sale-pdf-btn px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    data-id="${docId}" title="ดาวน์โหลดเป็นไฟล์ PDF">
                    <i class="fas fa-file-pdf text-red-600"></i> PDF
                  </button>
                  <button class="view-direct-sale-btn px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    data-id="${docId}" title="เปิดดูใบเสร็จ">
                    <i class="fas fa-receipt text-emerald-600"></i> ใบเสร็จ
                  </button>
                  <button class="delete-direct-sale-btn p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs transition-all cursor-pointer shadow-2xs"
                    data-id="${docId}" title="ยกเลิกบิลและคืนสต็อก">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center text-lg shadow">
                <i class="fas fa-store"></i>
              </span>
              หน้าจอการขาย
            </h1>
            <p class="text-sm text-gray-500 mt-1 ml-1">บันทึกรายการขายสินค้า · ออกใบเสร็จรับเงิน · ติดตามรายได้</p>
          </div>
          <a href="#inventory" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-bold transition-all shadow-xs self-start sm:self-auto">
            <i class="fas fa-boxes-stacked"></i> คลังสินค้า →
          </a>
        </div>

        <!-- Summary Cards -->
        ${summaryHtml}



        <!-- ===== Sale Recording Form ===== -->
        <div class="rounded-2xl border border-emerald-800/20 shadow-md overflow-hidden bg-white">
          <div class="bg-emerald-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center text-lg shrink-0">
                <i class="fas fa-pen-to-square"></i>
              </div>
              <div>
                <h2 class="text-base font-bold text-white flex items-center gap-2">
                  <span>บันทึกรายการขายใหม่</span>
                </h2>
                <p class="text-sm text-emerald-200">บันทึกข้อมูลการขาย ตัดสต็อกสินค้า และออกใบเสร็จรับเงินอัตโนมัติ</p>
              </div>
            </div>
            <!-- PK Badge: รหัสใบเสร็จ (sale_id / invoice_no) -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400/40 text-emerald-100 text-sm font-semibold shadow-xs self-start sm:self-auto">
              <i class="fas fa-key text-amber-400 text-base"></i>
              <span class="text-emerald-300">รหัสใบเสร็จ (PK):</span>
              <span class="font-mono font-bold text-white text-base tracking-wide">${nextInvoiceNo}</span>
            </div>
          </div>

          <form id="direct-sale-form" class="p-6 space-y-6">
            <input type="hidden" id="sale-invoice-no" name="invoiceNo" value="${nextInvoiceNo}">
            <input type="hidden" id="sale-customer-id" name="customerId" value="">
            <input type="hidden" id="sale-seller-id" name="sellerId" value="${currentUser && currentUser.memberId ? currentUser.memberId : ''}">

            <!-- แถวที่ 1 (ข้อมูลอ้างอิงและคู่ค้า): วันที่ขาย | ลูกค้า (FK) | ผู้บันทึกขาย (FK) -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">1</span>
                <span>ข้อมูลอ้างอิงและคู่ค้า (Reference & Partners)</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <!-- วันที่ขาย -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">
                    <i class="fas fa-calendar-day text-emerald-600 mr-1.5"></i>วันที่ขาย *
                  </label>
                  <input type="date" id="sale-date" name="date" required value="${today}"
                    class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white shadow-xs">
                  <p class="text-xs text-gray-500 mt-1">วันที่บันทึกรายการขาย (แก้ไขได้)</p>
                </div>

                <!-- ลูกค้า (FK) -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">
                    <i class="fas fa-user text-emerald-600 mr-1.5"></i>ลูกค้า (FK) *
                  </label>
                  <select id="sale-customer-select"
                    class="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-medium text-gray-800 bg-white mb-1.5 shadow-xs">
                    <option value="">— เลือกลูกค้าในระบบ (FK) —</option>
                    ${customerOptions}
                  </select>
                  <input type="text" id="sale-customer-name" name="customerName" required placeholder="หรือพิมพ์ชื่อลูกค้าใหม่..."
                    class="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white shadow-xs">
                </div>

                <!-- ผู้บันทึกขาย (FK) -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">
                    <i class="fas fa-user-tie text-emerald-600 mr-1.5"></i>ผู้บันทึกขาย (FK) *
                  </label>
                  <select id="sale-seller-select"
                    class="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-medium text-gray-800 bg-white mb-1.5 shadow-xs">
                    <option value="">— เลือกสมาชิกผู้ขาย (FK) —</option>
                    ${sellerOptions}
                  </select>
                  <input type="text" id="sale-seller-name" name="sellerName" required placeholder="ชื่อผู้บันทึกขาย..."
                    value="${currentUser ? currentUser.name : ''}"
                    class="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white shadow-xs">
                </div>
              </div>
            </div>

            <!-- แถวที่ 2 (ข้อมูลสินค้า): สินค้าที่ขาย (FK) | จำนวนที่ขาย + หน่วย | ราคาต่อหน่วย -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">2</span>
                <span>ข้อมูลสินค้าและสต็อก (Product & Stock Details)</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <!-- สินค้าที่ขาย (FK) -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">
                    <i class="fas fa-box text-emerald-600 mr-1.5"></i>สินค้าที่ขาย (FK) *
                  </label>
                  <select id="sale-product-id" name="productId"
                    class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white shadow-xs">
                    <option value="">— เลือกสินค้าจากคลัง —</option>
                    ${productOptions}
                  </select>
                  <p class="text-xs text-gray-500 mt-1">ตัดสต็อกอัตโนมัติเมื่อกดบันทึก</p>
                </div>

                <!-- จำนวนที่ขาย + หน่วย -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">
                    <i class="fas fa-sort-numeric-up text-emerald-600 mr-1.5"></i>จำนวนที่ขาย *
                  </label>
                  <div class="flex items-center gap-2">
                    <input type="number" id="sale-quantity" name="quantity" min="0.01" step="any" placeholder="0"
                      class="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-base font-bold text-gray-800 tabular-nums bg-white shadow-xs">
                    <span id="sale-unit-display" class="px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-800 whitespace-nowrap min-w-[64px] text-center shadow-xs">หน่วย</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">เช่น 50 G / 1 กระป๋อง / กก.</p>
                </div>

                <!-- ราคาต่อหน่วย -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">
                    <i class="fas fa-tag text-emerald-600 mr-1.5"></i>ราคาต่อหน่วย (บาท) *
                  </label>
                  <input type="number" id="sale-unit-price" name="unitPrice" min="0" step="any" placeholder="0"
                    class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-base font-bold text-emerald-700 tabular-nums bg-white shadow-xs">
                  <p class="text-xs text-gray-500 mt-1">ราคาจะดึงตามสินค้าที่เลือกอัตโนมัติ</p>
                </div>
              </div>
            </div>

            <!-- แถวที่ 3 (การเงินและสรุปยอด): ยอดรวมสุทธิ | ช่องทางชำระเงิน | หมายเหตุ -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">3</span>
                <span>การเงินและสรุปยอด (Payment & Financial Summary)</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <!-- ยอดรวมสุทธิ -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">
                    <i class="fas fa-coins text-amber-500 mr-1.5"></i>ยอดรวมสุทธิ (คำนวณอัตโนมัติ)
                  </label>
                  <div class="w-full px-4 py-2.5 rounded-xl border-2 border-amber-300 bg-amber-50/80 text-lg font-bold text-amber-900 tabular-nums flex items-center justify-between shadow-xs" id="sale-total-display">
                    <span>0.00</span> <span class="text-sm font-bold text-amber-700">บาท</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">คำนวณจากจำนวน × ราคาต่อหน่วย</p>
                </div>

                <!-- ช่องทางชำระเงิน -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">
                    <i class="fas fa-credit-card text-emerald-600 mr-1.5"></i>ช่องทางชำระเงิน *
                  </label>
                  <select id="sale-payment" name="payment"
                    class="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white shadow-xs">
                    <option value="เงินสด">💵 เงินสด</option>
                    <option value="โอนเงิน">📱 โอนเงิน (พร้อมเพย์/ธนาคาร)</option>
                    <option value="บัตรเครดิต">💳 บัตรเครดิต/เดบิต</option>
                    <option value="ค้างชำระ">⏳ ค้างชำระ (เครดิต)</option>
                    <option value="อื่นๆ">📝 อื่นๆ</option>
                  </select>
                  <p class="text-xs text-gray-500 mt-1">เลือกประเภทการชำระเงิน</p>
                </div>

                <!-- หมายเหตุ -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">
                    <i class="fas fa-note-sticky text-gray-400 mr-1.5"></i>หมายเหตุ (ถ้ามี)
                  </label>
                  <input type="text" id="sale-note" name="note" placeholder="เช่น สั่งพิเศษ, ส่งมอบหน้าร้าน, ซื้อยกล็อต..."
                    class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm text-gray-700 bg-white shadow-xs">
                  <p class="text-xs text-gray-500 mt-1">ข้อความเพิ่มเติมบนใบเสร็จ</p>
                </div>
              </div>
            </div>

            <!-- Optional Multi-Item Cart Button -->
            <div class="flex justify-end pt-1">
              <button type="button" id="add-to-cart-btn" class="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-bold transition-all flex items-center gap-2">
                <i class="fas fa-plus"></i> เพิ่มรายการนี้ลงบิล (กรณีต้องการขายหลายชิ้นพร้อมกัน)
              </button>
            </div>

            <!-- Cart Items Table -->
            <div id="cart-items-wrapper" class="hidden border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div class="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex justify-between items-center">
                    <span class="text-sm font-bold text-gray-700"><i class="fas fa-shopping-cart text-emerald-600 mr-1.5"></i> รายการสินค้าในบิล (<span id="cart-count">0 รายการ</span>)</span>
                    <span class="text-xs text-gray-500">สามารถเพิ่มสินค้าได้หลายรายการใน 1 ใบเสร็จ</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-white text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                <th class="py-2.5 px-3">สินค้า</th>
                                <th class="py-2.5 px-3 text-center">จำนวน</th>
                                <th class="py-2.5 px-3 text-right">ราคา/หน่วย</th>
                                <th class="py-2.5 px-3 text-right">รวมสุทธิ</th>
                                <th class="py-2.5 px-3 text-right w-12">ลบ</th>
                            </tr>
                        </thead>
                        <tbody id="cart-items-tbody"></tbody>
                        <tfoot>
                            <tr class="bg-emerald-50/50 border-t border-emerald-100 font-bold">
                                <td colspan="3" class="py-3 px-3 text-right text-sm text-emerald-800">ยอดรวมทั้งบิล (Grand Total):</td>
                                <td colspan="2" class="py-3 px-3 text-right text-base text-emerald-700 font-bold" id="cart-summary-total">0.00 บาท</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Submit Buttons -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-100 gap-4 flex-wrap">
              <div id="sale-stock-warning" class="text-sm text-orange-600 font-bold hidden">
                <i class="fas fa-triangle-exclamation mr-1"></i><span></span>
              </div>
              <div class="flex gap-3 ml-auto">
                <button type="reset" class="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-all">
                  ล้างแบบฟอร์ม
                </button>
                <button type="submit" id="submit-direct-sale-btn"
                  class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-base font-bold transition-all shadow-md flex items-center gap-2.5 active:scale-95">
                  <i class="fas fa-receipt text-lg"></i>
                  บันทึกการขายและออกใบเสร็จ
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- ===== Sales History Table ===== -->
        <div class="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center text-sm">
                <i class="fas fa-list-ul"></i>
              </div>
              <div>
                <h2 class="text-base font-bold text-gray-900">ประวัติรายการขายทั้งหมด</h2>
                <p class="text-sm text-gray-400">กดปุ่ม "ใบเสร็จ" เพื่อดูและพิมพ์ใบเสร็จรับเงิน</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Month filter -->
              <div class="flex items-center gap-1.5">
                <label for="sale-month-filter" class="text-xs font-bold text-gray-600 hidden sm:inline">
                  <i class="far fa-calendar text-gray-400 mr-0.5"></i>เดือน:
                </label>
                <select id="sale-month-filter" class="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs">
                  <option value="">ทุกเดือน (ทั้งหมด)</option>
                  ${MONTH_OPTIONS.map(m => `
                    <option value="${m.value}" ${String(this.filterMonth) === String(m.value) ? 'selected' : ''}>${m.name}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Year filter -->
              <div class="flex items-center gap-1.5">
                <label for="sale-year-filter" class="text-xs font-bold text-gray-600 hidden sm:inline">
                  <i class="far fa-calendar-alt text-gray-400 mr-0.5"></i>ปี:
                </label>
                <select id="sale-year-filter" class="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs">
                  <option value="">ทุกปี (ทั้งหมด)</option>
                  ${availableYears.map(y => `
                    <option value="${y}" ${String(this.filterYear) === String(y) ? 'selected' : ''}>พ.ศ. ${y}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Search -->
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400"><i class="fas fa-search text-sm"></i></span>
                <input type="text" id="sale-history-search" value="${this.searchQuery}" placeholder="ค้นหาบิล/ลูกค้า/สินค้า..."
                  class="pl-7 pr-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36 sm:w-44">
              </div>

              ${(this.filterYear || this.filterMonth || this.searchQuery) ? `
                <button type="button" id="clear-sale-filter-btn" class="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-200 cursor-pointer flex items-center gap-1 shadow-2xs" title="ล้างตัวกรองทั้งหมด">
                  <i class="fas fa-rotate-left"></i>
                  <span>ล้างกรอง</span>
                </button>
              ` : ''}

              <span class="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 whitespace-nowrap">
                ${filtered.length} รายการ · ${formatBaht(totalRevenue)}
              </span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200">
                  <th class="py-3.5 px-4 w-36">เลขที่ใบเสร็จ</th>
                  <th class="py-3.5 px-4 w-44">วันที่ขาย</th>
                  <th class="py-3.5 px-4">สินค้า</th>
                  <th class="py-3.5 px-4 text-center w-28">จำนวนรวม</th>
                  <th class="py-3.5 px-4 text-right w-36">ยอดรวมทั้งบิล</th>
                  <th class="py-3.5 px-4 w-52">ผู้ซื้อ / ผู้ขาย</th>
                  <th class="py-3.5 px-4 text-right w-44">จัดการ</th>
                </tr>
              </thead>
              <tbody>${tableRowsHtml}</tbody>
              ${filtered.length > 0 ? `
              <tfoot>
                <tr class="bg-emerald-50 border-t-2 border-emerald-600 font-bold text-sm">
                  <td colspan="3" class="py-3 px-4 text-right text-emerald-900">รวม (${filtered.length} บิล):</td>
                  <td class="py-3 px-4 text-center text-emerald-800">${totalQty.toLocaleString()}</td>
                  <td class="py-3 px-4 text-right text-emerald-800 text-base">${formatBaht(totalRevenue)}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>` : ''}
            </table>
          </div>
        </div>

      </div>
    `;
  },

  init() {
    this._bindForm();
    this._bindTableActions();
    this._bindSearch();
  },

  _bindForm() {
    const totalDisplay = document.getElementById('sale-total-display');
    const unitDisplay  = document.getElementById('sale-unit-display');
    const productSel   = document.getElementById('sale-product-id');
    const qtyInput     = document.getElementById('sale-quantity');
    const priceInput   = document.getElementById('sale-unit-price');
    const stockWarning = document.getElementById('sale-stock-warning');

    const updateCalc = () => {
      const q = parseFloat(qtyInput?.value) || 0;
      const p = parseFloat(priceInput?.value) || 0;
      const total = q * p;
      if (totalDisplay) {
        totalDisplay.innerHTML = `<span>${total.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})}</span> <span class="text-sm font-bold text-amber-700">บาท</span>`;
      }
    };

    if (qtyInput) qtyInput.addEventListener('input', updateCalc);
    if (priceInput) priceInput.addEventListener('input', updateCalc);

    if (productSel) {
      productSel.addEventListener('change', () => {
        const opt = productSel.selectedOptions[0];
        if (opt && opt.value) {
          if (priceInput) priceInput.value = opt.getAttribute('data-price') || '';
          const unit = opt.getAttribute('data-unit') || 'หน่วย';
          if (unitDisplay) unitDisplay.textContent = unit;
          
          const stock = parseFloat(opt.getAttribute('data-stock')) || 0;
          if (stockWarning) {
              if (stock <= 5) {
                stockWarning.classList.remove('hidden');
                stockWarning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> สินค้าในสต็อกเหลือ ${stock} ${unit}`;
              } else {
                stockWarning.classList.add('hidden');
              }
          }
          updateCalc();
        } else {
          if (priceInput) priceInput.value = '';
          if (unitDisplay) unitDisplay.textContent = 'หน่วย';
          if (stockWarning) stockWarning.classList.add('hidden');
          updateCalc();
        }
      });
    }

    // FK Selection Listeners
    const customerSel = document.getElementById('sale-customer-select');
    const customerNameInput = document.getElementById('sale-customer-name');
    const customerIdInput = document.getElementById('sale-customer-id');
    if (customerSel) {
      customerSel.addEventListener('change', () => {
        const opt = customerSel.selectedOptions[0];
        if (opt && opt.value) {
          const cName = opt.getAttribute('data-name') || opt.value;
          const cId = opt.getAttribute('data-id') || '';
          if (customerNameInput) customerNameInput.value = cName;
          if (customerIdInput) customerIdInput.value = cId;
        }
      });
    }

    const sellerSel = document.getElementById('sale-seller-select');
    const sellerNameInput = document.getElementById('sale-seller-name');
    const sellerIdInput = document.getElementById('sale-seller-id');
    if (sellerSel) {
      sellerSel.addEventListener('change', () => {
        const opt = sellerSel.selectedOptions[0];
        if (opt && opt.value) {
          const sName = opt.getAttribute('data-name') || opt.value;
          const sId = opt.getAttribute('data-id') || '';
          if (sellerNameInput) sellerNameInput.value = sName;
          if (sellerIdInput) sellerIdInput.value = sId;
        }
      });
    }
    
    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            this._handleAddToCart();
        });
    }

    const form = document.getElementById('direct-sale-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this._handleSubmit(form);
      });

      form.addEventListener('reset', () => {
        setTimeout(() => {
          this.currentCart = [];
          this._renderCartItems();
          if (totalDisplay) totalDisplay.innerHTML = `<span>0.00</span> <span class="text-sm font-bold text-amber-700">บาท</span>`;
          if (unitDisplay)  unitDisplay.textContent = 'หน่วย';
          if (stockWarning) stockWarning.classList.add('hidden');
        }, 0);
      });
    }
  },

  _handleAddToCart() {
      const productSel = document.getElementById('sale-product-id');
      const opt = productSel?.selectedOptions[0];
      if (!opt || !opt.value) { showToast('กรุณาเลือกสินค้า', 'error'); return; }
  
      const productId   = opt.value;
      const product     = appState.getProductById(productId);
      const productName = product ? product.name : (opt.text || 'สินค้า');
      const unit        = opt.getAttribute('data-unit') || (product ? product.unit : 'หน่วย');
      const quantity    = parseFloat(document.getElementById('sale-quantity')?.value) || 0;
      const unitPrice   = parseFloat(document.getElementById('sale-unit-price')?.value) || 0;
      const stock       = parseFloat(opt.getAttribute('data-stock')) || 0;

      if (quantity <= 0) { showToast('กรุณาระบุจำนวน', 'error'); return; }
      if (unitPrice < 0) { showToast('กรุณาระบุราคาต่อหน่วย', 'error'); return; }
      
      const existingQty = this.currentCart.reduce((sum, item) => item.productId === productId ? sum + item.quantity : sum, 0);
      if (product && (existingQty + quantity) > stock) {
          showToast(`สต็อกไม่พอ! (ในสต็อกมี ${stock} ${unit})`, 'error');
          return;
      }

      this.currentCart.push({
          productId, productName, unit, quantity, unitPrice, totalPrice: quantity * unitPrice
      });

      productSel.value = '';
      if (document.getElementById('sale-quantity')) document.getElementById('sale-quantity').value = '';
      if (document.getElementById('sale-unit-price')) document.getElementById('sale-unit-price').value = '';
      if (document.getElementById('sale-total-display')) document.getElementById('sale-total-display').innerHTML = `<span>0.00</span> <span class="text-sm font-bold text-amber-700">บาท</span>`;
      if (document.getElementById('sale-stock-warning')) document.getElementById('sale-stock-warning').classList.add('hidden');
      if (document.getElementById('sale-unit-display')) document.getElementById('sale-unit-display').textContent = 'หน่วย';

      this._renderCartItems();
  },

  _renderCartItems() {
      const tbody = document.getElementById('cart-items-tbody');
      const summaryTotal = document.getElementById('cart-summary-total');
      const wrapper = document.getElementById('cart-items-wrapper');
      const countB = document.getElementById('cart-count');
      
      if (!tbody) return;

      if (!this.currentCart || this.currentCart.length === 0) {
          if(wrapper) wrapper.classList.add('hidden');
          return;
      }
      
      if(wrapper) wrapper.classList.remove('hidden');
      if(countB) countB.textContent = this.currentCart.length + ' รายการ';
      
      let html = '';
      let grandTotal = 0;
      this.currentCart.forEach((item, idx) => {
          grandTotal += item.totalPrice;
          html += `
            <tr class="border-b border-gray-100 last:border-0 hover:bg-slate-50">
              <td class="py-2 px-3 text-sm font-bold text-gray-800">${item.productName}</td>
              <td class="py-2 px-3 text-center text-sm font-bold text-emerald-700">${item.quantity.toLocaleString()} ${item.unit}</td>
              <td class="py-2 px-3 text-right text-sm text-gray-600">${item.unitPrice.toLocaleString('th-TH', {minimumFractionDigits:2})}</td>
              <td class="py-2 px-3 text-right text-sm font-bold text-gray-900">${item.totalPrice.toLocaleString('th-TH', {minimumFractionDigits:2})}</td>
              <td class="py-2 px-3 text-right">
                <button type="button" class="remove-cart-item-btn text-rose-500 hover:text-rose-700 p-1" data-index="${idx}">
                  <i class="fas fa-times"></i>
                </button>
              </td>
            </tr>
          `;
      });
      tbody.innerHTML = html;
      if (summaryTotal) summaryTotal.textContent = `${grandTotal.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})} บาท`;
      
      const removeBtns = tbody.querySelectorAll('.remove-cart-item-btn');
      removeBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
              const idx = parseInt(e.currentTarget.getAttribute('data-index'));
              this.currentCart.splice(idx, 1);
              this._renderCartItems();
          });
      });
  },

  _handleSubmit(form) {
    const invoiceNo = document.getElementById('sale-invoice-no')?.value || generateSaleId();
    const date = document.getElementById('sale-date')?.value || new Date().toISOString().split('T')[0];
    const sellerName = document.getElementById('sale-seller-name')?.value?.trim();
    const sellerId = document.getElementById('sale-seller-id')?.value?.trim();
    const customerName = document.getElementById('sale-customer-name')?.value?.trim();
    const customerId = document.getElementById('sale-customer-id')?.value?.trim() || null;
    const payment = document.getElementById('sale-payment')?.value || 'เงินสด';
    const note = document.getElementById('sale-note')?.value?.trim();

    if (!sellerName) { showToast('กรุณาระบุชื่อผู้ขาย (FK)', 'error'); return; }
    if (!customerName) { showToast('กรุณาระบุชื่อลูกค้า (FK)', 'error'); return; }

    // If cart is empty, check if row 2 product & quantity are filled
    if (!this.currentCart || this.currentCart.length === 0) {
      const productSel = document.getElementById('sale-product-id');
      const opt = productSel?.selectedOptions[0];
      const qty = parseFloat(document.getElementById('sale-quantity')?.value) || 0;
      const price = parseFloat(document.getElementById('sale-unit-price')?.value) || 0;

      if (!opt || !opt.value) {
        showToast('กรุณาเลือกสินค้าที่ขาย (FK)', 'error');
        return;
      }
      if (qty <= 0) {
        showToast('กรุณาระบุจำนวนที่ขาย', 'error');
        return;
      }
      if (price < 0) {
        showToast('กรุณาระบุราคาต่อหน่วย', 'error');
        return;
      }

      const productId = opt.value;
      const product = appState.getProductById(productId);
      const productName = product ? product.name : (opt.text || 'สินค้า');
      const unit = opt.getAttribute('data-unit') || (product ? product.unit : 'หน่วย');
      const stock = parseFloat(opt.getAttribute('data-stock')) || 0;

      if (qty > stock) {
        showToast(`สต็อกไม่พอ! (ในสต็อกมี ${stock} ${unit})`, 'error');
        return;
      }

      this.currentCart = [{
        productId,
        productName,
        unit,
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price
      }];
    }

    const sales = getDirectSales();
    let grandTotal = 0;
    let totalQty = 0;
    const orderItems = [];

    // Process stock deduction for each item in cart
    for (let i = 0; i < this.currentCart.length; i++) {
      const item = this.currentCart[i];
      let remainingStock = 0;
      
      try {
        const deductResult = appState.deductProductStock(item.productId, item.quantity, customerName, item.unitPrice, date, customerId);
        if (deductResult && deductResult.product) {
          remainingStock = deductResult.product.stock;
        }
      } catch (e) {
        const product = appState.getProductById(item.productId);
        if (product) {
          const newStock = Math.max(0, parseFloat((product.stock - item.quantity).toFixed(2)));
          appState.updateProduct(item.productId, { stock: newStock });
          remainingStock = newStock;
        }
      }

      // ⚡ Deduct bulk dry herbs from inventory if selling in กก.
      if (item.unit === 'กก.' || item.unit === 'kg') {
        try {
          const inventory = appState.getInventory();
          const targetHerb = item.productName.includes('เก๊กฮวย') ? 'เก๊กฮวย' : (item.productName.includes('คาโมมายล์') ? 'คาโมมายล์' : '');
          if (targetHerb) {
            const dryRecords = inventory.filter(inv => inv.type === 'dry' && inv.herb === targetHerb && inv.remainingKg > 0);
            dryRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            let needed = item.quantity;
            for (const rec of dryRecords) {
              if (needed <= 0) break;
              if (rec.remainingKg >= needed) {
                rec.remainingKg = parseFloat((rec.remainingKg - needed).toFixed(2));
                needed = 0;
              } else {
                needed = parseFloat((needed - rec.remainingKg).toFixed(2));
                rec.remainingKg = 0;
              }
            }
            appState.saveInventory(inventory);
          }
        } catch (e) {
          console.error('Failed to deduct bulk inventory:', e);
        }
      }

      const itemTotal = parseFloat(item.totalPrice) || (item.quantity * item.unitPrice);
      grandTotal += itemTotal;
      totalQty += item.quantity;

      orderItems.push({
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal
      });
    }

    // ⚡ 1 บิล ต่อ 1 ออเดอร์ (Master-Detail Structure) รหัสใบเสร็จเดียว ไม่แยกขีด -1, -2
    const newOrder = {
      id: invoiceNo,
      invoiceNo: invoiceNo,
      receiptNo: invoiceNo,
      items: orderItems,
      // ฟิลด์ fallback เพื่อรองรับระบบภายนอกหรือโค้ดที่เรียกดูฟิลด์หลักโดยตรง
      productId: orderItems[0] ? orderItems[0].productId : '',
      productName: orderItems.length > 1 ? `${orderItems[0].productName} และอีก ${orderItems.length - 1} รายการ` : (orderItems[0] ? orderItems[0].productName : ''),
      unit: orderItems[0] ? orderItems[0].unit : '',
      quantity: totalQty,
      unitPrice: orderItems[0] ? orderItems[0].unitPrice : 0,
      totalPrice: grandTotal,
      date,
      saleDate: date,
      customerId: customerId || '',
      customerName,
      sellerId: sellerId || '',
      sellerName,
      payment,
      paymentMethod: payment,
      note,
      remark: note || '',
      createdAt: new Date().toISOString()
    };

    sales.unshift(newOrder);
    saveDirectSales(sales);
    this.currentCart = [];

    form.reset();
    showToast(`บันทึกการขาย ${invoiceNo} สำเร็จ! (${orderItems.length} รายการ ยอดรวม ${formatBaht(grandTotal)})`, 'success');
    this.refreshView();

    setTimeout(() => this._openReceipt(newOrder.id), 300);
  },
  _bindTableActions() {
    document.querySelectorAll('.view-direct-sale-btn').forEach(btn => {
      btn.addEventListener('click', () => this._openReceipt(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.download-direct-sale-pdf-btn').forEach(btn => {
      btn.addEventListener('click', () => this._downloadReceiptPdf(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.delete-direct-sale-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const sales = getDirectSales();
        const saleToDelete = sales.find(s => s.id === id || s.invoiceNo === id);
        if (!saleToDelete) return;

        const itemsToRestore = (saleToDelete.items && Array.isArray(saleToDelete.items) && saleToDelete.items.length > 0)
          ? saleToDelete.items
          : [saleToDelete];

        const itemCount = itemsToRestore.length;
        if (confirm(`คุณต้องการยกเลิกและลบรายการขาย #${saleToDelete.invoiceNo || id} (${itemCount} รายการ) หรือไม่?\n\n⚡ ระบบจะทำการ "คืนสต็อกสินค้าทั้งหมดในบิลนี้" กลับเข้าสู่คลังสินค้าโดยอัตโนมัติ`)) {
          // 1. คืนสต็อกสินค้าทั้งหมดในบิล
          itemsToRestore.forEach(item => {
            if (item.productId) {
              const product = appState.getProductById(item.productId);
              if (product) {
                const restoredStock = parseFloat((product.stock + item.quantity).toFixed(2));
                appState.updateProduct(product.id, { stock: restoredStock });
              }
            }
            // คืนสต็อกสมุนไพรอบแห้งแบบ กก. ถ้ามี
            if (item.unit === 'กก.' || item.unit === 'kg') {
              try {
                const inventory = appState.getInventory();
                const targetHerb = (item.productName || '').includes('เก๊กฮวย') ? 'เก๊กฮวย' : ((item.productName || '').includes('คาโมมายล์') ? 'คาโมมายล์' : '');
                if (targetHerb) {
                  const invItem = inventory.find(i => (i.herbType && i.herbType.includes(targetHerb)));
                  if (invItem) {
                    invItem.dryStockKg = parseFloat((invItem.dryStockKg + item.quantity).toFixed(2));
                    localStorage.setItem('herb_enterprise_inventory', JSON.stringify(inventory));
                  }
                }
              } catch (e) {
                console.error("Inventory restore error:", e);
              }
            }
          });

          // 2. Remove from appState.sales if present
          try {
            appState.deleteSale(id, false);
            if (saleToDelete.invoiceNo && saleToDelete.invoiceNo !== id) {
              appState.deleteSale(saleToDelete.invoiceNo, false);
            }
          } catch (e) {}

          // 3. Remove from direct sales
          const filtered = sales.filter(s => s.id !== id && s.invoiceNo !== id && s.id !== saleToDelete.invoiceNo && s.invoiceNo !== saleToDelete.invoiceNo);
          saveDirectSales(filtered);
          showToast(`ลบรายการขาย #${saleToDelete.invoiceNo || id} เรียบร้อยแล้ว และคืนสต็อกสินค้าทั้งหมดกลับเข้าคลัง`, 'success');
          this.refreshView();
        }
      });
    });
  },

  _bindSearch() {
    const search = document.getElementById('sale-history-search');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }
    const yearFilter = document.getElementById('sale-year-filter');
    if (yearFilter) {
      yearFilter.addEventListener('change', (e) => {
        this.filterYear = e.target.value;
        this.refreshView();
      });
    }
    const monthFilter = document.getElementById('sale-month-filter');
    if (monthFilter) {
      monthFilter.addEventListener('change', (e) => {
        this.filterMonth = e.target.value;
        this.refreshView();
      });
    }
    const clearBtn = document.getElementById('clear-sale-filter-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.filterYear = '';
        this.filterMonth = '';
        this.refreshView();
      });
    }
  },

  /**
   * สร้าง HTML ใบเสร็จรับเงินที่สมจริง ถูกต้องตามหลักการค้าวิสาหกิจชุมชน
   */
  _getReceiptContentHtml(s) {
    const enterprise = appState.getEnterprise() || {};
    const printDate  = toThaiDateTime(s.createdAt || new Date().toISOString());
    const saleDate   = toThaiDateLong(s.date);
    
    const sales = typeof getDirectSales === 'function' ? getDirectSales() : (JSON.parse(localStorage.getItem('herb_enterprise_direct_sales_v1')) || []);
    let allItems = [];
    if (s.items && Array.isArray(s.items) && s.items.length > 0) {
      allItems = s.items;
    } else {
      const filtered = (s.invoiceNo || s.receiptNo) ? sales.filter(x => (s.invoiceNo && x.invoiceNo === s.invoiceNo) || (s.receiptNo && x.receiptNo === s.receiptNo)) : [s];
      filtered.forEach(f => {
        if (f.items && Array.isArray(f.items) && f.items.length > 0) {
          allItems.push(...f.items);
        } else {
          allItems.push(f);
        }
      });
    }
    
    let subtotal = 0;
    let itemsHtml = '';
    
    allItems.forEach((item, index) => {
        const itemQty = parseFloat(item.quantity) || 0;
        const itemPrice = parseFloat(item.unitPrice) || 0;
        const itemTotal = parseFloat(item.totalPrice) || (itemQty * itemPrice);
        subtotal += itemTotal;
        itemsHtml += `
            <tr class="border-b border-gray-200/80 text-gray-800 hover:bg-slate-50/60 transition-colors">
                <td style="width: 44px;" class="py-2.5 px-2 text-center text-gray-500 font-medium whitespace-nowrap">${index + 1}</td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-gray-900 text-sm leading-snug">${item.productName}</div>
                  <div class="text-xs text-gray-400 font-normal mt-0.5 tracking-wide">รหัส: ${item.productId || '-'}</div>
                </td>
                <td style="width: 55px;" class="py-2.5 px-2 text-center text-gray-600 font-medium whitespace-nowrap">${item.unit || 'ชิ้น'}</td>
                <td style="width: 55px;" class="py-2.5 px-2 text-center font-bold text-gray-800 tabular-nums whitespace-nowrap">${itemQty.toLocaleString()}</td>
                <td style="width: 95px;" class="py-2.5 px-2 text-right text-gray-600 tabular-nums whitespace-nowrap">${formatBaht(itemPrice)}</td>
                <td style="width: 110px;" class="py-2.5 px-2 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">${formatBaht(itemTotal)}</td>
            </tr>
        `;
    });
    
    const grand      = subtotal;
    const documentId = s.invoiceNo || s.id || s.receiptNo;
    const barDigits  = (documentId || '').replace(/\D/g, '').padStart(12, '0');

    return `
      <div id="printable-receipt" class="receipt-paper w-full bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm" style="box-sizing: border-box; width: 100%;">

        <!-- Top Header: Logo + Enterprise Details -->
        <div class="flex items-start justify-between pb-4 border-b border-gray-200 gap-4">
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl shadow-xs shrink-0 mt-0.5">
              <i class="fas fa-leaf"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold text-emerald-800 tracking-wider">วิสาหกิจชุมชนมาตรฐานทางการ</span>
                <span class="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">OTOP</span>
              </div>
              <h1 class="text-base sm:text-lg font-bold text-gray-900 leading-snug">${enterprise.name || 'วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านศรีดอนมูล'}</h1>
              <p class="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                ${enterprise.village || 'หมู่ที่ 12'} ต.${enterprise.subdistrict || 'ศรีดอนมูล'} อ.${enterprise.district || 'เชียงแสน'} จ.${enterprise.province || 'เชียงราย'} ${enterprise.zipcode || enterprise.postalCode || '57150'}
              </p>
              <div class="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>โทร. ${enterprise.phone || '089-555-1234'}</span>
                <span>•</span>
                <span>รหัสทะเบียน: <span class="font-medium text-gray-700">5-50-08-01/1-0023</span></span>
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <span class="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              ต้นฉบับ
            </span>
            <div class="mt-2 text-right">
              <span class="text-lg font-bold text-gray-900 block leading-tight">ใบเสร็จรับเงิน</span>
            </div>
          </div>
        </div>

        <!-- Document Meta & Customer Info Grid (Always 2 Columns) -->
        <div class="grid grid-cols-2 gap-3.5 py-3.5 border-b border-gray-200 text-sm">
          <!-- ฝั่งซ้าย (ลูกค้า): ชื่อร้าน/ผู้ซื้อ, วิธีชำระเงิน -->
          <div class="space-y-1.5 bg-gray-50/90 p-3.5 rounded-xl border border-gray-200/90">
            <div class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fas fa-user text-emerald-700"></i> ข้อมูลลูกค้า / ผู้ซื้อ
            </div>
            <div class="font-bold text-gray-900 text-base leading-snug">${s.customerName || '-'}</div>
            <div class="text-sm text-gray-600 flex items-center gap-1.5 pt-0.5">
              <span class="text-gray-500">วิธีชำระเงิน:</span>
              <span class="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">${s.paymentMethod || s.payment || 'เงินสด'}</span>
            </div>
            ${s.note || s.remark ? `<div class="text-xs text-gray-500 mt-1 truncate" title="${s.note || s.remark}"><span class="text-gray-400">หมายเหตุ:</span> ${s.note || s.remark}</div>` : ''}
          </div>

          <!-- ฝั่งขวา (เอกสาร): เลขที่ใบเสร็จ, วันที่ออกใบเสร็จ, ผู้รับเงิน -->
          <div class="space-y-1.5 bg-gray-50/90 p-3.5 rounded-xl border border-gray-200/90 text-right">
            <div class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-end gap-1.5">
              <i class="fas fa-file-invoice text-emerald-700"></i> ข้อมูลเอกสาร
            </div>
            <div class="font-mono font-bold text-emerald-800 text-lg leading-snug">${documentId}</div>
            <div class="text-sm text-gray-600 pt-0.5">
              <span class="text-gray-500">วันที่ออกใบเสร็จ:</span> <span class="font-bold text-gray-800">${saleDate}</span>
            </div>
            <div class="text-sm text-gray-600">
              <span class="text-gray-500">ผู้รับเงิน / ผู้บันทึก:</span> <span class="font-semibold text-gray-800">${s.sellerName || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Items Table (Fixed Layout prevents clipping) -->
        <div class="py-2.5">
          <table class="w-full text-left border-collapse text-sm" style="width: 100%; table-layout: fixed;">
            <thead class="bg-gray-100 border-y border-gray-300">
              <tr class="text-gray-700 font-semibold text-sm">
                <th style="width: 44px;" class="py-2.5 px-2 text-center whitespace-nowrap">ลำดับ</th>
                <th class="py-2.5 px-3 text-left">รายการสินค้า</th>
                <th style="width: 55px;" class="py-2.5 px-2 text-center whitespace-nowrap">หน่วย</th>
                <th style="width: 55px;" class="py-2.5 px-2 text-center whitespace-nowrap">จำนวน</th>
                <th style="width: 95px;" class="py-2.5 px-2 text-right whitespace-nowrap">ราคา/หน่วย</th>
                <th style="width: 110px;" class="py-2.5 px-2 text-right whitespace-nowrap">รวมเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Totals Summary Grid (Always 2 Columns) -->
        <div class="grid grid-cols-2 gap-4 pt-3 pb-3">
          <!-- Left: Receipt Notice & Signatures -->
          <div class="flex flex-col justify-between space-y-4">
            <div class="text-xs text-gray-500 leading-relaxed border-l-2 border-emerald-400 pl-2.5">
              • สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืน<br>
              • ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์เมื่อได้รับเงินครบถ้วน<br>
              • ขอบคุณที่อุดหนุนผลิตภัณฑ์วิสาหกิจชุมชนศรีดอนมูล
            </div>
            <div class="grid grid-cols-2 gap-3 text-center pt-1">
              <div>
                <div class="border-b border-dashed border-gray-300 pb-5 mb-1"></div>
                <div class="text-xs text-gray-500">ผู้จ่ายเงิน</div>
              </div>
              <div>
                <div class="border-b border-dashed border-gray-300 pb-1 mb-1 text-xs font-bold text-emerald-800 truncate" title="${s.sellerName || ''}">
                  ${s.sellerName || ''}
                </div>
                <div class="text-xs text-gray-500">ผู้รับเงิน</div>
              </div>
            </div>
          </div>

          <!-- Right: Summary Total Box -->
          <div class="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 flex flex-col justify-center space-y-2">
            <div class="flex justify-between text-sm text-gray-600">
              <span>รวมเป็นเงิน</span>
              <span class="tabular-nums font-bold text-gray-800">${formatBaht(subtotal)}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600 pb-2 border-b border-emerald-200">
              <span>ส่วนลด</span>
              <span class="tabular-nums font-bold text-gray-800">0.00 บาท</span>
            </div>
            <div class="flex justify-between items-baseline pt-1">
              <span class="text-sm sm:text-base font-bold text-emerald-950">รวมเป็นเงินทั้งสิ้น</span>
              <span class="text-xl sm:text-2xl font-bold text-emerald-800 font-mono tabular-nums">${formatBaht(grand)}</span>
            </div>
            <div class="text-right text-xs text-emerald-700 font-medium">บาทถ้วน</div>
          </div>
        </div>

        <!-- Print Footer with Barcode simulation -->
        <div class="border-t border-gray-200 pt-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="h-5 w-28 bg-gray-800 text-transparent" style="background: repeating-linear-gradient(90deg, #1f2937, #1f2937 2px, transparent 2px, transparent 4px, #1f2937 4px, #1f2937 5px, transparent 5px, transparent 7px);">
            </div>
            <span class="text-xs font-mono text-gray-500 tracking-widest">${barDigits}</span>
          </div>
          <div class="text-xs text-gray-400 flex items-center gap-1.5">
            <i class="fas fa-print"></i> พิมพ์เมื่อ: ${printDate}
          </div>
        </div>
      </div>
    `;
  },

  _openReceipt(saleId) {
    const sales = getDirectSales();
    const s = sales.find(x => x.id === saleId || x.invoiceNo === saleId);
    if (!s) return;

    const receiptHtml = `
      <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="p-3 sm:p-5 overflow-y-auto flex-1 bg-slate-100/60 min-h-0">
          ${this._getReceiptContentHtml(s)}
        </div>

        <!-- Action Buttons -->
        <div class="p-3.5 sm:px-6 bg-white border-t border-gray-200 flex justify-between items-center shrink-0 gap-3 shadow-xs">
          <button type="button" class="close-global-modal-btn px-4 sm:px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
            ปิดหน้าต่าง
          </button>
          <div class="flex items-center gap-2.5">
            <button type="button" id="download-receipt-pdf-btn"
              class="px-4 sm:px-5 py-2.5 text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-xs flex items-center gap-2 active:scale-95 cursor-pointer">
              <i class="fas fa-file-pdf text-red-600 text-sm"></i>
              <span>ดาวน์โหลดเป็น PDF</span>
            </button>
            <button type="button" id="print-receipt-btn"
              class="px-5 sm:px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-2 active:scale-95 cursor-pointer">
              <i class="fas fa-print"></i>
              <span>พิมพ์ใบเสร็จ</span>
            </button>
          </div>
        </div>
      </div>
    `;

    openGlobalModal({
      title: `ใบเสร็จรับเงิน — ${s.invoiceNo || s.id}`,
      icon: 'fas fa-receipt',
      size: 'max-w-3xl',
      headerColor: 'bg-emerald-800',
      content: receiptHtml,
      onRender: (dialog) => {
        const printBtn = dialog.querySelector('#print-receipt-btn');
        if (printBtn) {
          printBtn.addEventListener('click', () => {
            this._printReceipt(saleId);
          });
        }

        const downloadPdfBtn = dialog.querySelector('#download-receipt-pdf-btn');
        if (downloadPdfBtn) {
          downloadPdfBtn.addEventListener('click', () => {
            this._downloadReceiptPdf(saleId, downloadPdfBtn);
          });
        }
      }
    });
  },

  /**
   * พิมพ์ใบเสร็จรับเงินอย่างเป็นทางการ (ขนาด A4 คมชัด ไม่ล้นหน้า 1 หน้าพอดีเป๊ะ)
   */
  _printReceipt(saleId) {
    const sales = getDirectSales();
    const s = sales.find(x => x.id === saleId || x.invoiceNo === saleId);
    if (!s) return;

    const receiptHtml = this._getReceiptContentHtml(s);

    let printFrame = document.getElementById('receipt-print-iframe');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'receipt-print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.visibility = 'hidden';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบเสร็จรับเงิน ${s.invoiceNo || s.id}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <style>
          * {
            box-sizing: border-box;
            font-family: 'Sarabun', sans-serif !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 15mm;
          }
          body {
            background: #ffffff !important;
            margin: 0;
            padding: 0;
            color: #0f172a;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .receipt-paper {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
            padding: 24px !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
        </style>
      </head>
      <body>
        <div style="max-width: 780px; margin: 0 auto; padding-top: 4px;">
          ${receiptHtml}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (e) {
        console.error('Print iframe error:', e);
        window.print();
      }
    }, 450);
  },

  /**
   * ดาวน์โหลดใบเสร็จรับเงินเป็นไฟล์ PDF โดยตรง
   */
  _downloadReceiptPdf(saleId, buttonElement = null) {
    const sales = getDirectSales();
    const s = sales.find(x => x.id === saleId || x.invoiceNo === saleId);
    if (!s) return;

    const originalButtonHtml = buttonElement ? buttonElement.innerHTML : null;
    if (buttonElement) {
      buttonElement.disabled = true;
      buttonElement.innerHTML = '<i class="fas fa-circle-notch fa-spin text-sm"></i> กำลังสร้าง PDF...';
    }

    showToast('กำลังเตรียมไฟล์ PDF ใบเสร็จ...', 'info');

    const docId = s.invoiceNo || s.id;
    const cleanCustomerName = (s.customerName || 'ลูกค้า').replace(/[\\/:*?"<>|]/g, '');

    // สร้าง Clean Container ชั่วคราวที่ตำแหน่ง (0, 0) เพื่อป้องกัน html2canvas scroll offset bug
    const printWrapper = document.createElement('div');
    printWrapper.id = 'temp-pdf-clean-wrapper';
    printWrapper.style.position = 'fixed';
    printWrapper.style.left = '0px';
    printWrapper.style.top = '0px';
    printWrapper.style.width = '720px';
    printWrapper.style.maxWidth = '720px';
    printWrapper.style.margin = '0';
    printWrapper.style.padding = '0';
    printWrapper.style.background = '#ffffff';
    printWrapper.style.zIndex = '-9999';
    printWrapper.style.opacity = '1';
    printWrapper.innerHTML = `
      <div style="width: 720px; max-width: 720px; background: #ffffff; padding: 6px; box-sizing: border-box; font-family: 'Sarabun', sans-serif;">
        ${this._getReceiptContentHtml(s)}
      </div>
    `;
    document.body.appendChild(printWrapper);

    const targetElement = printWrapper.firstElementChild;

    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     `ใบเสร็จรับเงิน_${docId}_${cleanCustomerName}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const cleanup = () => {
      if (printWrapper && printWrapper.parentNode) {
        printWrapper.parentNode.removeChild(printWrapper);
      }
      if (buttonElement && originalButtonHtml) {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalButtonHtml;
      }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(targetElement).save().then(() => {
        cleanup();
        showToast(`ดาวน์โหลดไฟล์ PDF ใบเสร็จ #${docId} สำเร็จแล้ว`, 'success');
      }).catch(err => {
        console.error('PDF error:', err);
        cleanup();
        showToast('ไม่สามารถสร้าง PDF ได้ กำลังเปิดหน้าต่างพิมพ์แทน...', 'warning');
        this._openReceipt(saleId);
        setTimeout(() => this._printReceipt(saleId), 400);
      });
    } else {
      cleanup();
      showToast('ระบบจะพิมพ์ผ่านเบราว์เซอร์แทน (สามารถเลือก Save as PDF ได้)', 'info');
      this._openReceipt(saleId);
      setTimeout(() => this._printReceipt(saleId), 400);
    }
  },

  refreshView() {
    const container = document.getElementById('app-view');
    if (container) {
      container.innerHTML = this.render();
      this.init();
    }
  }
};

// ---- helpers ----
function generateBarcode(digits) {
  const bars = [];
  for (let i = 0; i < 80; i++) {
    const d = parseInt(digits[i % digits.length]) || 0;
    const h = 20 + (d * 8);
    const w = (i % 3 === 0) ? 3 : 2;
    const dark = (i + d) % 3 !== 2;
    bars.push(`<div style="width:${w}px;height:${h}px;background:${dark ? '#1a1a1a' : '#e5e7eb'};flex-shrink:0"></div>`);
  }
  return bars.join('');
}

function numberToThaiText(amount) {
  if (amount === 0) return 'ศูนย์บาทถ้วน';
  const integer = Math.floor(amount);
  const decimal = Math.round((amount - integer) * 100);
  const ones = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const tens = ['','สิบ','ยี่สิบ','สามสิบ','สี่สิบ','ห้าสิบ','หกสิบ','เจ็ดสิบ','แปดสิบ','เก้าสิบ'];
  const places = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];

  function convert(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 100) {
      const t = Math.floor(n / 10), o = n % 10;
      return (tens[t] || '') + (o ? ones[o] : '');
    }
    const digits = String(n).split('').reverse();
    return digits.reduceRight((acc, d, i) => {
      return acc + (parseInt(d) ? ones[parseInt(d)] + places[i] : '');
    }, '');
  }

  const intText = convert(integer) + 'บาท';
  const decText = decimal > 0 ? convert(decimal) + 'สตางค์' : 'ถ้วน';
  return intText + decText;
}
