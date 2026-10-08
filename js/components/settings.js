// Settings Component for Enterprise Configuration and Automatic Organization Chart
import { appState } from '../state.js';
import { showToast } from '../helpers.js';

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderOrgChartTreeHtml(members = [], enterprise = {}) {
  const activeMembers = members.filter(m => m && m.status !== 'inactive');

  // 1. President (ประธานกลุ่ม)
  const president = activeMembers.find(m => m.role === 'ประธานกลุ่ม' || (m.role && m.role.includes('ประธาน') && !m.role.includes('รอง')))
    || (enterprise.chairman ? { name: enterprise.chairman, phone: enterprise.phone || '-', role: 'ประธานกลุ่ม' } : null)
    || { name: 'นายวีรวัฒน์ ปินทรายมูล', phone: '061-139-1105', role: 'ประธานกลุ่ม' };

  // 2. Vice President (รองประธานกลุ่ม)
  const vicePresidents = activeMembers.filter(m => m.role === 'รองประธาน' || (m.role && m.role.includes('รองประธาน')));
  const vicePresident = vicePresidents[0] || { name: 'นางแหม่ม สุตินกาศ', phone: '089-765-4321', role: 'รองประธาน' };

  // 3. Treasurer (เหรัญญิก)
  const treasurer = activeMembers.find(m => m.role === 'เหรัญญิก' || (m.role && (m.role.includes('เหรัญญิก') || m.role.includes('การเงิน') || m.role.includes('บัญชี'))))
    || { name: 'นายมานะ รักเกษตร', phone: '081-234-5699', role: 'เหรัญญิก' };

  // 4. Secretary (เลขานุการ)
  const secretary = activeMembers.find(m => m.role === 'เลขานุการ' || (m.role && (m.role.includes('เลขานุการ') || m.role.includes('สารบรรณ'))))
    || { name: 'นางสมศรี มีวิถี', phone: '081-234-5604', role: 'เลขานุการ' };

  // 5. Board Members (คณะกรรมการ / ฝ่ายปฏิบัติการ)
  const assignedIds = new Set([president.id, vicePresident.id, treasurer.id, secretary.id].filter(Boolean));
  const assignedNames = new Set([president.name, vicePresident.name, treasurer.name, secretary.name].filter(Boolean));

  let boardMembers = activeMembers.filter(m => {
    if (assignedIds.has(m.id) || assignedNames.has(m.name)) return false;
    return m.role === 'กรรมการ' || (m.role && m.role.includes('กรรมการ')) || (m.role !== 'สมาชิกทั่วไป' && !m.role.includes('สมาชิก'));
  });

  // If no explicit board members found, fallback to first few members so the tree displays nicely
  if (boardMembers.length === 0) {
    const candidates = activeMembers.filter(m => !assignedIds.has(m.id) && !assignedNames.has(m.name)).slice(0, 3);
    if (candidates.length > 0) {
      boardMembers = candidates.map(m => ({ ...m, role: 'กรรมการ' }));
    }
  }

  return `
    <div class="flex flex-col items-center py-6 min-w-[320px] select-none">
      
      <!-- LEVEL 1: ประธานกลุ่ม (Top Node) -->
      <div class="relative flex flex-col items-center">
        <div class="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white rounded-2xl shadow-lg shadow-emerald-900/20 border-2 border-emerald-400/60 p-4 sm:p-5 w-72 max-w-full text-center relative transform hover:scale-[1.02] transition-transform">
          <div class="inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-600/70 border-2 border-amber-300 text-amber-300 shadow mb-2">
            <i class="fas fa-crown text-base"></i>
          </div>
          <div>
            <span class="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider bg-emerald-950/60 px-3 py-0.5 rounded-full inline-block border border-amber-300/40 mb-1">
              ประธานกลุ่มวิสาหกิจชุมชน
            </span>
          </div>
          <div class="text-base sm:text-lg font-bold text-white tracking-wide truncate" title="${escapeHtml(president.name)}">
            ${escapeHtml(president.name || '-')}
          </div>
          <div class="text-xs text-emerald-100 mt-1 flex items-center justify-center gap-1.5 font-medium">
            <i class="fas fa-phone-alt text-[10px] text-amber-300"></i>
            <span>${escapeHtml(president.phone || '-')}</span>
          </div>
        </div>
      </div>

      <!-- Connector: Level 1 -> Level 2 -->
      <div class="w-0.5 h-6 bg-emerald-400"></div>

      <!-- LEVEL 2: รองประธานกลุ่ม (Sub Node) -->
      <div class="relative flex flex-col items-center">
        <div class="bg-gradient-to-br from-teal-700 to-emerald-800 text-white rounded-xl shadow-md border border-teal-400 p-3.5 sm:p-4 w-64 max-w-full text-center relative transform hover:scale-[1.02] transition-transform">
          <div class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-600 border border-teal-300 text-teal-100 shadow mb-1.5">
            <i class="fas fa-user-tie text-sm"></i>
          </div>
          <div class="text-xs font-bold text-teal-200">
            รองประธานกลุ่ม
          </div>
          <div class="text-sm sm:text-base font-bold text-white mt-0.5 truncate" title="${escapeHtml(vicePresident.name)}">
            ${escapeHtml(vicePresident.name || '-')}
          </div>
          <div class="text-xs text-teal-100 mt-1 flex items-center justify-center gap-1 font-medium">
            <i class="fas fa-phone-alt text-[10px] text-teal-300"></i>
            <span>${escapeHtml(vicePresident.phone || '-')}</span>
          </div>
        </div>
      </div>

      <!-- Connector: Level 2 -> Level 3 -->
      <div class="w-0.5 h-6 bg-emerald-400"></div>

      <!-- LEVEL 3: Executive Level (เหรัญญิก & เลขานุการ ขนาบคู่กัน) -->
      <div class="relative w-full max-w-xl">
        <!-- Horizontal Connecting Crossbar (hidden on mobile, visible on sm+) -->
        <div class="hidden sm:block absolute top-0 left-1/4 right-1/4 h-0.5 bg-emerald-400"></div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-0 sm:pt-4">
          
          <!-- เหรัญญิก -->
          <div class="relative flex flex-col items-center">
            <div class="hidden sm:block absolute -top-4 w-0.5 h-4 bg-emerald-400"></div>
            <div class="bg-white rounded-xl shadow-sm border-2 border-amber-400/80 p-4 w-full text-center hover:shadow-md hover:border-amber-500 transition-all">
              <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 border border-amber-300 mb-1.5 shadow-sm">
                <i class="fas fa-coins text-xs"></i>
              </div>
              <div class="text-xs font-bold text-amber-800">
                เหรัญญิก
              </div>
              <div class="text-[11px] text-amber-600 font-medium">
                ผู้ดูแลเรื่องการเงิน / บัญชี
              </div>
              <div class="text-sm font-bold text-gray-800 mt-1.5 truncate" title="${escapeHtml(treasurer.name)}">
                ${escapeHtml(treasurer.name || '-')}
              </div>
              <div class="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1 font-medium">
                <i class="fas fa-phone-alt text-[10px] text-amber-600"></i>
                <span>${escapeHtml(treasurer.phone || '-')}</span>
              </div>
            </div>
          </div>

          <!-- เลขานุการ -->
          <div class="relative flex flex-col items-center">
            <div class="hidden sm:block absolute -top-4 w-0.5 h-4 bg-emerald-400"></div>
            <div class="bg-white rounded-xl shadow-sm border-2 border-sky-400/80 p-4 w-full text-center hover:shadow-md hover:border-sky-500 transition-all">
              <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-700 border border-sky-300 mb-1.5 shadow-sm">
                <i class="fas fa-clipboard-list text-xs"></i>
              </div>
              <div class="text-xs font-bold text-sky-800">
                เลขานุการ
              </div>
              <div class="text-[11px] text-sky-600 font-medium">
                ผู้ดูแลงานเอกสาร / การประชุม
              </div>
              <div class="text-sm font-bold text-gray-800 mt-1.5 truncate" title="${escapeHtml(secretary.name)}">
                ${escapeHtml(secretary.name || '-')}
              </div>
              <div class="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1 font-medium">
                <i class="fas fa-phone-alt text-[10px] text-sky-600"></i>
                <span>${escapeHtml(secretary.phone || '-')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Connector: Level 3 -> Level 4 -->
      <div class="w-0.5 h-6 bg-emerald-400 my-1"></div>

      <!-- LEVEL 4: คณะกรรมการ / ฝ่ายปฏิบัติการ (Board Members) -->
      <div class="w-full flex flex-col items-center">
        <div class="inline-flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-100/90 px-3.5 py-1 rounded-full mb-3 border border-emerald-300 shadow-sm">
          <i class="fas fa-users-cog text-emerald-700"></i>
          <span>คณะกรรมการ (${boardMembers.length} ท่าน)</span>
        </div>

        ${boardMembers.length === 0 ? `
          <div class="text-xs text-gray-400 py-4 italic text-center">
            ยังไม่มีรายชื่อสมาชิกที่มีบทบาท 'กรรมการ' ในระบบ
          </div>
        ` : `
          <div class="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl">
            ${boardMembers.map(bm => `
              <div class="bg-white rounded-xl shadow-sm border border-emerald-200/90 hover:border-emerald-500 p-3.5 w-44 sm:w-52 text-center hover:shadow-md transition-all group">
                <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <i class="fas fa-user-cog text-[11px]"></i>
                </div>
                <div class="text-xs font-bold text-emerald-800 truncate" title="${escapeHtml(bm.role || 'กรรมการ')}">
                  ${escapeHtml(bm.role || 'กรรมการ')}
                </div>
                <div class="text-sm font-semibold text-gray-800 mt-0.5 truncate" title="${escapeHtml(bm.name || '-')}">
                  ${escapeHtml(bm.name || '-')}
                </div>
                <div class="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1 font-medium">
                  <i class="fas fa-phone-alt text-[10px] text-emerald-600"></i>
                  <span>${escapeHtml(bm.phone || '-')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

    </div>
  `;
}

export const SettingsComponent = {
  render() {
    const profile = appState.getEnterprise() || {};
    const members = appState.getMembers ? appState.getMembers() : [];

    return `
      <div class="fade-in max-w-5xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fa-solid fa-gear text-emerald-700"></i>
              ตั้งค่าข้อมูลวิสาหกิจชุมชน
            </h1>
            <p class="text-sm text-gray-500 mt-1">ตั้งค่าชื่อกลุ่ม ที่อยู่ และตรวจสอบแผนผังองค์กรที่เชื่อมโยงกับรายชื่อสมาชิก</p>
          </div>
        </div>

        <!-- CARD 1: ข้อมูลกลุ่มเบื้องต้น & ที่ตั้งสำนักงาน -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <form id="settings-form" class="space-y-6">
            
            <div class="border-b border-gray-100 pb-4">
              <h3 class="text-lg font-bold text-emerald-800 flex items-center gap-2">
                <i class="fas fa-home text-emerald-700"></i> ข้อมูลกลุ่มเบื้องต้น
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name -->
              <div class="md:col-span-2">
                <label for="ent-name" class="block text-sm font-medium text-gray-700 mb-2">ชื่อกลุ่มวิสาหกิจชุมชน *</label>
                <input type="text" id="ent-name" name="name" value="${escapeHtml(profile.name || '')}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Chairman -->
              <div>
                <label for="ent-chairman" class="block text-sm font-medium text-gray-700 mb-2">ประธานวิสาหกิจชุมชน</label>
                <input type="text" id="ent-chairman" name="chairman" value="${escapeHtml(profile.chairman || '')}"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Phone -->
              <div>
                <label for="ent-phone" class="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์ติดต่อ *</label>
                <input type="text" id="ent-phone" name="phone" value="${escapeHtml(profile.phone || '')}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Email -->
              <div class="md:col-span-2">
                <label for="ent-email" class="block text-sm font-medium text-gray-700 mb-2">อีเมลติดต่อ</label>
                <input type="email" id="ent-email" name="email" value="${escapeHtml(profile.email || '')}"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Description -->
              <div class="md:col-span-2">
                <label for="ent-desc" class="block text-sm font-medium text-gray-700 mb-2">คำอธิบายกลุ่ม / วัตถุประสงค์</label>
                <textarea id="ent-desc" name="description" rows="3"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">${escapeHtml(profile.description || '')}</textarea>
              </div>
            </div>

            <div class="border-b border-gray-100 pb-4 pt-4">
              <h3 class="text-lg font-bold text-emerald-800 flex items-center gap-2">
                <i class="fas fa-map-marker-alt text-emerald-700"></i> ที่ตั้งสำนักงานวิสาหกิจ
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Village -->
              <div>
                <label for="ent-village" class="block text-sm font-medium text-gray-700 mb-2">หมู่บ้าน/หมู่ที่ *</label>
                <input type="text" id="ent-village" name="village" value="${escapeHtml(profile.village || '')}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" placeholder="เช่น หมู่ 4 บ้านหนองเขียว">
              </div>

              <!-- Sub-district -->
              <div>
                <label for="ent-subdistrict" class="block text-sm font-medium text-gray-700 mb-2">ตำบล *</label>
                <input type="text" id="ent-subdistrict" name="subdistrict" value="${escapeHtml(profile.subdistrict || '')}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- District -->
              <div>
                <label for="ent-district" class="block text-sm font-medium text-gray-700 mb-2">อำเภอ *</label>
                <input type="text" id="ent-district" name="district" value="${escapeHtml(profile.district || '')}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Province -->
              <div>
                <label for="ent-province" class="block text-sm font-medium text-gray-700 mb-2">จังหวัด *</label>
                <input type="text" id="ent-province" name="province" value="${escapeHtml(profile.province || '')}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Zipcode -->
              <div>
                <label for="ent-zipcode" class="block text-sm font-medium text-gray-700 mb-2">รหัสไปรษณีย์ *</label>
                <input type="text" id="ent-zipcode" name="zipcode" value="${escapeHtml(profile.zipcode || '')}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>
            </div>

            <!-- Submit Button for Profile -->
            <div class="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit"
                class="px-6 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm focus:outline-none flex items-center gap-2">
                <i class="fas fa-save"></i> บันทึกข้อมูลวิสาหกิจ
              </button>
            </div>

          </form>
        </div>

        <!-- CARD 2: 🌳 แผนผังองค์กรวิสาหกิจชุมชน (ดึงข้อมูลอัตโนมัติจากจัดการสมาชิก) -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 class="text-lg font-bold text-emerald-800 flex items-center gap-2">
                <i class="fas fa-sitemap text-emerald-700"></i> 🌳 แผนผังองค์กรวิสาหกิจชุมชน (Organization Chart)
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                ดึงข้อมูลอัตโนมัติจาก <span class="font-semibold text-emerald-700">"จัดการข้อมูลสมาชิกวิสาหกิจชุมชน"</span> ตามบทบาทหน้าที่ (ประธาน, รองประธาน, เหรัญญิก, เลขานุการ, กรรมการ)
              </p>
            </div>
          </div>

          <!-- Visual Chart Card Box -->
          <div class="bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-50 border-2 border-emerald-100/90 rounded-2xl p-4 sm:p-6 overflow-x-auto shadow-inner">
            <div id="org-chart-tree-container">
              ${renderOrgChartTreeHtml(members, profile)}
            </div>
          </div>

        </div>

        <!-- CARD 3: Supabase Database Connection -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          
          <div class="border-b border-gray-100 pb-4">
            <h3 class="text-lg font-bold text-emerald-800 flex items-center gap-2">
              <i class="fas fa-database text-emerald-700"></i> เชื่อมต่อฐานข้อมูล Supabase (ระบบคลาวด์ออนไลน์)
            </h3>
          </div>

          <div class="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-sm text-emerald-800 leading-relaxed">
            <i class="fas fa-info-circle mr-1 text-emerald-700"></i>
            เมื่อเชื่อมต่อกับ Supabase ข้อมูลวิสาหกิจทั้งหมดจะซิงค์และบันทึกออนไลน์ร่วมกันทันที หากปล่อยช่องว่างไว้ระบบจะสลับใช้ LocalStorage ของเบราว์เซอร์เครื่องนี้โดยอัตโนมัติ
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Supabase URL -->
            <div class="md:col-span-2">
              <label for="sup-url" class="block text-sm font-medium text-gray-700 mb-2">Supabase Project URL</label>
              <input type="url" id="sup-url" name="supabaseUrl" value="${escapeHtml(localStorage.getItem('supabase_url') || 'https://fhoszzgibwlgzggopeux.supabase.co')}" placeholder="เช่น https://xxxxxx.supabase.co"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono">
            </div>

            <!-- Supabase Anon Key -->
            <div class="md:col-span-2">
              <label for="sup-key" class="block text-sm font-medium text-gray-700 mb-2">Supabase Anon Key</label>
              <input type="text" id="sup-key" name="supabaseKey" value="${escapeHtml(localStorage.getItem('supabase_key') || 'sb_publishable_upI8AP-NK_GUbvtcZw7WLw_sh63HUPy')}" placeholder="เช่น sb_publishable_..."
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono">
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button type="button" id="save-supabase-btn"
              class="px-5 py-2.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm flex items-center gap-2">
              <i class="fas fa-plug"></i> เชื่อมต่อ / บันทึกการตั้งค่า Cloud
            </button>
          </div>

        </div>

      </div>
    `;
  },

  init() {
    const form = document.getElementById('settings-form');

    // Settings Profile Form submit
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const currentProfile = appState.getEnterprise() || {};
        
        const updatedProfile = {
          ...currentProfile,
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
          showToast('บันทึกข้อมูลวิสาหกิจเรียบร้อยแล้ว', 'success');
          
          // Refresh view to reflect changes
          const container = document.getElementById('org-chart-tree-container');
          if (container) {
            const members = appState.getMembers ? appState.getMembers() : [];
            container.innerHTML = renderOrgChartTreeHtml(members, updatedProfile);
          }
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message, 'error');
        }
      });
    }

    // Save Supabase settings button
    const saveSupabaseBtn = document.getElementById('save-supabase-btn');
    if (saveSupabaseBtn) {
      saveSupabaseBtn.addEventListener('click', () => {
        const urlInput = document.getElementById('sup-url');
        const keyInput = document.getElementById('sup-key');
        const supabaseUrlVal = urlInput ? urlInput.value.trim() : '';
        const supabaseKeyVal = keyInput ? keyInput.value.trim() : '';

        try {
          if (supabaseUrlVal && supabaseKeyVal) {
            localStorage.setItem('supabase_url', supabaseUrlVal);
            localStorage.setItem('supabase_key', supabaseKeyVal);
          } else {
            localStorage.removeItem('supabase_url');
            localStorage.removeItem('supabase_key');
          }

          showToast('กำลังเชื่อมต่อ Supabase...');
          appState.initSupabase();

          appState.syncFromSupabase().then(() => {
            showToast('เชื่อมต่อ Supabase และซิงค์ข้อมูลสำเร็จ', 'success');
          }).catch(err => {
            showToast('เชื่อมต่อ Supabase สำเร็จ แต่พบข้อผิดพลาด: ' + err.message, 'warning');
          });
        } catch (err) {
          showToast('ข้อผิดพลาด Supabase: ' + err.message, 'error');
        }
      });
    }
  }
};
