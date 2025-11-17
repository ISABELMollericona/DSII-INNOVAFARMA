import { Component } from '@angular/core';

@Component({
  selector: 'app-compras-pedidos',
  standalone: true,
  template: `
    <div class="container-fluid">
      <h2 class="mb-3">Pedidos de Compra</h2>
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Gestión de Pedidos</h5>
        </div>
        <div class="card-body">
          <button class="btn btn-success me-2"><i class="bi bi-plus-lg"></i> Nuevo Pedido</button>
          <button class="btn btn-info"><i class="bi bi-file-pdf"></i> Generar Reporte</button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Número</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Monto Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>PED001</td>
                <td>Proveedor A</td>
                <td>2025-11-12</td>
                <td>5000.00 Bs</td>
                <td><span class="badge bg-warning">Pendiente</span></td>
                <td>
                  <button class="btn btn-sm btn-info"><i class="bi bi-eye"></i></button>
                  <button class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.container-fluid { padding: 20px; }`]
})
export class ComprasPedidosComponent {}
