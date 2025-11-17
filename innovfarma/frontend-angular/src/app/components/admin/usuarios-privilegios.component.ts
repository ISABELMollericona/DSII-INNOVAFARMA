import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  usuario: string;
  rol: string;
  estado: 'activo' | 'inactivo';
  permisos: string[];
  fechaCreacion: Date;
}

interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: string[];
}

const PERMISOS_DISPONIBLES = [
  // Permisos de Ventas
  { id: 'registrar_venta', nombre: 'Registrar Venta de Productos' },
  { id: 'cobro_cambio', nombre: 'Registrar Cobro y Cambio' },
  { id: 'facturacion_automatica', nombre: 'Generar Comprobantes/Facturas' },
  { id: 'gestionar_clientes_ventas', nombre: 'Gestionar Clientes' },
  
  // Permisos de Inventario
  { id: 'registrar_productos', nombre: 'Registro de Nuevos Productos' },
  { id: 'pedidos_proveedores', nombre: 'Crear Pedidos a Proveedores' },
  { id: 'control_lotes_caducidad', nombre: 'Control de Lotes y Caducidad' },
  { id: 'informes_inventario', nombre: 'Informes de Inventario' },
  
  // Permisos de Compras
  { id: 'registrar_proveedores', nombre: 'Registro de Proveedores' },
  { id: 'registrar_compras', nombre: 'Registro de Compras' },
  { id: 'cuentas_por_pagar', nombre: 'Gestionar Cuentas por Pagar' },
  { id: 'informes_compras', nombre: 'Informes de Compras' },
  
  // Permisos de Administración
  { id: 'informes_ventas', nombre: 'Informes de Ventas' },
  { id: 'crear_usuario', nombre: 'Crear Usuarios' },
  { id: 'editar_usuario', nombre: 'Editar Usuarios' },
  { id: 'eliminar_usuario', nombre: 'Eliminar Usuarios' },
  { id: 'ver_finanzas', nombre: 'Ver Finanzas' },
  { id: 'exportar_datos', nombre: 'Exportar Datos' }
];

@Component({
  selector: 'app-usuarios-privilegios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="usuarios-container">
      <div class="page-header">
        <h1>Usuarios y Privilegios</h1>
        <button class="btn btn-primary" (click)="openNewUserModal()">
          <i class="fas fa-plus"></i> Nuevo Usuario
        </button>
      </div>

      <div class="content-wrapper">
        <!-- Tabs -->
        <div class="tabs-container">
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              [class.active]="activeTab === 'usuarios'"
              (click)="activeTab = 'usuarios'">
              <i class="fas fa-users"></i> Usuarios
            </button>
            <button 
              class="tab-btn" 
              [class.active]="activeTab === 'roles'"
              (click)="activeTab = 'roles'">
              <i class="fas fa-shield-alt"></i> Roles y Permisos
            </button>
          </div>
        </div>

        <!-- Tab: Usuarios -->
        <div class="tab-content" *ngIf="activeTab === 'usuarios'">
          <div class="search-bar">
            <input 
              type="text" 
              placeholder="Buscar usuario..."
              [(ngModel)]="searchTerm"
              class="search-input">
            <i class="fas fa-search"></i>
          </div>

          <div class="table-responsive">
            <table class="usuarios-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let usuario of filteredUsuarios" [class.inactive]="usuario.estado === 'inactivo'">
                  <td>
                    <div class="user-info">
                      <div class="avatar">{{ usuario.nombre.charAt(0) }}</div>
                      <span>{{ usuario.nombre }}</span>
                    </div>
                  </td>
                  <td>{{ usuario.email }}</td>
                  <td>
                    <span class="badge badge-role">{{ usuario.rol }}</span>
                  </td>
                  <td>
                    <span class="status-badge" [class.active]="usuario.estado === 'activo'">
                      {{ usuario.estado }}
                    </span>
                  </td>
                  <td>{{ usuario.fechaCreacion | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <div class="actions">
                      <button class="btn-icon edit" (click)="editarUsuario(usuario)" title="Editar">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-icon delete" (click)="eliminarUsuario(usuario)" title="Eliminar">
                        <i class="fas fa-trash"></i>
                      </button>
                      <button class="btn-icon permissions" (click)="editarPermisos(usuario)" title="Permisos">
                        <i class="fas fa-lock"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab: Roles y Permisos -->
        <div class="tab-content" *ngIf="activeTab === 'roles'">
          <div class="roles-section">
            <h3>Roles Disponibles</h3>
            <p class="roles-info">El sistema cuenta con 2 roles predefinidos que no pueden ser modificados:</p>
            <div class="roles-grid">
              <div class="role-card" *ngFor="let rol of roles">
                <div class="role-header">
                  <h4>{{ rol.nombre }}</h4>
                </div>
                <p class="role-description">{{ rol.descripcion }}</p>
                <div class="permisos-list">
                  <span class="permiso-badge" *ngFor="let permiso of rol.permisos">
                    {{ getPermisoNombre(permiso) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Nuevo/Editar Usuario -->
    <div class="modal" *ngIf="showUsuarioModal" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
          <button class="close-btn" (click)="closeModal()">×</button>
        </div>
        <form [formGroup]="usuarioForm" (ngSubmit)="guardarUsuario()">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" formControlName="nombre" class="form-control">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" formControlName="email" class="form-control">
          </div>
          <div class="form-group">
            <label>Usuario</label>
            <input type="text" formControlName="usuario" class="form-control">
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" formControlName="password" class="form-control" 
                   [required]="!editingUsuario">
          </div>
          <div class="form-group">
            <label>Rol</label>
            <select formControlName="rol" class="form-control">
              <option value="">Seleccionar rol</option>
              <option *ngFor="let rol of roles" [value]="rol.nombre">{{ rol.nombre }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select formControlName="estado" class="form-control">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Editar Permisos -->
    <div class="modal" *ngIf="showPermisosModal" (click)="closeModal()">
      <div class="modal-content modal-large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Permisos de {{ editingUsuario?.nombre }}</h2>
          <button class="close-btn" (click)="closeModal()">×</button>
        </div>
        <div class="permisos-container">
          <div class="permisos-section">
            <h4>📊 Módulo de Ventas</h4>
            <div class="permisos-group">
              <div class="permiso-item" *ngFor="let permiso of PERMISOS_DISPONIBLES.slice(0, 4)">
                <input 
                  type="checkbox" 
                  [id]="'permiso-' + permiso.id"
                  [checked]="isPermisoSelected(permiso.id)"
                  (change)="togglePermiso(permiso.id)">
                <label [for]="'permiso-' + permiso.id">{{ permiso.nombre }}</label>
              </div>
            </div>
          </div>

          <div class="permisos-section">
            <h4>📦 Módulo de Inventarios</h4>
            <div class="permisos-group">
              <div class="permiso-item" *ngFor="let permiso of PERMISOS_DISPONIBLES.slice(4, 8)">
                <input 
                  type="checkbox" 
                  [id]="'permiso-' + permiso.id"
                  [checked]="isPermisoSelected(permiso.id)"
                  (change)="togglePermiso(permiso.id)">
                <label [for]="'permiso-' + permiso.id">{{ permiso.nombre }}</label>
              </div>
            </div>
          </div>

          <div class="permisos-section">
            <h4>🛒 Módulo de Compras</h4>
            <div class="permisos-group">
              <div class="permiso-item" *ngFor="let permiso of PERMISOS_DISPONIBLES.slice(8, 12)">
                <input 
                  type="checkbox" 
                  [id]="'permiso-' + permiso.id"
                  [checked]="isPermisoSelected(permiso.id)"
                  (change)="togglePermiso(permiso.id)">
                <label [for]="'permiso-' + permiso.id">{{ permiso.nombre }}</label>
              </div>
            </div>
          </div>

          <div class="permisos-section">
            <h4>⚙️ Administración</h4>
            <div class="permisos-group">
              <div class="permiso-item" *ngFor="let permiso of PERMISOS_DISPONIBLES.slice(12)">
                <input 
                  type="checkbox" 
                  [id]="'permiso-' + permiso.id"
                  [checked]="isPermisoSelected(permiso.id)"
                  (change)="togglePermiso(permiso.id)">
                <label [for]="'permiso-' + permiso.id">{{ permiso.nombre }}</label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="guardarPermisos()">Guardar Permisos</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .usuarios-container {
      padding: 20px;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .page-header h1 {
      font-size: 2rem;
      color: #1a3c34;
      margin: 0;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #1a5f4a 0%, #165442 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(26, 95, 74, 0.3);
    }

    .btn-secondary {
      background: #e9ecef;
      color: #333;
    }

    .btn-secondary:hover {
      background: #dee2e6;
    }

    .content-wrapper {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    /* Tabs */
    .tabs-container {
      border-bottom: 1px solid #e9ecef;
    }

    .tab-buttons {
      display: flex;
      padding: 0;
      margin: 0;
    }

    .tab-btn {
      flex: 1;
      padding: 16px 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.95rem;
      color: #6c757d;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .tab-btn:hover {
      background: #f8f9fa;
      color: #1a5f4a;
    }

    .tab-btn.active {
      color: #1a5f4a;
      border-bottom-color: #1a5f4a;
      background: #f0f7f5;
    }

    .tab-content {
      padding: 20px;
    }

    /* Search Bar */
    .search-bar {
      position: relative;
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      padding: 12px 40px 12px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #1a5f4a;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.1);
    }

    .search-bar i {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
    }

    /* Table */
    .table-responsive {
      overflow-x: auto;
    }

    .usuarios-table {
      width: 100%;
      border-collapse: collapse;
    }

    .usuarios-table thead th {
      background: #f8f9fa;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #1a3c34;
      border-bottom: 2px solid #e9ecef;
    }

    .usuarios-table tbody tr {
      border-bottom: 1px solid #e9ecef;
      transition: background 0.2s;
    }

    .usuarios-table tbody tr:hover {
      background: #f8f9fa;
    }

    .usuarios-table tbody tr.inactive {
      opacity: 0.6;
    }

    .usuarios-table td {
      padding: 14px 16px;
      color: #495057;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a5f4a 0%, #165442 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge-role {
      background: #e3f2fd;
      color: #1565c0;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      background: #ffebee;
      color: #c62828;
    }

    .status-badge.active {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      border: none;
      background: #f0f0f0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #e0e0e0;
    }

    .btn-icon.edit:hover {
      background: #e3f2fd;
      color: #1565c0;
    }

    .btn-icon.delete:hover {
      background: #ffebee;
      color: #c62828;
    }

    .btn-icon.permissions:hover {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .roles-section {
      padding: 20px;
    }

    .roles-section h3 {
      color: #1a3c34;
      margin-bottom: 10px;
    }

    .roles-info {
      color: #6c757d;
      font-size: 0.95rem;
      margin-bottom: 20px;
      padding: 12px;
      background: #f0f7f5;
      border-radius: 6px;
      border-left: 3px solid #1a5f4a;
    }

    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .role-card {
      border: 1px solid #e9ecef;
      border-radius: 10px;
      padding: 16px;
      transition: all 0.3s ease;
      background: white;
    }

    .role-card:hover {
      border-color: #1a5f4a;
      box-shadow: 0 4px 12px rgba(26, 95, 74, 0.1);
    }

    .role-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .role-header h4 {
      margin: 0;
      color: #1a3c34;
      font-size: 1.1rem;
    }

    .role-actions {
      display: flex;
      gap: 8px;
    }

    .role-description {
      color: #6c757d;
      font-size: 0.9rem;
      margin: 8px 0 12px 0;
      line-height: 1.5;
    }

    .permisos-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .permiso-badge {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    /* Permisos Container */
    .permisos-container {
      padding: 20px;
      max-height: 600px;
      overflow-y: auto;
    }

    .permisos-section {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e9ecef;
    }

    .permisos-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .permisos-section h4 {
      color: #1a3c34;
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #1a5f4a;
    }

    .permisos-group {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
    }

    .permiso-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .permiso-item:hover {
      background: #f8f9fa;
    }

    .permiso-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #1a5f4a;
    }

    .permiso-item label {
      cursor: pointer;
      margin: 0;
      flex: 1;
      font-size: 0.95rem;
      color: #495057;
    }
  `]
})
export class UsuariosPrivilegiosComponent implements OnInit {
  activeTab: 'usuarios' | 'roles' = 'usuarios';
  searchTerm: string = '';
  showUsuarioModal: boolean = false;
  showPermisosModal: boolean = false;
  editingUsuario: Usuario | null = null;
  usuarioForm!: FormGroup;
  permisosTemporal: string[] = [];
  PERMISOS_DISPONIBLES = PERMISOS_DISPONIBLES;

  usuarios: Usuario[] = [
    {
      id: '1',
      nombre: 'Admin Sistema',
      email: 'admin@innovfarma.com',
      usuario: 'admin',
      rol: 'Administrador',
      estado: 'activo',
      permisos: [
        'registrar_venta', 'cobro_cambio', 'facturacion_automatica', 'gestionar_clientes_ventas',
        'registrar_productos', 'pedidos_proveedores', 'control_lotes_caducidad', 'informes_inventario',
        'registrar_proveedores', 'registrar_compras', 'cuentas_por_pagar', 'informes_compras',
        'informes_ventas', 'crear_usuario', 'editar_usuario', 'eliminar_usuario', 'ver_finanzas', 'exportar_datos'
      ],
      fechaCreacion: new Date('2024-01-01')
    },
    {
      id: '2',
      nombre: 'María López',
      email: 'maria@innovfarma.com',
      usuario: 'mlopez',
      rol: 'Vendedor',
      estado: 'activo',
      permisos: ['registrar_venta', 'cobro_cambio', 'facturacion_automatica', 'gestionar_clientes_ventas'],
      fechaCreacion: new Date('2024-02-20')
    },
    {
      id: '3',
      nombre: 'Carlos Mendoza',
      email: 'carlos@innovfarma.com',
      usuario: 'cmendoza',
      rol: 'Vendedor',
      estado: 'activo',
      permisos: ['registrar_venta', 'cobro_cambio', 'facturacion_automatica', 'gestionar_clientes_ventas'],
      fechaCreacion: new Date('2024-03-10')
    }
  ];

  roles: Rol[] = [
    {
      id: '1',
      nombre: 'Administrador',
      descripcion: 'Acceso completo a todos los módulos: Ventas, Inventarios, Compras y Administración',
      permisos: [
        'registrar_venta', 'cobro_cambio', 'facturacion_automatica', 'gestionar_clientes_ventas',
        'registrar_productos', 'pedidos_proveedores', 'control_lotes_caducidad', 'informes_inventario',
        'registrar_proveedores', 'registrar_compras', 'cuentas_por_pagar', 'informes_compras',
        'informes_ventas', 'crear_usuario', 'editar_usuario', 'eliminar_usuario', 'ver_finanzas', 'exportar_datos'
      ]
    },
    {
      id: '2',
      nombre: 'Vendedor',
      descripcion: 'Módulo de Ventas: Registro de ventas, cobranza, facturación y gestión de clientes',
      permisos: ['registrar_venta', 'cobro_cambio', 'facturacion_automatica', 'gestionar_clientes_ventas']
    }
  ];

  get filteredUsuarios(): Usuario[] {
    return this.usuarios.filter(u => 
      u.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      u.usuario.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      usuario: ['', Validators.required],
      password: ['', Validators.required],
      rol: ['', Validators.required],
      estado: ['activo']
    });
  }

  openNewUserModal() {
    this.editingUsuario = null;
    this.usuarioForm.reset({ estado: 'activo' });
    this.showUsuarioModal = true;
  }

  editarUsuario(usuario: Usuario) {
    this.editingUsuario = usuario;
    this.usuarioForm.patchValue(usuario);
    this.usuarioForm.get('password')?.clearAsyncValidators();
    this.showUsuarioModal = true;
  }

  guardarUsuario() {
    if (this.usuarioForm.valid) {
      if (this.editingUsuario) {
        Object.assign(this.editingUsuario, this.usuarioForm.value);
      } else {
        const nuevoUsuario: Usuario = {
          id: (Math.max(...this.usuarios.map(u => parseInt(u.id))) + 1).toString(),
          ...this.usuarioForm.value,
          permisos: [],
          fechaCreacion: new Date()
        };
        this.usuarios.push(nuevoUsuario);
      }
      this.closeModal();
    }
  }

  eliminarUsuario(usuario: Usuario) {
    if (confirm(`¿Deseas eliminar a ${usuario.nombre}?`)) {
      this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
    }
  }

  editarPermisos(usuario: Usuario) {
    this.editingUsuario = usuario;
    this.permisosTemporal = [...usuario.permisos];
    this.showPermisosModal = true;
  }

  isPermisoSelected(permisoId: string): boolean {
    return this.permisosTemporal.includes(permisoId);
  }

  togglePermiso(permisoId: string) {
    const index = this.permisosTemporal.indexOf(permisoId);
    if (index > -1) {
      this.permisosTemporal.splice(index, 1);
    } else {
      this.permisosTemporal.push(permisoId);
    }
  }

  guardarPermisos() {
    if (this.editingUsuario) {
      this.editingUsuario.permisos = [...this.permisosTemporal];
    }
    this.closeModal();
  }

  getPermisoNombre(permisoId: string): string {
    const permiso = PERMISOS_DISPONIBLES.find(p => p.id === permisoId);
    return permiso ? permiso.nombre : permisoId;
  }

  closeModal() {
    this.showUsuarioModal = false;
    this.showPermisosModal = false;
    this.editingUsuario = null;
  }
}
