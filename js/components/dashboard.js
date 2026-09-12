// Dashboard Component for Overview Metrics and Quick Insights
import { appState } from '../state.js';
import { formatThaiArea, formatThaiDate } from '../helpers.js';

export const DashboardComponent = {
  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    const stats = appState.getStats();

    let plots = appState.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const plotIds = plots.map(p => p.id);
    const crops = appState.getCrops().filter(c => c.status === 'growing' && plotIds.includes(c.plotId));
    const members = appState.getMembers();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compute fertilizer schedule for each active crop
    const cropsWithFert = crops.map(c => {
      const plot = plots.find(p => p.id === c.plotId);
      const owners = plot ? members.filter(m => plot.memberIds && plot.memberIds.includes(m.id)) : [];
      const ownersNames = owners.map(o => o.name).join(', ') || '-';
      const herbType = c.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';
      const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');

      const fertLogs = c.fertilizingLog || [];
      const fertCount = fertLogs.length;
      let nextFertDateStr = c.fertDateEst;
      if (!nextFertDateStr && c.plantDate) {
        const pDate = new Date(c.plantDate);
        pDate.setMonth(pDate.getMonth() + (fertCount + 1));
        nextFertDateStr = pDate.toISOString().split('T')[0];
      }

      let fertDiffDays = null;
      if (nextFertDateStr) {
        const fDate = new Date(nextFertDateStr);
        fDate.setHours(0, 0, 0, 0);
        fertDiffDays = Math.ceil((fDate - today) / (1000 * 60 * 60 * 24));
      }

      return {
        ...c,
        plot,
        ownersNames,
        herbType,
        isChrys,
        fertCount,
        nextFertDateStr,
        fertDiffDays
      };
    });

    // Sort urgent fertilizer needs first (overdue < 0 first, then 0, then 1..N)
    const sortedFertCrops = [...cropsWithFert].sort((a, b) => {
      if (a.fertDiffDays === null) return 1;
      if (b.fertDiffDays === null) return -1;
      return a.fertDiffDays - b.fertDiffDays;
    });

    const overdueCount = sortedFertCrops.filter(item => item.fertDiffDays !== null && item.fertDiffDays < 0).length;
    const dueTodayCount = sortedFertCrops.filter(item => item.fertDiffDays === 0).length;
    const upcomingCount = sortedFertCrops.filter(item => item.fertDiffDays !== null && item.fertDiffDays > 0 && item.fertDiffDays <= 7).length;

    // Generate fertilizer reminder cards
    const fertCardsHtml = sortedFertCrops.length === 0
      ? `<div class="col-span-full py-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl">ไม่มีรอบการปลูกที่กำลังดำเนินการในขณะนี้</div>`
      : sortedFertCrops.map(item => {
          let badgeClass = '';
          let badgeText = '';
          let cardBg = 'bg-white border-gray-100';
          let icon = '';

          if (item.fertDiffDays === null) {
            badgeClass = 'bg-gray-100 text-gray-600';
            badgeText = 'ยังไม่กำหนดวัน';
            icon = '<i class="fas fa-calendar-alt text-gray-400"></i>';
          } else if (item.fertDiffDays < 0) {
            badgeClass = 'bg-rose-100 text-rose-800 border border-rose-200';
            badgeText = `<i class="fas fa-exclamation-triangle mr-1"></i>เลยกำหนด ${Math.abs(item.fertDiffDays)} วัน`;
            cardBg = 'bg-rose-50/50 border-rose-200 shadow-sm';
            icon = '<i class="fas fa-exclamation-circle text-rose-500 text-base"></i>';
          } else if (item.fertDiffDays === 0) {
            badgeClass = 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse';
            badgeText = `<i class="fas fa-bell mr-1"></i>ถึงกำหนดวันนี้!`;
            cardBg = 'bg-amber-50/60 border-amber-300 shadow-sm ring-1 ring-amber-300';
            icon = '<i class="fas fa-bell text-amber-500 text-base animate-bounce"></i>';
          } else if (item.fertDiffDays <= 7) {
            badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            badgeText = `<i class="fas fa-clock mr-1"></i>อีก ${item.fertDiffDays} วัน`;
            cardBg = 'bg-emerald-50/40 border-emerald-200';
            icon = '<i class="fas fa-seedling text-emerald-600 text-base"></i>';
          } else {
            badgeClass = 'bg-gray-100 text-gray-700 border border-gray-200';
            badgeText = `อีก ${item.fertDiffDays} วัน`;
            cardBg = 'bg-white border-gray-100';
            icon = '<i class="fas fa-calendar-check text-emerald-600 text-base"></i>';
          }

          return `
            <div class="rounded-2xl p-5 border ${cardBg} flex flex-col justify-between transition-all hover:shadow-md">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2.5">
                  <div class="flex items-center gap-2">
                    ${icon}
                    <span class="text-xs font-bold text-gray-700">รอบ #${item.id}</span>
                  </div>
                  <span class="px-2.5 py-1 text-xs font-bold rounded-full ${badgeClass}">
                    ${badgeText}
                  </span>
                </div>

                <div class="text-base font-bold text-gray-900 truncate">
                  ${item.plot ? item.plot.name : 'ไม่พบแปลงปลูก'}
                </div>
                
                <div class="text-xs text-gray-500 mt-1 flex items-center justify-between">
                  <span class="truncate"><i class="fas fa-user text-gray-400 mr-1"></i>${item.ownersNames}</span>
                  <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${
                    item.isChrys ? 'text-amber-800 bg-amber-100' : 'text-sky-800 bg-sky-100'
                  }">${item.herbType}</span>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase font-semibold">กำหนดใส่ปุ๋ยบำรุง</span>
                  <span class="font-bold ${item.fertDiffDays !== null && item.fertDiffDays < 0 ? 'text-rose-600' : (item.fertDiffDays === 0 ? 'text-amber-700' : 'text-gray-800')}">
                    ${item.nextFertDateStr ? formatThaiDate(item.nextFertDateStr) : '-'}
                  </span>
                  <span class="text-[11px] text-gray-400 block">ใส่แล้ว ${item.fertCount} ครั้ง</span>
                </div>
                <a href="#crops" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5">
                  <i class="fas fa-hand-holding-seedling"></i>
                  <span>บันทึกใส่ปุ๋ย</span>
                </a>
              </div>
            </div>
          `;
        }).join('');

    // Active crops table rows with fertilizer schedule column
    const activeCropsHtml = sortedFertCrops.length === 0 
      ? `<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">ไม่มีรอบการปลูกที่กำลังดำเนินการในขณะนี้</td></tr>`
      : sortedFertCrops.slice(0, 5).map(c => {
          let fertStatusBadge = '';
          if (c.fertDiffDays === null) {
            fertStatusBadge = `<span class="text-xs text-gray-400">-</span>`;
          } else if (c.fertDiffDays < 0) {
            fertStatusBadge = `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                <i class="fas fa-exclamation-triangle"></i> เลยกำหนด ${Math.abs(c.fertDiffDays)} วัน (${formatThaiDate(c.nextFertDateStr)})
              </span>
            `;
          } else if (c.fertDiffDays === 0) {
            fertStatusBadge = `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                <i class="fas fa-bell"></i> ถึงกำหนดวันนี้ (${formatThaiDate(c.nextFertDateStr)})
              </span>
            `;
          } else if (c.fertDiffDays <= 7) {
            fertStatusBadge = `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <i class="fas fa-clock"></i> อีก ${c.fertDiffDays} วัน (${formatThaiDate(c.nextFertDateStr)})
              </span>
            `;
          } else {
            fertStatusBadge = `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                <i class="fas fa-calendar-alt text-gray-400"></i> อีก ${c.fertDiffDays} วัน (${formatThaiDate(c.nextFertDateStr)})
              </span>
            `;
          }

          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-4 text-sm font-semibold text-emerald-800">${c.id}</td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">${c.plot ? c.plot.name : 'ไม่พบแปลงปลูก'}</div>
                <div class="text-xs text-gray-550">เจ้าของ: ${c.ownersNames}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                  c.isChrys ? 'badge-chrysanthemum text-amber-800 bg-amber-100' : 'badge-chamomile text-sky-800 bg-sky-100'
                }">
                  ${c.herbType}
                </span>
              </td>
              <td class="px-6 py-4">
                ${fertStatusBadge}
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">${formatThaiDate(c.plantDate)}</td>
              <td class="px-6 py-4 text-sm text-gray-600 font-medium">${formatThaiDate(c.harvestDateEst)}</td>
            </tr>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">
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

        <!-- Fertilizer Alert & Reminder Section -->
        <div class="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div class="flex items-center gap-2.5">
                <span class="flex h-3 w-3 relative">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <i class="fas fa-bell text-amber-500"></i>
                  การแจ้งเตือนกำหนดใส่ปุ๋ยบำรุงแปลง (เดือนละ 1 ครั้ง)
                </h3>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                ติดตามรอบบำรุงดินและใส่ปุ๋ยอินทรีย์ตามระยะเวลา เพื่อให้ได้ผลผลิตสมุนไพรคุณภาพตามมาตรฐาน
              </p>
            </div>
            
            <div class="flex items-center gap-2 flex-wrap">
              ${overdueCount > 0 ? `
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <i class="fas fa-exclamation-circle"></i> เลยกำหนด ${overdueCount} แปลง
                </span>
              ` : ''}
              ${dueTodayCount > 0 ? `
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                  <i class="fas fa-bell"></i> ถึงกำหนดวันนี้ ${dueTodayCount} แปลง
                </span>
              ` : ''}
              ${upcomingCount > 0 ? `
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <i class="fas fa-calendar-check"></i> ใน 7 วัน ${upcomingCount} แปลง
                </span>
              ` : ''}
              <a href="#crops" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all">
                <i class="fas fa-clipboard-list"></i> ไปที่บันทึกรอบปลูก
              </a>
            </div>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            ${fertCardsHtml}
          </div>
        </div>

        <!-- Active Crops Seasons Table (Full Width) -->
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
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
                  <th class="px-6 py-3.5">กำหนดใส่ปุ๋ย (เดือนละครั้ง)</th>
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
      </div>
    `;
  },

  init() {
    // No specific listeners needed for static dashboard display
  }
};
