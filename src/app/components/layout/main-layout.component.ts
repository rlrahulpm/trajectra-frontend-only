import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <nav class="sidebar">
        <div class="logo">
          <h2>TML Corrosion Monitor</h2>
        </div>
        <ul class="nav-menu">
          <li>
            <a routerLink="/dashboard" routerLinkActive="active">
              <span class="icon">📊</span>
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a routerLink="/circuits" routerLinkActive="active">
              <span class="icon">🔌</span>
              <span>Circuits</span>
            </a>
          </li>
          <li>
            <a routerLink="/tmls" routerLinkActive="active">
              <span class="icon">📍</span>
              <span>TML Points</span>
            </a>
          </li>
          <li>
            <a routerLink="/measurements" routerLinkActive="active">
              <span class="icon">📏</span>
              <span>Measurements</span>
            </a>
          </li>
          <li>
            <a routerLink="/analytics" routerLinkActive="active">
              <span class="icon">📈</span>
              <span>Analytics</span>
            </a>
          </li>
          <li>
            <a routerLink="/classifications" routerLinkActive="active">
              <span class="icon">🏷️</span>
              <span>Classifications</span>
            </a>
          </li>
          <li>
            <a routerLink="/reports" routerLinkActive="active">
              <span class="icon">📑</span>
              <span>Reports</span>
            </a>
          </li>
          <li>
            <a routerLink="/sankey" routerLinkActive="active">
              <span class="icon">🌊</span>
              <span>Flow Diagram</span>
            </a>
          </li>
        </ul>
      </nav>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      background: #f5f5f5;
    }

    .sidebar {
      width: 250px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    }

    .logo {
      padding: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      text-align: center;
    }

    .logo h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 600;
    }

    .nav-menu {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }

    .nav-menu li {
      margin: 0;
    }

    .nav-menu a {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .nav-menu a:hover {
      background: rgba(255,255,255,0.1);
      padding-left: 25px;
    }

    .nav-menu a.active {
      background: rgba(255,255,255,0.2);
      border-left: 4px solid white;
    }

    .icon {
      margin-right: 12px;
      font-size: 1.2rem;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
  `]
})
export class MainLayoutComponent {}