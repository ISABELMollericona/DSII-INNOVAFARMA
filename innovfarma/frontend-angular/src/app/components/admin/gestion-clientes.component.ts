import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Cliente {
  id: string;
  nit_ci: string;
  nombre_razon_social: string;
  email: string | null;
  fechaRegistro: Date;
}

@Component({
  selector: 'app-gestion-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="clientes-container">
      <div class="page-header">
        <h1>Gestión de Clientes</h1>
        <button class="btn btn-primary" (click)="openNewClienteModal()">
          <i class="fas fa-plus"></i> Nuevo Cliente
        </button>
      </div>

      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Clientes</p>
            <p class="stat-value">{{ clientes.length }}</p>
          </div>
        </div>
      </div>

      <div class="filters-container">
        <div class="search-bar">
          <input 
            type="text" 
            placeholder="Buscar por NIT/CI o nombre..."
            [(ngModel)]="searchTerm"
            class="search-input">
          <i class="fas fa-search"></i>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="table-responsive">
          <table class="clientes-table">
            <thead>
              <tr>
                <th>NIT/CI</th>
                <th>Nombre o Razón Social</th>
                <th>Email</th>
                <th>Fecha de Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cliente of filteredClientes">
                <td>
                  <strong>{{ cliente.nit_ci }}</strong>
                </td>
                <td>
                  <div class="cliente-info">
                    <div class="avatar">{{ cliente.nombre_razon_social.charAt(0) }}</div>
                    <span>{{ cliente.nombre_razon_social }}</span>
                  </div>
                </td>
                <td>{{ cliente.email || '—' }}</td>
                <td>{{ cliente.fechaRegistro | date:'dd/MM/yyyy' }}</td>
                <td>
                  <div class="actions">
                    <button class="btn-icon view" (click)="verDetalles(cliente)" title="Ver">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit" (click)="editarCliente(cliente)" title="Editar">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" (click)="eliminarCliente(cliente)" title="Eliminar">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="filteredClientes.length === 0" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No hay clientes que coincidan con la búsqueda</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Nuevo/Editar Cliente -->
    <div class="modal" *ngIf="showClienteModal" (click)="closeModal()">
      <div class="modal-content modal-simple" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ editingCliente ? 'Editar Cliente' : 'Nuevo Cliente' }}</h2>
          <button class="close-btn" (click)="closeModal()">×</button>
        </div>
        <form [formGroup]="clienteForm" (ngSubmit)="guardarCliente()">
          <div class="form-group">
            <label>NIT / CI<span class="required">*</span></label>
            <input 
              type="text" 
              formControlName="nit_ci" 
              class="form-control"
              placeholder="Ej: 12345678-K o 1234567890">
            <small *ngIf="clienteForm.get('nit_ci')?.invalid && clienteForm.get('nit_ci')?.touched" class="error-text">
              El NIT/CI es obligatorio
            </small>
          </div>

          <div class="form-group">
            <label>Nombre o Razón Social<span class="required">*</span></label>
            <input 
              type="text" 
              formControlName="nombre_razon_social" 
              class="form-control"
              placeholder="Ej: Farmacia Centro o Juan García">
            <small *ngIf="clienteForm.get('nombre_razon_social')?.invalid && clienteForm.get('nombre_razon_social')?.touched" class="error-text">
              El nombre o razón social es obligatorio
            </small>
          </div>

          <div class="form-group">
            <label>Email<span class="optional">(Opcional)</span></label>
            <input 
              type="email" 
              formControlName="email" 
              class="form-control"
              placeholder="Ej: contacto@empresa.com">
            <small *ngIf="clienteForm.get('email')?.invalid && clienteForm.get('email')?.touched" class="error-text">
              El email no es válido
            </small>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="!clienteForm.valid">Guardar Cliente</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Ver Detalles -->
    <div class="modal" *ngIf="showDetallesModal && editingCliente" (click)="closeModal()">
      <div class="modal-content modal-simple" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Detalles del Cliente</h2>
          <button class="close-btn" (click)="closeModal()">×</button>
        </div>
        <div class="detalles-container">
          <div class="detalles-item">
            <label>NIT / CI:</label>
            <p>{{ editingCliente.nit_ci }}</p>
          </div>
          <div class="detalles-item">
            <label>Nombre o Razón Social:</label>
            <p>{{ editingCliente.nombre_razon_social }}</p>
          </div>
          <div class="detalles-item">
            <label>Email:</label>
            <p>{{ editingCliente.email || 'No especificado' }}</p>
          </div>
          <div class="detalles-item">
            <label>Fecha de Registro:</label>
            <p>{{ editingCliente.fechaRegistro | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cerrar</button>
          <button class="btn btn-primary" (click)="openModalEditar()">Editar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clientes-container {
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

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: #e9ecef;
      color: #333;
    }

    .btn-secondary:hover {
      background: #dee2e6;
    }

    /* Stats */
    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a5f4a 0%, #165442 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      color: #6c757d;
      font-size: 0.85rem;
      margin: 0;
    }

    .stat-value {
      color: #1a3c34;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 4px 0 0 0;
    }

    /* Filters */
    .filters-container {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      align-items: center;
    }

    .search-bar {
      position: relative;
      flex: 1;
    }

    .search-input {
      width: 100%;
      padding: 12px 40px 12px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
      background: white;
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

    /* Content */
    .content-wrapper {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .clientes-table {
      width: 100%;
      border-collapse: collapse;
    }

    .clientes-table thead th {
      background: #f8f9fa;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #1a3c34;
      border-bottom: 2px solid #e9ecef;
    }

    .clientes-table tbody tr {
      border-bottom: 1px solid #e9ecef;
      transition: background 0.2s;
    }

    .clientes-table tbody tr:hover {
      background: #f8f9fa;
    }

    .clientes-table td {
      padding: 14px 16px;
      color: #495057;
    }

    .cliente-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cliente-info strong {
      color: #1a3c34;
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
      font-size: 0.9rem;
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

    .btn-icon.view:hover {
      background: #e3f2fd;
      color: #1565c0;
    }

    .btn-icon.edit:hover {
      background: #e3f2fd;
      color: #1565c0;
    }

    .btn-icon.delete:hover {
      background: #ffebee;
      color: #c62828;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      font-size: 1.1rem;
      margin: 0;
    }

    /* Modal */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 10px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content.modal-simple {
      max-width: 450px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
    }

    .modal-header h2 {
      margin: 0;
      color: #1a3c34;
      font-size: 1.5rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #999;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #e9ecef;
    }

    form {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #1a3c34;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .form-group label .required {
      color: #e74c3c;
      margin-left: 2px;
    }

    .form-group label .optional {
      color: #999;
      font-size: 0.85rem;
      font-weight: 400;
      margin-left: 6px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
      font-family: inherit;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #1a5f4a;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.1);
    }

    .error-text {
      display: block;
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 4px;
    }

    /* Detalles */
    .detalles-container {
      padding: 20px;
    }

    .detalles-item {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e9ecef;
    }

    .detalles-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .detalles-item label {
      display: block;
      color: #6c757d;
      font-size: 0.9rem;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .detalles-item p {
      color: #1a3c34;
      margin: 0;
      font-size: 1rem;
    }
  `]
})
export class GestionClientesComponent implements OnInit {
  searchTerm: string = '';
  showClienteModal: boolean = false;
  showDetallesModal: boolean = false;
  editingCliente: Cliente | null = null;
  clienteForm!: FormGroup;

  clientes: Cliente[] = [
    {
      id: '1',
      nit_ci: '12345678-K',
      nombre_razon_social: 'Farmacia Centro',
      email: 'info@farmaciacentro.com',
      fechaRegistro: new Date('2024-01-10')
    },
    {
      id: '2',
      nit_ci: '87654321-A',
      nombre_razon_social: 'Dr. Juan García',
      email: 'juan.garcia@clinica.com',
      fechaRegistro: new Date('2024-02-15')
    },
    {
      id: '3',
      nit_ci: '55555555-B',
      nombre_razon_social: 'Farmacia del Barrio',
      email: null,
      fechaRegistro: new Date('2024-03-20')
    },
    {
      id: '4',
      nit_ci: '99999999-Z',
      nombre_razon_social: 'Hospital Metropolitano',
      email: 'compras@hospitalmet.com',
      fechaRegistro: new Date('2024-04-05')
    }
  ];

  get filteredClientes(): Cliente[] {
    return this.clientes.filter(c =>
      c.nombre_razon_social.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.nit_ci.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.clienteForm = this.fb.group({
      nit_ci: ['', Validators.required],
      nombre_razon_social: ['', Validators.required],
      email: ['', [Validators.email]]
    });
  }

  openNewClienteModal() {
    this.editingCliente = null;
    this.clienteForm.reset({ email: null });
    this.showClienteModal = true;
    this.showDetallesModal = false;
  }

  editarCliente(cliente: Cliente) {
    this.editingCliente = cliente;
    this.clienteForm.patchValue(cliente);
    this.showClienteModal = true;
    this.showDetallesModal = false;
  }

  guardarCliente() {
    if (this.clienteForm.valid) {
      const formValue = this.clienteForm.value;
      // Convertir email vacío a null
      if (!formValue.email) {
        formValue.email = null;
      }

      if (this.editingCliente) {
        Object.assign(this.editingCliente, formValue);
      } else {
        const nuevoCliente: Cliente = {
          id: (Math.max(...this.clientes.map(c => parseInt(c.id))) + 1).toString(),
          ...formValue,
          fechaRegistro: new Date()
        };
        this.clientes.push(nuevoCliente);
      }
      this.closeModal();
    }
  }

  verDetalles(cliente: Cliente) {
    this.editingCliente = cliente;
    this.showDetallesModal = true;
    this.showClienteModal = false;
  }

  openModalEditar() {
    if (this.editingCliente) {
      this.clienteForm.patchValue(this.editingCliente);
      this.showClienteModal = true;
      this.showDetallesModal = false;
    }
  }

  eliminarCliente(cliente: Cliente) {
    if (confirm(`¿Deseas eliminar a ${cliente.nombre_razon_social}?`)) {
      this.clientes = this.clientes.filter(c => c.id !== cliente.id);
    }
  }

  closeModal() {
    this.showClienteModal = false;
    this.showDetallesModal = false;
    this.editingCliente = null;
  }
}
