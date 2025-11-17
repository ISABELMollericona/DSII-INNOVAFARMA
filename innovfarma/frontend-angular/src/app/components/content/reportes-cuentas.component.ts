import { Component } from '@angular/core';

@Component({
  selector: 'app-reportes-cuentas',
  standalone: true,
  template: `
    <div class="container-fluid">
      <h2 class="mb-3">Cuentas por Cobrar</h2>
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Deudas Pendientes</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="Buscar cliente..." />
            </div>
            <div class="col-md-3">
              <select class="form-select">
                <option>Todos los estados</option>
                <option>Vencido</option>
                <option>Próximo a vencer</option>
              </select>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Cliente</th>
                <th>Factura</th>
                <th>Monto</th>
                <th>Días Atraso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cliente B</td>
                <td>FAC002</td>
                <td>500.00 Bs</td>
                <td>15 días</td>
                <td><span class="badge bg-danger">Vencido</span></td>
                <td>
                  <button class="btn btn-sm btn-info"><i class="bi bi-envelope"></i></button>
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
export class ReportesCuentasComponent {}
