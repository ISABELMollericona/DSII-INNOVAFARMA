import { Component } from '@angular/core';

@Component({
  selector: 'app-finanzas',
  standalone: true,
  template: `
    <div class="container-fluid">
      <h2 class="mb-3">Finanzas</h2>
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h6 class="card-title">Ingresos Totales</h6>
              <h3>42,500.00 Bs</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white">
            <div class="card-body">
              <h6 class="card-title">Gastos</h6>
              <h3>12,300.00 Bs</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h6 class="card-title">Ganancias Netas</h6>
              <h3>30,200.00 Bs</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark">
            <div class="card-body">
              <h6 class="card-title">Por Cobrar</h6>
              <h3>8,750.00 Bs</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Resumen Financiero</h5>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-3">
              <label class="form-label">Período</label>
              <select class="form-select">
                <option>Este mes</option>
                <option>Trimestral</option>
                <option>Anual</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Sucursal</label>
              <select class="form-select">
                <option>Todas</option>
                <option>Sucursal 1</option>
              </select>
            </div>
            <div class="col-md-6">
              <label>&nbsp;</label>
              <button class="btn btn-primary w-100"><i class="bi bi-download"></i> Descargar Reporte</button>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Concepto</th>
                <th>Monto Bs</th>
                <th>Monto USD</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ventas de Medicamentos</td>
                <td>38,000.00 Bs</td>
                <td>5,500 USD</td>
                <td>89%</td>
              </tr>
              <tr>
                <td>Ventas de Suplementos</td>
                <td>4,500.00 Bs</td>
                <td>650 USD</td>
                <td>11%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.container-fluid { padding: 20px; }`]
})
export class FinanzasComponent {}
