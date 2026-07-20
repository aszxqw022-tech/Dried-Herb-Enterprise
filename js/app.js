// Main App Controller and Router for Single Page Application
import { appState } from './state.js';
import { DashboardComponent } from './components/dashboard.js';
import { MembersComponent } from './components/members.js?v=2';
import { PlotsComponent } from './components/plots.js';
import { CropsComponent } from './components/crops.js?v=2';
import { SettingsComponent } from './components/settings.js';
import { InventoryComponent } from './components/inventory.js?v=3'; // Phase 2
import { TraceabilityComponent } from './components/traceability.js?v=2'; // Phase 2
import { LoginComponent } from './components/login.js';

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.views = {
      dashboard: DashboardComponent,
      members: MembersComponent,
      plots: PlotsComponent,
      crops: CropsComponent,
      settings: SettingsComponent,
      inventory: InventoryComponent,  // Phase 2
      trace: TraceabilityComponent,   // Phase 2
      login: LoginComponent
    };
  }

  init() {
    // 1. Bind Navigation Sidebar Links
    const navLinks = document.querySelectorAll('.sidebar-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        window.location.hash = `#${targetView}`; // Update hash for router
      });
    });

    // 2. Setup Responsive Sidebar Toggle for mobile screens
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggleBtn && sidebar && overlay) {
      const toggleSidebar = () => {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
      };

      toggleBtn.addEventListener('click', toggleSidebar);
      overlay.addEventListener('click', toggleSidebar);
      
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (!sidebar.classList.contains('-translate-x-full')) {
            toggleSidebar();
          }
        });
      });
    }

    // 3. Listen to enterprise details change to update title/logo dynamically
    appState.onEnterpriseChange = (profile) => {
      this.updateHeaderAndTitles(profile);
    };

    // 4. Listen to Auth Session Changes
    appState.onAuthChange = (user) => {
      this.updateUserSessionUI(user);
    };

    // 5. Listen for hash changes to route dynamically
    window.addEventListener('hashchange', () => {
      this.handleRouting();
    });

    // 6. Initial layout updates
    const initialProfile = appState.getEnterprise();
    this.updateHeaderAndTitles(initialProfile);
    this.updateUserSessionUI(appState.getCurrentUser());

    // 7. Run router on initial load
    this.handleRouting();
  }

  handleRouting() {
    let hash = window.location.hash || '#dashboard';
    const sidebar = document.getElementById('sidebar');
    const header = document.querySelector('header');
    const isLoggedIn = appState.isLoggedIn();

    // Traceability Consumer Route (Public)
    if (hash.startsWith('#trace/')) {
      const cropId = hash.split('/')[1];
      TraceabilityComponent.currentCropId = cropId;

      if (sidebar) sidebar.style.display = 'none';
      if (header) header.style.display = 'none';
      
      this.switchView('trace');
      return;
    }

    // Route Guard for Protected Views
    if (!isLoggedIn && hash !== '#login') {
      window.location.hash = '#login';
      return;
    }

    if (isLoggedIn && hash === '#login') {
      window.location.hash = '#dashboard';
      return;
    }

    // Login View (Hide sidebar)
    if (hash === '#login') {
      if (sidebar) sidebar.style.display = 'none';
      if (header) header.style.display = '';
      this.switchView('login');
      return;
    }

    // Standard Protected Views
    if (sidebar) sidebar.style.display = '';
    if (header) header.style.display = '';

    const viewKey = hash.substring(1);
    if (this.views[viewKey]) {
      this.switchView(viewKey);
    } else {
      window.location.hash = isLoggedIn ? '#dashboard' : '#login';
    }
  }

  switchView(viewKey) {
    if (!this.views[viewKey]) {
      console.error(`View ${viewKey} not found`);
      return;
    }

    this.currentView = viewKey;

    // Update active state in navigation
    const navLinks = document.querySelectorAll('.sidebar-link');
    navLinks.forEach(link => {
      const linkView = link.getAttribute('data-view');
      if (linkView === viewKey) {
        link.classList.add('active');
        const icon = link.querySelector('i');
        if (icon) icon.className = icon.className.replace('text-emerald-700', 'text-white');
      } else {
        link.classList.remove('active');
      }
    });

    // Render component HTML
    const viewContainer = document.getElementById('app-view');
    if (viewContainer) {
      viewContainer.innerHTML = this.views[viewKey].render();
      // Initialize view event listeners
      this.views[viewKey].init();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateHeaderAndTitles(profile) {
    const titles = document.querySelectorAll('.enterprise-name-display');
    titles.forEach(el => {
      el.textContent = profile.name;
    });

    const villages = document.querySelectorAll('.enterprise-village-display');
    villages.forEach(el => {
      el.textContent = `${profile.village} ต.${profile.subdistrict}`;
    });
  }

  updateUserSessionUI(user) {
    const container = document.getElementById('header-user-container');
    const avatarDisplay = document.getElementById('user-avatar-display');
    const nameDisplay = document.getElementById('user-name-display');
    const roleDisplay = document.getElementById('user-role-display');

    if (user) {
      // Logged in UI in Header
      if (container) {
        container.innerHTML = `
          <div class="flex items-center gap-3 bg-emerald-50/80 px-3 py-1.5 rounded-2xl border border-emerald-100 shadow-sm">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              ${user.avatarText || 'U'}
            </div>
            <div class="hidden sm:block text-left">
              <span class="text-xs font-bold text-gray-800 block leading-tight">${user.name}</span>
              <span class="text-[10px] text-emerald-700 font-semibold block leading-tight">${user.role}</span>
            </div>
            <button id="logout-btn" title="ออกจากระบบ"
              class="ml-1 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold focus:outline-none">
              <i class="fas fa-sign-out-alt text-sm"></i>
              <span class="hidden md:inline">ออกจากระบบ</span>
            </button>
          </div>
        `;

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => {
            if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
              appState.logout();
              window.location.hash = '#login';
            }
          });
        }
      }

      // Sidebar Footer
      if (avatarDisplay) avatarDisplay.textContent = user.avatarText || 'U';
      if (nameDisplay) nameDisplay.textContent = user.name;
      if (roleDisplay) roleDisplay.textContent = user.role;

    } else {
      // Logged out UI in Header
      if (container) {
        container.innerHTML = `
          <a href="#login" id="header-login-btn"
            class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
            <i class="fas fa-sign-in-alt"></i>
            <span>เข้าสู่ระบบ</span>
          </a>
        `;
      }

      // Sidebar Footer
      if (avatarDisplay) avatarDisplay.textContent = 'G';
      if (nameDisplay) nameDisplay.textContent = 'ผู้ใช้งานทั่วไป';
      if (roleDisplay) roleDisplay.textContent = 'ยังไม่ได้เข้าสู่ระบบ';
    }
  }
}

// Instantiate and start app when DOM is fully ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
