import { Component } from '@angular/core';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  template: `
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="mb-3">Usuarios y Roles</h2>
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">Gestión de Usuarios</h5>
            </div>
            <div class="card-body">
              <button class="btn btn-success me-2"><i class="bi bi-plus-lg"></i> Nuevo Usuario</button>
              <button class="btn btn-warning"><i class="bi bi-pencil"></i> Editar</button>
            </div>
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>Admin</td>
                    <td>admin@innovfarma.com</td>
                    <td><span class="badge bg-success">Administrador</span></td>
                    <td><span class="badge bg-success">Activo</span></td>
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
export class UsuariosComponent {}
