// Plots Management Component with Leaflet Map Pinning
import { appState } from '../state.js';
import { formatThaiArea, showToast } from '../helpers.js';

let mapInstance = null;
let tempMarker = null;

export const PlotsComponent = {
  editingPlotId: null,

  render() {
    const plots = appState.getPlots();
    const members = appState.getMembers();

    // Generate members dropdown options
    const membersDropdown = members
      .filter(m => m.status === 'active')
      .map(m => `<option value="${m.id}">${m.name} (${m.id})</option>`)
      .join('');

    // Generate table rows for plots
    const rowsHtml = plots.length === 0 
      ? `<tr><td colspan="7" class="px-6 py-6 text-center text-sm text-gray-500">ยังไม่มีการบันทึกแปลงปลูกในระบบ</td></tr>`
      : plots.map(p => {
          let ownersText = 'ไม่พบชื่อเจ้าของ';
          if (p.memberIds && Array.isArray(p.memberIds)) {
            const owners = p.memberIds.map(mId => members.find(m => m.id === mId)).filter(Boolean);
            if (owners.length > 0) {
              ownersText = owners.map(o => o.name).join(', ');
            }
          } else if (p.memberId) {
            const owner = members.find(m => m.id === p.memberId);
            if (owner) ownersText = owner.name;
          }
          const areaFormatted = formatThaiArea(p.sizeRai, p.sizeNgan, p.sizeSqWah);
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-3.5 text-sm font-semibold text-emerald-800">${p.id}</td>
              <td class="px-6 py-3.5 text-sm font-medium text-gray-900">${p.name}</td>
              <td class="px-6 py-3.5 text-sm text-gray-600">${ownersText}</td>
              <td class="px-6 py-3.5 text-sm text-gray-600">${areaFormatted}</td>
              <td class="px-6 py-3.5">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                  p.plantType === 'เก๊กฮวย' ? 'badge-chrysanthemum' : 'badge-chamomile'
                }">
                  ${p.plantType}
                </span>
              </td>
              <td class="px-6 py-3.5 text-xs font-mono text-gray-500">
                ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}
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
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Map & Details List (Col span 2) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Map Card -->
            <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
              <div class="flex items-center justify-between mb-3 px-2">
                <h3 class="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <i class="fas fa-globe text-emerald-600"></i> แผนที่ตำแหน่งแปลงปลูกจำลอง
                </h3>
                <span class="text-xs text-gray-400">คลิกที่แผนที่หรือกรอกพิกัดเพื่อปักหมุดแปลงปลูก</span>
              </div>
              <!-- Map Div -->
              <div id="plots-map" class="map-container"></div>
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

          <!-- Add / Edit Plot Form Sidebar (Col 3) -->
          <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col h-fit space-y-4">
            <div class="border-b border-gray-100 pb-3">
              <h3 id="plot-form-title" class="font-bold text-gray-800 text-lg flex items-center gap-2">
                <i class="fas fa-plus-circle text-emerald-700"></i>
                ลงทะเบียนแปลงปลูกใหม่
              </h3>
              <p class="text-xs text-gray-400 mt-1">กรอกรายละเอียดขนาดและจิ้มตำแหน่งพิกัดทางภูมิศาสตร์</p>
            </div>

            <form id="plot-form" class="space-y-4">
              <!-- Owner Members Selection (Multi-select Checklist) -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase mb-1 font-bold text-gray-700">เกษตรกรผู้ถือครองร่วม * (เลือกได้มากกว่า 1 คน)</label>
                <div class="border border-gray-200 rounded-xl p-3 bg-white space-y-2 max-h-40 overflow-y-auto" id="members-checkboxes-container">
                  ${members.filter(m => m.status === 'active').map(m => {
                    const avatar = m.currentPhotoBase64 
                      ? `<img src="${m.currentPhotoBase64}" class="w-6 h-6 rounded-full object-cover border border-gray-100 flex-shrink-0">`
                      : `<div class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-800 border border-emerald-200 flex-shrink-0">${m.name.charAt(0)}</div>`;
                    return `
                      <label class="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-xs text-gray-700">
                        <input type="checkbox" name="memberIds" value="${m.id}" class="plot-member-checkbox rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4">
                        ${avatar}
                        <span class="font-medium">${m.name} <span class="text-[9px] text-gray-400">(${m.role})</span></span>
                      </label>
                    `;
                  }).join('')}
                </div>
                <p class="text-[10px] text-gray-400 mt-1">ติ๊กถูกหน้าชื่อสมาชิกที่เป็นผู้ดูแลหรือเจ้าของร่วมแปลงนี้</p>
              </div>

              <!-- Plot Name -->
              <div>
                <label for="plot-name" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชื่อเรียกแปลงปลูก *</label>
                <input type="text" id="plot-name" name="name" required placeholder="เช่น แปลง 1 ข้างบ้านป้าใจดี"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Herb Type -->
              <div>
                <label for="plot-plantType" class="block text-xs font-semibold text-gray-500 uppercase mb-1">พืชสมุนไพรหลัก *</label>
                <select id="plot-plantType" name="plantType" required
                  class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="เก๊กฮวย">เก๊กฮวย (Chrysanthemum)</option>
                  <option value="คาโมมายล์">คาโมมายล์ (Chamomile)</option>
                </select>
              </div>

              <!-- Area Size Inputs (Rai - Ngan - SqWah) -->
              <div>
                <span class="block text-xs font-semibold text-gray-500 uppercase mb-1">ขนาดพื้นที่แปลงปลูก *</span>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <input type="number" id="plot-rai" name="sizeRai" min="0" value="0" required
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="block text-[10px] text-center text-gray-400 mt-1">ไร่</span>
                  </div>
                  <div>
                    <input type="number" id="plot-ngan" name="sizeNgan" min="0" max="3" value="0" required
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="block text-[10px] text-center text-gray-400 mt-1">งาน</span>
                  </div>
                  <div>
                    <input type="number" id="plot-sqWah" name="sizeSqWah" min="0" max="99" value="0" required
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="block text-[10px] text-center text-gray-400 mt-1">ตร.ว.</span>
                  </div>
                </div>
              </div>

              <!-- Map Coordinates Input -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label for="plot-lat" class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Latitude *</label>
                  <input type="number" id="plot-lat" name="lat" step="any" required placeholder="18.9142"
                    class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <div>
                  <label for="plot-lng" class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Longitude *</label>
                  <input type="number" id="plot-lng" name="lng" step="any" required placeholder="98.9442"
                    class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
              </div>

              <!-- Notice -->
              <div class="p-3 bg-amber-50 text-amber-900 border border-amber-100 rounded-xl text-[10px] leading-relaxed">
                <i class="fas fa-info-circle mr-1 text-amber-600"></i>
                คุณสามารถคลิกที่แผนที่โดยตรง พิกัด ละติจูด/ลองจิจูด จะอัปเดตลงฟอร์มให้คุณอัตโนมัติ
              </div>

              <!-- Buttons -->
              <div class="flex gap-2 pt-2">
                <button type="button" id="cancel-plot-form" class="w-1/3 py-2.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" class="w-2/3 py-2.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1">
                  <i class="fas fa-save"></i> บันทึกข้อมูลแปลง
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    `;
  },

  init() {
    this.initMap();
    this.bindFormEvents();
    this.bindPlotActions();
  },

  initMap() {
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded');
      return;
    }

    // Safely remove existing map instance to avoid container reuse issues
    if (mapInstance !== null) {
      mapInstance.remove();
      mapInstance = null;
      tempMarker = null;
    }

    const plots = appState.getPlots();
    
    // Default focus center around Chiang Mai Mae Rim area
    const centerLat = 18.9142;
    const centerLng = 98.9442;

    // Initialize Map
    mapInstance = L.map('plots-map').setView([centerLat, centerLng], 14);

    // Add OpenStreetMap tiles layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Load custom icons or colors
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

    // Add markers for existing plots
    plots.forEach(p => {
      let ownersText = 'ไม่พบชื่อเจ้าของ';
      if (p.memberIds && Array.isArray(p.memberIds)) {
        const owners = p.memberIds.map(mId => members.find(m => m.id === mId)).filter(Boolean);
        if (owners.length > 0) {
          ownersText = owners.map(o => o.name).join(', ');
        }
      } else if (p.memberId) {
        const owner = members.find(m => m.id === p.memberId);
        if (owner) ownersText = owner.name;
      }
      const icon = p.plantType === 'เก๊กฮวย' ? chrysanthemumIcon : chamomileIcon;
      const marker = L.marker([p.lat, p.lng], { icon: icon }).addTo(mapInstance);
      
      const popupContent = `
        <div class="p-1 leading-normal font-sans">
          <span class="text-xs font-bold text-gray-500">${p.id}</span>
          <h4 class="text-sm font-bold text-gray-900 mt-0.5">${p.name}</h4>
          <p class="text-xs text-gray-600 mt-1"><b>เกษตรกร:</b> ${ownersText}</p>
          <p class="text-xs text-gray-600"><b>พืชสมุนไพร:</b> <span class="px-1.5 py-0.5 rounded text-[10px] ${
            p.plantType === 'เก๊กฮวย' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
          }">${p.plantType}</span></p>
          <p class="text-xs text-gray-600"><b>ขนาดพื้นที่:</b> ${formatThaiArea(p.sizeRai, p.sizeNgan, p.sizeSqWah)}</p>
          <p class="text-[10px] text-gray-400 mt-1">พิกัด: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    // Handle clicks on map to set coords
    mapInstance.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      document.getElementById('plot-lat').value = lat.toFixed(6);
      document.getElementById('plot-lng').value = lng.toFixed(6);

      // Add or update temporary marker to show draft location
      if (tempMarker === null) {
        const tempIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-gray-500 text-white pulse-emerald"><i class="fas fa-map-pin"></i></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        tempMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(mapInstance);
      } else {
        tempMarker.setLatLng([lat, lng]);
      }
    });
  },

  bindFormEvents() {
    const form = document.getElementById('plot-form');
    const cancelBtn = document.getElementById('cancel-plot-form');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Collect checked memberIds
        const checkedCheckboxes = document.querySelectorAll('.plot-member-checkbox:checked');
        const memberIds = Array.from(checkedCheckboxes).map(cb => cb.value);
        
        if (memberIds.length === 0) {
          showToast('กรุณาเลือกสมาชิกผู้ถือครองอย่างน้อย 1 คน', 'error');
          return;
        }

        const formData = new FormData(form);
        const data = {
          memberIds: memberIds,
          memberId: memberIds[0], // fallback for legacy logic compatibility
          name: formData.get('name'),
          plantType: formData.get('plantType'),
          sizeRai: parseInt(formData.get('sizeRai')) || 0,
          sizeNgan: parseInt(formData.get('sizeNgan')) || 0,
          sizeSqWah: parseInt(formData.get('sizeSqWah')) || 0,
          lat: parseFloat(formData.get('lat')),
          lng: parseFloat(formData.get('lng')),
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
          this.resetForm();
          this.refreshView();
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลแปลงปลูก', 'error');
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.resetForm();
      });
    }
  },

  bindPlotActions() {
    // Pan to plot marker on map
    const panBtns = document.querySelectorAll('.pan-to-plot-btn');
    panBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plot = appState.getPlotById(id);
        if (plot && mapInstance) {
          mapInstance.setView([plot.lat, plot.lng], 16);
          
          // Open popup of marker dynamically
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

    // Edit plot details
    const editBtns = document.querySelectorAll('.edit-plot-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plot = appState.getPlotById(id);
        if (plot) {
          this.editingPlotId = id;
          document.getElementById('plot-form-title').innerHTML = `<i class="fas fa-edit text-emerald-700"></i> แก้ไขข้อมูลแปลง (${id})`;
          
          // Clear all checked boxes first
          const checkboxes = document.querySelectorAll('.plot-member-checkbox');
          checkboxes.forEach(cb => cb.checked = false);

          // Check the ones corresponding to this plot
          const currentMemberIds = plot.memberIds || (plot.memberId ? [plot.memberId] : []);
          currentMemberIds.forEach(mId => {
            const cb = document.querySelector(`.plot-member-checkbox[value="${mId}"]`);
            if (cb) cb.checked = true;
          });

          document.getElementById('plot-name').value = plot.name;
          document.getElementById('plot-plantType').value = plot.plantType;
          document.getElementById('plot-rai').value = plot.sizeRai;
          document.getElementById('plot-ngan').value = plot.sizeNgan;
          document.getElementById('plot-sqWah').value = plot.sizeSqWah;
          document.getElementById('plot-lat').value = plot.lat;
          document.getElementById('plot-lng').value = plot.lng;

          // Pan to it on map
          if (mapInstance) {
            mapInstance.setView([plot.lat, plot.lng], 16);
          }
          
          // Scroll form into view if on mobile
          document.getElementById('plot-form').scrollIntoView({ behavior: 'smooth' });
        }
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
  },

  resetForm() {
    this.editingPlotId = null;
    document.getElementById('plot-form-title').innerHTML = `<i class="fas fa-plus-circle text-emerald-700"></i> ลงทะเบียนแปลงปลูกใหม่`;
    const form = document.getElementById('plot-form');
    if (form) form.reset();
    
    // Uncheck all member checkboxes
    const checkboxes = document.querySelectorAll('.plot-member-checkbox');
    checkboxes.forEach(cb => cb.checked = false);

    if (tempMarker !== null && mapInstance) {
      mapInstance.removeLayer(tempMarker);
      tempMarker = null;
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
