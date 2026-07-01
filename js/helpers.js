// Helpers functions for Dried Herb Community Enterprise

/**
 * Format date to Thai Locale (e.g., "1 ก.ค. 2569")
 * @param {string|Date} dateVal 
 * @param {boolean} shortMonth 
 */
export function formatThaiDate(dateVal, shortMonth = true) {
  if (!dateVal) return '-';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return dateVal;

  const monthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  
  const monthsFull = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear() + 543; // Convert AD to BE

  return `${day} ${shortMonth ? monthsShort[month] : monthsFull[month]} ${year}`;
}

/**
 * Format currency to Thai Baht (e.g., "1,500.00 บาท")
 * @param {number} amount 
 * @param {boolean} includeSatang 
 */
export function formatBaht(amount, includeSatang = false) {
  if (amount === undefined || amount === null) return '0 บาท';
  
  const formatter = new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: includeSatang ? 2 : 0,
    maximumFractionDigits: includeSatang ? 2 : 0,
  });

  return `${formatter.format(amount)} บาท`;
}

/**
 * Convert Thai land unit (Rai, Ngan, Sq.Wah) to square meters
 */
export function thaiAreaToSqMeters(rai = 0, ngan = 0, sqWah = 0) {
  const r = parseFloat(rai) || 0;
  const n = parseFloat(ngan) || 0;
  const w = parseFloat(sqWah) || 0;
  
  // 1 Rai = 400 Sq.Wah = 1600 Sq.Meters
  // 1 Ngan = 100 Sq.Wah = 400 Sq.Meters
  // 1 Sq.Wah = 4 Sq.Meters
  return (r * 1600) + (n * 400) + (w * 4);
}

/**
 * Format area in Thai layout (e.g., "2 ไร่ 1 งาน 50 ตร.ว.")
 */
export function formatThaiArea(rai = 0, ngan = 0, sqWah = 0) {
  const parts = [];
  if (rai > 0) parts.push(`${rai} ไร่`);
  if (ngan > 0) parts.push(`${ngan} งาน`);
  if (sqWah > 0) parts.push(`${sqWah} ตร.ว.`);
  
  if (parts.length === 0) return '0 ตร.ว.';
  return parts.join(' ');
}

/**
 * Generate a random coordinates within a box (e.g., for simulation around Chiang Mai/Northern Thailand)
 * Default bounds: Mae Rim, Chiang Mai (Lat 18.91, Lng 98.94)
 */
export function generateRandomCoordinates(latBase = 18.914, lngBase = 98.944, variance = 0.05) {
  const lat = latBase + (Math.random() - 0.5) * variance;
  const lng = lngBase + (Math.random() - 0.5) * variance;
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

/**
 * Generate unique random ID
 */
export function generateId(prefix = 'ID') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Create a simple toast notification
 */
export function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800 fade-in border-l-4 ${
    type === 'success' ? 'border-green-500' : type === 'error' ? 'border-red-500' : 'border-yellow-500'
  }`;

  const icon = type === 'success' 
    ? '<i class="fas fa-check-circle text-green-500 mr-2 text-lg"></i>' 
    : type === 'error' 
      ? '<i class="fas fa-exclamation-circle text-red-500 mr-2 text-lg"></i>' 
      : '<i class="fas fa-exclamation-triangle text-yellow-500 mr-2 text-lg"></i>';

  toast.innerHTML = `
    <div class="flex items-center">
      ${icon}
      <div class="ms-3 text-sm font-normal text-gray-800 dark:text-gray-200">${message}</div>
    </div>
    <button type="button" class="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast" aria-label="Close">
      <span class="sr-only">Close</span>
      <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
      </svg>
    </button>
  `;

  toastContainer.appendChild(toast);

  // Auto-remove toast
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
    setTimeout(() => toast.remove(), 500);
  }, 4000);

  // Close button binding
  toast.querySelector('button').addEventListener('click', () => {
    toast.remove();
  });
}
