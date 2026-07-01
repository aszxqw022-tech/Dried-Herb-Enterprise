// Main App Controller and Router for Single Page Application
import { appState } from './state.js';
import { DashboardComponent } from './components/dashboard.js';
import { MembersComponent } from './components/members.js';
import { PlotsComponent } from './components/plots.js';
import { CropsComponent } from './components/crops.js';
import { SettingsComponent } from './components/settings.js';

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.views = {
      dashboard: DashboardComponent,
      members: MembersComponent,
      plots: PlotsComponent,
      crops: CropsComponent,
      settings: SettingsComponent
    };
  }

  init() {
    // 1. Bind Navigation Sidebar Links
    const navLinks = document.querySelectorAll('.sidebar-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        this.switchView(targetView);
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
      
      // Close sidebar when clicking sidebar links on mobile
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

    // 4. Initial layout updates
    const initialProfile = appState.getEnterprise();
    this.updateHeaderAndTitles(initialProfile);

    // 5. Render default view
    this.switchView('dashboard');
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
        // Highlight icon
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
