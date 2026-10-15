// Login Component for Authentication
import { appState } from '../state.js';
import { showToast } from '../helpers.js';

export const LoginComponent = {
  render() {
    const enterprise = appState.getEnterprise();
    const demoUsers = appState.getDemoUsers();

    return `
      <div class="fade-in max-w-xl mx-auto py-6 md:py-12">
        <div class="glass-card bg-white rounded-3xl p-6 md:p-10 shadow-2xl border border-emerald-100/80 relative overflow-hidden">
          
          <!-- Decorative Top Accent Banner -->
          <div class="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-500"></div>

          <!-- Header Logo & Branding -->
          <div class="text-center space-y-3 mb-8 pt-2">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/20 border border-white/20">
              <i class="fas fa-leaf text-3xl text-green-300"></i>
            </div>
            <div>
              <span class="text-sm font-bold text-emerald-700 tracking-wider uppercase block">ระบบบริหารจัดการและบัญชี</span>
              <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mt-1">${enterprise.name}</h1>
              <p class="text-sm text-gray-500 mt-1">กรุณาล็อกอินด้วยบัญชีผู้ใช้งานเพื่อเข้าถึงระบบจัดการวิสาหกิจ</p>
            </div>
          </div>

          <!-- Alert error banner (Hidden by default) -->
          <div id="login-error-alert" class="hidden mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-3">
            <i class="fas fa-exclamation-circle text-lg text-red-500 flex-shrink-0"></i>
            <span id="login-error-msg">ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง</span>
          </div>

          <!-- Login Form -->
          <form id="login-form" class="space-y-5">
            <!-- Username Input -->
            <div>
              <label for="login-username" class="block text-sm font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                <i class="fas fa-user text-emerald-700"></i> ชื่อผู้ใช้งาน *
              </label>
              <div class="relative">
                <input type="text" id="login-username" name="username" required placeholder="ชื่อผู้ใช้งาน"
                  class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-gray-50/50 focus:bg-white">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                  <i class="fas fa-user text-base"></i>
                </span>
              </div>
            </div>

            <!-- Password Input -->
            <div>
              <label for="login-password" class="block text-sm font-bold text-gray-700 uppercase mb-1.5 flex items-center justify-between">
                <span class="flex items-center gap-1.5"><i class="fas fa-lock text-emerald-700"></i> รหัสผ่าน *</span>
              </label>
              <div class="relative">
                <input type="password" id="login-password" name="password" required placeholder="รหัสผ่าน"
                  class="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-gray-50/50 focus:bg-white">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                  <i class="fas fa-lock text-base"></i>
                </span>
                <button type="button" id="toggle-password-btn" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                  <i class="fas fa-eye text-sm" id="toggle-password-icon"></i>
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="login-submit-btn"
              class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
              <span>เข้าสู่ระบบ (Login)</span>
              <i class="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
            </button>
          </form>

        </div>
      </div>
    `;
  },

  init() {
    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const togglePassBtn = document.getElementById('toggle-password-btn');
    const togglePassIcon = document.getElementById('toggle-password-icon');
    const errorAlert = document.getElementById('login-error-alert');
    const errorMsg = document.getElementById('login-error-msg');
    const demoBtns = document.querySelectorAll('.demo-login-btn');

    // Show/Hide password toggle
    if (togglePassBtn && passwordInput && togglePassIcon) {
      togglePassBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassIcon.className = type === 'password' ? 'fas fa-eye text-sm' : 'fas fa-eye-slash text-sm text-emerald-700';
      });
    }

    // Process Login Form Submission
    const performLogin = (username, password) => {
      if (errorAlert) errorAlert.classList.add('hidden');

      try {
        const user = appState.login(username, password);
        showToast(`ยินดีต้อนรับ ${user.name} (${user.role}) เข้าสู่ระบบ`);
        window.location.hash = '#dashboard';
      } catch (err) {
        if (errorAlert && errorMsg) {
          errorMsg.textContent = err.message;
          errorAlert.classList.remove('hidden');
        } else {
          showToast(err.message, 'error');
        }
      }
    };

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput ? usernameInput.value : '';
        const password = passwordInput ? passwordInput.value : '';
        performLogin(username, password);
      });
    }

    // Bind 1-Click Demo Login Buttons
    demoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.getAttribute('data-demo-user');
        const p = btn.getAttribute('data-demo-pass');
        if (usernameInput) usernameInput.value = u;
        if (passwordInput) passwordInput.value = p;
        performLogin(u, p);
      });
    });
  }
};
