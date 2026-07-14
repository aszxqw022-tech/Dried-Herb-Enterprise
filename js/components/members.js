// Members Management Component
import { appState } from '../state.js';
import { formatThaiDate, showToast } from '../helpers.js';

export const MembersComponent = {
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  roleFilter: '',
  statusFilter: '',
  editingMemberId: null,
  currentPhotoBase64: '',

  render() {
    const allMembers = appState.getMembers();
    
    // Apply filters and search
    let filtered = allMembers.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          m.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          m.phone.includes(this.searchQuery);
      
      const matchRole = this.roleFilter ? m.role === this.roleFilter : true;

      return matchSearch && matchRole;
    });

    // Pagination calculations
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const paginated = filtered.slice(startIndex, startIndex + this.pageSize);

    // Build role filter options
    const roles = [...new Set(allMembers.map(m => m.role))];
    const roleOptions = roles.map(r => `
      <option value="${r}" ${this.roleFilter === r ? 'selected' : ''}>${r}</option>
    `).join('');

    // Table rows
    const rowsHtml = paginated.length === 0 
      ? `<tr><td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500">ไม่พบข้อมูลสมาชิกตามที่ระบุ</td></tr>`
      : paginated.map(m => {
          const avatarHtml = m.photo 
            ? `<img src="${m.photo}" class="w-10 h-10 rounded-full object-cover border border-emerald-100 shadow-sm flex-shrink-0">`
            : `<div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-100 shadow-sm flex-shrink-0">${m.name.charAt(0) || 'M'}</div>`;

          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-4 text-sm font-semibold text-emerald-800">${m.id}</td>
              <td class="px-6 py-4 flex items-center gap-3">
                ${avatarHtml}
                <div>
                  <div class="text-sm font-bold text-gray-900">${m.name}</div>
                  <div class="text-xs text-gray-400">บทบาท: ${m.role}</div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">${m.phone}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${m.villageNumber || '-'}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${formatThaiDate(m.joinDate)}</td>
              <td class="px-6 py-4 text-sm font-medium text-right space-x-1">
                <button data-id="${m.id}" class="edit-member-btn text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors" title="แก้ไขข้อมูล">
                  <i class="fas fa-edit"></i>
                </button>
                <button data-id="${m.id}" class="delete-member-btn text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="ลบสมาชิก">
                  <i class="fas fa-trash-alt"></i>
                </button>
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
              จัดการข้อมูลสมาชิกวิสาหกิจชุมชน
            </h1>
            <p class="text-sm text-gray-500 mt-1">ทะเบียนประวัติเกษตรกรผู้ปลูกสมุนไพรอบแห้งจำลอง (ยอดรวมทั้งหมด ${allMembers.length} ราย)</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button id="quick-mock-member-btn" class="px-4 py-2.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-magic"></i> สุ่มจำลองสมาชิกเพิ่ม
            </button>
            <button id="add-member-btn" class="px-4 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-user-plus"></i> เพิ่มสมาชิกใหม่
            </button>
          </div>
        </div>

        <!-- Filters & Search Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search input -->
          <div class="md:col-span-2 relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search"></i>
            </span>
            <input type="text" id="member-search" value="${this.searchQuery}" placeholder="ค้นหา ชื่อ, รหัสสมาชิก หรือเบอร์โทรศัพท์..." 
              class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
          </div>

          <!-- Role Filter -->
          <div>
            <select id="member-role-filter" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">ทุกบทบาทหน้าที่</option>
              ${roleOptions}
            </select>
          </div>
        </div>

        <!-- Table Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                  <th class="px-6 py-4">รหัสสมาชิก</th>
                  <th class="px-6 py-4">ชื่อ - นามสกุล</th>
                  <th class="px-6 py-4">เบอร์โทรศัพท์</th>
                  <th class="px-6 py-4">หมู่บ้าน</th>
                  <th class="px-6 py-4">วันที่ลงทะเบียน</th>
                  <th class="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-xs text-gray-500">
              กำลังแสดงรายการที่ <span class="font-bold">${totalItems === 0 ? 0 : startIndex + 1}</span> ถึง <span class="font-bold">${endIndex}</span> จากทั้งหมด <span class="font-bold">${totalItems}</span> รายการ
            </div>
            
            <div class="flex items-center gap-2">
              <button id="prev-page-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors">
                <i class="fas fa-chevron-left mr-1"></i> ก่อนหน้า
              </button>
              
              <span class="text-xs text-gray-600 font-medium">หน้า ${this.currentPage} / ${totalPages}</span>

              <button id="next-page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors">
                ถัดไป <i class="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Add/Edit Member Modal (Hidden by default) -->
        <div id="member-modal" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center p-4 bg-black bg-opacity-40 transition-opacity">
          <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl transform transition-all border border-gray-100">
            <!-- Modal Header -->
            <div class="bg-emerald-800 px-6 py-4 text-white flex justify-between items-center">
              <h3 id="modal-title" class="font-bold text-lg flex items-center gap-2">
                <i class="fas fa-user-edit"></i> เพิ่มสมาชิกใหม่
              </h3>
              <button type="button" class="close-modal-btn text-white opacity-80 hover:opacity-100 text-xl focus:outline-none">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- Modal Body Form -->
            <form id="member-modal-form" class="p-6 space-y-4">
              <!-- Photo Upload Field -->
              <div class="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
                <div id="mem-photo-preview" class="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-250 flex items-center justify-center text-emerald-800 text-xl font-bold overflow-hidden flex-shrink-0">
                  <i class="fas fa-user-circle text-emerald-500 text-4xl"></i>
                </div>
                <div class="space-y-1">
                  <label for="mem-photo" class="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer transition-colors shadow-sm inline-block">
                    <i class="fas fa-camera mr-1"></i> เลือกรูปถ่ายสมาชิก
                  </label>
                  <input type="file" id="mem-photo" accept="image/*" class="hidden">
                  <p class="text-[10px] text-gray-400">แนะนำรูปจัตุรัส ขนาดไม่เกิน 1MB</p>
                  <button type="button" id="remove-mem-photo-btn" class="hidden text-[10px] text-red-500 hover:underline font-semibold block">
                    <i class="fas fa-trash-alt mr-0.5"></i> ลบรูปถ่าย
                  </button>
                </div>
              </div>
              <!-- Name -->
              <div>
                <label for="mem-name" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชื่อ-นามสกุลสมาชิก *</label>
                <input type="text" id="mem-name" name="name" required placeholder="เช่น นายเกษตร มั่นคง"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Role -->
                <div>
                  <label for="mem-role" class="block text-xs font-semibold text-gray-500 uppercase mb-1">บทบาทหน้าที่ *</label>
                  <select id="mem-role" name="role" required 
                    class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="สมาชิกทั่วไป">สมาชิกทั่วไป</option>
                    <option value="กรรมการ">กรรมการ</option>
                    <option value="เลขานุการ">เลขานุการ</option>
                    <option value="เหรัญญิก">เหรัญญิก</option>
                    <option value="รองประธาน">รองประธาน</option>
                    <option value="ประธานกลุ่ม">ประธานกลุ่ม</option>
                  </select>
                </div>

                <!-- Phone -->
                <div>
                  <label for="mem-phone" class="block text-xs font-semibold text-gray-500 uppercase mb-1">เบอร์โทรศัพท์ *</label>
                  <input type="text" id="mem-phone" name="phone" required placeholder="08X-XXX-XXXX"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
              </div>

              <div>
                <label for="mem-village" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ที่อยู่หมู่บ้าน/หมู่ที่ *</label>
                <input type="text" id="mem-village" name="villageNumber" required placeholder="เช่น หมู่ 4"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Join Date -->
              <div>
                <label for="mem-joindate" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่เข้าร่วมเป็นสมาชิก *</label>
                <input type="date" id="mem-joindate" name="joinDate" required
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Footer Buttons -->
              <div class="flex justify-end pt-4 gap-2.5">
                <button type="button" class="close-modal-btn px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1">
                  <i class="fas fa-save"></i> บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    this.bindSearchAndFilters();
    this.bindPagination();
    this.bindModalEvents();
    this.bindMemberActions();
    this.bindQuickMock();
  },

  bindSearchAndFilters() {
    const searchInput = document.getElementById('member-search');
    const roleFilter = document.getElementById('member-role-filter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.refreshView();
      });
    }

    if (roleFilter) {
      roleFilter.addEventListener('change', (e) => {
        this.roleFilter = e.target.value;
        this.currentPage = 1;
        this.refreshView();
      });
    }
  },

  bindPagination() {
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.refreshView();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentPage++;
        this.refreshView();
      });
    }
  },

  bindModalEvents() {
    const modal = document.getElementById('member-modal');
    const addBtn = document.getElementById('add-member-btn');
    const closeBtns = document.querySelectorAll('.close-modal-btn');
    const form = document.getElementById('member-modal-form');

    if (addBtn && modal) {
      addBtn.addEventListener('click', () => {
        this.editingMemberId = null;
        this.currentPhotoBase64 = '';
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-user-plus"></i> เพิ่มสมาชิกใหม่';
        if (form) {
          form.reset();
          // Pre-fill today's date
          document.getElementById('mem-joindate').value = new Date().toISOString().split('T')[0];
          
          const preview = document.getElementById('mem-photo-preview');
          const removeBtn = document.getElementById('remove-mem-photo-btn');
          if (preview) {
            preview.innerHTML = `<i class="fas fa-user-circle text-emerald-500 text-4xl"></i>`;
          }
          if (removeBtn) {
            removeBtn.classList.add('hidden');
          }
        }
        modal.classList.remove('hidden');
      });
    }

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (modal) modal.classList.add('hidden');
      });
    });

    // Handle photo select event
    const photoInput = document.getElementById('mem-photo');
    const photoPreview = document.getElementById('mem-photo-preview');
    const removePhotoBtn = document.getElementById('remove-mem-photo-btn');

    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1.2 * 1024 * 1024) {
            showToast('ไฟล์รูปภาพมีขนาดใหญ่เกินไป (แนะนำไม่เกิน 1MB)', 'warning');
            photoInput.value = '';
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            this.currentPhotoBase64 = event.target.result;
            if (photoPreview) {
              photoPreview.innerHTML = `<img src="${this.currentPhotoBase64}" class="w-full h-full object-cover">`;
            }
            if (removePhotoBtn) {
              removePhotoBtn.classList.remove('hidden');
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', () => {
        this.currentPhotoBase64 = '';
        if (photoInput) photoInput.value = '';
        if (photoPreview) {
          photoPreview.innerHTML = `<i class="fas fa-user-circle text-emerald-500 text-4xl"></i>`;
        }
        removePhotoBtn.classList.add('hidden');
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {
          name: formData.get('name'),
          role: formData.get('role'),
          phone: formData.get('phone'),
          villageNumber: formData.get('villageNumber'),
          status: 'active',
          joinDate: formData.get('joinDate'),
          photo: this.currentPhotoBase64 || null
        };

        try {
          if (this.editingMemberId) {
            appState.updateMember(this.editingMemberId, data);
            showToast('อัปเดตข้อมูลสมาชิกเรียบร้อยแล้ว');
          } else {
            appState.addMember(data);
            showToast('เพิ่มสมาชิกรายใหม่สำเร็จ');
          }
          if (modal) modal.classList.add('hidden');
          this.refreshView();
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        }
      });
    }
  },

  bindMemberActions() {
    // Edit actions
    const editBtns = document.querySelectorAll('.edit-member-btn');
    const modal = document.getElementById('member-modal');
    const form = document.getElementById('member-modal-form');

    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const member = appState.getMemberById(id);
        
        if (member && modal) {
          this.editingMemberId = id;
          document.getElementById('modal-title').innerHTML = `<i class="fas fa-user-edit"></i> แก้ไขข้อมูลสมาชิก (${id})`;
          
          document.getElementById('mem-name').value = member.name;
          document.getElementById('mem-role').value = member.role;
          document.getElementById('mem-phone').value = member.phone;
          document.getElementById('mem-village').value = member.villageNumber;
          document.getElementById('mem-joindate').value = member.joinDate;

          this.currentPhotoBase64 = member.photo || '';
          const preview = document.getElementById('mem-photo-preview');
          const removeBtn = document.getElementById('remove-mem-photo-btn');
          if (preview) {
            if (member.photo) {
              preview.innerHTML = `<img src="${member.photo}" class="w-full h-full object-cover">`;
              if (removeBtn) removeBtn.classList.remove('hidden');
            } else {
              preview.innerHTML = `<i class="fas fa-user-circle text-emerald-500 text-4xl"></i>`;
              if (removeBtn) removeBtn.classList.add('hidden');
            }
          }

          modal.classList.remove('hidden');
        }
      });
    });

    // Delete actions
    const deleteBtns = document.querySelectorAll('.delete-member-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const member = appState.getMemberById(id);
        if (confirm(`คุณต้องการลบข้อมูลของ "${member.name}" ใช่หรือไม่?`)) {
          try {
            appState.deleteMember(id);
            showToast(`ลบข้อมูลสมาชิก ${id} สำเร็จ`);
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  },

  bindQuickMock() {
    const quickBtn = document.getElementById('quick-mock-member-btn');
    if (quickBtn) {
      quickBtn.addEventListener('click', () => {
        const mockFirstNames = ['ทองดี', 'สมคิด', 'ประสิทธิ์', 'กิตติ', 'อรทัย', 'ดวงใจ', 'สุวรรณ', 'ชลธิชา', 'ธีรพล', 'จิราภรณ์'];
        const mockLastNames = ['รักดี', 'เกษตรไพร', 'ศรีสมุนไพร', 'ทองมี', 'พึ่งตน', 'มั่นคง', 'ยอดเกษตร', 'สมบูรณ์', 'ดินดี', 'สุขใจ'];
        const mockRoles = ['สมาชิกทั่วไป', 'สมาชิกทั่วไป', 'สมาชิกทั่วไป', 'กรรมการ'];
        
        const randomName = `${mockFirstNames[Math.floor(Math.random() * mockFirstNames.length)]} ${mockLastNames[Math.floor(Math.random() * mockLastNames.length)]}`;
        const randomRole = mockRoles[Math.floor(Math.random() * mockRoles.length)];
        const randomPhone = `08${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
        const randomVillage = `หมู่ ${Math.floor(Math.random() * 5) + 1}`;
        const randomJoinDate = `2024-${String(Math.floor(Math.random() * 6) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;

        const newMember = {
          name: randomName,
          role: randomRole,
          phone: randomPhone,
          villageNumber: randomVillage,
          status: 'active',
          joinDate: randomJoinDate
        };

        try {
          const added = appState.addMember(newMember);
          showToast(`จำลองสมาชิกใหม่สำเร็จ: ${added.name} (${added.id})`);
          this.refreshView();
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการจำลองข้อมูล', 'error');
        }
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
