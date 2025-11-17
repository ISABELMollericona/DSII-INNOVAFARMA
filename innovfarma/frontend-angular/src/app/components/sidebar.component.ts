import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside class="sidebar-menu-wrapper" id="sidebarMenu">
      <div class="sidebar-header">
        <h2 class="sidebar-title">Módulos</h2>
      </div>
      
      <ul class="modules-menu">
        <li class="module-item" *ngFor="let item of menuItems; let i = index">
          <!-- Módulo sin submenu -->
          <ng-container *ngIf="!item.children || item.children.length === 0">
            <a [routerLink]="item.path" class="module-link">
              <i class="fas" [ngClass]="item.icon + ' module-icon'"></i>
              <span class="module-label">{{ item.label }}</span>
            </a>
          </ng-container>
          
          <!-- Módulo con submenu -->
          <ng-container *ngIf="item.children && item.children.length > 0">
            <button class="module-link" (click)="toggleSubmenu(i)" [class.active]="openMenus[i]">
              <i class="fas" [ngClass]="item.icon + ' module-icon'"></i>
              <span class="module-label">{{ item.label }}</span>
              <i class="fas fa-chevron-right arrow-icon" [class.rotated]="openMenus[i]"></i>
            </button>
            
            <ul class="submenu" *ngIf="openMenus[i]" [@slideDown]>
              <li *ngFor="let child of item.children">
                <a [routerLink]="child.path" class="submenu-link">
                  <i class="fas" [ngClass]="child.icon + ' submenu-icon'"></i>
                  <span>{{ child.label }}</span>
                </a>
              </li>
            </ul>
          </ng-container>
        </li>
      </ul>
    </aside>
  `,
  styles: [`
    :host {
      --sidebar-width: 250px;
    }

    .sidebar-menu-wrapper {
      width: var(--sidebar-width);
      background: linear-gradient(180deg, #1a5f4a 0%, #165442 100%);
      overflow-x: hidden;
      overflow-y: auto;
      box-shadow: 2px 0 12px rgba(0,0,0,0.15);
      height: 100vh;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .sidebar-title {
      color: #ffffff;
      font-size: 1.3rem;
      margin: 0;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .modules-menu {
      list-style: none;
      margin: 0;
      padding: 8px 0;
      flex: 1;
    }

    .module-item {
      padding: 0;
      display: block;
      margin: 0;
    }

    .module-link {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: rgba(255,255,255,0.85);
      text-decoration: none;
      width: 100%;
      border: none;
      background: transparent;
      font-size: 0.95rem;
      font-family: inherit;
      font-weight: 500;
      position: relative;
    }

    .module-link:hover {
      background: rgba(255,255,255,0.1);
      color: #ffffff;
      padding-left: 24px;
    }

    .module-link.active {
      color: #ffffff;
      background: rgba(255,255,255,0.15);
    }

    .module-icon {
      font-size: 1.1rem;
      min-width: 24px;
      text-align: center;
      color: rgba(255,255,255,0.9);
      flex-shrink: 0;
    }

    .module-label {
      flex: 1;
      color: inherit;
    }

    .arrow-icon {
      font-size: 0.7rem;
      transition: transform 0.3s ease;
      margin-left: auto;
    }

    .arrow-icon.rotated {
      transform: rotate(90deg);
    }

    /* Submenu */
    .submenu {
      list-style: none;
      margin: 0;
      padding: 0;
      background: rgba(0,0,0,0.2);
      border-left: 2px solid rgba(255,255,255,0.2);
      max-height: 400px;
      overflow: hidden;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 400px;
      }
    }

    .submenu li {
      padding: 0;
      list-style: none;
      margin: 0;
    }

    .submenu-link {
      padding: 10px 20px 10px 48px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      font-size: 0.9rem;
      border-left: 2px solid transparent;
    }

    .submenu-link:hover {
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.95);
      border-left-color: rgba(255,255,255,0.5);
      padding-left: 52px;
    }

    .submenu-icon {
      font-size: 0.85rem;
      min-width: 20px;
    }

    /* Scroll */
    .sidebar-menu-wrapper::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-menu-wrapper::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-menu-wrapper::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
    }

    .sidebar-menu-wrapper::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.3);
    }
  `]
})
export class SidebarComponent {
  openMenus: { [key: number]: boolean } = {};

  menuItems: MenuItem[] = [
    {
      label: 'Administración',
      icon: 'fa-th',
      children: [
        { label: 'Usuarios y Privilegios', icon: 'fa-users-cog', path: '/admin/usuarios' },
        { label: 'Gestión de Clientes', icon: 'fa-user-tie', path: '/admin/clientes' }
      ]
    },
    {
      label: 'Inventarios',
      icon: 'fa-cube',
      path: '/inventarios'
    },
    {
      label: 'Compras',
      icon: 'fa-shopping-cart',
      children: [
        { label: 'Control de Proveedores', icon: 'fa-building', path: '/compras' },
        { label: 'Pedidos a Proveedores', icon: 'fa-clipboard-list', path: '/compras' },
        { label: 'Registro de Compras', icon: 'fa-receipt', path: '/compras' }
      ]
    },
    {
      label: 'Venta y Facturación',
      icon: 'fa-receipt',
      path: '/ventas',
      children: [
        { label: 'Facturación', icon: 'fa-file-invoice', path: '/ventas/facturacion' },
        { label: 'Reportes de Ventas', icon: 'fa-chart-bar', path: '/ventas/reportes' },
        { label: 'Caja y Arqueo', icon: 'fa-cash-register', path: '/ventas/caja' }
      ]
    },
    {
      label: 'Contabilidad',
      icon: 'fa-book',
      path: '/contabilidad'
    }
  ];

  toggleSubmenu(index: number) {
    this.openMenus[index] = !this.openMenus[index];
  }

  constructor() {}
}
