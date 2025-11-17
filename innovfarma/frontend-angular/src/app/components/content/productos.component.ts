import { Component } from '@angular/core';

@Component({
  selector: 'app-productos',
  standalone: true,
  template: `
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="mb-3">Productos</h2>
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">Catálogo de Productos</h5>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-4">
                  <input type="text" class="form-control" placeholder="Buscar producto..." />
                </div>
                <div class="col-md-4">
                  <select class="form-select">
                    <option>Todas las categorías</option>
                    <option>Medicamentos</option>
                    <option>Suplementos</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <button class="btn btn-success w-100"><i class="bi bi-plus-lg"></i> Nuevo Producto</button>
                </div>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Código</th>
                    <th>Nombre Comercial</th>
                    <th>Laboratorio</th>
                    <th>Precio Venta</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>PROD001</td>
                    <td>Ibuprofeno 400mg</td>
                    <td>Laboratorio X</td>
                    <td>25.50 Bs</td>
                    <td><span class="badge bg-success">100 u.</span></td>
                    <td>
                      <button class="btn btn-sm btn-info"><i class="bi bi-pencil"></i></button>
                      <button class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
export class ProductosComponent {}
