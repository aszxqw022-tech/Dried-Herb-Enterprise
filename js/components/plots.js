// Plots Management Component with Leaflet Map Pinning & Modal Form
import { appState } from '../state.js';
import { formatThaiArea, showToast, openGlobalModal, closeGlobalModal, formatThaiNameWithoutPrefix } from '../helpers.js';

let mapInstance = null;
let modalMapInstance = null;
let modalMarker = null;

export const PlotsComponent = {
  editingPlotId: null,

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    let plots = appState.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const members = appState.getMembers();

    // Generate member options for single owner selection (used in the Modal)
    const memberOptions = members
      .filter(m => m.status === 'active')
      .map(m => {
        const isSelf = isMember && m.id === currentUser.memberId;
        return `<option value="${m.id}" ${isSelf ? 'selected' : ''}>${formatThaiNameWithoutPrefix(m.name)} (${m.id}) - บ้านเลขที่ ${m.houseNumber || '-'}</option>`;
      })
      .join('');

    // Generate table rows for plots
    const rowsHtml = plots.length === 0 
      ? `<tr><td colspan="7" class="px-6 py-6 text-center text-sm text-gray-500">ยังไม่มีการบันทึกแปลงปลูกในระบบ</td></tr>`
      : plots.map(p => {
          const owner = members.find(m => (p.memberIds && p.memberIds.includes(m.id)) || p.memberId === m.id);
          const ownerName = owner ? formatThaiNameWithoutPrefix(owner.name) : 'ไม่พบชื่อเจ้าของ';
          const areaFormatted = formatThaiArea(p.sizeRai, p.sizeNgan, p.sizeSqWah);
          return `
            <tr class="plot-table-row hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors" data-search="${p.id} ${p.name} ${ownerName} ${owner ? owner.name : ''}">
              <td class="px-6 py-3.5 text-sm font-bold text-emerald-800">${p.id}</td>
              <td class="px-6 py-3.5 text-base font-bold text-gray-900">${p.name}</td>
              <td class="px-6 py-3.5 text-sm font-semibold text-gray-800 whitespace-nowrap">${ownerName}</td>
              <td class="px-6 py-3.5 text-sm text-gray-700 whitespace-nowrap">${areaFormatted}</td>
              <td class="px-6 py-3.5 text-sm font-mono text-gray-600">
                ${(parseFloat(p.lat) || 0).toFixed(4)}, ${(parseFloat(p.lng) || 0).toFixed(4)}
              </td>
              <td class="px-6 py-3.5 text-sm text-right space-x-1">
                <button data-id="${p.id}" class="pan-to-plot-btn text-emerald-600 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors" title="ดูแผนที่">
                  <i class="fas fa-map-marker-alt"></i>
                </button>
                <button data-id="${p.id}" class="edit-plot-btn text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors" title="แก้ไข">
                  <i class="fas fa-edit"></i>
                </button>
                <button data-id="${p.id}" class="delete-plot-btn text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="ลบ">
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
              <i class="fa-solid fa-map-location-dot text-emerald-700"></i>
              ระบบจัดการพื้นที่แปลงปลูกสมุนไพร
            </h1>
            <p class="text-sm text-gray-500 mt-1">แผนที่ปักหมุดแปลงเกษตรกรรมและขนาดพื้นที่ของสมาชิกในวิสาหกิจชุมชน</p>
          </div>
          <div>
            <button id="open-add-plot-btn" class="px-4 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-plus-circle"></i> ลงทะเบียนแปลงปลูกใหม่
            </button>
          </div>
        </div>

        <!-- Full Width Layout -->
        <div class="space-y-6">
          <!-- Main Map Card -->
          <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-3 px-2">
              <h3 class="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <i class="fas fa-globe text-emerald-600"></i> แผนที่ตำแหน่งแปลงปลูกวิสาหกิจชุมชนทั้งหมด
              </h3>
              <span class="text-sm text-gray-400">ปักหมุดแสดงพิกัดที่ตั้งแปลงเกษตรกรทั้งหมด</span>
            </div>
            <!-- Map Div -->
            <div id="plots-map" class="map-container h-[400px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner"></div>
          </div>

          <!-- Plots Table Card -->
          <div id="plots-table-card" class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-gray-900 text-base">รายการแปลงปลูกลงทะเบียน</h3>
                <span id="plots-table-count-badge" class="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">${plots.length} แปลง</span>
              </div>
              <div class="relative w-full sm:w-72">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <i class="fas fa-search text-xs"></i>
                </span>
                <input type="text" id="plots-table-search" placeholder="ค้นหาชื่อแปลง, รหัส, ชื่อเจ้าของ..."
                  class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs">
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 text-sm font-bold text-gray-700 border-b border-gray-200">
                    <th class="px-6 py-3.5">รหัสแปลง</th>
                    <th class="px-6 py-3.5">ชื่อแปลง</th>
                    <th class="px-6 py-3.5">เจ้าของแปลง</th>
                    <th class="px-6 py-3.5">ขนาดพื้นที่</th>
                    <th class="px-6 py-3.5">พิกัด Lat, Lng</th>
                    <th class="px-6 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                  <tr id="plots-table-no-match" class="hidden">
                    <td colspan="6" class="px-6 py-8 text-center text-sm text-gray-400">
                      <i class="fas fa-search text-2xl mb-1 block opacity-40"></i>
                      ไม่พบข้อมูลแปลงปลูกที่ตรงกับคำค้นหา
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    try {
      this.initMainMap();
    } catch (e) {
      console.error("Main map initialization error:", e);
    }
    this.bindEvents();
  },

  initMainMap() {
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded');
      return;
    }

    if (mapInstance !== null) {
      try {
        mapInstance.remove();
      } catch (e) {
        console.warn("Main map remove warning:", e);
      }
      mapInstance = null;
    }

    const plots = appState.getPlots();
    // Centered at Sri Don Mun, Chiang Saen, Chiang Rai (covers Moo 12, Moo 7 Doi Sa-Ngo, Moo 1 Mae Ma)
    const centerLat = 20.3350;
    const centerLng = 100.0080;

    mapInstance = L.map('plots-map').setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    const plotPinIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-emerald-600 text-white font-bold"><i class="fas fa-seedling"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const members = appState.getMembers();

    plots.forEach(p => {
      const owners = members.filter(m => p.memberIds && p.memberIds.includes(m.id));
      const ownersNames = owners.map(o => formatThaiNameWithoutPrefix(o.name)).join(', ') || '-';
      
      const latVal = parseFloat(p.lat);
      const lngVal = parseFloat(p.lng);
      if (isNaN(latVal) || isNaN(lngVal)) return;

      const marker = L.marker([latVal, lngVal], { icon: plotPinIcon }).addTo(mapInstance);
      
      const popupContent = `
        <div class="p-1 leading-normal font-sans">
          <span class="text-sm font-bold text-gray-500">${p.id}</span>
          <h4 class="text-sm font-bold text-gray-900 mt-0.5">${p.name}</h4>
          <p class="text-sm text-gray-600 mt-1"><b>เจ้าของแปลง:</b> ${ownersNames}</p>
          <p class="text-sm text-gray-600"><b>ขนาดพื้นที่:</b> ${formatThaiArea(p.sizeRai, p.sizeNgan, p.sizeSqWah)}</p>
          <p class="text-sm text-gray-400 mt-1">พิกัด: ${latVal.toFixed(5)}, ${lngVal.toFixed(5)}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
    });
  },

  bindEvents() {
    // Open Modal button
    const openAddBtn = document.getElementById('open-add-plot-btn');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => {
        this.openPlotModal(null);
      });
    }

    // Edit plot details
    const editBtns = document.querySelectorAll('.edit-plot-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openPlotModal(id);
      });
    });

    // Delete plot details
    const deleteBtns = document.querySelectorAll('.delete-plot-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plot = appState.getPlotById(id);
        if (confirm(`คุณต้องการลบแปลงปลูก "${plot.name}" (${id}) ใช่หรือไม่?`)) {
          try {
            appState.deletePlot(id);
            showToast(`ลบแปลงปลูก ${id} สำเร็จ`);
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // Add crop from plot shortcut
    const addCropBtns = document.querySelectorAll('.add-crop-from-plot-btn');
    addCropBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.location.hash = '#crops'; // Navigate to crops view
        // Import crops component and trigger modal open
        import('./crops.js').then(module => {
          if (module.CropsComponent) {
            // Need a slight delay to ensure view is fully loaded by router
            setTimeout(() => {
              module.CropsComponent.openStep1Modal(id);
            }, 300);
          }
        }).catch(err => {
          console.error("Failed to load crops component:", err);
          showToast('ไม่สามารถเปิดหน้าบันทึกการปลูกได้', 'error');
        });
      });
    });

    // Pan to plot marker on main map
    const panBtns = document.querySelectorAll('.pan-to-plot-btn');
    panBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plot = appState.getPlotById(id);
        if (plot && mapInstance && typeof plot.lat === 'number' && typeof plot.lng === 'number' && !isNaN(plot.lat) && !isNaN(plot.lng)) {
          mapInstance.setView([plot.lat, plot.lng], 16);
          
          // Open marker popup dynamically
          mapInstance.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.getLatLng) {
              const latLng = layer.getLatLng();
              if (Math.abs(latLng.lat - plot.lat) < 0.0001 && Math.abs(latLng.lng - plot.lng) < 0.0001) {
                layer.openPopup();
              }
            }
          });

          // Scroll map into view if on mobile
          const mapEl = document.getElementById('plots-map');
          if (mapEl) {
            mapEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Search Plots Table Listener
    const tableSearch = document.getElementById('plots-table-search');
    if (tableSearch) {
      tableSearch.addEventListener('input', (e) => {
        const q = (e.target.value || '').trim().toLowerCase();
        const rows = document.querySelectorAll('.plot-table-row');
        let visibleCount = 0;
        rows.forEach(row => {
          const content = (row.getAttribute('data-search') || '').toLowerCase();
          if (!q || content.includes(q)) {
            row.classList.remove('hidden');
            visibleCount++;
          } else {
            row.classList.add('hidden');
          }
        });
        const countBadge = document.getElementById('plots-table-count-badge');
        if (countBadge) {
          countBadge.textContent = `${visibleCount} แปลง`;
        }
        const noMatchRow = document.getElementById('plots-table-no-match');
        if (noMatchRow) {
          noMatchRow.classList.toggle('hidden', visibleCount > 0 || rows.length === 0);
        }
      });
    }
  },

  openPlotModal(id = null) {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';
    this.editingPlotId = id;

    const members = appState.getMembers();
    const activeMembers = members.filter(m => m.status === 'active');
    const memberOptions = activeMembers
      .map(m => {
        const isCurrent = isMember && m.id === currentUser.memberId;
        return `<option value="${m.id}" ${isCurrent ? 'selected' : ''}>${formatThaiNameWithoutPrefix(m.name)} (${m.villageNumber || 'หมู่ 4'})</option>`;
      })
      .join('');

    let defaultLat = 20.3350;
    let defaultLng = 100.0080;
    let zoomLevel = 13;
    let hasMarker = false;

    let plot = null;
    if (id) {
      plot = appState.getPlotById(id);
      if (plot) {
        const latVal = parseFloat(plot.lat);
        const lngVal = parseFloat(plot.lng);
        if (!isNaN(latVal) && !isNaN(lngVal)) {
          defaultLat = latVal;
          defaultLng = lngVal;
          zoomLevel = 16;
          hasMarker = true;
        }
      }
    }

    const title = id ? `แก้ไขข้อมูลแปลงปลูก (${id})` : 'ลงทะเบียนแปลงปลูกใหม่';
    const currentOwnerId = plot ? ((plot.memberIds && plot.memberIds[0]) || plot.memberId || '') : (isMember ? currentUser.memberId : '');

    const formHtml = `
      <form id="global-plot-modal-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Left Column: Form Inputs -->
            <div class="space-y-4">
              <!-- Owner Member Selection -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label for="modal-plot-ownerId" class="block text-sm font-semibold text-gray-500 uppercase">เจ้าของแปลง *</label>
                  <span id="modal-plot-owner-count" class="text-xs text-emerald-700 font-semibold"></span>
                </div>
                ${!isMember ? `
                  <!-- Search Owner Box -->
                  <div class="relative mb-2">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <i class="fas fa-search text-xs"></i>
                    </span>
                    <input type="text" id="modal-plot-owner-search" placeholder="พิมพ์ค้นหาชื่อ, รหัส หรือหมู่เจ้าของแปลง..." autocomplete="off"
                      class="w-full pl-8 pr-8 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs">
                    <button type="button" id="modal-plot-owner-search-clear" class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 hidden cursor-pointer" title="ล้างคำค้นหา">
                      <i class="fas fa-times-circle text-xs"></i>
                    </button>
                  </div>
                  <!-- Quick Suggestions Chips (Visible when typing) -->
                  <div id="modal-plot-owner-chips" class="hidden flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto"></div>
                ` : ''}
                <select id="modal-plot-ownerId" name="ownerId" required ${isMember ? 'disabled' : ''}
                  class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">-- เลือกเจ้าของแปลง --</option>
                  ${memberOptions}
                </select>
              </div>

              <!-- Plot Name -->
              <div>
                <label for="modal-plot-name" class="block text-sm font-semibold text-gray-500 uppercase mb-1">ชื่อเรียกแปลงปลูก *</label>
                <input type="text" id="modal-plot-name" name="name" required value="${plot ? (plot.name || '') : ''}" placeholder="เช่น แปลง 1 ข้างบ้านป้าใจดี"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Area Size Inputs -->
              <div>
                <span class="block text-sm font-semibold text-gray-500 uppercase mb-1">ขนาดพื้นที่แปลงปลูก *</span>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <input type="number" id="modal-plot-rai" name="sizeRai" min="0" value="${plot ? (plot.sizeRai || 0) : 0}" required
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="block text-sm text-center text-gray-400 mt-1">ไร่</span>
                  </div>
                  <div>
                    <input type="number" id="modal-plot-ngan" name="sizeNgan" min="0" max="3" value="${plot ? (plot.sizeNgan || 0) : 0}" required
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="block text-sm text-center text-gray-400 mt-1">งาน</span>
                  </div>
                  <div>
                    <input type="number" id="modal-plot-sqWah" name="sizeSqWah" min="0" max="99" value="${plot ? (plot.sizeSqWah || 0) : 0}" required
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="block text-sm text-center text-gray-400 mt-1">ตร.ว.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Map Selection -->
            <div class="flex flex-col h-full space-y-3">
              <div>
                <span class="block text-sm font-semibold text-gray-500 uppercase mb-1">ปักหมุดตำแหน่งพิกัดแปลง *</span>
                <div class="text-sm text-gray-450 leading-normal">
                  <i class="fas fa-info-circle text-emerald-600 mr-0.5"></i>
                  คลิกบนแผนที่เพื่ออัปเดตละติจูดและลองจิจูดลงฟอร์มอัตโนมัติ
                </div>
              </div>
              
              <!-- Modal Map Container -->
              <div id="modal-plots-map" class="w-full flex-grow h-48 md:h-64 rounded-2xl border border-gray-200 overflow-hidden shadow-inner"></div>

              <!-- Lat/Lng Inputs -->
              <div class="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label for="modal-plot-lat" class="block text-sm font-semibold text-gray-500 uppercase mb-1">Latitude *</label>
                  <input type="number" id="modal-plot-lat" name="lat" step="any" required value="${plot && plot.lat !== undefined ? plot.lat : ''}" placeholder="20.3350"
                    class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <div>
                  <label for="modal-plot-lng" class="block text-sm font-semibold text-gray-500 uppercase mb-1">Longitude *</label>
                  <input type="number" id="modal-plot-lng" name="lng" step="any" required value="${plot && plot.lng !== undefined ? plot.lng : ''}" placeholder="100.0080"
                    class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
              <div class="mt-4">
                <button type="button" id="btn-current-location" class="w-full py-3.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 border-2 border-blue-400 transform hover:-translate-y-0.5">
                  <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <i class="fas fa-map-marker-alt text-lg animate-bounce mt-1"></i>
                  </div>
                  <span class="text-sm font-bold tracking-wide">ดึงพิกัด GPS ปัจจุบัน</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>

        <!-- Modal Footer Buttons (Fixed) -->
        <div class="flex justify-end gap-2 p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-7 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 font-bold">
            <i class="fas fa-save"></i> บันทึกข้อมูลแปลง
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title,
      icon: 'fas fa-map-pin',
      size: 'max-w-5xl',
      content: formHtml,
      onRender: (dialog) => {
        const ownerSearch = dialog.querySelector('#modal-plot-owner-search');
        const ownerClearBtn = dialog.querySelector('#modal-plot-owner-search-clear');
        const ownerSelect = dialog.querySelector('#modal-plot-ownerId');
        const countBadge = dialog.querySelector('#modal-plot-owner-count');
        const chipsContainer = dialog.querySelector('#modal-plot-owner-chips');

        if (ownerSelect && currentOwnerId) {
          ownerSelect.value = currentOwnerId;
        }

        if (ownerSearch && ownerSelect) {
          const filterOwners = (query = '') => {
            const q = query.trim().toLowerCase();
            const curVal = ownerSelect.value;
            const filtered = activeMembers.filter(m => {
              if (!q) return true;
              const nameMatch = m.name && m.name.toLowerCase().includes(q);
              const idMatch = m.id && m.id.toLowerCase().includes(q);
              const villageMatch = (m.villageNumber || '').toString().toLowerCase().includes(q);
              return nameMatch || idMatch || villageMatch;
            });

            if (countBadge) {
              countBadge.textContent = q ? `พบ ${filtered.length} รายชื่อ` : '';
            }

            let optsHtml = '<option value="">-- เลือกเจ้าของแปลง --</option>';
            filtered.forEach(m => {
              const sel = m.id === curVal ? 'selected' : '';
              optsHtml += `<option value="${m.id}" ${sel}>${formatThaiNameWithoutPrefix(m.name)} (${m.villageNumber || 'หมู่ 4'})</option>`;
            });
            if (filtered.length === 0) {
              optsHtml = '<option value="">-- ไม่พบรายชื่อที่ตรงกับคำค้นหา --</option>';
            }
            ownerSelect.innerHTML = optsHtml;

            // Auto-select if exactly 1 match and nothing selected yet
            if (filtered.length === 1 && !curVal) {
              ownerSelect.value = filtered[0].id;
            } else if (curVal && filtered.some(m => m.id === curVal)) {
              ownerSelect.value = curVal;
            }

            // Quick Chips display
            if (chipsContainer) {
              if (q && filtered.length > 0 && filtered.length <= 8) {
                chipsContainer.classList.remove('hidden');
                chipsContainer.innerHTML = filtered.map(m => {
                  const isChosen = ownerSelect.value === m.id;
                  const cleanName = formatThaiNameWithoutPrefix(m.name);
                  return `
                    <button type="button" data-member-id="${m.id}" class="owner-chip text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${isChosen ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'}">
                      <i class="fas ${isChosen ? 'fa-check' : 'fa-user'} text-[10px]"></i>
                      <span>${cleanName}</span>
                    </button>
                  `;
                }).join('');

                chipsContainer.querySelectorAll('.owner-chip').forEach(chip => {
                  chip.addEventListener('click', () => {
                    const chosenId = chip.getAttribute('data-member-id');
                    ownerSelect.value = chosenId;
                    filterOwners(ownerSearch.value);
                  });
                });
              } else {
                chipsContainer.classList.add('hidden');
                chipsContainer.innerHTML = '';
              }
            }
          };

          ownerSearch.addEventListener('input', (e) => {
            const val = e.target.value;
            if (ownerClearBtn) {
              ownerClearBtn.classList.toggle('hidden', !val);
            }
            filterOwners(val);
          });

          ownerSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const firstOpt = ownerSelect.querySelector('option[value]:not([value=""])');
              if (firstOpt) {
                ownerSelect.value = firstOpt.value;
                filterOwners(ownerSearch.value);
                showToast(`เลือกเจ้าของแปลง: ${firstOpt.textContent}`, 'info');
              }
            }
          });

          if (ownerClearBtn) {
            ownerClearBtn.addEventListener('click', () => {
              ownerSearch.value = '';
              ownerClearBtn.classList.add('hidden');
              filterOwners('');
              ownerSearch.focus();
            });
          }

          ownerSelect.addEventListener('change', () => {
            if (chipsContainer && !chipsContainer.classList.contains('hidden')) {
              filterOwners(ownerSearch.value);
            }
          });
        }

        const form = dialog.querySelector('#global-plot-modal-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const selectedOwnerId = isMember ? currentUser.memberId : (ownerSelect ? ownerSelect.value : '');

            if (!selectedOwnerId) {
              showToast('กรุณาเลือกเจ้าของแปลง', 'error');
              return;
            }

            const data = {
              memberIds: [selectedOwnerId],
              memberId: selectedOwnerId,
              name: dialog.querySelector('#modal-plot-name').value,
              sizeRai: parseInt(dialog.querySelector('#modal-plot-rai').value) || 0,
              sizeNgan: parseInt(dialog.querySelector('#modal-plot-ngan').value) || 0,
              sizeSqWah: parseInt(dialog.querySelector('#modal-plot-sqWah').value) || 0,
              lat: parseFloat(dialog.querySelector('#modal-plot-lat').value),
              lng: parseFloat(dialog.querySelector('#modal-plot-lng').value),
              status: 'active'
            };

            try {
              if (this.editingPlotId) {
                appState.updatePlot(this.editingPlotId, data);
                showToast('อัปเดตข้อมูลแปลงปลูกสำเร็จ');
              } else {
                appState.addPlot(data);
                showToast('ลงทะเบียนแปลงปลูกใหม่สำเร็จ');
              }
              closeGlobalModal();
              this.refreshView();
            } catch (err) {
              showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลแปลงปลูก', 'error');
            }
          });
        }

        // Initialize Leaflet map inside global modal
        setTimeout(() => {
          this.initModalMap(defaultLat, defaultLng, zoomLevel, hasMarker);
        }, 80);

        const btnCurrentLocation = dialog.querySelector('#btn-current-location');
        if (btnCurrentLocation) {
          btnCurrentLocation.addEventListener('click', () => {
            if (navigator.geolocation) {
              const originalText = btnCurrentLocation.innerHTML;
              btnCurrentLocation.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังค้นหา...';
              btnCurrentLocation.disabled = true;

              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  
                  const latInput = dialog.querySelector('#modal-plot-lat');
                  const lngInput = dialog.querySelector('#modal-plot-lng');
                  if (latInput) latInput.value = lat.toFixed(6);
                  if (lngInput) lngInput.value = lng.toFixed(6);
                  
                  if (modalMapInstance) {
                    modalMapInstance.setView([lat, lng], 18);
                    if (modalMarker) {
                      modalMarker.setLatLng([lat, lng]);
                    } else {
                      const pinIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-emerald-600 text-white pulse-emerald"><i class="fas fa-map-pin"></i></div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32]
                      });
                      modalMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(modalMapInstance);
                    }
                  }
                  
                  btnCurrentLocation.innerHTML = originalText;
                  btnCurrentLocation.disabled = false;
                  showToast('ดึงตำแหน่งปัจจุบันสำเร็จ');
                },
                (error) => {
                  btnCurrentLocation.innerHTML = originalText;
                  btnCurrentLocation.disabled = false;
                  showToast('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาเปิดอนุญาต GPS', 'error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              );
            } else {
              showToast('เบราว์เซอร์ของคุณไม่รองรับการดึงตำแหน่ง GPS', 'error');
            }
          });
        }
      },
      onClose: () => {
        if (modalMapInstance !== null) {
          try {
            modalMapInstance.remove();
          } catch (e) {}
          modalMapInstance = null;
          modalMarker = null;
        }
      }
    });
  },

  initModalMap(lat, lng, zoom, hasMarker) {
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded');
      return;
    }

    if (modalMapInstance !== null) {
      try {
        modalMapInstance.remove();
      } catch (e) {
        console.warn("Modal map remove warning:", e);
      }
      modalMapInstance = null;
      modalMarker = null;
    }

    const mapContainer = document.getElementById('modal-plots-map');
    if (!mapContainer) return;

    modalMapInstance = L.map('modal-plots-map').setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(modalMapInstance);

    const pinIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-emerald-600 text-white pulse-emerald"><i class="fas fa-map-pin"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    if (hasMarker) {
      modalMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(modalMapInstance);
    }

    modalMapInstance.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      const latInput = document.getElementById('modal-plot-lat');
      const lngInput = document.getElementById('modal-plot-lng');
      if (latInput) latInput.value = clickLat.toFixed(6);
      if (lngInput) lngInput.value = clickLng.toFixed(6);

      if (modalMarker === null) {
        modalMarker = L.marker([clickLat, clickLng], { icon: pinIcon }).addTo(modalMapInstance);
      } else {
        modalMarker.setLatLng([clickLat, clickLng]);
      }
    });

    modalMapInstance.invalidateSize();
  },

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init(); // rebind map and events
    }
  }
};
