import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <div class="header">
      <div class="welcome-message">
        Bienvenido {{ userName }}, eres de la sucursal ({{ sucursalId }}), ({{ sucursalNombre }})
      </div>
    </div>
  `,
  styles: [`
    .header {
      padding: 10px 20px;
      background: #e3f2fd;
      color: #222;
      font-size: 1.2rem;
      font-weight: 500;
      border-bottom: 1px solid #bbb;
    }
    .welcome-message {
      margin: 0;
    }
  `]
})
export class HeaderComponent {
  userName = 'Usuario';
  sucursalId = '1';
  sucursalNombre = 'Sucursal Principal';
}
