// Settings Component for Enterprise Configuration
import { appState } from '../state.js';
import { showToast } from '../helpers.js';

export const SettingsComponent = {
  render() {
    const profile = appState.getEnterprise();
    
    return `
      <div class="fade-in max-w-4xl mx-auto">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-cogs text-emerald-700"></i>
              ตั้งค่าข้อมูลวิสาหกิจชุมชน
            </h1>
            <p class="text-sm text-gray-500 mt-1">ตั้งค่าชื่อกลุ่ม ที่อยู่ และข้อมูลพื้นฐานสำหรับใช้งานในระบบให้สอดคล้องกับแต่ละพื้นที่</p>
          </div>
        </div>

        <!-- Form Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <form id="settings-form" class="space-y-6">
            
            <div class="border-b border-gray-100 pb-4">
              <h3 class="text-lg font-medium text-emerald-800 flex items-center gap-2">
                <i class="fas fa-home"></i> ข้อมูลกลุ่มเบื้องต้น
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name -->
              <div class="md:col-span-2">
                <label for="ent-name" class="block text-sm font-medium text-gray-700 mb-2">ชื่อกลุ่มวิสาหกิจชุมชน *</label>
                <input type="text" id="ent-name" name="name" value="${profile.name}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Chairman -->
              <div>
                <label for="ent-chairman" class="block text-sm font-medium text-gray-700 mb-2">ประธานวิสาหกิจชุมชน</label>
                <input type="text" id="ent-chairman" name="chairman" value="${profile.chairman || ''}"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Phone -->
              <div>
                <label for="ent-phone" class="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์ติดต่อ *</label>
                <input type="text" id="ent-phone" name="phone" value="${profile.phone}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Email -->
              <div class="md:col-span-2">
                <label for="ent-email" class="block text-sm font-medium text-gray-700 mb-2">อีเมลติดต่อ</label>
                <input type="email" id="ent-email" name="email" value="${profile.email || ''}"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Description -->
              <div class="md:col-span-2">
                <label for="ent-desc" class="block text-sm font-medium text-gray-700 mb-2">คำอธิบายกลุ่ม / วัตถุประสงค์</label>
                <textarea id="ent-desc" name="description" rows="3"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">${profile.description || ''}</textarea>
              </div>
            </div>

            <div class="border-b border-gray-100 pb-4 pt-4">
              <h3 class="text-lg font-medium text-emerald-800 flex items-center gap-2">
                <i class="fas fa-map-marker-alt"></i> ที่ตั้งสำนักงานวิสาหกิจ
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Village -->
              <div>
                <label for="ent-village" class="block text-sm font-medium text-gray-700 mb-2">หมู่บ้าน/หมู่ที่ *</label>
                <input type="text" id="ent-village" name="village" value="${profile.village}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" placeholder="เช่น หมู่ 4 บ้านหนองเขียว">
              </div>

              <!-- Sub-district -->
              <div>
                <label for="ent-subdistrict" class="block text-sm font-medium text-gray-700 mb-2">ตำบล *</label>
                <input type="text" id="ent-subdistrict" name="subdistrict" value="${profile.subdistrict}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- District -->
              <div>
                <label for="ent-district" class="block text-sm font-medium text-gray-700 mb-2">อำเภอ *</label>
                <input type="text" id="ent-district" name="district" value="${profile.district}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Province -->
              <div>
                <label for="ent-province" class="block text-sm font-medium text-gray-700 mb-2">จังหวัด *</label>
                <input type="text" id="ent-province" name="province" value="${profile.province}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Zipcode -->
              <div>
                <label for="ent-zipcode" class="block text-sm font-medium text-gray-700 mb-2">รหัสไปรษณีย์ *</label>
                <input type="text" id="ent-zipcode" name="zipcode" value="${profile.zipcode}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end pt-4 gap-3">
              <button type="button" id="reset-settings-btn"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none">
                รีเซ็ตค่าเริ่มต้น
              </button>
              <button type="submit"
                class="px-6 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm focus:outline-none flex items-center gap-2">
                <i class="fas fa-save"></i> บันทึกการเปลี่ยนแปลง
              </button>
            </div>

          </form>
        </div>
      </div>
    `;
  },

  init() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const updatedProfile = {
        name: formData.get('name'),
        chairman: formData.get('chairman'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        description: formData.get('description'),
        village: formData.get('village'),
        subdistrict: formData.get('subdistrict'),
        district: formData.get('district'),
        province: formData.get('province'),
        zipcode: formData.get('zipcode')
      };

      try {
        appState.saveEnterprise(updatedProfile);
        showToast('บันทึกข้อมูลวิสาหกิจเรียบร้อยแล้ว');
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      }
    });

    const resetBtn = document.getElementById('reset-settings-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการรีเซ็ตค่าระบบตั้งต้นของระบบสาธิตใช่หรือไม่?')) {
          localStorage.removeItem('herb_enterprise_profile');
          appState.init();
          // Reload settings view
          const main = document.getElementById('app-view');
          if (main) {
            main.innerHTML = this.render();
            this.init();
          }
          showToast('รีเซ็ตข้อมูลวิสาหกิจแล้ว');
          
          // Force update main title
          const profile = appState.getEnterprise();
          if (appState.onEnterpriseChange) {
            appState.onEnterpriseChange(profile);
          }
        }
      });
    }
  }
};
