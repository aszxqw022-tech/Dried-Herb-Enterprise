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
 * Generate a random coordinates within a box (e.g., around Sri Don Mun, Chiang Saen, Chiang Rai)
 * Default bounds: Sri Don Mun, Chiang Saen, Chiang Rai (Lat 20.33, Lng 100.00)
 */
export function generateRandomCoordinates(latBase = 20.330, lngBase = 100.005, variance = 0.03) {
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

/**
 * ============================================================================
 * GLOBAL MODAL MANAGEMENT UTILITY
 * ============================================================================
 * Renders modal directly into #global-modal-container under <body>
 * completely escaping main viewport and sidebar flex bounds.
 */
let activeModalCloseHandler = null;

/**
 * Open a Global Modal
 * @param {Object} options
 * @param {string} options.title - Header Title
 * @param {string} [options.icon] - FontAwesome icon class e.g. "fas fa-user-edit"
 * @param {string} options.content - Inner modal body HTML
 * @param {string} [options.size='max-w-5xl'] - Tailwind max width: 'max-w-md', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl'
 * @param {string} [options.headerColor='bg-emerald-800'] - Tailwind background color for header
 * @param {boolean} [options.closeOnBackdrop=true] - Close when clicking dark overlay
 * @param {Function} [options.onRender] - Callback after DOM inserted (for binding inputs/maps)
 * @param {Function} [options.onClose] - Callback when modal closes
 */
export function openGlobalModal(optionsOrTitle = {}, maybeContent = '', maybeOptions = {}) {
  let opts = {};
  if (typeof optionsOrTitle === 'string') {
    opts = {
      title: optionsOrTitle,
      content: maybeContent,
      ...(typeof maybeOptions === 'string' ? { size: maybeOptions } : (maybeOptions || {}))
    };
  } else if (typeof optionsOrTitle === 'object' && optionsOrTitle !== null) {
    opts = optionsOrTitle;
  }

  const {
    title = '',
    icon = '',
    content = '',
    size = 'max-w-5xl',
    headerColor = 'bg-emerald-800',
    closeOnBackdrop = true,
    onRender = null,
    onClose = null
  } = opts;

  const container = document.getElementById('global-modal-container');
  if (!container) {
    console.error('#global-modal-container not found in DOM');
    return;
  }

  // Clear any existing modal
  closeGlobalModal();

  const iconHtml = icon ? `<i class="${icon}"></i>` : '';

  const modalHtml = `
    <div id="global-modal-backdrop" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div id="global-modal-dialog" class="bg-white rounded-3xl shadow-2xl w-full ${size} max-h-[92vh] flex flex-col overflow-hidden animate-fade-in my-auto border border-gray-100">
        <!-- Header (Fixed) -->
        <div class="${headerColor} px-6 py-4.5 text-white flex justify-between items-center flex-shrink-0">
          <h3 id="global-modal-title" class="font-bold text-base md:text-lg flex items-center gap-2">
            ${iconHtml} <span>${title}</span>
          </h3>
          <button type="button" id="global-modal-close-btn" class="text-white opacity-80 hover:opacity-100 text-xl focus:outline-none transition-opacity cursor-pointer p-1">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Body / Content injected -->
        <div id="global-modal-body" class="flex flex-col flex-1 overflow-y-auto min-h-0">
          ${content}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = modalHtml;

  // Prevent background body scrolling when modal is open
  document.body.classList.add('overflow-hidden');

  const backdrop = document.getElementById('global-modal-backdrop');
  const dialog = document.getElementById('global-modal-dialog');
  const closeBtn = document.getElementById('global-modal-close-btn');

  const handleClose = () => {
    closeGlobalModal();
    if (typeof onClose === 'function') onClose();
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', handleClose);
  }

  if (closeOnBackdrop && backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        handleClose();
      }
    });
  }

  // Close buttons with class .close-global-modal-btn inside content
  dialog.querySelectorAll('.close-global-modal-btn').forEach(btn => {
    btn.addEventListener('click', handleClose);
  });

  // Escape key listener
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };
  document.addEventListener('keydown', escHandler);

  activeModalCloseHandler = () => {
    document.removeEventListener('keydown', escHandler);
  };

  // Run onRender callback
  if (typeof onRender === 'function') {
    setTimeout(() => {
      // Auto-initialize Thai datepickers (วัน/เดือน/ปี) for any date inputs in the modal
      initThaiDatePickers(dialog);
      onRender(dialog);
    }, 15);
  } else {
    setTimeout(() => {
      initThaiDatePickers(dialog);
    }, 15);
  }
}

/**
 * Initialize Flatpickr Thai Date Picker (dd/mm/yyyy - วัน/เดือน/ปี)
 * Automatically converts native type="date" inputs to display Day/Month/Year first.
 * @param {HTMLElement|string} rootElement - Container or selector to search for date inputs
 */
export function initThaiDatePickers(rootElement = document) {
  if (typeof window.flatpickr === 'undefined') return;

  const container = typeof rootElement === 'string' 
    ? document.querySelector(rootElement) 
    : (rootElement || document);

  if (!container) return;

  const dateInputs = container.querySelectorAll('input[type="date"], input.thai-datepicker');
  dateInputs.forEach(input => {
    // Avoid double initialization
    if (input._flatpickr) return;

    // Read initial value before Flatpickr mutates
    const initialVal = input.value || input.getAttribute('value') || '';

    // Switch type from "date" to "text" so native browser date controls don't conflict with flatpickr
    if (input.type === 'date') {
      input.type = 'text';
    }

    window.flatpickr(input, {
      locale: 'th',
      dateFormat: 'Y-m-d',            // Underlying form value format (YYYY-MM-DD)
      altInput: true,                 // Creates a user-facing input
      altFormat: 'd/m/Y',             // Displays strictly วัน/เดือน/ปี (Day/Month/Year)
      defaultDate: initialVal || undefined,
      allowInput: true,
      disableMobile: false,           // Use flatpickr on mobile too so format stays dd/mm/yyyy
      onChange: (selectedDates, dateStr, instance) => {
        // Dispatch standard change and input events so custom form listeners react
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
}

/**
 * Close any active Global Modal
 */
export function closeGlobalModal() {
  const container = document.getElementById('global-modal-container');
  if (container) {
    container.innerHTML = '';
  }
  document.body.classList.remove('overflow-hidden');

  if (activeModalCloseHandler) {
    activeModalCloseHandler();
    activeModalCloseHandler = null;
  }
}

/**
 * 3 กลุ่มสมุนไพรหลักของวิสาหกิจชุมชน พร้อมข้อมูลมาตรฐานและไอคอนประจำตัวพืช
 * (ใช้ Emoji มาตรฐานสากล Unicode 6.0 ที่รองรับบน Windows ทุกเวอร์ชัน ไม่แสดงเป็นกล่องว่าง ▯)
 */
export const HERB_GROUPS_PRESETS = [
  {
    groupName: 'ชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ',
    groupIcon: '🍵',
    color: 'emerald',
    herbs: [
      { name: 'เก๊กฮวย', icon: '🌼', durationDays: 90, desc: 'ดอกสีเหลืองทอง กลิ่นหอม บำรุงตับ ดับพิษร้อน ปลูกง่าย ผลผลิตคุ้มค่า' },
      { name: 'กระเจี๊ยบแดง', icon: '🌺', durationDays: 120, desc: 'กลีบเลี้ยงสีแดงสด รสเปรี้ยว ดับกระหาย บำรุงเลือด ลดไขมันในเลือด' },
      { name: 'อัญชัน', icon: '🌸', durationDays: 60, desc: 'ดอกสีน้ำเงินม่วง อุดมด้วยสารแอนโทไซยานิน บำรุงสายตา บำรุงเส้นผม' },
      { name: 'ตะไคร้หอม', icon: '🌾', durationDays: 90, desc: 'พืชตระกูลหญ้า กลิ่นหอมอโรมา ขับลม เจริญอาหาร แก้หวัดคัดจมูก' },
      { name: 'ใบเตยหอม', icon: '🍃', durationDays: 90, desc: 'ใบสีเขียวสด กลิ่นหอมเย็น บำรุงหัวใจ ดับกระหายคลายร้อน ปรับสมดุล' },
      { name: 'คาโมมายล์', icon: '🌼', durationDays: 85, desc: 'ดอกสีขาวเกสรเหลือง ช่วยให้นอนหลับสบาย ผ่อนคลายกล้ามเนื้อ ต้านการอักเสบ' }
    ]
  },
  {
    groupName: 'แปรรูปเป็นยา เวชภัณฑ์ และอาหารเสริม',
    groupIcon: '💊',
    color: 'amber',
    herbs: [
      { name: 'ฟ้าทะลายโจร', icon: '🌿', durationDays: 110, desc: 'รสขมจัด มีสารแอนโดรกราโฟไลด์ บรรเทาอาการหวัด เจ็บคอ ลดไข้ เสริมภูมิคุ้มกัน' },
      { name: 'ขมิ้นชัน', icon: '🍠', durationDays: 240, desc: 'เหง้าสีส้มทอง มีสารเคอร์คูมินอยด์ บรรเทากรดไหลย้อน ท้องอืด ท้องเฟ้อ สมานแผลในกระเพาะ' },
      { name: 'ไพล', icon: '🍠', durationDays: 240, desc: 'เหง้าสมุนไพรเด่น น้ำมันหอมระเหยบำบัดกล้ามเนื้อ บรรเทาเคล็ดขัดยอก ฟกช้ำ' },
      { name: 'กระชายดำ', icon: '🍠', durationDays: 240, desc: 'โสมไทย เหง้าเนื้อสีม่วงดำ บำรุงกำลัง บำรุงหัวใจ เพิ่มความสดชื่น ชะลอวัย' },
      { name: 'ขิง', icon: '🍠', durationDays: 210, desc: 'เหง้ารสเผ็ดร้อน มีสารจินเจอรอล ขับลม แก้อาเจียน คลื่นไส้ กระตุ้นการไหลเวียน' }
    ]
  },
  {
    groupName: 'เครื่องสำอาง สปา และสารสกัด',
    groupIcon: '🧴',
    color: 'purple',
    herbs: [
      { name: 'ว่านหางจระเข้', icon: '🌵', durationDays: 240, desc: 'พืชอวบน้ำ วุ้นใสในกาบใบ ให้ความชุ่มชื้นแก่ผิว สมานแผล ลดการระคายเคือง' },
      { name: 'ทองพันชั่ง', icon: '🌼', durationDays: 180, desc: 'ดอกสีขาวคล้ายนกกระยาง สารสกัดต้านเชื้อรา รักษาโรคผิวหนัง กลากเกลื้อน' },
      { name: 'เสลดพังพอน', icon: '🌿', durationDays: 120, desc: 'ถอนพิษแมลงสัตว์กัดต่อย รักษาแผลเริม งูสวัด บรรเทาอาการคัน' },
      { name: 'มะกรูด', icon: '🍋', durationDays: 360, desc: 'ผลผิวขรุขระ น้ำมันหอมระเหยบำรุงหนังศีรษะและเส้นผมให้ดกดำเงางาม กลิ่นผ่อนคลาย' }
    ]
  }
];

/**
 * คืนค่าไอคอนประจำตัวพืชสมุนไพรอัตโนมัติตามชื่อพืช
 * (ใช้ Emoji สากลที่แสดงผลได้ 100% บนทุกเครื่อง ไม่เป็นกล่องว่าง ▯)
 * @param {string} herbName
 * @returns {string} Emoji icon
 */
export function getHerbDefaultIcon(herbName) {
  if (!herbName || typeof herbName !== 'string') return '🌿';
  const clean = herbName.trim().toLowerCase();

  // กลุ่มชาชงดื่มและเครื่องดื่มเพื่อสุขภาพ
  if (clean.includes('เก๊กฮวย')) return '🌼';
  if (clean.includes('กระเจี๊ยบ')) return '🌺';
  if (clean.includes('อัญชัน')) return '🌸';
  if (clean.includes('ตะไคร้')) return '🌾';
  if (clean.includes('เตย') || clean.includes('ใบเตย')) return '🍃';
  if (clean.includes('คาโมมายล์')) return '🌼';

  // กลุ่มแปรรูปเป็นยา เวชภัณฑ์ และอาหารเสริม (พืชเหง้า/หัวใต้ดิน และสมุนไพรใบ)
  if (clean.includes('ฟ้าทะลายโจร')) return '🌿';
  if (clean.includes('ขมิ้น')) return '🍠';
  if (clean.includes('ไพล')) return '🍠';
  if (clean.includes('กระชาย')) return '🍠';
  if (clean.includes('ขิง')) return '🍠';

  // กลุ่มเครื่องสำอาง สปา และสารสกัด
  if (clean.includes('ว่านหางจระเข้') || clean.includes('หางจระเข้')) return '🌵';
  if (clean.includes('ทองพันชั่ง')) return '🌼';
  if (clean.includes('เสลดพังพอน')) return '🌿';
  if (clean.includes('มะกรูด')) return '🍋';

  // พืชสมุนไพรเพิ่มเติม
  if (clean.includes('ดาวเรือง')) return '🌼';
  if (clean.includes('มะนาว')) return '🍋';
  if (clean.includes('บัวบก')) return '🍀';
  if (clean.includes('สะระแหน่') || clean.includes('มินต์') || clean.includes('มิ้นต์')) return '🍃';
  if (clean.includes('กะเพรา') || clean.includes('โหระพา') || clean.includes('แมงลัก')) return '🌿';
  if (clean.includes('ชา') || clean.includes('ชาเขียว')) return '🍵';
  if (clean.includes('บัว') || clean.includes('เกสรบัว')) return '🌸';
  if (clean.includes('ดอก')) return '🌸';

  return '🌿';
}

/**
 * Format crop cycle ID to standard: [ปี พ.ศ.]/[รหัสแปลง]-R[รอบที่]
 * e.g., "2569/P001-R1" (strictly no spaces, single slash, dash R)
 * @param {string} cropIdOrPlot 
 * @param {number|string} [year] 
 * @param {number|string} [cycle] 
 */
export function formatCropSeasonId(cropIdOrPlot, year = null, cycle = null) {
  if (!cropIdOrPlot) return '';
  const str = String(cropIdOrPlot).trim();

  // Check if it has year/plot/cycle combined
  const m = str.match(/^(\d{4})\/P\s*-?\s*(\d+)[-\/]R?(\d+)$/i);
  if (m) {
    const y = m[1];
    const p = String(parseInt(m[2], 10)).padStart(3, '0');
    const c = m[3];
    return `${y}/P${p}-R${c}`;
  }

  // If passed plotId (e.g. 'P-001' or 'P001') along with year and cycle
  if (year && cycle) {
    const pDigits = str.replace(/[^\d]/g, '');
    const pNum = pDigits ? String(parseInt(pDigits, 10)).padStart(3, '0') : '001';
    return `${year}/P${pNum}-R${cycle}`;
  }

  // General cleanup fallback
  return str
    .replace(/\s+/g, '')
    .replace(/\/P-?/i, '/P')
    .replace(/\/([123])$/, '-R$1');
}

/**
 * Format crop cycle dropdown option label:
 * e.g., "2569/P001-R1 (แปลงสวนหน้าบ้าน - รอบ 1)"
 * @param {object|string} crop 
 * @param {object} [plot] 
 */
export function formatCropCycleDropdownLabel(crop, plot = null) {
  if (!crop) return '';
  const rawId = typeof crop === 'string' ? crop : (crop.id || '');
  const year = typeof crop === 'object' ? crop.cropYear : null;
  const cycle = typeof crop === 'object' ? crop.cropCycle : (rawId.match(/-R(\d+)/i) ? rawId.match(/-R(\d+)/i)[1] : 1);
  const cleanId = formatCropSeasonId(rawId, year, cycle);
  const plotName = plot ? plot.name : (crop.plotName || crop.plotId || '');
  if (plotName) {
    return `${cleanId} (${plotName} - รอบ ${cycle || 1})`;
  }
  return `${cleanId} (รอบ ${cycle || 1})`;
}
