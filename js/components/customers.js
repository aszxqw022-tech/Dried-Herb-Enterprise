// Customers Component for Customer Management & Purchase Tracking
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const CustomersComponent = {
  searchQuery: '',
  selectedTypeFilter: '',
  editingCustomerId: null,
  viewingHistoryCustomerId: null,

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    if (isMember) {
      return `
        <div class="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <i class="fas fa-lock text-4xl text-gray-400 mb-3"></i>
          <h2 class="text-base font-bold text-gray-700">สิทธิ์การเข้าถึงถูกจำกัด</h2>
          <p class="text-xs text-gray-400 mt-1">ส่วนงานนี้สำหรับประธานกลุ่มและเจ้าหน้าที่/เหรัญญิกเท่านั้น</p>
        </div>
      `;
    }

    const customers = appState.getCustomers();
    const allSales = appState.getSales();

    // Compute metrics
    const totalCustomers = customers.length;
    const cafeCount = customers.filter(c => c.customerType === 'ร้านคาเฟ่/ร้านขายของฝาก').length;
    const distributorCount = customers.filter(c => c.customerType === 'ตัวแทนจำหน่าย').length;
    const generalCount = customers.filter(c => c.customerType === 'ลูกค้าทั่วไป' || !c.customerType).length;

    // Filter customers
    const filteredCustomers = customers.filter(c => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.contactChannel && c.contactChannel.toLowerCase().includes(q));

      const matchType = !this.selectedTypeFilter || c.customerType === this.selectedTypeFilter;
      return matchSearch && matchType;
    });

    const getCustomerSalesStats = (cust) => {
      const custSales = allSales.filter(s => s.customerId === cust.id || s.customer === cust.name);
      const totalAmount = custSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
      const orderCount = custSales.length;
      return { orderCount, totalAmount, sales: custSales };
    };

    const tableRowsHtml = filteredCustomers.length === 0
      ? `<tr><td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500">ไม่พบข้อมูลลูกค้าตรงตามเงื่อนไขการค้นหา</td></tr>`
      : filteredCustomers.map(c => {
          const stats = getCustomerSalesStats(c);
          let badgeColor = 'bg-gray-100 text-gray-700';
          if (c.customerType === 'ร้านคาเฟ่/ร้านขายของฝาก') badgeColor = 'bg-amber-100 text-amber-800';
          else if (c.customerType === 'ตัวแทนจำหน่าย') badgeColor = 'bg-blue-100 text-blue-800';
          else if (c.customerType === 'ซื้อส่งโรงงาน') badgeColor = 'bg-purple-100 text-purple-800';
          else if (c.customerType === 'ลูกค้าทั่วไป') badgeColor = 'bg-emerald-100 text-emerald-800';

          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-4">
                <span class="text-xs font-black text-emerald-900">${c.id}</span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-gray-800">${c.name}</div>
                <div class="text-xs text-gray-400 mt-0.5">${c.address || '-'}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${badgeColor}">
                  ${c.customerType || 'ลูกค้าทั่วไป'}
                </span>
              </td>
              <td class="px-6 py-4 text-xs text-gray-600">
                <div class="font-semibold text-gray-800"><i class="fas fa-phone mr-1 text-gray-400"></i>${c.phone || '-'}</div>
                <div class="text-gray-500 text-[11px] mt-0.5">${c.contactChannel ? `<i class="fas fa-comment-dots mr-1 text-emerald-600"></i>${c.contactChannel}` : '-'}</div>
              </td>
              <td class="px-6 py-4 text-sm font-black text-emerald-800">
                ${formatBaht(stats.totalAmount)}
                <span class="block text-[10px] text-gray-400 font-normal">${stats.orderCount} คำสั่งซื้อ</span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button data-id="${c.id}" class="view-cust-history-btn px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all" title="ดูประวัติการซื้อ">
                    <i class="fas fa-receipt mr-1"></i> ยอดซื้อ
                  </button>
                  <button data-id="${c.id}" class="edit-cust-btn p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all" title="แก้ไขข้อมูล">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button data-id="${c.id}" class="delete-cust-btn p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all" title="ลบลูกค้า">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
    return `
      <div class="fade-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-users text-emerald-700"></i>
              ข้อมูลลูกค้า (Customers)
            </h1>
            <p class="text-sm text-gray-500 mt-1">จัดการทะเบียนรายชื่อลูกค้า ฐานข้อมูลคู่ค้า ช่องทางติดต่อ และตรวจสอบประวัติยอดสั่งซื้อ</p>
          </div>
          <div>
            <button id="open-add-cust-modal-btn" class="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-user-plus"></i> เพิ่มลูกค้าใหม่
            </button>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span class="text-xs font-medium text-gray-400 block">ลูกค้าทั้งหมด</span>
            <span class="text-2xl font-black text-gray-800 mt-1 block">${totalCustomers} ราย</span>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span class="text-xs font-medium text-gray-400 block">ร้านคาเฟ่ / ของฝาก</span>
            <span class="text-2xl font-black text-amber-700 mt-1 block">${cafeCount} ราย</span>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span class="text-xs font-medium text-gray-400 block">ตัวแทนจำหน่าย</span>
            <span class="text-2xl font-black text-blue-700 mt-1 block">${distributorCount} ราย</span>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span class="text-xs font-medium text-gray-400 block">ลูกค้าทั่วไป</span>
            <span class="text-2xl font-black text-emerald-700 mt-1 block">${generalCount} ราย</span>
          </div>
        </div>

        <!-- Filter and Search Row -->
        <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="relative flex-1 max-w-md">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search text-xs"></i>
            </span>
            <input type="text" id="cust-search-input" value="${this.searchQuery}" placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, ที่อยู่..." 
              class="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>

          <div class="flex items-center gap-2">
            <label for="cust-type-filter" class="text-xs font-bold text-gray-500 whitespace-nowrap">ประเภทลูกค้า:</label>
            <select id="cust-type-filter" class="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">ทั้งหมด (${totalCustomers})</option>
              <option value="ลูกค้าทั่วไป" ${this.selectedTypeFilter === 'ลูกค้าทั่วไป' ? 'selected' : ''}>ลูกค้าทั่วไป</option>
              <option value="ร้านคาเฟ่/ร้านขายของฝาก" ${this.selectedTypeFilter === 'ร้านคาเฟ่/ร้านขายของฝาก' ? 'selected' : ''}>ร้านคาเฟ่/ร้านขายของฝาก</option>
              <option value="ตัวแทนจำหน่าย" ${this.selectedTypeFilter === 'ตัวแทนจำหน่าย' ? 'selected' : ''}>ตัวแทนจำหน่าย</option>
              <option value="ซื้อส่งโรงงาน" ${this.selectedTypeFilter === 'ซื้อส่งโรงงาน' ? 'selected' : ''}>ซื้อส่งโรงงาน</option>
            </select>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                  <th class="px-6 py-3.5">รหัส</th>
                  <th class="px-6 py-3.5">ชื่อลูกค้า / บริษัท</th>
                  <th class="px-6 py-3.5">ประเภท</th>
                  <th class="px-6 py-3.5">การติดต่อ / เบอร์โทร</th>
                  <th class="px-6 py-3.5">ยอดสั่งซื้อสะสม</th>
                  <th class="px-6 py-3.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  init() {
    const searchInput = document.getElementById('cust-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }

    const typeFilter = document.getElementById('cust-type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.selectedTypeFilter = e.target.value;
        this.refreshView();
      });
    }

    const openAddBtn = document.getElementById('open-add-cust-modal-btn');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => {
        this.openCustomerModal(null);
      });
    }

    // Edit button click
    const editBtns = document.querySelectorAll('.edit-cust-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openCustomerModal(id);
      });
    });

    // Delete button click
    const deleteBtns = document.querySelectorAll('.delete-cust-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`คุณต้องการลบข้อมูลลูกค้ารหัส "${id}" ใช่หรือไม่?`)) {
          try {
            appState.deleteCustomer(id);
            showToast(`ลบข้อมูลลูกค้ารหัส ${id} เรียบร้อยแล้ว`);
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // View Sales History button click
    const historyBtns = document.querySelectorAll('.view-cust-history-btn');
    historyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.showCustomerHistoryModal(id);
      });
    });
  },

  openCustomerModal(id = null) {
    this.editingCustomerId = id;
    const cust = id ? appState.getCustomerById(id) : null;
    const isEdit = !!cust;

    const title = isEdit ? `แก้ไขข้อมูลลูกค้า (${cust.id})` : 'เพิ่มข้อมูลลูกค้าใหม่';
    const icon = isEdit ? 'fas fa-edit' : 'fas fa-user-plus';

    const formHtml = `
      <form id="global-customer-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="cust-name" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชื่อลูกค้า / ชื่อร้านค้า *</label>
              <input type="text" id="cust-name" name="name" required value="${cust ? cust.name : ''}" placeholder="เช่น ร้านชาสมุนไพรม่อนแจ่ม, คุณสมศรี"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="cust-type" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ประเภทลูกค้า *</label>
              <select id="cust-type" name="customerType" required
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="ลูกค้าทั่วไป" ${cust && cust.customerType === 'ลูกค้าทั่วไป' ? 'selected' : ''}>ลูกค้าทั่วไป</option>
                <option value="ร้านคาเฟ่/ร้านขายของฝาก" ${cust && cust.customerType === 'ร้านคาเฟ่/ร้านขายของฝาก' ? 'selected' : ''}>ร้านคาเฟ่/ร้านขายของฝาก</option>
                <option value="ตัวแทนจำหน่าย" ${cust && cust.customerType === 'ตัวแทนจำหน่าย' ? 'selected' : ''}>ตัวแทนจำหน่าย</option>
                <option value="ซื้อส่งโรงงาน" ${cust && cust.customerType === 'ซื้อส่งโรงงาน' ? 'selected' : ''}>ซื้อส่งโรงงาน</option>
              </select>
            </div>

            <div>
              <label for="cust-phone" class="block text-xs font-semibold text-gray-500 uppercase mb-1">เบอร์โทรศัพท์ *</label>
              <input type="text" id="cust-phone" name="phone" required value="${cust ? (cust.phone || '') : ''}" placeholder="เช่น 081-234-5678"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="cust-channel" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ช่องทางติดต่ออื่นๆ (Line / Facebook)</label>
              <input type="text" id="cust-channel" name="contactChannel" value="${cust ? (cust.contactChannel || '') : ''}" placeholder="เช่น Line: @mytea, FB: ชาสมุนไพร"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div class="md:col-span-2">
              <label for="cust-address" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ที่อยู่จัดส่ง / ที่อยู่ร้านค้า</label>
              <textarea id="cust-address" name="address" rows="3" placeholder="ระบุที่อยู่จัดส่งสินค้า ตำบล อำเภอ จังหวัด"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">${cust ? (cust.address || '') : ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Footer (Fixed) -->
        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-save"></i> บันทึกข้อมูล
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title,
      icon,
      size: 'max-w-4xl',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-customer-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            const payload = {
              name: formData.get('name'),
              customerType: formData.get('customerType'),
              phone: formData.get('phone'),
              contactChannel: formData.get('contactChannel'),
              address: formData.get('address')
            };

            try {
              if (id) {
                appState.updateCustomer(id, payload);
                showToast('อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว');
              } else {
                const added = appState.addCustomer(payload);
                showToast(`เพิ่มลูกค้าใหม่รหัส ${added.id} สำเร็จ`);
              }
              closeGlobalModal();
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  showCustomerHistoryModal(id) {
    const cust = appState.getCustomerById(id);
    if (!cust) return;

    const allSales = appState.getSales();
    const customerSales = allSales.filter(s => s.customerId === cust.id);
    const totalAmount = customerSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);

    const historyContent = `
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <span class="text-[11px] text-emerald-700 font-bold block">ยอดซื้อรวมทั้งหมด</span>
              <span class="text-xl font-black text-emerald-900 mt-1 block">${formatBaht(totalAmount)}</span>
            </div>
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
              <span class="text-[11px] text-gray-500 font-bold block">จำนวนครั้งที่สั่งซื้อ</span>
              <span class="text-xl font-black text-gray-800 mt-1 block">${customerSales.length} ครั้ง</span>
            </div>
            <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center col-span-2 sm:col-span-1">
              <span class="text-[11px] text-amber-700 font-bold block">เบอร์ติดต่อ</span>
              <span class="text-sm font-bold text-gray-800 mt-1 block">${cust.phone || '-'}</span>
            </div>
          </div>

          <div class="space-y-3">
            <span class="text-xs font-bold text-gray-700 block">รายการคำสั่งซื้อสินค้า</span>
            ${customerSales.length === 0 
              ? `<div class="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">ยังไม่มีประวัติการสั่งซื้อสำหรับลูกค้ารายนี้</div>`
              : `
                <div class="overflow-x-auto rounded-xl border border-gray-100">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                        <th class="p-3.5">รหัสการขาย</th>
                        <th class="p-3.5">ล็อตสินค้า</th>
                        <th class="p-3.5">ประเภท</th>
                        <th class="p-3.5 text-right">จำนวน</th>
                        <th class="p-3.5 text-right">ยอดรวม</th>
                        <th class="p-3.5">วันที่</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${customerSales.map(s => {
                        const inv = appState.getInventoryByCropId(s.cropId);
                        const herbType = inv ? inv.herbType : 'สมุนไพร';
                        return `
                          <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                            <td class="p-3.5 font-bold text-emerald-800">${s.id}</td>
                            <td class="p-3.5">${s.cropId} (${herbType})</td>
                            <td class="p-3.5">${s.saleType === 'jar' ? 'กระปุก' : 'กก. วัตถุดิบ'}</td>
                            <td class="p-3.5 text-right font-medium">${s.amount || s.amountKg} ${s.saleType === 'jar' ? 'กระปุก' : 'กก.'}</td>
                            <td class="p-3.5 text-right font-black text-emerald-800">${formatBaht(s.totalPrice)}</td>
                            <td class="p-3.5 text-gray-500">${formatThaiDate(s.date)}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `}
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
      title: `ประวัติยอดซื้อ: ${cust.name}`,
      icon: 'fas fa-receipt',
      size: 'max-w-5xl',
      headerColor: 'bg-[#1e4620]',
      content: historyContent
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