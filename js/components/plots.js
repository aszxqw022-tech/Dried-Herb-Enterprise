// Plots Management Component with Leaflet Map Pinning & Modal Form
import { appState } from '../state.js';
import { formatThaiArea, showToast } from '../helpers.js';

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

    // Generate members checkboxes options for co-ownership selection (used in the Modal)
    const membersCheckboxes = members
      .filter(m => m.status === 'active')
      .map(m => {
        const isSelf = isMember && m.id === currentUser.memberId;
        return `
          <label class="flex items-center gap-2 text-xs text-gray-750 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
            <input type="checkbox" name="memberIds" value="${m.id}" 
              ${isSelf ? 'checked disabled' : ''} 
              class="plot-member-checkbox rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 w-4 h-4 transition-all">
            <span>${m.name} <span class="text-gray-400 font-mono text-[10px]">(${m.id})</span></span>
          </label>
        `;
      })
      .join('');

    // Generate table rows for plots
    const rowsHtml = plots.length === 0 
      ? `<tr><td colspan="7" class="px-6 py-6 text-center text-sm text-gray-500">ยังไม่มีการบันทึกแปลงปลูกในระบบ</td></tr>`
      : plots.map(p => {
          const owners = members.filter(m => p.memberIds && p.memberIds.includes(m.id));
          const ownersNames = owners.map(o => o.name).join(', ') || 'ไม่พบชื่อเจ้าของ';
          const areaFormatted = formatThaiArea(p.sizeRai, p.sizeNgan, p.sizeSqWah);
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-3.5 text-sm font-semibold text-emerald-800">${p.id}</td>
              <td class="px-6 py-3.5 text-sm font-medium text-gray-900">${p.name}</td>
              <td class="px-6 py-3.5 text-sm text-gray-600">${ownersNames}</td>
              <td class="px-6 py-3.5 text-sm text-gray-600">${areaFormatted}</td>
              <td class="px-6 py-3.5">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                  p.plantType === 'เก๊กฮวย' ? 'badge-chrysanthemum' : 'badge-chamomile'
                }">
                  ${p.plantType}
                </span>
              </td>
              <td class="px-6 py-3.5 text-xs font-mono text-gray-500">
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
              <i class="fas fa-map-marked-alt text-emerald-700"></i>
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
              <span class="text-xs text-gray-400">ปักหมุดแสดงพิกัดที่ตั้งแปลงเกษตรกรทั้งหมด</span>
            </div>
            <!-- Map Div -->
            <div id="plots-map" class="map-container h-[400px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner"></div>
          </div>

          <!-- Plots Table Card -->
          <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 class="font-bold text-gray-800 text-sm">รายการแปลงปลูกลงทะเบียน</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                    <th class="px-6 py-3.5">รหัสแปลง</th>
                    <th class="px-6 py-3.5">ชื่อแปลง</th>
                    <th class="px-6 py-3.5">เกษตรกรเจ้าของ</th>
                    <th class="px-6 py-3.5">ขนาดพื้นที่</th>
                    <th class="px-6 py-3.5">พืชที่ปลูก</th>
                    <th class="px-6 py-3.5">พิกัด Lat, Lng</th>
                    <th class="px-6 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Plot Modal (Hidden by default) -->
      <div id="plot-modal" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
        <div class="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl transform transition-all border border-gray-100">
          <!-- Modal Header -->
          <div class="bg-emerald-800 px-6 py-4 text-white flex justify-between items-center">
            <h3 id="plot-modal-title" class="font-bold text-lg flex items-center gap-2">
              <i class="fas fa-map-pin"></i> ลงทะเบียนแปลงปลูกใหม่
            </h3>
            <button type="button" id="close-plot-modal-btn" class="text-white opacity-80 hover:opacity-100 text-xl focus:outline-none">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <!-- Modal Body Form -->
          <form id="plot-modal-form" class="p-6">
            <!-- Hidden input to prevent JS cache exceptions from old scripts expecting this element -->
            <input type="hidden" id="plot-memberId" value="">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Left Column: Form Inputs -->
              <div class="space-y-4">
                <!-- Owner Member Selection -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">เกษตรกรผู้ถือครองร่วม * <span class="text-[10px] text-gray-400 normal-case">(เลือกได้หลายคน)</span></label>
                  <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-1.5 bg-gray-50/30">
                    ${membersCheckboxes}
                  </div>
                </div>

                <!-- Plot Name -->
                <div>
                  <label for="modal-plot-name" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชื่อเรียกแปลงปลูก *</label>
                  <input type="text" id="modal-plot-name" name="name" required placeholder="เช่น แปลง 1 ข้างบ้านป้าใจดี"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>

                <!-- Herb Type -->
                <div>
                  <label for="modal-plot-plantType" class="block text-xs font-semibold text-gray-500 uppercase mb-1">พืชสมุนไพรหลัก *</label>
                  <select id="modal-plot-plantType" name="plantType" required
                    class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="เก๊กฮวย">เก๊กฮวย (Chrysanthemum)</option>
                    <option value="คาโมมายล์">คาโมมายล์ (Chamomile)</option>
                  </select>
                </div>

                <!-- Area Size Inputs -->
                <div>
                  <span class="block text-xs font-semibold text-gray-500 uppercase mb-1">ขนาดพื้นที่แปลงปลูก *</span>
                  <div class="grid grid-cols-3 gap-2">
                    <div>
                      <input type="number" id="modal-plot-rai" name="sizeRai" min="0" value="0" required
                        class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <span class="block text-[10px] text-center text-gray-400 mt-1">ไร่</span>
                    </div>
                    <div>
                      <input type="number" id="modal-plot-ngan" name="sizeNgan" min="0" max="3" value="0" required
                        class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <span class="block text-[10px] text-center text-gray-400 mt-1">งาน</span>
                    </div>
                    <div>
                      <input type="number" id="modal-plot-sqWah" name="sizeSqWah" min="0" max="99" value="0" required
                        class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <span class="block text-[10px] text-center text-gray-400 mt-1">ตร.ว.</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column: Map Selection -->
              <div class="flex flex-col h-full space-y-3">
                <div>
                  <span class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปักหมุดตำแหน่งพิกัดแปลง *</span>
                  <div class="text-[10px] text-gray-450 leading-normal">
                    <i class="fas fa-info-circle text-emerald-600 mr-0.5"></i>
                    กรุณาคลิกเลือกตำแหน่งบนแผนที่ด้านล่างเพื่ออัปเดตละติจูดและลองจิจูดลงฟอร์มอัตโนมัติ
                  </div>
                </div>
                
                <!-- Modal Map Container -->
                <div id="modal-plots-map" class="w-full flex-grow h-48 md:h-60 rounded-2xl border border-gray-200 overflow-hidden shadow-inner"></div>

                <!-- Lat/Lng Inputs -->
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label for="modal-plot-lat" class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Latitude *</label>
                    <input type="number" id="modal-plot-lat" name="lat" step="any" required placeholder="18.9142"
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  </div>
                  <div>
                    <label for="modal-plot-lng" class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Longitude *</label>
                    <input type="number" id="modal-plot-lng" name="lng" step="any" required placeholder="98.9442"
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  </div>
                </div>
              </div>
              
            </div>

            <!-- Modal Footer Buttons -->
            <div class="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6">
              <button type="button" id="cancel-plot-modal-btn" class="px-5 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                ยกเลิก
              </button>
              <button type="submit" class="px-7 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
                <i class="fas fa-save"></i> บันทึกข้อมูลแปลง
              </button>
            </div>
          </form>
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
    const centerLat = 18.9142;
    const centerLng = 98.9442;

    mapInstance = L.map('plots-map').setView([centerLat, centerLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    const chrysanthemumIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-amber-500 text-white font-bold"><i class="fas fa-seedling"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const chamomileIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-sky-500 text-white font-bold"><i class="fas fa-seedling"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const members = appState.getMembers();

    plots.forEach(p => {
      const owners = members.filter(m => p.memberIds && p.memberIds.includes(m.id));
      const ownersNames = owners.map(o => o.name).join(', ') || '-';
      const icon = p.plantType === 'เก๊กฮวย' ? chrysanthemumIcon : chamomileIcon;
      
      const latVal = parseFloat(p.lat);
      const lngVal = parseFloat(p.lng);
      if (isNaN(latVal) || isNaN(lngVal)) return;

      const marker = L.marker([latVal, lngVal], { icon: icon }).addTo(mapInstance);
      
      const popupContent = `
        <div class="p-1 leading-normal font-sans">
          <span class="text-xs font-bold text-gray-500">${p.id}</span>
          <h4 class="text-sm font-bold text-gray-900 mt-0.5">${p.name}</h4>
          <p class="text-xs text-gray-600 mt-1"><b>เกษตรกร:</b> ${ownersNames}</p>
          <p class="text-xs text-gray-600"><b>พืชสมุนไพร:</b> <span class="px-1.5 py-0.5 rounded text-[10px] ${
            p.plantType === 'เก๊กฮวย' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
          }">${p.plantType}</span></p>
          <p class="text-xs text-gray-600"><b>ขนาดพื้นที่:</b> ${formatThaiArea(p.sizeRai, p.sizeNgan, p.sizeSqWah)}</p>
          <p class="text-[10px] text-gray-400 mt-1">พิกัด: ${latVal.toFixed(5)}, ${lngVal.toFixed(5)}</p>
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

    // Close Modal buttons
    const closeBtn = document.getElementById('close-plot-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closePlotModal();
      });
    }

    const cancelBtn = document.getElementById('cancel-plot-modal-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.closePlotModal();
      });
    }

    // Submit Modal Form
    const form = document.getElementById('plot-modal-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = appState.getCurrentUser();
        const isMember = currentUser && currentUser.role === 'Member';

        const memberCheckboxes = document.querySelectorAll('.plot-member-checkbox:checked');
        const checkedMemberIds = Array.from(memberCheckboxes).map(cb => cb.value);

        if (isMember && currentUser && !checkedMemberIds.includes(currentUser.memberId)) {
          checkedMemberIds.push(currentUser.memberId);
        }

        if (checkedMemberIds.length === 0) {
          showToast('กรุณาเลือกเกษตรกรผู้ถือครองร่วมอย่างน้อย 1 คน', 'error');
          return;
        }

        const data = {
          memberIds: checkedMemberIds,
          name: document.getElementById('modal-plot-name').value,
          plantType: document.getElementById('modal-plot-plantType').value,
          sizeRai: parseInt(document.getElementById('modal-plot-rai').value) || 0,
          sizeNgan: parseInt(document.getElementById('modal-plot-ngan').value) || 0,
          sizeSqWah: parseInt(document.getElementById('modal-plot-sqWah').value) || 0,
          lat: parseFloat(document.getElementById('modal-plot-lat').value),
          lng: parseFloat(document.getElementById('modal-plot-lng').value),
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
          this.closePlotModal();
          this.refreshView();
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลแปลงปลูก', 'error');
        }
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
  },

  openPlotModal(id = null) {
    const modal = document.getElementById('plot-modal');
    if (!modal) return;

    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';
    this.editingPlotId = id;

    // Reset form
    const form = document.getElementById('plot-modal-form');
    if (form) form.reset();

    // Clear checkboxes
    const checkboxes = document.querySelectorAll('.plot-member-checkbox');
    checkboxes.forEach(cb => {
      const isSelf = isMember && cb.value === currentUser.memberId;
      cb.checked = isSelf;
      cb.disabled = isSelf;
    });

    let defaultLat = 18.9142;
    let defaultLng = 98.9442;
    let zoomLevel = 14;
    let hasMarker = false;

    if (id) {
      // Edit mode
      const plot = appState.getPlotById(id);
      if (plot) {
        document.getElementById('plot-modal-title').innerHTML = `<i class="fas fa-edit"></i> แก้ไขข้อมูลแปลงปลูก (${id})`;
        
        checkboxes.forEach(cb => {
          const isSelf = isMember && cb.value === currentUser.memberId;
          cb.checked = isSelf || (plot.memberIds && plot.memberIds.includes(cb.value));
          cb.disabled = isSelf;
        });

        document.getElementById('modal-plot-name').value = plot.name || '';
        document.getElementById('modal-plot-plantType').value = plot.plantType || 'เก๊กฮวย';
        document.getElementById('modal-plot-rai').value = plot.sizeRai || 0;
        document.getElementById('modal-plot-ngan').value = plot.sizeNgan || 0;
        document.getElementById('modal-plot-sqWah').value = plot.sizeSqWah || 0;
        document.getElementById('modal-plot-lat').value = plot.lat !== undefined ? plot.lat : '';
        document.getElementById('modal-plot-lng').value = plot.lng !== undefined ? plot.lng : '';

        const latVal = parseFloat(plot.lat);
        const lngVal = parseFloat(plot.lng);
        if (!isNaN(latVal) && !isNaN(lngVal)) {
          defaultLat = latVal;
          defaultLng = lngVal;
          zoomLevel = 16;
          hasMarker = true;
        }
      }
    } else {
      // Add mode
      document.getElementById('plot-modal-title').innerHTML = `<i class="fas fa-plus-circle"></i> ลงทะเบียนแปลงปลูกใหม่`;
      document.getElementById('modal-plot-lat').value = '';
      document.getElementById('modal-plot-lng').value = '';
    }

    // Toggle Modal Display
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Initialize map in modal with a slight delay to avoid Leaflet rendering dimensions issues
    setTimeout(() => {
      this.initModalMap(defaultLat, defaultLng, zoomLevel, hasMarker);
    }, 150);
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
      
      document.getElementById('modal-plot-lat').value = clickLat.toFixed(6);
      document.getElementById('modal-plot-lng').value = clickLng.toFixed(6);

      if (modalMarker === null) {
        modalMarker = L.marker([clickLat, clickLng], { icon: pinIcon }).addTo(modalMapInstance);
      } else {
        modalMarker.setLatLng([clickLat, clickLng]);
      }
    });

    // Make sure map updates its width and height rendering bounding box
    modalMapInstance.invalidateSize();
  },

  closePlotModal() {
    const modal = document.getElementById('plot-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    if (modalMapInstance !== null) {
      try {
        modalMapInstance.remove();
      } catch (e) {
        console.warn("Modal map close remove warning:", e);
      }
      modalMapInstance = null;
      modalMarker = null;
    }
  },

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init(); // rebind map and events
    }
  }
};
