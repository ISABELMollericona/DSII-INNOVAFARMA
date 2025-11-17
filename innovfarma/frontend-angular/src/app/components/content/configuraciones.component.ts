import { Component } from '@angular/core';

@Component({
  selector: 'app-configuraciones',
  standalone: true,
  template: `
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="mb-3">Configuraciones</h2>
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">Configuración General del Sistema</h5>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Nombre de la Empresa</label>
                  <input type="text" class="form-control" value="InnovFarma" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">NIT</label>
                  <input type="text" class="form-control" value="" />
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Sucursal Principal</label>
                  <select class="form-select">
                    <option>Seleccionar sucursal</option>
                    <option>Sucursal 1</option>
                    <option>Sucursal 2</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Moneda</label>
                  <select class="form-select">
                    <option>BOB (Bolivianos)</option>
                    <option>USD (Dólares)</option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div class="col-12">
                  <button class="btn btn-primary"><i class="bi bi-save"></i> Guardar Cambios</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container-fluid {
      padding: 20px;
    }
    .card {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  `]
})
export class ConfiguracionesComponent {}
