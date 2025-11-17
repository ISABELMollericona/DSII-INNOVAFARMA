import { Component } from '@angular/core';

@Component({
  selector: 'app-reportes-inventario',
  standalone: true,
  template: `
    <div class="container-fluid">
      <h2 class="mb-3">Reportes de Inventario</h2>
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Estado de Inventario</h5>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-3">
              <label class="form-label">Categoría</label>
              <select class="form-select">
                <option>Todas</option>
                <option>Medicamentos</option>
                <option>Suplementos</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Sucursal</label>
              <select class="form-select">
                <option>Todas</option>
                <option>Sucursal 1</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado Stock</label>
              <select class="form-select">
                <option>Todos</option>
                <option>Stock Bajo</option>
                <option>Agotado</option>
              </select>
            </div>
            <div class="col-md-3">
              <label>&nbsp;</label>
              <button class="btn btn-primary w-100"><i class="bi bi-download"></i> Descargar</button>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Estado</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>PROD001</td>
                <td>Ibuprofeno 400mg</td>
                <td>100</td>
                <td>50</td>
                <td><span class="badge bg-success">OK</span></td>
                <td>2,550.00 Bs</td>
              </tr>
              <tr>
                <td>PROD002</td>
                <td>Amoxicilina 500mg</td>
                <td>15</td>
                <td>30</td>
                <td><span class="badge bg-warning">Bajo</span></td>
                <td>525.00 Bs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.container-fluid { padding: 20px; }`]
})
export class ReportesInventarioComponent {}
