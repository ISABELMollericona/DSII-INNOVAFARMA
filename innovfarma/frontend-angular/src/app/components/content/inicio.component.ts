import { Component } from '@angular/core';

@Component({
  selector: 'app-inicio',
  standalone: true,
  template: `
    <div class="inicio-container">
      <h1>Inicio</h1>
      <p>Bienvenido al Sistema de Facturación InnovFarma</p>
      <div class="dashboard-grid">
        <div class="card">
          <h3>Ventas del día</h3>
          <p class="number">$0.00</p>
        </div>
        <div class="card">
          <h3>Productos</h3>
          <p class="number">0</p>
        </div>
        <div class="card">
          <h3>Pendientes</h3>
          <p class="number">0</p>
        </div>
        <div class="card">
          <h3>Usuarios activos</h3>
          <p class="number">0</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inicio-container {
      padding: 20px;
    }

    h1 {
      color: #333;
      margin-bottom: 10px;
    }

    p {
      color: #666;
      margin-bottom: 20px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .card h3 {
      color: #007bff;
      margin: 0 0 10px 0;
      font-size: 1rem;
    }

    .card .number {
      font-size: 2rem;
      color: #333;
      font-weight: bold;
      margin: 0;
    }
  `]
})
export class InicioComponent {}
