import { Component } from '@angular/core';

@Component({
  selector: 'app-inventario-ingresos',
  standalone: true,
  template: `
    <div class="container-fluid">
      <h2 class="mb-3">Ingresos de Inventario</h2>
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Movimientos de Entrada</h5>
        </div>
        <div class="card-body">
          <button class="btn btn-success me-2"><i class="bi bi-plus-lg"></i> Nuevo Ingreso</button>
          <button class="btn btn-warning"><i class="bi bi-pencil"></i> Ajustes</button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Costo Unit.</th>
                <th>Total</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2025-11-12</td>
                <td>Compra a Proveedor</td>
                <td>Ibuprofeno 400mg</td>
                <td>50</td>
                <td>18.00 Bs</td>
                <td>900.00 Bs</td>
                <td>Admin</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.container-fluid { padding: 20px; }`]
})
export class InventarioIngresosComponent {}
