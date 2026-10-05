// สรุปต้นทุน-รายได้ วิสาหกิจชุมชน — Cost & Revenue Summary Component
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal, getHerbDefaultIcon, formatCropSeasonId } from '../helpers.js';

export const CostRevenueComponent = {
  activeTab: 'financial-crop', // 'financial-crop' | 'inventory-yield' | 'members-calc'
  selectedSalesYear: String(new Date().getFullYear()),
  selectedSalesMonth: 'all',

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    // ---- Raw Data ----
    let plots     = appState.getPlots();
    let crops     = appState.getCrops();
    let members   = appState.getMembers();
    let batches   = appState.getDryingBatches ? appState.getDryingBatches() : [];
    let products  = appState.getProducts();

    // à¸£à¸§à¸¡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸à¸²à¸£à¸‚à¸²à¸¢à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸” à¸—à¸±à¹‰à¸‡à¸ˆà¸²à¸à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™/à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¸‚à¸²à¸¢ (direct_sales) à¹à¸¥à¸°à¸£à¸°à¸šà¸šà¸«à¸¥à¸±à¸ (state.sales)
    const DIRECT_SALES_KEY = 'herb_enterprise_direct_sales_v1';
    let directSales = [];
    try {
      directSales = JSON.parse(localStorage.getItem(DIRECT_SALES_KEY)) || [];
    } catch (e) {}

    const salesMap = new Map();
    directSales.forEach(s => { if (s && s.id) salesMap.set(s.id, s); });
    (appState.getSales() || []).forEach(s => {
      if (s && s.id && !salesMap.has(s.id)) salesMap.set(s.id, s);
    });
    let sales = Array.from(salesMap.values());

    if (isMember) {
      plots  = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
      const plotIds = plots.map(p => p.id);
      crops  = crops.filter(c => plotIds.includes(c.plotId));
      const cropIds = crops.map(c => c.id);
      sales  = sales.filter(s => (s.cropId && cropIds.includes(s.cropId)) || s.sellerId === currentUser.memberId || s.memberId === currentUser.memberId);
    }

    // Helper: à¸”à¸¶à¸‡à¸ˆà¸³à¸™à¸§à¸™à¸£à¸§à¸¡à¸‚à¸­à¸‡à¸ªà¸´à¸™à¸„à¹‰à¸²à¹ƒà¸™à¸£à¸²à¸¢à¸à¸²à¸£à¸‚à¸²à¸¢
    const getSaleQty = (x) => {
      if (x.quantity !== undefined && !isNaN(parseFloat(x.quantity)) && parseFloat(x.quantity) > 0) {
        return parseFloat(x.quantity);
      }
      if (x.amountKg !== undefined && !isNaN(parseFloat(x.amountKg)) && parseFloat(x.amountKg) > 0) {
        return parseFloat(x.amountKg);
      }
      if (x.amount !== undefined && !isNaN(parseFloat(x.amount)) && parseFloat(x.amount) > 0) {
        return parseFloat(x.amount);
      }
      if (x.items && Array.isArray(x.items) && x.items.length > 0) {
        return x.items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
      }
      return 0;
    };

    // ---- KPI Totals ----
    const totalRevenue = sales.reduce((s, x) => s + (parseFloat(x.totalPrice) || 0), 0);
    const totalCost    = crops.reduce((s, c) => s + (parseFloat(c.cost) || 0), 0);
    const totalProfit  = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    const totalFreshKg = crops.reduce((s, c) => s + (parseFloat(c.harvestWeight) || parseFloat(c.yield) || 0), 0);
    const totalSaleQty = sales.reduce((s, x) => s + getSaleQty(x), 0);
    const avgPricePerKg = totalSaleQty > 0 ? (totalRevenue / totalSaleQty).toFixed(0) : 0;

    // Helper: คำนวณน้ำหนักอบแห้งจริงสะสมจากรอบปลูกที่ผ่านการอบแห้งและล็อตอบแห้งกลาง
    const getHerbDryKg = (targetHerb = null) => {
      const filteredCrops = targetHerb 
        ? crops.filter(c => {
            const plot = plots.find(p => p.id === c.plotId);
            const pt = c.seedlingSource || (plot ? plot.plantType : '') || '';
            return pt.includes(targetHerb);
          })
        : crops;

      const cropDryMap = {};
      filteredCrops.forEach(c => {
        if (c.dryWeight && parseFloat(c.dryWeight) > 0) {
          cropDryMap[c.id] = parseFloat(c.dryWeight);
        }
      });
      let sum = Object.values(cropDryMap).reduce((s, v) => s + v, 0);

      const targetBatches = targetHerb
        ? batches.filter(b => b.herbType && b.herbType.includes(targetHerb))
        : batches;

      targetBatches.forEach(b => {
        const bDry = parseFloat(b.dryWeightKg || b.dryWeight) || 0;
        if (b.cropIds && Array.isArray(b.cropIds) && b.cropIds.length > 0) {
          const isCovered = b.cropIds.every(id => cropDryMap[id] !== undefined);
          if (!isCovered) sum += bDry;
        } else if (!b.cropIds || b.cropIds.length === 0) {
          sum += bDry;
        }
      });

      return parseFloat(sum.toFixed(1));
    };

    const totalDryKg = getHerbDryKg();

    // ---- Herb Discovery (เชื่อมโยง 3 ระบบหลัก: แผนการปลูก, บันทึกรอบเพาะปลูก, และคลังสินค้า) ----
    const allRoadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
    const roadmapHerbNames = Object.keys(allRoadmaps).filter(h => h && h.trim());
    const plotHerbNames = plots.map(p => (p.plantType || '').trim()).filter(Boolean);
    const cropHerbNames = crops.map(c => (c.seedlingSource || '').trim()).filter(Boolean);
    const batchHerbNames = batches.map(b => (b.herbType || '').trim()).filter(Boolean);
    // ดึงเฉพาะพืชที่มีสินค้าในคลังและมีสต็อกคงเหลือจริง > 0
    const productHerbNames = (products || [])
      .filter(p => (parseFloat(p.stock) || 0) > 0)
      .map(p => (p.category || '').trim())
      .filter(c => c && !['สมุนไพรรวม', 'แปรรูปบรรจุภัณฑ์', 'ทั่วไป'].includes(c));

    // พืชต้องมาจาก แผนการปลูก (Roadmap) หรือมีบันทึกรอบปลูกจริง/แปลงปลูกจริง หรือมีสต็อกสินค้าจริง
    const rawHerbs = ['เก๊กฮวย', 'คาโมมายล์', ...roadmapHerbNames, ...plotHerbNames, ...cropHerbNames, ...batchHerbNames, ...productHerbNames];
    const uniqueHerbs = [];
    rawHerbs.forEach(raw => {
      let clean = (raw || '').trim();
      if (!clean) return;
      if (clean.includes('เก๊กฮวย')) clean = 'เก๊กฮวย';
      else if (clean.includes('คาโมมายล์')) clean = 'คาโมมายล์';
      if (!uniqueHerbs.includes(clean)) {
        // ต้องเป็นพืชที่มีใน แผนการปลูก หรือ มีรอบปลูกจริง หรือ มีสต็อกสินค้าจริง
        const inRoadmap = roadmapHerbNames.includes(clean) || clean === 'เก๊กฮวย' || clean === 'คาโมมายล์';
        const hasCrops = crops.some(c => (c.seedlingSource || '').includes(clean));
        const hasPlots = plots.some(p => (p.plantType || '').includes(clean));
        const hasStock = (products || []).some(p => p.category === clean && (parseFloat(p.stock) || 0) > 0);
        if (inRoadmap || hasCrops || hasPlots || hasStock) {
          uniqueHerbs.push(clean);
        }
      }
    });

    const defaultMeta = {
      'เก๊กฮวย': { emoji: '🌼', ratioText: '8 : 1 (สด 8 กก. ➔ แห้ง 1 กก. ➔ 20 กระปุก)', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
      'คาโมมายล์': { emoji: '🌿', ratioText: '6 : 1 (สด 6 กก. ➔ แห้ง 1 กก. ➔ 20 กระปุก)', badgeBg: 'bg-sky-100 text-sky-900 border-sky-300' }
    };

    const colorPalettes = [
      { emoji: '🌱', badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
      { emoji: '🍃', badgeBg: 'bg-teal-100 text-teal-900 border-teal-300' },
      { emoji: '🌸', badgeBg: 'bg-purple-100 text-purple-900 border-purple-300' },
      { emoji: '🪴', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300' },
      { emoji: '🍀', badgeBg: 'bg-lime-100 text-lime-900 border-lime-300' },
      { emoji: '🌾', badgeBg: 'bg-rose-100 text-rose-900 border-rose-300' }
    ];

    const herbTypes = uniqueHerbs.map((name, idx) => {
      const roadmapIcon = allRoadmaps[name]?.icon;
      const herbEmoji = roadmapIcon || getHerbDefaultIcon(name);
      if (defaultMeta[name]) {
        return {
          name,
          ...defaultMeta[name],
          emoji: herbEmoji
        };
      }
      const palette = colorPalettes[(idx - 2) % colorPalettes.length] || colorPalettes[0];
      return {
        name,
        emoji: herbEmoji,
        ratioText: '8 : 1 (สด 8 กก. ➔ แห้ง 1 กก. ➔ 20 กระปุก)',
        badgeBg: palette.badgeBg
      };
    });

    // ---- 1. Top 6 KPI Cards (Clean White Luxury Design, Non-fatiguing) ----
    const kpiCards = [
      {
        label: 'รายได้จากการจำหน่ายรวม',
        value: formatBaht(totalRevenue),
        sub: `${sales.length} รายการจำหน่ายในระบบ`,
        icon: 'fa-cash-register',
        valColor: 'text-emerald-800',
        iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
      },
      {
        label: 'ต้นทุนการผลิตรวม',
        value: formatBaht(totalCost),
        sub: `${crops.length} รอบการปลูกสะสม`,
        icon: 'fa-seedling',
        valColor: 'text-amber-800',
        iconBg: 'bg-amber-50 text-amber-700 border border-amber-100'
      },
      {
        label: 'กำไรสุทธิรวม',
        value: (totalProfit >= 0 ? '+' : '') + formatBaht(totalProfit),
        sub: `อัตรากำไร (Margin) ${profitMargin}%`,
        icon: totalProfit >= 0 ? 'fa-chart-line' : 'fa-arrow-trend-down',
        valColor: totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-600',
        iconBg: totalProfit >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
      },
      {
        label: 'ราคาจำหน่ายเฉลี่ย',
        value: `${Number(avgPricePerKg).toLocaleString()} บาท/กก.`,
        sub: `ปริมาณจำหน่ายรวม ${totalSaleQty.toFixed(1)} กก.`,
        icon: 'fa-scale-balanced',
        valColor: 'text-slate-800',
        iconBg: 'bg-sky-50 text-sky-700 border border-sky-100'
      },
      {
        label: 'ผลผลิตดอกสดรวม',
        value: `${totalFreshKg.toFixed(1)} กก.`,
        sub: `อบแห้งรวมได้ ~${totalDryKg.toFixed(1)} กก.`,
        icon: 'fa-boxes-packing',
        valColor: 'text-slate-800',
        iconBg: 'bg-indigo-50 text-indigo-700 border border-indigo-100'
      },
      {
        label: 'อัตราการอบแห้งมาตรฐาน',
        value: uniqueHerbs.length > 2 ? `${uniqueHerbs.length} ชนิดพืช` : '8:1 / 6:1',
        sub: uniqueHerbs.length > 2 
          ? `${uniqueHerbs.join(' · ')} (20 กระปุก/กก.)` 
          : 'เก๊กฮวย 8:1 · คาโมมายล์ 6:1 (20 กระปุก/กก.)',
        icon: 'fa-temperature-half',
        valColor: 'text-amber-900',
        iconBg: 'bg-orange-50 text-orange-700 border border-orange-100'
      }
    ];

    const kpiHtml = kpiCards.map(k => `
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs hover:shadow-md transition-all flex items-start justify-between gap-3">
        <div class="space-y-1.5 min-w-0">
          <span class="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide block truncate">${k.label}</span>
          <div class="text-2xl sm:text-3xl font-bold font-mono tabular-nums ${k.valColor} leading-none">${k.value}</div>
          <span class="text-xs sm:text-sm text-gray-600 font-medium block pt-0.5">${k.sub}</span>
        </div>
        <div class="w-11 h-11 rounded-xl ${k.iconBg} flex items-center justify-center text-lg shrink-0 shadow-2xs">
          <i class="fas ${k.icon}"></i>
        </div>
      </div>
    `).join('');

    // ---- By Herb Type Breakdown (เปรียบเทียบทุกชนิดพืชในระบบ บรรจุ 20 กระปุก/กก.) ----
    const herbRows = herbTypes.map(h => {
      const herb = h.name;
      const herbCrops = crops.filter(c => {
        const plot = plots.find(p => p.id === c.plotId);
        const pt = c.seedlingSource || (plot ? plot.plantType : '') || '';
        return pt.includes(herb);
      });
      let rev = 0;
      let herbSalesCount = 0;
      sales.forEach(s => {
        if (s.items && Array.isArray(s.items) && s.items.length > 0) {
          const matchedItems = s.items.filter(it => {
            const pName = it.productName || '';
            const prod = it.productId && appState.getProductById ? appState.getProductById(it.productId) : null;
            return pName.includes(herb) || (prod && ((prod.category || '').includes(herb) || (prod.name || '').includes(herb)));
          });
          if (matchedItems.length > 0) {
            herbSalesCount++;
            rev += matchedItems.reduce((acc, it) => acc + (parseFloat(it.totalPrice) || ((parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0)) || 0), 0);
          }
        } else {
          const crop = s.cropId ? appState.getCropById(s.cropId) : null;
          const plot = crop ? plots.find(p => p.id === crop.plotId) : null;
          const pt = crop?.seedlingSource || (plot ? plot.plantType : '') || s.productName || '';
          if (pt.includes(herb) || (s.herbType && s.herbType.includes(herb)) || (s.category && s.category.includes(herb))) {
            herbSalesCount++;
            rev += (parseFloat(s.totalPrice) || 0);
          }
        }
      });
      const cost = herbCrops.reduce((s, c) => s + (parseFloat(c.cost) || 0), 0);
      const profit = rev - cost;
      const freshKg = herbCrops.reduce((s, c) => s + (parseFloat(c.harvestWeight) || parseFloat(c.yield) || 0), 0);
      const dryKg = getHerbDryKg(herb);
      const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0';

      return {
        ...h,
        herb,
        rev,
        cost,
        profit,
        margin,
        freshKg,
        dryKg,
        crops: herbCrops.length,
        sales: herbSalesCount
      };
    });

    const herbTableRows = herbRows.map(r => `
      <tr class="even:bg-gray-50/60 hover:bg-emerald-50/40 transition-colors border-b border-gray-100 text-sm sm:text-base">
        <td class="py-4 px-5">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${r.emoji}</span>
            <div>
              <div class="font-bold text-gray-900 text-base">${r.herb}</div>
              <div class="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">${r.crops} รอบปลูก · ${r.sales} รายการจำหน่าย</div>
            </div>
          </div>
        </td>
        <td class="py-4 px-4 sm:px-5 text-right font-bold text-gray-800 font-mono">${r.freshKg.toFixed(1)} กก.</td>
        <td class="py-4 px-4 sm:px-5 text-right font-bold text-indigo-800 font-mono">${r.dryKg.toFixed(1)} กก.</td>
        <td class="py-4 px-4 sm:px-5 text-right font-bold text-teal-800 font-mono">${Math.round(r.dryKg * 20).toLocaleString()} กระปุก</td>
        <td class="py-4 px-5 text-right font-bold text-amber-800 font-mono">${formatBaht(r.cost)}</td>
        <td class="py-4 px-5 text-right font-bold text-emerald-800 font-mono">${formatBaht(r.rev)}</td>
        <td class="py-4 px-5 text-right font-bold text-base sm:text-lg font-mono ${r.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}">
          ${r.profit >= 0 ? '+' : ''}${formatBaht(r.profit)}
        </td>
        <td class="py-4 px-5 text-center">
          <span class="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${r.profit >= 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}">
            ${r.margin}%
          </span>
        </td>
      </tr>
    `).join('');

    // ---- Monthly Sales with Year/Month Filters ----
    if (!this.selectedSalesYear) {
      this.selectedSalesYear = String(new Date().getFullYear());
    }
    if (!this.selectedSalesMonth) {
      this.selectedSalesMonth = 'all';
    }

    const currentYear = new Date().getFullYear();
    const availableYearsSet = new Set([currentYear]);
    sales.forEach(s => {
      const d = s.date || s.saleDate || (s.createdAt ? s.createdAt.substring(0, 10) : '');
      if (d && d.length >= 4) {
        const y = parseInt(d.substring(0, 4));
        if (!isNaN(y) && y > 2000 && y < 2200) {
          availableYearsSet.add(y);
        }
      }
    });
    const availableYears = Array.from(availableYearsSet).sort().reverse();

    const monthFilterOptions = [
      { val: 'all', label: 'ทุกเดือน' },
      { val: '01', label: 'ม.ค.' },
      { val: '02', label: 'ก.พ.' },
      { val: '03', label: 'มี.ค.' },
      { val: '04', label: 'เม.ย.' },
      { val: '05', label: 'พ.ค.' },
      { val: '06', label: 'มิ.ย.' },
      { val: '07', label: 'ก.ค.' },
      { val: '08', label: 'ส.ค.' },
      { val: '09', label: 'ก.ย.' },
      { val: '10', label: 'ต.ค.' },
      { val: '11', label: 'พ.ย.' },
      { val: '12', label: 'ธ.ค.' }
    ];

    const filteredSales = sales.filter(s => {
      const d = s.date || s.saleDate || (s.createdAt ? s.createdAt.substring(0, 10) : '');
      if (!d) return false;
      const y = d.substring(0, 4);
      const m = d.substring(5, 7);

      if (this.selectedSalesYear !== 'all' && y !== String(this.selectedSalesYear)) {
        return false;
      }
      if (this.selectedSalesMonth !== 'all' && m !== this.selectedSalesMonth) {
        return false;
      }
      return true;
    });

    const monthMap = {};
    filteredSales.forEach(s => {
      const d = s.date || s.saleDate || (s.createdAt ? s.createdAt.substring(0, 10) : '');
      const mo = d ? d.substring(0, 7) : ''; // YYYY-MM
      if (!mo) return;
      if (!monthMap[mo]) monthMap[mo] = { revenue: 0, qty: 0, count: 0 };
      monthMap[mo].revenue += (parseFloat(s.totalPrice) || 0);
      monthMap[mo].qty     += getSaleQty(s);
      monthMap[mo].count   ++;
    });

    const monthKeys = Object.keys(monthMap).sort().reverse();
    const thMonthsShort = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thMonthsFull  = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    const totalFilteredQty = filteredSales.reduce((sum, s) => sum + getSaleQty(s), 0);
    const totalFilteredRevenue = filteredSales.reduce((sum, s) => sum + (parseFloat(s.totalPrice) || 0), 0);
    const totalFilteredCount = filteredSales.length;

    const monthRowsHtml = monthKeys.length === 0
      ? `<tr>
          <td colspan="4" class="py-10 text-center text-sm text-gray-500">
            <div class="flex flex-col items-center justify-center gap-1.5">
              <i class="fas fa-inbox text-3xl text-gray-300 mb-1"></i>
              <span class="font-medium text-gray-600">ไม่พบข้อมูลการขายตามช่วงเวลาที่เลือก</span>
              <span class="text-xs text-gray-400">ลองปรับเปลี่ยนตัวกรองปี หรือเลือก "ทุกเดือน" เพื่อดูข้อมูล</span>
            </div>
          </td>
        </tr>`
      : monthKeys.map(mo => {
          const [y, m] = mo.split('-');
          const mIdx = parseInt(m);
          const monthLabel = `${thMonthsFull[mIdx]} ${parseInt(y) + 543}`;
          const data = monthMap[mo];
          return `
            <tr class="even:bg-gray-50/60 hover:bg-sky-50/40 transition-colors border-b border-gray-100 text-sm sm:text-base">
              <td class="py-3.5 px-5 font-bold text-gray-800">${monthLabel}</td>
              <td class="py-3.5 px-5 text-right text-gray-700 font-mono">${data.qty.toFixed(1)} หน่วย</td>
              <td class="py-3.5 px-5 text-right font-bold text-emerald-800 text-base font-mono">${formatBaht(data.revenue)}</td>
              <td class="py-3.5 px-5 text-center">
                <span class="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">${data.count} รายการ</span>
              </td>
            </tr>
          `;
        }).join('');

    const monthFootHtml = monthKeys.length > 0 ? `
      <tfoot class="bg-sky-50/80 border-t-2 border-sky-400 font-bold text-sm sm:text-base">
        <tr>
          <td class="py-3.5 px-5 text-sky-950 font-bold">
            ${this.selectedSalesMonth !== 'all' ? `รวมยอดจำหน่ายเดือน ${thMonthsShort[parseInt(this.selectedSalesMonth)]}` : 'รวมยอดจำหน่ายทั้งหมด'}
          </td>
          <td class="py-3.5 px-5 text-right font-mono text-gray-900">${totalFilteredQty.toFixed(1)} หน่วย</td>
          <td class="py-3.5 px-5 text-right font-mono font-bold text-emerald-900 text-base sm:text-lg">${formatBaht(totalFilteredRevenue)}</td>
          <td class="py-3.5 px-5 text-center font-mono font-bold text-sky-900">${totalFilteredCount} รายการ</td>
        </tr>
      </tfoot>
    ` : '';

    // ---- Product Profitability & Valuation ----
    const productRows = products.map(p => {
      const revenue = p.stock * p.price;
      return { ...p, potentialRevenue: revenue };
    }).sort((a, b) => b.potentialRevenue - a.potentialRevenue);

    const totalInventoryValue = productRows.reduce((s, p) => s + p.potentialRevenue, 0);

    const productHtml = productRows.map(p => {
      const isKg = p.unit === 'กก.' || p.unit === 'kg';
      const herbMeta = herbTypes.find(h => (p.category || '').includes(h.name) || (p.name || '').includes(h.name));
      const pEmoji = herbMeta ? herbMeta.emoji : getHerbDefaultIcon(p.category || p.name);
      return `
        <div class="p-4 rounded-xl bg-white border border-gray-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-2xl">${pEmoji}</span>
            <div class="min-w-0">
              <div class="font-bold text-gray-900 text-base truncate">${p.name}</div>
              <div class="text-xs sm:text-sm text-gray-500 mt-0.5">
                รหัส: <span class="font-mono text-gray-700 font-semibold">${p.id}</span> · คงเหลือในคลัง: <b class="text-emerald-800 font-bold">${isKg ? p.stock.toFixed(2) : p.stock.toLocaleString()}</b> ${p.unit}
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-5 text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
            <div>
              <span class="text-xs text-gray-400 block">ราคาขายต่อหน่วย</span>
              <span class="text-sm sm:text-base font-bold text-gray-800 font-mono">${formatBaht(p.price)}</span><span class="text-xs text-gray-500">/${p.unit}</span>
            </div>
            <div>
              <span class="text-xs text-indigo-600 font-bold block">มูลค่าคงคลังประเมิน</span>
              <span class="text-base sm:text-lg font-bold text-indigo-900 font-mono">${formatBaht(p.potentialRevenue)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // ---- Harvest Report Data ----
    const allPlots = appState.getPlots();
    const allHarvests = appState.getCrops().filter(c => c.status === 'harvested');
    let totalHarvestFresh = 0;
    
    const harvestRowsHtml = allHarvests.length === 0 
      ? '<tr><td colspan="4" class="py-8 text-center text-gray-400 text-sm">ยังไม่มีข้อมูลการเก็บเกี่ยว</td></tr>'
      : allHarvests.map(c => {
          const p = allPlots.find(x => x.id === c.plotId);
          const owner = p ? members.find(m => m.id === p.memberId || (p.memberIds && p.memberIds.includes(m.id))) : null;
          const fresh = parseFloat(c.yield) || parseFloat(c.harvestWeight) || 0;
          totalHarvestFresh += fresh;
          const herb = c.seedlingSource || (p ? p.plantType : '') || 'เก๊กฮวย';
          const herbMeta = herbTypes.find(h => herb.includes(h.name));
          const badgeClass = herbMeta ? herbMeta.badgeBg : 'bg-emerald-50 text-emerald-800 border-emerald-200';

          return `
            <tr class="even:bg-gray-50/60 hover:bg-emerald-50/40 transition-colors border-b border-gray-100 text-sm sm:text-base">
              <td class="py-3.5 px-5 font-bold text-gray-900">
                <div>${owner ? owner.name : '-'}</div>
                <div class="text-xs text-gray-400 font-normal">แปลง: ${p ? p.name : (c.plotId || '-')}</div>
              </td>
              <td class="py-3.5 px-5 font-mono text-emerald-800 font-bold text-sm">${formatCropSeasonId(c.id, c.cropYear, c.cropCycle)}</td>
              <td class="py-3.5 px-5">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeClass}">
                  ${herb}
                </span>
              </td>
              <td class="py-3.5 px-5 font-bold text-amber-900 text-right font-mono text-base">${fresh.toFixed(1)} กก.</td>
            </tr>
          `;
        }).join('');

    // ---- Per-Member Analysis ----
    const financialReport = appState.getFinancialReport();
    let reportData = isMember
      ? financialReport.filter(r => r.id === currentUser.memberId)
      : financialReport;

    const memberRows = reportData.length === 0
      ? `<tr><td colspan="6" class="py-8 text-center text-sm text-gray-400">ยังไม่มีข้อมูลการเงินรายสมาชิก</td></tr>`
      : reportData.map(r => {
          const margin = r.totalRevenue > 0 ? ((r.netProfit / r.totalRevenue) * 100).toFixed(1) : '0.0';
          return `
            <tr class="even:bg-gray-50/60 hover:bg-emerald-50/40 transition-colors border-b border-gray-100 text-sm sm:text-base">
              <td class="py-3.5 px-5 text-sm font-bold text-emerald-800 font-mono">${r.id}</td>
              <td class="py-3.5 px-5">
                <div class="font-bold text-gray-900 text-base">${r.name}</div>
                <div class="text-xs sm:text-sm text-gray-500 font-medium">${r.role} · ${r.villageNumber || ''}</div>
              </td>
              <td class="py-3.5 px-5 text-center text-sm font-bold text-gray-700">${r.totalCrops} รอบ</td>
              <td class="py-3.5 px-5 text-right font-bold text-amber-800 font-mono">${formatBaht(r.totalCost)}</td>
              <td class="py-3.5 px-5 text-right font-bold text-emerald-800 font-mono">${formatBaht(r.totalRevenue)}</td>
              <td class="py-3.5 px-5 text-right font-bold ${r.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'} font-mono">
                <div>${r.netProfit >= 0 ? '+' : ''}${formatBaht(r.netProfit)}</div>
                <span class="text-xs text-gray-500 font-normal">Margin ${margin}%</span>
              </td>
            </tr>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">

        <!-- Top Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-1 border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>รายงานวิเคราะห์ต้นทุน-รายได้และผลผลิตวิสาหกิจ</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-lg shadow-sm">
                <i class="fas fa-chart-pie"></i>
              </span>
              <span>7. รายงานสรุป (สรุปต้นทุน–รายได้)</span>
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              วิเคราะห์ภาพรวมการเงินวิสาหกิจ · อัตราการอบแห้ง (${uniqueHerbs.join(' / ')}) · มูลค่าคลังสินค้า · ผลผลิตรายสมาชิก
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <a href="#finance" class="px-4 py-2 text-sm font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl transition shadow-2xs flex items-center gap-1.5">
              <i class="fas fa-hand-holding-dollar text-emerald-700"></i>
              <span>การเงินรายสมาชิก</span>
            </a>
            <a href="#inventory" class="px-4 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs flex items-center gap-1.5">
              <i class="fas fa-boxes-stacked text-emerald-200"></i>
              <span>สต็อกสินค้าในคลัง</span>
            </a>
          </div>
        </div>

        <!-- 1. Top 6 KPI Cards (Clean White Card Layout) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          ${kpiHtml}
        </div>

        <!-- 2. Navigation Sub-Tabs (3 กลุ่มข้อมูลหลัก สะอาดตา ไม่ลายตา) -->
        <div class="flex items-center gap-2 border-b border-gray-200 pb-2.5 flex-wrap pt-2">
          
          <button type="button" class="cost-rev-tab-btn px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
            this.activeTab === 'financial-crop'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          }" data-tab="financial-crop">
            <i class="fas fa-chart-pie"></i>
            <span>1. สรุปการเงินและชนิดพืช</span>
          </button>

          <button type="button" class="cost-rev-tab-btn px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
            this.activeTab === 'inventory-yield'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          }" data-tab="inventory-yield">
            <i class="fas fa-boxes-stacked"></i>
            <span>2. มูลค่าคลังสินค้าและผลผลิต</span>
          </button>

          <button type="button" class="cost-rev-tab-btn px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
            this.activeTab === 'members-calc'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          }" data-tab="members-calc">
            <i class="fas fa-users"></i>
            <span>3. ข้อมูลสมาชิกและคำอธิบายสูตร</span>
          </button>

        </div>

        <!-- ================= TAB 1: สรุปการเงินและชนิดพืช ================= -->
        ${this.activeTab === 'financial-crop' ? `
          <div class="space-y-6 fade-in">
            
            <!-- ตารางวิเคราะห์ เก๊กฮวย vs คาโมมายล์ vs พืชอื่นๆ ในระบบ -->
            <div class="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
              <div class="p-5 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-teal-50/80 border-b border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-lg shadow-xs">
                    <i class="fas fa-leaf"></i>
                  </div>
                  <div>
                    <h2 class="text-base sm:text-lg font-bold text-emerald-950">วิเคราะห์ต้นทุน-รายได้ เปรียบเทียบชนิดพืช</h2>
                    <p class="text-xs sm:text-sm text-emerald-900/80">เปรียบเทียบผลผลิต ต้นทุน รายได้ และกำไรสุทธิทุกชนิดพืช (${uniqueHerbs.join(', ')}) · มาตรฐานบรรจุ 20 กระปุก/กก.</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold px-3 py-1 rounded-full bg-white border border-emerald-300 text-emerald-800 shadow-2xs">
                    <i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i> เกณฑ์มาตรฐานวิสาหกิจ
                  </span>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-gray-100/90 text-gray-700 font-bold text-sm sm:text-base border-b border-gray-200 uppercase tracking-wide">
                    <tr>
                      <th class="py-3.5 px-4 sm:px-5">ชนิดพืช</th>
                      <th class="py-3.5 px-4 text-right">ผลผลิตสดรวม</th>
                      <th class="py-3.5 px-4 text-right">อบแห้งรวม (กก.)</th>
                      <th class="py-3.5 px-4 text-right">จำนวนกระปุก (50g)</th>
                      <th class="py-3.5 px-4 text-right">ต้นทุนรวม</th>
                      <th class="py-3.5 px-4 text-right">รายได้รวม</th>
                      <th class="py-3.5 px-4 text-right">กำไรสุทธิ</th>
                      <th class="py-3.5 px-4 text-center">อัตรากำไร (Margin)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${herbTableRows}
                  </tbody>
                  <tfoot>
                    <tr class="bg-emerald-50 border-t-2 border-emerald-600 font-bold text-sm sm:text-base">
                      <td class="py-4 px-4 sm:px-5 text-emerald-950 font-bold">รวมทุกชนิดพืช (${herbRows.length} พืช)</td>
                      <td class="py-4 px-4 text-right text-gray-800 font-mono">${totalFreshKg.toFixed(1)} กก.</td>
                      <td class="py-4 px-4 text-right text-indigo-900 font-mono">${totalDryKg.toFixed(1)} กก.</td>
                      <td class="py-4 px-4 text-right text-teal-900 font-mono">${Math.round(totalDryKg * 20).toLocaleString()} กระปุก</td>
                      <td class="py-4 px-4 text-right text-amber-900 font-mono">${formatBaht(totalCost)}</td>
                      <td class="py-4 px-4 text-right text-emerald-900 font-mono">${formatBaht(totalRevenue)}</td>
                      <td class="py-4 px-4 text-right font-mono ${totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}">
                        ${totalProfit >= 0 ? '+' : ''}${formatBaht(totalProfit)}
                      </td>
                      <td class="py-4 px-4 text-center text-emerald-800 font-mono font-bold">${profitMargin}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- ตารางยอดขายรายเดือน พร้อมตัวกรองปีและเดือน -->
            <div class="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
              <div class="p-5 bg-gradient-to-r from-sky-50 via-gray-50 to-white border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center text-lg shadow-xs shrink-0">
                    <i class="fas fa-calendar-days"></i>
                  </div>
                  <div>
                    <h2 class="text-base sm:text-lg font-bold text-gray-900">รายได้จากการจำหน่าย รายเดือน</h2>
                    <p class="text-xs sm:text-sm text-gray-500">กรองและสรุปยอดจำหน่ายตามปี พ.ศ. และเดือน</p>
                  </div>
                </div>

                <!-- Dropdown Filters (มุมขวาบน) -->
                <div class="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
                  <!-- ตัวกรองที่ 1: เลือกปี พ.ศ. -->
                  <div class="relative inline-flex items-center">
                    <select id="cost-rev-year-filter" aria-label="เลือกปี พ.ศ." class="appearance-none bg-white border border-gray-300 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-8 py-2 cursor-pointer shadow-2xs transition-all outline-none">
                      <option value="all" ${this.selectedSalesYear === 'all' ? 'selected' : ''}>ทั้งหมด</option>
                      ${availableYears.map(y => `
                        <option value="${y}" ${String(this.selectedSalesYear) === String(y) ? 'selected' : ''}>พ.ศ. ${y + 543}</option>
                      `).join('')}
                    </select>
                    <i class="fas fa-chevron-down text-gray-400 text-xs absolute right-2.5 pointer-events-none"></i>
                  </div>

                  <!-- ตัวกรองที่ 2: เลือกเดือน -->
                  <div class="relative inline-flex items-center">
                    <select id="cost-rev-month-filter" aria-label="เลือกเดือน" class="appearance-none bg-white border border-gray-300 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-8 py-2 cursor-pointer shadow-2xs transition-all outline-none">
                      ${monthFilterOptions.map(m => `
                        <option value="${m.val}" ${this.selectedSalesMonth === m.val ? 'selected' : ''}>${m.label}</option>
                      `).join('')}
                    </select>
                    <i class="fas fa-chevron-down text-gray-400 text-xs absolute right-2.5 pointer-events-none"></i>
                  </div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-gray-100/90 text-gray-700 font-bold text-sm sm:text-base border-b border-gray-200 uppercase tracking-wide">
                    <tr>
                      <th class="py-3.5 px-5">เดือน (พ.ศ.)</th>
                      <th class="py-3.5 px-5 text-right">ปริมาณจำหน่าย</th>
                      <th class="py-3.5 px-5 text-right">ยอดรายได้รวม</th>
                      <th class="py-3.5 px-5 text-center">จำนวนรายการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${monthRowsHtml}
                  </tbody>
                  ${monthFootHtml}
                </table>
              </div>
            </div>

          </div>
        ` : ''}

        <!-- ================= TAB 2: มูลค่าคลังสินค้าและผลผลิต ================= -->
        ${this.activeTab === 'inventory-yield' ? `
          <div class="space-y-6 fade-in">
            
            <!-- มูลค่าสินค้าคงคลังแยกตามรายการ -->
            <div class="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200/80 gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center text-lg shadow-xs">
                    <i class="fas fa-boxes-stacked"></i>
                  </div>
                  <div>
                    <h2 class="text-base sm:text-lg font-bold text-gray-900">มูลค่าสินค้าคงคลังปัจจุบัน (Inventory Valuation)</h2>
                    <p class="text-xs sm:text-sm text-gray-500">คำนวณจาก [ ราคาขายต่อหน่วย × ปริมาณคงเหลือพร้อมจำหน่ายในคลัง ]</p>
                  </div>
                </div>
                <div class="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-right self-start sm:self-auto">
                  <span class="text-xs text-indigo-700 font-bold block uppercase">มูลค่าสินค้าคงคลังรวมทั้งหมด</span>
                  <span class="text-xl sm:text-2xl font-bold text-indigo-950 font-mono">${formatBaht(totalInventoryValue)}</span>
                </div>
              </div>

              <!-- รายการสินค้าคงคลัง -->
              <div class="space-y-2.5 pt-1">
                ${productHtml || '<p class="text-sm text-gray-400 text-center py-8">ไม่พบข้อมูลสินค้าในคลัง</p>'}
              </div>
            </div>

            <!-- สรุปการเก็บเกี่ยวรายบุคคลและรายแปลง -->
            <div class="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
              <div class="p-5 bg-gradient-to-r from-amber-50 via-gray-50 to-white border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-lg shadow-xs">
                    <i class="fas fa-seedling"></i>
                  </div>
                  <div>
                    <h2 class="text-base sm:text-lg font-bold text-gray-900">ตารางสรุปการเก็บเกี่ยวผลผลิตสด (รายบุคคล / รายแปลง)</h2>
                    <p class="text-xs sm:text-sm text-gray-500">บันทึกน้ำหนักดอกสดตอนเก็บเกี่ยวจริง ก่อนนำส่งโรงอบแห้งกลาง</p>
                  </div>
                </div>
                <div class="px-3.5 py-1.5 rounded-xl bg-white border border-amber-200 text-right shadow-2xs self-start sm:self-auto">
                  <span class="text-xs text-amber-700 font-bold block uppercase">ดอกสดเก็บเกี่ยวรวม</span>
                  <span class="text-base font-bold text-amber-900 font-mono">${totalHarvestFresh.toFixed(1)} กก.</span>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-gray-100/90 text-gray-700 font-bold text-sm sm:text-base border-b border-gray-200 uppercase tracking-wide">
                    <tr>
                      <th class="py-3.5 px-5">ชื่อเกษตรกร / แปลงปลูก</th>
                      <th class="py-3.5 px-5">รหัสรอบเพาะปลูก</th>
                      <th class="py-3.5 px-5">ชนิดพืช</th>
                      <th class="py-3.5 px-5 text-right">น้ำหนักดอกสดเก็บเกี่ยว (กก.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${harvestRowsHtml}
                  </tbody>
                  <tfoot>
                    <tr class="bg-amber-50 border-t-2 border-amber-600 font-bold text-sm sm:text-base">
                      <td colspan="3" class="py-3.5 px-5 text-amber-950 text-right font-bold">รวมผลผลิตดอกสดทั้งหมด:</td>
                      <td class="py-3.5 px-5 text-right text-amber-900 font-mono text-base sm:text-lg font-bold">${totalHarvestFresh.toFixed(1)} กก.</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>
        ` : ''}

        <!-- ================= TAB 3: ข้อมูลสมาชิกและคำอธิบายสูตร ================= -->
        ${this.activeTab === 'members-calc' ? `
          <div class="space-y-6 fade-in">
            
            <!-- ตารางวิเคราะห์ต้นทุน-กำไร รายสมาชิก -->
            ${!isMember ? `
              <div class="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
                <div class="p-5 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-teal-50/80 border-b border-emerald-200/80 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-lg shadow-xs">
                      <i class="fas fa-users"></i>
                    </div>
                    <div>
                      <h2 class="text-base sm:text-lg font-bold text-emerald-950">วิเคราะห์ต้นทุน-รายได้ รายสมาชิก (สำหรับคณะกรรมการ)</h2>
                      <p class="text-xs sm:text-sm text-emerald-900/80">สรุปผลงาน ต้นทุนสะสม รายได้สะสม และกำไรสุทธิ รายบุคคล</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold px-3 py-1 rounded-full bg-white border border-emerald-300 text-emerald-800 shadow-2xs">
                    ${reportData.length} สมาชิก
                  </span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-100/90 text-gray-700 font-bold text-sm sm:text-base border-b border-gray-200 uppercase tracking-wide">
                      <tr>
                        <th class="py-3.5 px-5">รหัสสมาชิก</th>
                        <th class="py-3.5 px-5">ชื่อ-นามสกุลสมาชิก</th>
                        <th class="py-3.5 px-5 text-center">รอบปลูกสะสม</th>
                        <th class="py-3.5 px-5 text-right">ต้นทุนสะสม</th>
                        <th class="py-3.5 px-5 text-right">รายได้สะสม</th>
                        <th class="py-3.5 px-5 text-right">กำไรสุทธิ / Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${memberRows}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}

            <!-- กล่องหมายเหตุและคำอธิบายสูตรการคำนวณ -->
            <div class="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-2xs space-y-4">
              <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-lg shrink-0 shadow-xs mt-0.5">
                  <i class="fas fa-circle-info"></i>
                </div>
                <div class="space-y-3 flex-1 text-emerald-950 text-sm sm:text-base">
                  <div>
                    <h3 class="font-bold text-lg text-emerald-950">เกณฑ์และสูตรการคำนวณทางการเงินของวิสาหกิจชุมชน</h3>
                    <p class="text-xs sm:text-sm text-emerald-800/90 mt-0.5">หลักเกณฑ์มาตรฐานที่ใช้ในการประมวลผลข้อมูลในระบบสารสนเทศวิสาหกิจ</p>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 text-sm">
                    <div class="p-3.5 rounded-xl bg-white/90 border border-emerald-200 shadow-2xs">
                      <b class="text-emerald-900 block font-bold mb-1">💰 รายได้จากการจำหน่าย (Revenue):</b>
                      ยอดขายรวมจริงจากทุกรายการที่บันทึกการขายผ่านระบบ
                    </div>
                    <div class="p-3.5 rounded-xl bg-white/90 border border-emerald-200 shadow-2xs">
                      <b class="text-amber-900 block font-bold mb-1">🌱 ต้นทุนการผลิต (Cost):</b>
                      ต้นทุนสะสมในการปลูกของแต่ละรอบ เช่น ค่าต้นกล้า ค่าปุ๋ยอินทรีย์ ค่าเตรียมแปลง
                    </div>
                    <div class="p-3.5 rounded-xl bg-white/90 border border-emerald-200 shadow-2xs">
                      <b class="text-emerald-900 block font-bold mb-1">📈 กำไรสุทธิ (Net Profit):</b>
                      คำนวณจาก [ รายได้รวม − ต้นทุนสะสมรวม ]
                    </div>
                    <div class="p-3.5 rounded-xl bg-white/90 border border-emerald-200 shadow-2xs">
                      <b class="text-indigo-900 block font-bold mb-1">☀️ อัตราส่วนอบแห้งมาตรฐาน (Drying Ratio):</b>
                      ${herbTypes.map(h => `• <b>${h.name}:</b> อัตราส่วน <b>${h.name === 'คาโมมายล์' ? '6 : 1' : '8 : 1'}</b> (บรรจุได้ ~20 กระปุก ขนาด 50 กรัม)`).join('<br>')}
                    </div>
                  </div>
                  <div class="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-emerald-800 font-medium">
                    <span>* สินค้าคงคลังประเมินมูลค่าตามราคาจำหน่ายปัจจุบัน</span>
                    <a href="#inventory" class="font-bold text-emerald-900 hover:underline flex items-center gap-1">
                      <span>ตรวจสอบคลังสินค้า</span>
                      <i class="fas fa-arrow-right text-xs"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ` : ''}

      </div>
    `;
  },

  init() {
    // Tab switching event listeners
    document.querySelectorAll('.cost-rev-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab && this.activeTab !== tab) {
          this.activeTab = tab;
          this.refreshView();
        }
      });
    });

    // Dropdown Filters for Monthly Sales
    const yearSelect = document.getElementById('cost-rev-year-filter');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.selectedSalesYear = e.target.value;
        this.refreshView();
      });
    }

    const monthSelect = document.getElementById('cost-rev-month-filter');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        this.selectedSalesMonth = e.target.value;
        this.refreshView();
      });
    }
  },

  refreshView() {
    const container = document.getElementById('app-view');
    if (container) {
      const scrollPos = window.scrollY;
      container.innerHTML = this.render();
      this.init();
      window.scrollTo(0, scrollPos);
    }
  }
};
