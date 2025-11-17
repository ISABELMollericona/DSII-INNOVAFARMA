import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="app-header">
      <h1>Innovfarma</h1>
      <nav>
        <a routerLink="/">Inicio</a> | <a routerLink="/productos">Productos</a> | <a routerLink="/login">Login</a>
      </nav>
    </header>
  `
})
export class HeaderComponent {}
