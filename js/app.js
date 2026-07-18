// Main App Controller and Router for Single Page Application
import { appState } from './state.js';
import { DashboardComponent } from './components/dashboard.js';
import { MembersComponent } from './components/members.js?v=4';
import { PlotsComponent } from './components/plots.js?v=4';
import { CropsComponent } from './components/crops.js?v=4';
import { SettingsComponent } from './components/settings.js';
import { InventoryComponent } from './components/inventory.js?v=5'; // Phase 2
import { TraceabilityComponent } from './components/traceability.js?v=4'; // Phase 2

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
      trace: TraceabilityComponent    // Phase 2
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

    // 4. Listen for hash changes to route dynamically (Phase 2)
    window.addEventListener('hashchange', () => {
      this.handleRouting();
    });

    // 5. Initial layout updates
    const initialProfile = appState.getEnterprise();
    this.updateHeaderAndTitles(initialProfile);

    // 6. Run router on initial load
    this.handleRouting();
  }

  handleRouting() {
    const hash = window.location.hash || '#dashboard';
    const sidebar = document.getElementById('sidebar');
    const header = document.querySelector('header');

    if (hash.startsWith('#trace/')) {
      const cropId = hash.split('/')[1];
      TraceabilityComponent.currentCropId = cropId;

      // HIDE admin panels for consumer traceability view
      if (sidebar) sidebar.style.display = 'none';
      if (header) header.style.display = 'none';
      
      this.switchView('trace');
    } else {
      // RESTORE admin panels
      if (sidebar) sidebar.style.display = '';
      if (header) header.style.display = '';

      const viewKey = hash.substring(1);
      if (this.views[viewKey]) {
        this.switchView(viewKey);
      } else {
        window.location.hash = '#dashboard';
      }
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
}

// Instantiate and start app when DOM is fully ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
