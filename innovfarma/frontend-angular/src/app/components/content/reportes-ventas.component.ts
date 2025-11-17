import { Component } from '@angular/core';

@Component({
  selector: 'app-reportes-ventas',
  standalone: true,
  template: `
    <div class="container-fluid">
      <h2 class="mb-3">Reportes de Ventas</h2>
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Filtros de Reporte</h5>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-3">
              <label class="form-label">Fecha Inicio</label>
              <input type="date" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha Fin</label>
              <input type="date" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Sucursal</label>
              <select class="form-select">
                <option>Todas</option>
                <option>Sucursal 1</option>
                <option>Sucursal 2</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">&nbsp;</label>
              <button class="btn btn-primary w-100"><i class="bi bi-search"></i> Generar</button>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Factura</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Subtotal</th>
                <th>Descuento</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2025-11-12</td>
                <td>FAC001</td>
                <td>Cliente A</td>
                <td>5</td>
                <td>1000.00 Bs</td>
                <td>50.00 Bs</td>
                <td>950.00 Bs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.container-fluid { padding: 20px; }`]
})
export class ReportesVentasComponent {}
