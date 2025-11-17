import { Component } from '@angular/core';

@Component({
  selector: 'app-ventas-caja',
  standalone: true,
  template: `
    <div class="container-fluid">
      <h2 class="mb-3">Caja y Arqueo</h2>
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h6 class="card-title">Venta del Día</h6>
              <h3>5,250.00 Bs</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h6 class="card-title">Transacciones</h6>
              <h3>23</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark">
            <div class="card-body">
              <h6 class="card-title">Descuentos</h6>
              <h3>125.50 Bs</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white">
            <div class="card-body">
              <h6 class="card-title">Cambio</h6>
              <h3>350.00 Bs</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Movimientos de Caja</h5>
        </div>
        <div class="card-body">
          <button class="btn btn-primary me-2"><i class="bi bi-plus-lg"></i> Arqueo</button>
          <button class="btn btn-outline-secondary me-2" (click)="nuevaCotizacion()"><i class="bi bi-file-earmark-text"></i> Cotización</button>
          <button class="btn btn-danger"><i class="bi bi-x-circle"></i> Cerrar Caja</button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>08:30</td>
                <td><span class="badge bg-success">Entrada</span></td>
                <td>Apertura de Caja</td>
                <td>1000.00 Bs</td>
                <td>-</td>
                <td>1000.00 Bs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.container-fluid { padding: 20px; }`]
})
export class VentasCajaComponent {
  nuevaCotizacion() {
    // En esta implementación simple guardamos una cotización demo en localStorage
    const cot = {
      id: 'COT-' + Date.now(),
      fecha: new Date().toISOString(),
      total: 0,
      items: []
    };
    localStorage.setItem('ultimaCotizacion', JSON.stringify(cot));
    alert('Nueva cotización creada localmente. ID: ' + cot.id);
  }
}
