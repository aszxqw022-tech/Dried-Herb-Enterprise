// Inventory and Cost-Profit Ledger Component
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast } from '../helpers.js';

export const InventoryComponent = {
  activeTab: 'stock', // 'stock' | 'ledger' | 'sales'
  searchMemberQuery: '',
  sellingCropId: null,

  render() {
    const stats = appState.getStats();
    const inventory = appState.getInventory();
    const plots = appState.getPlots();
    const members = appState.getMembers();
    const sales = appState.getSales();
    const crops = appState.getCrops(); // Added to fix ReferenceError
    const financialReport = appState.getFinancialReport();

    // 1. Filtered report for members tab
    const filteredReport = financialReport.filter(r => 
      r.name.toLowerCase().includes(this.searchMemberQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(this.searchMemberQuery.toLowerCase())
    );

    // 2. Build Inventory Stock Tab HTML
    const activeInventoryLots = inventory.filter(inv => inv.dryStockKg > 0);
    const stockTabHtml = activeInventoryLots.length === 0
      ? `<div class="p-8 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">犹�ｸ｡犹謂ｸ｡犧ｵ犧ｪ犧ｴ犧吭ｸ�ｹ霞ｸｲ犧ｭ犧壟ｹ≒ｸｫ犹霞ｸ�ｸ�ｸ�ｹ犧ｫ犧･犧ｷ犧ｭ犹�ｸ吭ｸ�ｸ･犧ｱ犧�ｹ�ｸ吭ｸもｸ内ｸｰ犧吭ｸｵ犹�</div>`
      : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${activeInventoryLots.map(inv => {
            const crop = appState.getCropById(inv.cropId);
            const plot = crop ? plots.find(p => p.id === crop.plotId) : null;
            const owner = plot ? members.find(m => m.id === plot.memberId) : null;
            const isChrys = inv.herbType === '犹犧≒ｹ癌ｸ≒ｸｮ犧ｧ犧｢' || inv.herbType.includes('犹犧≒ｹ癌ｸ≒ｸｮ犧ｧ犧｢');
            
            return `
              <div class="glass-card bg-white rounded-2xl p-5 border border-gray-100 flex flex-col justify-between space-y-4">
                <div>
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-xs font-bold text-gray-400">犧･犹�ｸｭ犧�: ${inv.cropId}</span>
                      <button data-crop-id="${inv.cropId}" class="edit-lot-weights-btn text-emerald-600 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors text-[10px] font-bold flex items-center gap-0.5 border border-emerald-100 shadow-sm" title="犹≒ｸ≒ｹ霞ｹ�ｸもｸもｹ霞ｸｭ犧｡犧ｹ犧･犧吭ｹ霞ｸｳ犧ｫ犧吭ｸｱ犧≒ｸｪ犧�/犹≒ｸｫ犹霞ｸ�">
                        <i class="fas fa-weight-hanging"></i> 犹≒ｸ≒ｹ霞ｹ�ｸもｸ吭ｹ霞ｸｳ犧ｫ犧吭ｸｱ犧�
                      </button>
                    </div>
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                      isChrys ? 'badge-chrysanthemum' : 'badge-chamomile'
                    }">
                      ${inv.herbType}犧ｭ犧壟ｹ≒ｸｫ犹霞ｸ�
                    </span>
                  </div>
                  <h4 class="text-base font-bold text-gray-800">${plot ? plot.name : '犹�ｸ｡犹謂ｸ樅ｸ壟ｹ≒ｸ巵ｸ･犧�ｸ巵ｸ･犧ｹ犧�'}</h4>
                  <p class="text-xs text-gray-500 mt-1">犹犧≒ｸｩ犧歩ｸ｣犧≒ｸ｣犹犧謂ｹ霞ｸｲ犧もｸｭ犧�: <b>${owner ? owner.name : '-'}</b></p>
                  
                  <div class="mt-4 p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                    <span class="text-xs text-gray-500">犧ｪ犧歩ｹ�ｸｭ犧≒ｸ�ｸ�ｹ犧ｫ犧･犧ｷ犧ｭ犧･犹�ｸｭ犧歩ｸ吭ｸｵ犹�:</span>
                    <span class="text-2xl font-black text-emerald-800">${inv.dryStockKg.toFixed(2)} <span class="text-xs font-bold text-gray-400">犧≒ｸ�.</span></span>
                  </div>
                  <div class="text-[10px] text-gray-400 mt-2 text-right">
                    犧ｭ犧壟ｹ≒ｸｫ犹霞ｸ�ｹ犧ｪ犧｣犹�ｸ謂ｹ犧｡犧ｷ犹謂ｸｭ: ${formatThaiDate(inv.processedDate)}
                  </div>
                </div>

                <div class="pt-2">
                  <button data-crop-id="${inv.cropId}" class="sell-stock-btn w-full py-2.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5">
                    <i class="fas fa-shopping-cart"></i> 犧壟ｸｱ犧吭ｸ伶ｸｶ犧≒ｸ≒ｸｲ犧｣犧もｸｲ犧｢
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

    // 3. Build Finance Ledger Tab HTML
    const ledgerRowsHtml = filteredReport.length === 0
      ? `<tr><td colspan="7" class="px-6 py-6 text-center text-sm text-gray-500">犹�ｸ｡犹謂ｸ樅ｸ壟ｸ｣犧ｲ犧｢犧�ｸｲ犧吭ｸ≒ｸｲ犧｣犹犧�ｸｴ犧吭ｸもｸｭ犧�ｸｪ犧｡犧ｲ犧癌ｸｴ犧≒ｸ｣犧ｲ犧｢犧伶ｸｵ犹謂ｸ｣犧ｰ犧壟ｸｸ</td></tr>`
      : filteredReport.map(r => {
          const statusBadge = r.netProfit > 0 
            ? `<span class="px-2.5 py-1 text-xs font-bold bg-green-50 text-green-700 rounded-full border border-green-200"><i class="fas fa-arrow-up mr-0.5"></i> 犧≒ｸｳ犹�ｸ｣</span>`
            : r.netProfit < 0
              ? `<span class="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 rounded-full border border-red-200"><i class="fas fa-arrow-down mr-0.5"></i> 犧もｸｲ犧扉ｸ伶ｸｸ犧�</span>`
              : `<span class="px-2.5 py-1 text-xs font-bold bg-gray-50 text-gray-600 rounded-full border border-gray-200">犹犧伶ｹ謂ｸｲ犧伶ｸｸ犧�</span>`;
          
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-4 text-sm font-semibold text-emerald-800">${r.id}</td>
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-gray-900">${r.name}</div>
                <div class="text-[10px] text-gray-400">犧壟ｸ伶ｸ壟ｸｲ犧�: ${r.role} (${r.villageNumber})</div>
              </td>
              <td class="px-6 py-4 text-center text-sm text-gray-700 font-medium">${r.totalCrops} 犧｣犧ｭ犧�</td>
              <td class="px-6 py-4 text-sm text-gray-600 font-medium">${formatBaht(r.totalCost)}</td>
              <td class="px-6 py-4 text-sm text-emerald-800 font-bold">${formatBaht(r.totalRevenue)}</td>
              <td class="px-6 py-4 text-sm font-extrabold ${r.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}">
                ${r.netProfit > 0 ? '+' : ''}${formatBaht(r.netProfit)}
              </td>
              <td class="px-6 py-4 text-center">${statusBadge}</td>
            </tr>
          `;
        }).join('');

    const ledgerTabHtml = `
      <div class="space-y-4">
        <!-- Search and filters -->
        <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="relative flex-1 max-w-md">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search text-xs"></i>
            </span>
            <input type="text" id="member-ledger-search" value="${this.searchMemberQuery}" placeholder="犧�ｹ霞ｸ吭ｸｫ犧ｲ犧癌ｸｷ犹謂ｸｭ犧ｪ犧｡犧ｲ犧癌ｸｴ犧≒ｸｫ犧｣犧ｷ犧ｭ犧｣犧ｫ犧ｱ犧ｪ犧伶ｸｰ犹犧壟ｸｵ犧｢犧�..." 
              class="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>
          <div class="text-xs text-gray-400">
            * 犧ｪ犧｣犧ｸ犧巵ｸ｢犧ｭ犧扉ｸｪ犧ｰ犧ｪ犧｡犧�ｸｳ犧吭ｸｧ犧内ｸ謂ｸｲ犧� (犧｣犧ｲ犧｢犹�ｸ扉ｹ霞ｸ謂ｸｲ犧≒ｸ≒ｸｲ犧｣犧もｸｲ犧｢犧ｪ犧｡犧ｸ犧吭ｹ�ｸ樅ｸ｣犧ｭ犧壟ｹ≒ｸｫ犹霞ｸ�ｸもｸｭ犧�ｸ･犹�ｸｭ犧歩ｸｪ犧｡犧ｲ犧癌ｸｴ犧�) - (犧歩ｹ霞ｸ吭ｸ伶ｸｸ犧吭ｸｪ犧ｰ犧ｪ犧｡犧｣犧ｭ犧壟ｸ≒ｸｲ犧｣犹犧樅ｸｲ犧ｰ犧巵ｸ･犧ｹ犧�)
          </div>
        </div>

        <!-- Table Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                  <th class="px-6 py-4">犧｣犧ｫ犧ｱ犧ｪ犧ｪ犧｡犧ｲ犧癌ｸｴ犧�</th>
                  <th class="px-6 py-4">犧癌ｸｷ犹謂ｸｭ - 犧吭ｸｲ犧｡犧ｪ犧≒ｸｸ犧･</th>
                  <th class="px-6 py-4 text-center">犧謂ｸｳ犧吭ｸｧ犧吭ｸ｣犧ｭ犧壟ｸ巵ｸ･犧ｹ犧�</th>
                  <th class="px-6 py-4">犧歩ｹ霞ｸ吭ｸ伶ｸｸ犧吭ｸｪ犧ｰ犧ｪ犧｡</th>
                  <th class="px-6 py-4">犧｣犧ｲ犧｢犹�ｸ扉ｹ霞ｸｪ犧ｰ犧ｪ犧｡</th>
                  <th class="px-6 py-4">犧≒ｸｳ犹�ｸ｣犧ｪ犧ｸ犧伶ｸ倨ｸｴ犧ｪ犧ｰ犧ｪ犧｡</th>
                  <th class="px-6 py-4 text-center">犧ｪ犧籾ｸｲ犧吭ｸｰ犧≒ｸｲ犧｣犹犧�ｸｴ犧�</th>
                </tr>
              </thead>
              <tbody>
                ${ledgerRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // 4. Build Sales Log Tab HTML
    const salesRowsHtml = sales.length === 0
      ? `<tr><td colspan="8" class="px-6 py-6 text-center text-sm text-gray-500">犧｢犧ｱ犧�ｹ�ｸ｡犹謂ｸ樅ｸ壟ｸもｹ霞ｸｭ犧｡犧ｹ犧･犧≒ｸｲ犧｣犧謂ｸｳ犧ｫ犧吭ｹ謂ｸｲ犧｢犧憫ｸ･犧憫ｸ･犧ｴ犧歩ｹ�ｸ吭ｸ｣犧ｰ犧壟ｸ�</td></tr>`
      : sales.map(s => {
          const crop = crops.find(c => c.id === s.cropId);
          const plot = crop ? plots.find(p => p.id === crop.plotId) : null;
          const owner = plot ? members.find(m => m.id === plot.memberId) : null;
          const isChrys = plot && (plot.plantType === '犹犧≒ｹ癌ｸ≒ｸｮ犧ｧ犧｢' || plot.plantType.includes('犹犧≒ｹ癌ｸ≒ｸｮ犧ｧ犧｢'));
          
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-3.5 text-sm font-semibold text-emerald-800">${s.id}</td>
              <td class="px-6 py-3.5 text-sm font-medium text-emerald-900">${s.cropId}</td>
              <td class="px-6 py-3.5 text-sm text-gray-800">${owner ? owner.name : '-'}</td>
              <td class="px-6 py-3.5">
                <span class="px-2.5 py-0.5 text-[10px] font-semibold border rounded-full ${
                  isChrys ? 'badge-chrysanthemum' : 'badge-chamomile'
                }">${plot ? plot.plantType : '-'}犧ｭ犧壟ｹ≒ｸｫ犹霞ｸ�</span>
              </td>
              <td class="px-6 py-3.5 text-sm text-gray-700 font-bold text-center">
                ${s.saleType === 'jar' ? `${s.amount || s.amountKg} 犧≒ｸ｣犧ｰ犧巵ｸｸ犧～ : `${s.amountKg || s.amount} 犧≒ｸ�.`}
              </td>
              <td class="px-6 py-3.5 text-sm text-gray-500">
                ${s.saleType === 'jar' ? `${formatBaht(s.price || s.pricePerKg)}/犧≒ｸ｣犧ｰ犧巵ｸｸ犧～ : `${formatBaht(s.pricePerKg || s.price)}/犧≒ｸ�.`}
              </td>
              <td class="px-6 py-3.5 text-sm text-emerald-800 font-black">${formatBaht(s.totalPrice)}</td>
              <td class="px-6 py-3.5 text-sm text-gray-600 truncate max-w-[120px]" title="${s.customer}">${s.customer}</td>
              <td class="px-6 py-3.5 text-xs text-gray-400">${formatThaiDate(s.date)}</td>
            </tr>
          `;
        }).join('');

    const salesTabHtml = `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 class="font-bold text-gray-800 text-sm">犧巵ｸ｣犧ｰ犧ｧ犧ｱ犧歩ｸｴ犧≒ｸｲ犧｣犧謂ｸｳ犧ｫ犧吭ｹ謂ｸｲ犧｢犧ｪ犧｡犧ｸ犧吭ｹ�ｸ樅ｸ｣犧ｭ犧壟ｹ≒ｸｫ犹霞ｸ�</h3>
          <span class="text-xs text-gray-400">犧倨ｸｸ犧｣犧≒ｸ｣犧｣犧｡犧≒ｸｲ犧｣犧歩ｸｱ犧扉ｸｪ犧歩ｹ�ｸｭ犧≒ｸ�ｸ･犧ｱ犧�ｸｪ犧ｴ犧吭ｸ�ｹ霞ｸｲ犧伶ｸｱ犹霞ｸ�ｸｫ犧｡犧�</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                <th class="px-6 py-3.5">犧｣犧ｫ犧ｱ犧ｪ犧｣犧ｲ犧｢犧≒ｸｲ犧｣</th>
                <th class="px-6 py-3.5">犧･犹�ｸｭ犧歩ｸ憫ｸ･犧憫ｸ･犧ｴ犧� (Crop)</th>
                <th class="px-6 py-3.5">犹犧≒ｸｩ犧歩ｸ｣犧≒ｸ｣犹犧謂ｹ霞ｸｲ犧もｸｭ犧�</th>
                <th class="px-6 py-3.5">犧巵ｸ｣犧ｰ犹犧�犧伶ｸ樅ｸｷ犧�</th>
                <th class="px-6 py-3.5 text-center">犧謂ｸｳ犧吭ｸｧ犧吭ｸもｸｲ犧｢</th>
                <th class="px-6 py-3.5">犧｣犧ｲ犧�ｸｲ犧歩ｹ謂ｸｭ犧ｫ犧吭ｹ謂ｸｧ犧｢</th>
                <th class="px-6 py-3.5">犧｢犧ｭ犧扉ｸ｣犧ｧ犧｡犹犧�ｸｴ犧�</th>
                <th class="px-6 py-3.5">犧憫ｸｹ犹霞ｸ金ｸｷ犹霞ｸｭ / 犧癌ｹ謂ｸｭ犧�ｸ伶ｸｲ犧�</th>
                <th class="px-6 py-3.5">犧ｧ犧ｱ犧吭ｸ伶ｸｵ犹謂ｸ謂ｸｳ犧ｫ犧吭ｹ謂ｸｲ犧｢</th>
              </tr>
            </thead>
            <tbody>
              ${salesRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 5. Select tab layout content
    let tabContentHtml = '';
    if (this.activeTab === 'stock') tabContentHtml = stockTabHtml;
    else if (this.activeTab === 'ledger') tabContentHtml = ledgerTabHtml;
    else if (this.activeTab === 'sales') tabContentHtml = salesTabHtml;

    return `
      <div class="fade-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-warehouse text-emerald-700"></i>
              犧｣犧ｰ犧壟ｸ壟ｸ壟ｸ｣犧ｴ犧ｫ犧ｲ犧｣犧�ｸ･犧ｱ犧�ｸｪ犧ｴ犧吭ｸ�ｹ霞ｸｲ犹≒ｸ･犧ｰ犧≒ｸｲ犧｣犹犧�ｸｴ犧吭ｸ｣犧ｲ犧｢犧ｪ犧｡犧ｲ犧癌ｸｴ犧�
            </h1>
            <p class="text-sm text-gray-500 mt-1">犧�ｸ･犧ｱ犧�ｸｭ犧壟ｹ≒ｸｫ犹霞ｸ�ｹ≒ｸ｢犧≒ｸｪ犧ｴ犧伶ｸ倨ｸｴ犹呉ｸ歩ｸｲ犧｡犧･犹�ｸｭ犧歩ｹ犧樅ｸｲ犧ｰ犧巵ｸ･犧ｹ犧� 犹≒ｸ･犧ｰ犧壟ｸｱ犧財ｸ癌ｸｵ犧ｧ犧ｴ犹犧�ｸ｣犧ｲ犧ｰ犧ｫ犹呉ｸ伶ｸｸ犧�-犧≒ｸｳ犹�ｸ｣犧｣犧ｲ犧｢犧壟ｸｸ犧�ｸ�ｸ･</p>
          </div>
        </div>

        <!-- Mini Stats Summary Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block font-medium">犧ｪ犧歩ｹ�ｸｭ犧≒ｸｭ犧壟ｹ≒ｸｫ犹霞ｸ�ｸ�ｸ�ｹ犧ｫ犧･犧ｷ犧ｭ犧｣犧ｧ犧｡</span>
              <span class="text-2xl font-bold text-emerald-800">${stats.totalDryStock} <span class="text-sm text-gray-500 font-normal">犧≒ｸｴ犹もｸ･犧≒ｸ｣犧ｱ犧｡</span></span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><i class="fas fa-dolly"></i></div>
          </div>
          
          <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block font-medium">犧｣犧ｲ犧｢犹�ｸ扉ｹ霞ｸ謂ｸｲ犧≒ｸ≒ｸｲ犧｣犧もｸｲ犧｢犧ｪ犧ｰ犧ｪ犧｡</span>
              <span class="text-2xl font-bold text-emerald-800">${formatBaht(stats.totalSalesRevenue)}</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center"><i class="fas fa-cash-register"></i></div>
          </div>

          <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block font-medium">犧ｭ犧ｱ犧歩ｸ｣犧ｲ犧ｪ犹謂ｸｧ犧吭ｸｭ犧壟ｹ≒ｸｫ犹霞ｸ� (犹犧霞ｸ･犧ｵ犹謂ｸ｢)</span>
              <span class="text-sm font-semibold text-gray-700 block">犹犧≒ｹ癌ｸ≒ｸｮ犧ｧ犧｢ 8:1 | 犧�ｸｲ犹もｸ｡犧｡犧ｲ犧｢犧･犹� 6:1</span>
              <span class="text-[10px] text-gray-400 block">犧�ｸｳ犧        <!-- Record Sale Modal -->
        <div id="sale-record-modal" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center md:p-4 bg-black bg-opacity-40 transition-opacity">
          <div class="bg-white w-full h-full md:h-auto md:max-w-5xl rounded-none md:rounded-3xl overflow-y-auto md:overflow-hidden shadow-2xl border border-gray-100">
            <!-- Modal Header -->
            <div class="bg-emerald-800 px-6 py-4 text-white flex justify-between items-center">
              <h3 class="font-bold text-sm flex items-center gap-1.5">
                <i class="fas fa-cash-register"></i> 犧壟ｸｱ犧吭ｸ伶ｸｶ犧≒ｸ｣犧ｲ犧｢犧≒ｸｲ犧｣犧もｸｲ犧｢犧ｪ犧ｴ犧吭ｸ�ｹ霞ｸｲ犹≒ｸ巵ｸ｣犧｣犧ｹ犧�
              </h3>
              <button type="button" class="close-sale-modal-btn text-white opacity-80 hover:opacity-100 text-xl focus:outline-none">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- Modal Body Form -->
            <form id="sale-form" class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left Column -->
                <div class="space-y-4">
                  <!-- Lot Code Display -->
                  <div>
                    <span class="block text-xs font-semibold text-gray-400 uppercase">犧謂ｸｳ犧ｫ犧吭ｹ謂ｸｲ犧｢犧謂ｸｲ犧≒ｸ｣犧ｫ犧ｱ犧ｪ犧･犹�ｸｭ犧歩ｸｪ犧ｴ犧吭ｸ�ｹ霞ｸｲ</span>
                    <span id="sale-crop-display" class="block text-lg font-extrabold text-emerald-800 mt-1">CROP-XXX</span>
                  </div>

                  <!-- Sale Type Select -->
                  <div>
                    <label for="sale-type" class="block text-xs font-semibold text-gray-500 uppercase mb-1">犧巵ｸ｣犧ｰ犹犧�犧伶ｸｪ犧ｴ犧吭ｸ�ｹ霞ｸｲ犧伶ｸｵ犹謂ｸもｸｲ犧｢ *</label>
                    <select id="sale-type" name="saleType" required
                      class="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 font-semibold">
                      <option value="bulk">犧ｧ犧ｱ犧歩ｸ籾ｸｸ犧扉ｸｴ犧壟ｸｭ犧壟ｹ≒ｸｫ犹霞ｸ� (犧≒ｸｴ犹もｸ･犧≒ｸ｣犧ｱ犧｡)</option>
                      <option value="jar">犧≒ｸ｣犧ｰ犧巵ｸｸ犧≒ｸｪ犧ｳ犹犧｣犹�ｸ謂ｸ｣犧ｹ犧� (犧≒ｸ｣犧ｰ犧巵ｸｸ犧�)</option>
                    </select>
                  </div>

                  <!-- Sale Quantity -->
                  <div>
                    <label for="sale-amount" class="block text-xs font-semibold text-gray-500 uppercase mb-1">犧巵ｸ｣犧ｴ犧｡犧ｲ犧内ｸ伶ｸｵ犹謂ｸもｸｲ犧｢ *</label>
                    <input type="number" id="sale-amount" name="amount" required min="0.01" step="any" placeholder="犹犧癌ｹ謂ｸ� 5.5"
                      class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                    <span id="sale-max-stock-display" class="block text-[10px] text-gray-400 mt-1">犧ｪ犧歩ｹ�ｸｭ犧≒ｸ･犹�ｸｭ犧歩ｸ吭ｸｵ犹霞ｸ�ｸ�ｹ犧ｫ犧･犧ｷ犧ｭ犧ｪ犧ｹ犧�ｸｪ犧ｸ犧�: - 犧≒ｸ�.</span>
                  </div>

                  <!-- Price per Unit -->
                  <div>
                    <label for="sale-price" class="block text-xs font-semibold text-gray-500 uppercase mb-1">犧｣犧ｲ犧�ｸｲ犧歩ｹ謂ｸｭ犧ｫ犧吭ｹ謂ｸｧ犧｢ (犧壟ｸｲ犧�) *</label>
                    <input type="number" id="sale-price" name="price" required min="1" placeholder="犹犧癌ｹ謂ｸ� 450"
                      class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                  </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4 flex flex-col justify-between">
                  <div>
                    <!-- Customer Info -->
                    <div class="mb-4">
                      <label for="sale-customer" class="block text-xs font-semibold text-gray-500 uppercase mb-1">犧･犧ｹ犧≒ｸ�ｹ霞ｸｲ / 犧癌ｹ謂ｸｭ犧�ｸ伶ｸｲ犧�ｸ謂ｸｱ犧扉ｸ謂ｸｳ犧ｫ犧吭ｹ謂ｸｲ犧｢ *</label>
                      <input type="text" id="sale-customer" name="customer" required placeholder="犹犧癌ｹ謂ｸ� 犧｣犹霞ｸｲ犧吭ｸ≒ｸｲ犹≒ｸ游ｸｪ犧ｧ犧吭ｸ｣犹謂ｸ｡犧｣犧ｷ犹謂ｸ�, 犹≒ｸ游ｸ吭ｹ犧樅ｸ謂ｸ≒ｸ･犧ｸ犹謂ｸ｡"
                        class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    </div>

                    <!-- Date -->
                    <div class="mb-4">
                      <label for="sale-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">犧ｧ犧ｱ犧吭ｸ伶ｸｵ犹謂ｸ謂ｸｳ犧ｫ犧吭ｹ謂ｸｲ犧｢ *</label>
                      <input type="date" id="sale-date" name="date" required
                        class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    </div>
                  </div>

                  <!-- Info hint -->
                  <div class="p-4 bg-green-50 text-green-950 border border-green-100 rounded-2xl text-xs leading-relaxed space-y-1">
                    <div class="font-bold text-green-800 flex items-center gap-1.5">
                      <i class="fas fa-info-circle text-green-600"></i>
                      <span>犧�ｸｳ犧癌ｸｵ犹霞ｹ≒ｸ謂ｸ�ｸ≒ｸｲ犧｣犧壟ｸｱ犧吭ｸ伶ｸｶ犧≒ｸもｸｲ犧｢:</span>
                    </div>
                    <p class="text-[11px] text-gray-600">
                      犧≒ｸｲ犧｣犧壟ｸｱ犧吭ｸ伶ｸｶ犧≒ｸもｸｲ犧｢犧謂ｸｰ犧�ｸｳ犧吭ｸｧ犧内ｸ｣犧ｲ犧�ｸｲ犧もｸｲ犧｢犧ｪ犧ｸ犧伶ｸ倨ｸｴ 犧ｫ犧ｱ犧≒ｸ･犧扉ｸｪ犧歩ｹ�ｸｭ犧≒ｸｧ犧ｱ犧歩ｸ籾ｸｸ犧扉ｸｴ犧壟ｸｭ犧ｭ犧≒ｸ謂ｸｲ犧≒ｸ�ｸ･犧ｱ犧�ｸｪ犧ｴ犧吭ｸ�ｹ霞ｸｲ犧･犹�ｸｭ犧歩ｸ吭ｸｵ犹� 犹≒ｸ･犧ｰ犧�ｸｳ犧吭ｸｧ犧内ｸ巵ｸｱ犧吭ｸｪ犹謂ｸｧ犧吭ｸ｢犧ｭ犧扉ｹ犧�ｸｴ犧吭ｸ巵ｸｱ犧吭ｸ憫ｸ･/犧｣犧ｲ犧｢犧｣犧ｱ犧壟ｸ�ｸｷ犧吭ｹ犧もｹ霞ｸｲ犧ｪ犧ｹ犹謂ｸ≒ｸ｣犧ｰ犹犧巵ｹ金ｸｲ犹犧�ｸｴ犧吭ｸもｸｭ犧�ｸｪ犧｡犧ｲ犧癌ｸｴ犧≒ｹ犧謂ｹ霞ｸｲ犧もｸｭ犧�ｸ｣犹謂ｸｧ犧｡犹≒ｸ巵ｸ･犧�ｸ巵ｸ･犧ｹ犧≒ｹもｸ扉ｸ｢犧ｭ犧ｱ犧歩ｹもｸ吭ｸ｡犧ｱ犧歩ｸｴ
                    </p>
                  </div>
                </div>
              </div>

              <!-- Footer Buttons -->
              <div class="flex justify-end pt-6 gap-3 border-t border-gray-100 mt-4">
                <button type="button" class="close-sale-modal-btn px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  犧｢犧≒ｹ犧･犧ｴ犧�
                </button>
                <button type="submit" class="px-8 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-md flex items-center gap-2">
                  <i class="fas fa-check"></i> 犧壟ｸｱ犧吭ｸ伶ｸｶ犧≒ｸもｸｲ犧｢犹≒ｸ･犧ｰ犧ｫ犧ｱ犧≒ｸ｢犧ｭ犧扉ｸｪ犧歩ｹ�ｸｭ犧�
                </button>
              </div>
            </form>犧｣犧ｲ犧�ｸｲ犧歩ｹ謂ｸｭ犧≒ｸｴ犹もｸ･犧≒ｸ｣犧ｱ犧｡ (犧壟ｸｲ犧�) *</label>
                <input type="number" id="sale-price" name="price" required min="1" placeholder="犹犧癌ｹ謂ｸ� 450"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Customer Info -->
              <div>
                <label for="sale-customer" class="block text-xs font-semibold text-gray-500 uppercase mb-1">犧･犧ｹ犧≒ｸ�ｹ霞ｸｲ / 犧癌ｹ謂ｸｭ犧�ｸ伶ｸｲ犧�ｸ謂ｸｱ犧扉ｸ謂ｸｳ犧ｫ犧吭ｹ謂ｸｲ犧｢ *</label>
                <input type="text" id="sale-customer" name="customer" required placeholder="犹犧癌ｹ謂ｸ� 犧｣犹霞ｸｲ犧吭ｸ≒ｸｲ犹≒ｸ游ｸｪ犧ｧ犧吭ｸ｣犹謂ｸ｡犧｣犧ｷ犹謂ｸ�, 犹≒ｸ游ｸ吭ｹ犧樅ｸ謂ｸ≒ｸ･犧ｸ犹謂ｸ｡"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Date -->
              <div>
                <label for="sale-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">犧ｧ犧ｱ犧吭ｸ伶ｸｵ犹謂ｸ謂ｸｳ犧ｫ犧吭ｹ謂ｸｲ犧｢ *</label>
                <input type="date" id="sale-date" name="date" required
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Info hint -->
              <div class="p-3 bg-green-50 text-green-900 border border-green-100 rounded-xl text-[10px] leading-relaxed">
                <i class="fas fa-info-circle mr-1 text-green-600"></i>
                犧≒ｸｲ犧｣犧壟ｸｱ犧吭ｸ伶ｸｶ犧≒ｸもｸｲ犧｢犧謂ｸｰ犧ｫ犧ｱ犧≒ｸ｢犧ｭ犧扉ｸ�ｸ･犧ｱ犧�ｸｪ犧ｴ犧吭ｸ�ｹ霞ｸｲ犧･犹�ｸｭ犧歩ｸ吭ｸｵ犹� 犹≒ｸ･犧ｰ犧�ｸｳ犧吭ｸｧ犧内ｸ壟ｸｧ犧≒ｸ｣犧ｲ犧｢犧｣犧ｱ犧壟ｸ�ｸｷ犧吭ｹ犧もｹ霞ｸｲ犧≒ｸｱ犧壟ｹ犧≒ｸｩ犧歩ｸ｣犧≒ｸ｣犹犧謂ｹ霞ｸｲ犧もｸｭ犧�ｸｪ犧ｴ犧伶ｸ倨ｸｴ犹呉ｸもｸｭ犧�ｸ･犹�ｸｭ犧歩ｹもｸ扉ｸ｢犧ｭ犧ｱ犧歩ｹもｸ吭ｸ｡犧ｱ犧歩ｸｴ
              </div>

              <!-- Footer Buttons -->
              <div class="flex justify-end pt-4 gap-2.5">
                <button type="button" class="close-sale-modal-btn px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  犧｢犧≒ｹ犧･犧ｴ犧�
                </button>
                <button type="submit" class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm font-bold">
                  <i class="fas fa-check"></i> 犧壟ｸｱ犧吭ｸ伶ｸｶ犧≒ｸもｸｲ犧｢犹≒ｸ･犧ｰ犧ｫ犧ｱ犧≒ｸ｢犧ｭ犧�
                </button>
              </div>
            </form>
          </div>
        </div>



        <!-- Edit Lot Weights Modal (Hidden by default) -->
        <div id="edit-weights-modal" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center md:p-4 bg-black bg-opacity-40 transition-opacity">
          <div class="bg-white w-full h-full md:h-auto md:max-w-3xl rounded-none md:rounded-3xl overflow-y-auto md:overflow-hidden shadow-2xl border border-gray-100">
            <!-- Modal Header -->
            <div class="bg-emerald-800 px-6 py-4 text-white flex justify-between items-center">
              <h3 class="font-bold text-sm flex items-center gap-1.5">
                <i class="fas fa-weight-hanging"></i> 犹≒ｸ≒ｹ霞ｹｸもｸ吭ｹ霞ｸｳ犧ｫ犧吭ｸｱ犧≒ｸ憫ｸ･犧憫ｸ･犧ｴ犧歩ｸｪ犧扉ｹ≒ｸ･犧ｰ犹≒ｸｫ犹霞ｸ
              </h3>
              <button type="button" class="close-weights-modal-btn text-white opacity-80 hover:opacity-100 text-xl focus:outline-none">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- Modal Body Form -->
            <form id="edit-weights-form" class="p-6 space-y-4">
              <!-- Lot Code Display -->
              <div class="border-b border-gray-100 pb-3 mb-2">
                <span class="block text-xs font-semibold text-gray-400 uppercase">犹≒ｸ≒ｹ霞ｹ�ｸもｸもｹ霞ｸｭ犧｡犧ｹ犧･犧もｸｭ犧�ｸ･犹�ｸｭ犧歩ｸｪ犧ｴ犧吭ｸ�ｹ霞ｸｲ</span>
                <span id="weights-crop-display" class="block text-lg font-extrabold text-emerald-800 mt-1">CROP-XXX</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Fresh weight input -->
                <div>
                  <label for="weights-fresh" class="block text-xs font-semibold text-gray-500 uppercase mb-1">犧吭ｹ霞ｸｳ犧ｫ犧吭ｸｱ犧≒ｸ扉ｸｭ犧≒ｸｪ犧扉ｸ伶ｸｵ犹謂ｹ犧≒ｹ�ｸ壟ｹ犧≒ｸｵ犹謂ｸ｢犧ｧ犹�ｸ扉ｹ� (犧≒ｸｴ犹もｸ･犧≒ｸ｣犧ｱ犧｡) *</label>
                  <input type="number" id="weights-fresh" name="yieldFresh" required min="0.01" step="any" placeholder="犹犧癌ｹ謂ｸ� 150.5"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                </div>

                <!-- Dried weight input -->
                <div>
                  <label for="weights-dry" class="block text-xs font-semibold text-gray-500 uppercase mb-1">犧吭ｹ霞ｸｳ犧ｫ犧吭ｸｱ犧≒ｸｭ犧壟ｹ≒ｸｫ犹霞ｸ�ｸ伶ｸｵ犹謂ｸ壟ｸ｣犧｣犧謂ｸｸ犹犧もｹ霞ｸｲ犧�ｸ･犧ｱ犧� (犧≒ｸｴ犹もｸ･犧≒ｸ｣犧ｱ犧｡) *</label>
                  <input type="number" id="weights-dry" name="dryStock" required min="0.01" step="any" placeholder="犹犧癌ｹ謂ｸ� 20.0"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                </div>
              </div>

              <!-- Footer Buttons -->
              <div class="flex justify-end pt-4 gap-3 border-t border-gray-100 mt-4">
                <button type="button" class="close-weights-modal-btn px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  犧｢犧≒ｹ犧･犧ｴ犧�
                </button>
                <button type="submit" class="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-md font-bold">
                  <i class="fas fa-save"></i> 犧壟ｸｱ犧吭ｸ伶ｸｶ犧≒ｸもｹ霞ｸｭ犧｡犧ｹ犧･犧吭ｹ霞ｸｳ犧ｫ犧吭ｸｱ犧�
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  },

  init() {
    this.bindTabEvents();
    
    if (this.activeTab === 'stock') {
      this.bindStockEvents();
    } else if (this.activeTab === 'ledger') {
      this.bindLedgerEvents();
    }
  },

  bindTabEvents() {
    const stockBtn = document.getElementById('tab-stock-btn');
    const ledgerBtn = document.getElementById('tab-ledger-btn');
    const salesBtn = document.getElementById('tab-sales-btn');

    if (stockBtn) {
      stockBtn.addEventListener('click', () => {
        this.activeTab = 'stock';
        this.refreshView();
      });
    }

    if (ledgerBtn) {
      ledgerBtn.addEventListener('click', () => {
        this.activeTab = 'ledger';
        this.refreshView();
      });
    }

    if (salesBtn) {
      salesBtn.addEventListener('click', () => {
        this.activeTab = 'sales';
        this.refreshView();
      });
    }
  },

  bindStockEvents() {
    const sellBtns = document.querySelectorAll('.sell-stock-btn');
    const saleModal = document.getElementById('sale-record-modal');
    const closeSaleBtns = document.querySelectorAll('.close-sale-modal-btn');
    const saleForm = document.getElementById('sale-form');
    const saleTypeSelect = document.getElementById('sale-type');

    sellBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        const invItem = appState.getInventoryByCropId(cropId);
        
        if (invItem && saleModal) {
          this.sellingCropId = cropId;
          document.getElementById('sale-crop-display').textContent = `${cropId} (${invItem.herbType}犧ｭ犧壟ｹ≒ｸｫ犹霞ｸ�)`;
          
          if (saleForm) {
            saleForm.reset();
            document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
            
            if (saleTypeSelect) {
              saleTypeSelect.value = 'bulk';
              updateSaleFormUI(invItem);
            }
          }

          saleModal.classList.remove('hidden');
        }
      });
    });

    const updateSaleFormUI = (invItem) => {
      if (!invItem) return;
      const type = saleTypeSelect ? saleTypeSelect.value : 'bulk';
      const amountInput = document.getElementById('sale-amount');
      const amountLabel = amountInput.previousElementSibling;
      const priceInput = document.getElementById('sale-price');
      const priceLabel = priceInput.previousElementSibling;
      const maxDisplay = document.getElementById('sale-max-stock-display');

      if (type === 'bulk') {
        amountLabel.textContent = '犧巵ｸ｣犧ｴ犧｡犧ｲ犧内ｸ伶ｸｵ犹謂ｸもｸｲ犧｢ (犧≒ｸｴ犹もｸ･犧≒ｸ｣犧ｱ犧｡) *';
        amountInput.placeholder = '犹犧癌ｹ謂ｸ� 5.5';
        amountInput.step = 'any';
        amountInput.min = '0.01';
        amountInput.max = invItem.dryStockKg;
        priceLabel.textContent = '犧｣犧ｲ犧�ｸｲ犧歩ｹ謂ｸｭ犧≒ｸｴ犹もｸ･犧≒ｸ｣犧ｱ犧｡ (犧壟ｸｲ犧�) *';
        priceInput.placeholder = '犹犧癌ｹ謂ｸ� 450';
        maxDisplay.textContent = `犧ｪ犧歩ｹ�ｸｭ犧≒ｸ･犹�ｸｭ犧歩ｸ吭ｸｵ犹霞ｸ�ｸ�ｹ犧ｫ犧･犧ｷ犧ｭ犧ｪ犧ｹ犧�ｸｪ犧ｸ犧�: ${invItem.dryStockKg} 犧≒ｸ�.`;
      } else {
        const isChrys = invItem.herbType === '犹犧≒ｹ癌ｸ≒ｸｮ犧ｧ犧｢' || invItem.herbType.includes('犹犧≒ｹ癌ｸ≒ｸｮ犧ｧ犧｢');
        const jarCapacity = isChrys ? 0.10 : 0.05; // 100g / 50g
        const maxJars = Math.floor(invItem.dryStockKg / jarCapacity);

        amountLabel.textContent = '犧謂ｸｳ犧吭ｸｧ犧吭ｸ≒ｸ｣犧ｰ犧巵ｸｸ犧≒ｸ伶ｸｵ犹謂ｸもｸｲ犧｢ (犧≒ｸ｣犧ｰ犧巵ｸｸ犧�) *';
        amountInput.placeholder = '犹犧癌ｹ謂ｸ� 10';
        amountInput.step = '1';
        amountInput.min = '1';
        amountInput.max = maxJars;
        priceLabel.textContent = '犧｣犧ｲ犧�ｸｲ犧歩ｹ謂ｸｭ犧≒ｸ｣犧ｰ犧巵ｸｸ犧� (犧壟ｸｲ犧�) *';
        priceInput.placeholder = '犹犧癌ｹ謂ｸ� 80';
        maxDisplay.textContent = `犧ｪ犧歩ｹ�ｸｭ犧≒ｸ･犹�ｸｭ犧歩ｸ吭ｸｵ犹霞ｸ�ｸ�ｹ犧ｫ犧･犧ｷ犧ｭ犧もｸｲ犧｢犹犧巵ｹ�ｸ吭ｸ≒ｸ｣犧ｰ犧巵ｸｸ犧≒ｸｪ犧ｹ犧�ｸｪ犧ｸ犧�: ${maxJars} 犧≒ｸ｣犧ｰ犧巵ｸｸ犧� (犹犧伶ｸｵ犧｢犧壟ｹ犧伶ｹ謂ｸｲ犧吭ｹ霞ｸｳ犧ｫ犧吭ｸｱ犧≒ｹ�ｸ吭ｸ�ｸ･犧ｱ犧�)`;
      }
    };

    if (saleTypeSelect) {
      saleTypeSelect.addEventListener('change', () => {
        if (this.sellingCropId) {
          const invItem = appState.getInventoryByCropId(this.sellingCropId);
          updateSaleFormUI(invItem);
        }
      });
    }

    closeSaleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (saleModal) saleModal.classList.add('hidden');
      });
    });

    if (saleForm) {
      saleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(saleForm);
        const amount = parseFloat(formData.get('amount'));
        const price = parseFloat(formData.get('price'));
        const customer = formData.get('customer');
        const date = formData.get('date');
        const saleType = formData.get('saleType') || 'bulk';

        if (this.sellingCropId) {
          try {
            appState.recordSale(this.sellingCropId, amount, price, customer, date, saleType);
            showToast(`犧ｫ犧ｱ犧≒ｸ｢犧ｭ犧扉ｸｪ犧歩ｹ�ｸｭ犧≒ｸ･犹�ｸｭ犧� ${this.sellingCropId} 犹≒ｸ･犧ｰ犧壟ｸｱ犧吭ｸ伶ｸｶ犧≒ｸもｸｲ犧｢犧ｪ犧ｳ犹犧｣犹�ｸ�);
            if (saleModal) saleModal.classList.add('hidden');
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    }

    // --- Edit Weights Modal Events ---
    const weightsModal = document.getElementById('edit-weights-modal');
    const editWeightsBtns = document.querySelectorAll('.edit-lot-weights-btn');
    const closeWeightsBtns = document.querySelectorAll('.close-weights-modal-btn');
    const weightsForm = document.getElementById('edit-weights-form');

    editWeightsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        const invItem = appState.getInventoryByCropId(cropId);
        const crop = appState.getCropById(cropId);
        
        if (invItem && weightsModal) {
          this.editingWeightsCropId = cropId;
          document.getElementById('weights-crop-display').textContent = `${cropId} (${invItem.herbType}犧ｭ犧壟ｹ≒ｸｫ犹霞ｸ�)`;
          document.getElementById('weights-fresh').value = crop ? (crop.yield || 0) : 0;
          document.getElementById('weights-dry').value = invItem.dryStockKg || 0;
          weightsModal.classList.remove('hidden');
        }
      });
    });

    closeWeightsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (weightsModal) weightsModal.classList.add('hidden');
      });
    });

    if (weightsForm) {
      weightsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(weightsForm);
        const yieldFresh = parseFloat(formData.get('yieldFresh')) || 0;
        const dryStock = parseFloat(formData.get('dryStock')) || 0;

        if (this.editingWeightsCropId) {
          try {
            appState.updateLotWeights(this.editingWeightsCropId, yieldFresh, dryStock);
            showToast(`犧ｭ犧ｱ犧巵ｹ犧扉ｸ歩ｸ吭ｹ霞ｸｳ犧ｫ犧吭ｸｱ犧≒ｸ･犹�ｸｭ犧� ${this.editingWeightsCropId} 犹犧｣犧ｵ犧｢犧壟ｸ｣犹霞ｸｭ犧｢犹≒ｸ･犹霞ｸｧ`);
            if (weightsModal) weightsModal.classList.add('hidden');
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    }
  },

  bindLedgerEvents() {
    const searchInput = document.getElementById('member-ledger-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchMemberQuery = e.target.value;
        // Simple update without losing cursor focus
        const financialReport = appState.getFinancialReport();
        const filteredReport = financialReport.filter(r => 
          r.name.toLowerCase().includes(this.searchMemberQuery.toLowerCase()) ||
          r.id.toLowerCase().includes(this.searchMemberQuery.toLowerCase())
        );

        const rowsHtml = filteredReport.length === 0
          ? `<tr><td colspan="7" class="px-6 py-6 text-center text-sm text-gray-500">犹�ｸ｡犹謂ｸ樅ｸ壟ｸ｣犧ｲ犧｢犧�ｸｲ犧吭ｸ≒ｸｲ犧｣犹犧�ｸｴ犧吭ｸもｸｭ犧�ｸｪ犧｡犧ｲ犧癌ｸｴ犧≒ｸ｣犧ｲ犧｢犧伶ｸｵ犹謂ｸ｣犧ｰ犧壟ｸｸ</td></tr>`
          : filteredReport.map(r => {
              const statusBadge = r.netProfit > 0 
                ? `<span class="px-2.5 py-1 text-xs font-bold bg-green-50 text-green-700 rounded-full border border-green-200"><i class="fas fa-arrow-up mr-0.5"></i> 犧≒ｸｳ犹�ｸ｣</span>`
                : r.netProfit < 0
                  ? `<span class="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 rounded-full border border-red-200"><i class="fas fa-arrow-down mr-0.5"></i> 犧もｸｲ犧扉ｸ伶ｸｸ犧�</span>`
                  : `<span class="px-2.5 py-1 text-xs font-bold bg-gray-50 text-gray-600 rounded-full border border-gray-200">犹犧伶ｹ謂ｸｲ犧伶ｸｸ犧�</span>`;
              
              return `
                <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                  <td class="px-6 py-4 text-sm font-semibold text-emerald-800">${r.id}</td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-bold text-gray-900">${r.name}</div>
                    <div class="text-[10px] text-gray-400">犧壟ｸ伶ｸ壟ｸｲ犧�: ${r.role} (${r.villageNumber})</div>
                  </td>
                  <td class="px-6 py-4 text-center text-sm text-gray-700 font-medium">${r.totalCrops} 犧｣犧ｭ犧�</td>
                  <td class="px-6 py-4 text-sm text-gray-600 font-medium">${formatBaht(r.totalCost)}</td>
                  <td class="px-6 py-4 text-sm text-emerald-800 font-bold">${formatBaht(r.totalRevenue)}</td>
                  <td class="px-6 py-4 text-sm font-extrabold ${r.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}">
                    ${r.netProfit > 0 ? '+' : ''}${formatBaht(r.netProfit)}
                  </td>
                  <td class="px-6 py-4 text-center">${statusBadge}</td>
                </tr>
              `;
            }).join('');
        
        const tbody = document.querySelector('table tbody');
        if (tbody) tbody.innerHTML = rowsHtml;
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
