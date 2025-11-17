import { Component } from '@angular/core';

@Component({
  selector: 'app-inventario-traspasos',
  standalone: true,
  template: `
    <div class="container-fluid">
      <h2 class="mb-3">Traspasos Entre Sucursales</h2>
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Gestión de Traspasos</h5>
        </div>
        <div class="card-body">
          <button class="btn btn-success me-2"><i class="bi bi-plus-lg"></i> Nuevo Traspaso</button>
          <button class="btn btn-info"><i class="bi bi-file-pdf"></i> Generar Reporte</button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Número</th>
                <th>De Sucursal</th>
                <th>Hacia Sucursal</th>
                <th>Fecha</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>TRA001</td>
                <td>Sucursal 1</td>
                <td>Sucursal 2</td>
                <td>2025-11-12</td>
                <td>8</td>
                <td><span class="badge bg-info">En tránsito</span></td>
                <td>
                  <button class="btn btn-sm btn-success"><i class="bi bi-check-circle"></i></button>
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
export class InventarioTraspasosComponent {}
