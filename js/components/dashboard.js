// Dashboard Component for Overview Metrics and Quick Insights
import { appState } from '../state.js';
import { formatThaiArea, formatThaiDate } from '../helpers.js';

export const DashboardComponent = {
  render() {
    const stats = appState.getStats();
    const enterprise = appState.getEnterprise();
    const crops = appState.getCrops().filter(c => c.status === 'growing');
    const plots = appState.getPlots();
    const members = appState.getMembers();

    // Calculate percentages for the styled bar charts
    const totalHerbPlots = stats.chrysanthemumPlots + stats.chamomilePlots || 1;
    const chrysPercent = Math.round((stats.chrysanthemumPlots / totalHerbPlots) * 100);
    const chamoPercent = Math.round((stats.chamomilePlots / totalHerbPlots) * 100);

    // Get active growing crop seasons details
    const activeCropsHtml = crops.length === 0 
      ? `<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">ไม่มีรอบการปลูกที่กำลังดำเนินการในขณะนี้</td></tr>`
      : crops.slice(0, 5).map(c => {
          const plot = plots.find(p => p.id === c.plotId);
          const owner = plot ? members.find(m => m.id === plot.memberId) : null;
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-4 text-sm font-semibold text-emerald-800">${c.id}</td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">${plot ? plot.name : 'ไม่พบแปลงปลูก'}</div>
                <div class="text-xs text-gray-500">เจ้าของ: ${owner ? owner.name : '-'}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                  plot && plot.plantType === 'เก๊กฮวย' ? 'badge-chrysanthemum' : 'badge-chamomile'
                }">
                  ${plot ? plot.plantType : '-'}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">${formatThaiDate(c.plantDate)}</td>
              <td class="px-6 py-4 text-sm text-gray-600 font-medium">${formatThaiDate(c.harvestDateEst)}</td>
            </tr>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">
        <!-- Welcoming Banner -->
        <div class="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-8 border-emerald-700">
          <div class="space-y-1">
            <span class="text-xs font-bold text-emerald-700 uppercase tracking-widest">ระบบข้อมูลระบบสาธิต</span>
            <h1 class="text-2xl md:text-3xl font-extrabold text-gray-800">${enterprise.name}</h1>
            <p class="text-sm text-gray-600 max-w-2xl">${enterprise.description}</p>
            <p class="text-xs text-gray-500 pt-2 flex items-center gap-1">
              <i class="fas fa-map-marker-alt text-emerald-600"></i> ที่ตั้ง: ${enterprise.village} ต.${enterprise.subdistrict} อ.${enterprise.district} จ.${enterprise.province}
            </p>
          </div>
          <div class="flex items-center gap-3 self-start md:self-center">
            <span class="flex h-3 w-3 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span class="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              ระบบออนไลน์จำลอง
            </span>
          </div>
        </div>

        <!-- 4 Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Card 1: Members -->
          <div class="glass-card bg-white rounded-2xl p-6 flex items-center gap-5 border border-gray-100">
            <div class="p-4 bg-emerald-50 rounded-2xl text-emerald-700">
              <i class="fas fa-users text-2xl"></i>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-400 block mb-1">สมาชิกทั้งหมด</span>
              <span class="text-3xl font-bold text-gray-800">${stats.totalMembers}</span>
              <span class="text-xs text-emerald-600 block mt-1">
                <i class="fas fa-user-check mr-1"></i> Active ${stats.activeMembers} คน
              </span>
            </div>
          </div>

          <!-- Card 2: Plots -->
          <div class="glass-card bg-white rounded-2xl p-6 flex items-center gap-5 border border-gray-100">
            <div class="p-4 bg-amber-50 rounded-2xl text-amber-600">
              <i class="fas fa-seedling text-2xl"></i>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-400 block mb-1">แปลงปลูกในระบบ</span>
              <span class="text-3xl font-bold text-gray-800">${stats.totalPlots}</span>
              <span class="text-xs text-amber-600 block mt-1">
                <i class="fas fa-map-marked-alt mr-1"></i> ปักหมุดแผนที่ครบถ้วน
              </span>
            </div>
          </div>

          <!-- Card 3: Total Area -->
          <div class="glass-card bg-white rounded-2xl p-6 flex items-center gap-5 border border-gray-100">
            <div class="p-4 bg-lime-50 rounded-2xl text-lime-700">
              <i class="fas fa-chart-area text-2xl"></i>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-400 block mb-1">พื้นที่ปลูกรวม</span>
              <span class="text-3xl font-bold text-gray-800">${stats.totalAreaRai}</span>
              <span class="text-xs text-gray-500 inline-block">ไร่</span>
              <span class="text-xs text-lime-700 block mt-1">
                <i class="fas fa-calculator mr-1"></i> ประมาณ ${stats.totalAreaSqM.toLocaleString()} ตร.ม.
              </span>
            </div>
          </div>

          <!-- Card 4: Harvest -->
          <div class="glass-card bg-white rounded-2xl p-6 flex items-center gap-5 border border-gray-100">
            <div class="p-4 bg-sky-50 rounded-2xl text-sky-600">
              <i class="fas fa-weight text-2xl"></i>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-400 block mb-1">ผลผลิตสะสมรวม</span>
              <span class="text-3xl font-bold text-gray-800">${stats.totalYield}</span>
              <span class="text-xs text-gray-500 inline-block">กก.</span>
              <span class="text-xs text-sky-600 block mt-1">
                <i class="fas fa-history mr-1"></i> จากรอบการปลูกที่เสร็จสิ้น
              </span>
            </div>
          </div>

        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Column 1 & 2: Active Crops Seasons -->
          <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                <i class="fas fa-hourglass-half text-emerald-600"></i>
                รอบเพาะปลูกที่กำลังเติบโต (Active Seasons)
              </h3>
              <span class="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                ทั้งหมด ${crops.length} รอบ
              </span>
            </div>

            <div class="overflow-x-auto rounded-xl border border-gray-100">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                    <th class="px-6 py-3.5">รหัสรอบ</th>
                    <th class="px-6 py-3.5">ชื่อแปลง / เกษตรกร</th>
                    <th class="px-6 py-3.5">พืชที่ปลูก</th>
                    <th class="px-6 py-3.5">วันเริ่มปลูก</th>
                    <th class="px-6 py-3.5">วันคาดว่าจะเก็บเกี่ยว</th>
                  </tr>
                </thead>
                <tbody>
                  ${activeCropsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Column 3: Herb Crops Distribution (Styled custom Bar Charts) -->
          <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i class="fas fa-pie-chart text-emerald-600"></i>
                สัดส่วนสมุนไพรในแปลงปลูก
              </h3>

              <!-- Chart Content -->
              <div class="space-y-6">
                <!-- Chrysanthemum -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center text-sm font-medium">
                    <span class="text-amber-800 flex items-center gap-1.5">
                      <span class="w-3 h-3 bg-amber-500 rounded-full inline-block"></span>
                      เก๊กฮวย
                    </span>
                    <span class="text-gray-500">${stats.chrysanthemumPlots} แปลง (${chrysPercent}%)</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-3">
                    <div class="bg-amber-500 h-3 rounded-full transition-all duration-500" style="width: ${chrysPercent}%"></div>
                  </div>
                </div>

                <!-- Chamomile -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center text-sm font-medium">
                    <span class="text-sky-800 flex items-center gap-1.5">
                      <span class="w-3 h-3 bg-sky-500 rounded-full inline-block"></span>
                      คาโมมายล์
                    </span>
                    <span class="text-gray-500">${stats.chamomilePlots} แปลง (${chamoPercent}%)</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-3">
                    <div class="bg-sky-500 h-3 rounded-full transition-all duration-500" style="width: ${chamoPercent}%"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notice card -->
            <div class="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
              <i class="fas fa-info-circle mr-1 text-emerald-600"></i> 
              สัดส่วนนี้อ้างอิงจากแปลงปลูกที่ลงทะเบียนพิกัดและชนิดพืชเรียบร้อยแล้วในฐานข้อมูลระบบจัดการแปลงปลูก
            </div>
          </div>

        </div>
      </div>
    `;
  },

  init() {
    // No specific listeners needed for static dashboard display
  }
};
