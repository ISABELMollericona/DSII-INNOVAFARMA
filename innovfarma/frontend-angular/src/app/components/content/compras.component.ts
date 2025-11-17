import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  existencia: number;
  precio: number;
  total: number;
}

interface ListitaItem {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="compras-container">
      <!-- HEADER -->
      <div class="page-header">
        <h1>📦 Pedidos a Proveedores</h1>
        <div class="header-actions">
          <input 
            type="text" 
            placeholder="Buscar producto..."
            [(ngModel)]="searchProducto"
            class="search-input">
          <button class="btn btn-primary">
            <i class="fas fa-plus"></i> Nuevo Pedido
          </button>
        </div>
      </div>

      <!-- PANEL SUPERIOR: Tabla de Productos/Inventario -->
      <div class="panel-superior">
        <div class="panel-titulo">
          <h3>Inventario Disponible</h3>
          <div class="info-badge">{{ filteredProductos.length }} productos</div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%">Sel</th>
                <th style="width: 40%">Nombre Comercial</th>
                <th style="width: 15%">Marca</th>
                <th style="width: 10%">Existencia</th>
                <th style="width: 10%">Precio Unit</th>
                <th style="width: 15%">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                *ngFor="let prod of filteredProductos"
                (dblclick)="agregarProducto(prod)"
                class="product-row">
                <td>
                  <input type="checkbox" (change)="toggleSelectProducto(prod)">
                </td>
                <td><strong>{{ prod.nombre }}</strong></td>
                <td>{{ prod.marca }}</td>
                <td class="text-center">{{ prod.existencia }}</td>
                <td class="text-right">{{ prod.precio | number:'1.2-2' }}</td>
                <td class="text-right">{{ prod.total | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="filteredProductos.length === 0" class="empty-state">
            No hay productos disponibles
          </div>
        </div>
      </div>

      <!-- PANEL INFERIOR: Pedido Actual -->
      <div class="panel-inferior">
        <div class="panel-header">
          <div class="left-section">
            <h3>Pedido: {{ pedidoActual.numero }}</h3>
            <div class="proveedor-badge">Proveedor</div>
          </div>
          <div class="right-section">
            <button class="btn-icon-action delete-icon" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn-icon-action more-icon" title="Más opciones">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>

        <div class="pedido-content">
          <!-- Tabla de productos agregados -->
          <div class="listita-section">
            <div class="listita-header">
              <h4>Productos del Pedido</h4>
              <div class="listita-stats">
                Cantidad: <strong>{{ calcularCantidadTotal() }}</strong> | 
                Sus: <strong>S/. {{ calcularTotal() | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="table-wrapper-small">
              <table class="listita-table">
                <thead>
                  <tr>
                    <th style="width: 40%">Nombre Comercial</th>
                    <th style="width: 15%">Marca</th>
                    <th style="width: 12%">Cantidad Total</th>
                    <th style="width: 12%">Precio Unit</th>
                    <th style="width: 12%">Existencia Total</th>
                    <th style="width: 9%">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of listitaProductos; let i = index" class="listita-row">
                    <td>{{ item.producto.nombre }}</td>
                    <td>{{ item.producto.marca }}</td>
                    <td>
                      <input 
                        type="number" 
                        [(ngModel)]="item.cantidad" 
                        min="1"
                        class="qty-small">
                    </td>
                    <td>{{ item.producto.precio | number:'1.2-2' }}</td>
                    <td>{{ (item.cantidad * item.producto.precio) | number:'1.2-2' }}</td>
                    <td>
                      <button (click)="removerProducto(i)" class="btn-remove-item">✕</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="listitaProductos.length === 0" class="empty-listita">
              Doble clic en un producto para agregarlo
            </div>
          </div>

          <!-- Resumen y acciones -->
          <div class="pedido-footer">
            <div class="total-section">
              <div class="total-item">
                <label>Total:</label>
                <span class="total-value">S/. {{ calcularTotal() | number:'1.2-2' }}</span>
              </div>
              <div class="total-item">
                <label>Importe:</label>
                <span class="total-value">S/. {{ calcularTotal() | number:'1.2-2' }}</span>
              </div>
              <div class="total-item discount">
                <label>Descuento</label>
                <span class="text-danger">0.00</span>
              </div>
            </div>

            <div class="action-buttons">
              <button class="btn btn-secondary">
                <i class="fas fa-print"></i> Imprimir
              </button>
              <button class="btn btn-primary">
                <i class="fas fa-save"></i> Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .compras-container {
      padding: 0;
      background: #f5f7fa;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* HEADER */
    .page-header {
      background: white;
      padding: 20px 30px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #1a3c34;
    }

    .header-actions {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .search-input {
      padding: 10px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      width: 250px;
      font-size: 0.95rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #1a5f4a;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.1);
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

    /* PANELS */
    .panel-superior {
      flex: 1;
      background: white;
      margin: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-titulo {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .panel-titulo h3 {
      margin: 0;
      font-size: 1rem;
      color: #1a3c34;
    }

    .info-badge {
      background: #e8f5e9;
      color: #1a5f4a;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .table-wrapper {
      flex: 1;
      overflow: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .data-table thead th {
      background: #f8f9fa;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #1a3c34;
      border-bottom: 2px solid #e9ecef;
      position: sticky;
      top: 0;
    }

    .data-table tbody tr {
      border-bottom: 1px solid #e9ecef;
      transition: background 0.2s;
    }

    .data-table tbody tr:hover {
      background: #f8f9fa;
    }

    .product-row {
      cursor: pointer;
    }

    .product-row:hover {
      background: #f0f8f5 !important;
    }

    .data-table td {
      padding: 10px 12px;
      color: #495057;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
      font-weight: 600;
      color: #1a5f4a;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #999;
    }

    /* PANEL INFERIOR */
    .panel-inferior {
      background: white;
      margin: 0 15px 15px 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      max-height: 350px;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .left-section {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .left-section h3 {
      margin: 0;
      font-size: 1rem;
      color: #1a3c34;
    }

    .proveedor-badge {
      background: #2196f3;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .right-section {
      display: flex;
      gap: 10px;
    }

    .btn-icon-action {
      width: 36px;
      height: 36px;
      border: none;
      background: #f0f0f0;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      color: #666;
    }

    .btn-icon-action:hover {
      background: #e0e0e0;
    }

    .delete-icon:hover {
      background: #ffebee;
      color: #c62828;
    }

    .pedido-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .listita-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 12px;
    }

    .listita-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding: 0 8px;
    }

    .listita-header h4 {
      margin: 0;
      font-size: 0.95rem;
      color: #333;
    }

    .listita-stats {
      font-size: 0.85rem;
      color: #666;
    }

    .table-wrapper-small {
      flex: 1;
      overflow: auto;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: #fafafa;
    }

    .listita-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .listita-table thead th {
      background: white;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      color: #1a3c34;
      border-bottom: 2px solid #e0e0e0;
      position: sticky;
      top: 0;
    }

    .listita-table td {
      padding: 8px 10px;
      color: #495057;
      border-bottom: 1px solid #e0e0e0;
    }

    .listita-row:hover {
      background: #f0f8f5;
    }

    .qty-small {
      width: 60px;
      padding: 4px 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
      font-size: 0.85rem;
    }

    .qty-small:focus {
      outline: none;
      border-color: #1a5f4a;
      box-shadow: 0 0 0 2px rgba(26, 95, 74, 0.1);
    }

    .btn-remove-item {
      background: #ffebee;
      border: none;
      color: #c62828;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-remove-item:hover {
      background: #ffcdd2;
    }

    .empty-listita {
      text-align: center;
      color: #999;
      padding: 20px;
      font-size: 0.9rem;
    }

    .pedido-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
      gap: 20px;
    }

    .total-section {
      display: flex;
      gap: 30px;
      flex: 1;
    }

    .total-item {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .total-item label {
      font-weight: 600;
      color: #666;
      font-size: 0.9rem;
    }

    .total-value {
      font-weight: 700;
      color: #1a5f4a;
      font-size: 1rem;
    }

    .total-item.discount {
      margin-left: auto;
    }

    .text-danger {
      color: #e74c3c;
      font-weight: 700;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
    }

    .action-buttons .btn {
      padding: 8px 16px;
      font-size: 0.9rem;
    }
  `]
})
export class ComprasComponent implements OnInit {
  searchProducto: string = '';
  
  productos: Producto[] = [
    { id: '1', nombre: 'SEDATIVOL ULTRA CAJA X 30 COMPRIMIDOS', marca: 'HAHNE...', existencia: 0.00, precio: 93.00, total: 0.00 },
    { id: '2', nombre: 'CLOTRIMAZOL CAJA X 100 ÓVULOS', marca: 'LAF AB', existencia: 0.00, precio: 332, total: 66.00 },
    { id: '3', nombre: 'DEMOTIL CAJA X 3 AMPOLLAS', marca: 'INTI ETI...', existencia: 0.00, precio: 9.00, total: 0.00 },
    { id: '4', nombre: 'TEGADERM FILM 3M 10 X 25 CM', marca: 'INSUM...', existencia: 0.00, precio: 0.00, total: 0.00 },
    { id: '5', nombre: 'TEGADERM FILM 3M 10 X 12 CM', marca: 'INSUM...', existencia: 0.00, precio: 0.00, total: 0.00 },
    { id: '6', nombre: 'TEGADERM I.V. ADVANCED 3M 6.25 X 7CM', marca: 'INSUM...', existencia: 0.00, precio: 0.00, total: 0.00 },
    { id: '7', nombre: 'CLORURO DE MAGNESIO FCO X 33 G', marca: 'SOLQUI...', existencia: 9.00, precio: 48.00, total: 0.00 },
    { id: '8', nombre: 'VASELINA SOLIDA BLANCA FRASCO X 200 G', marca: 'SOLQUI...', existencia: 0.00, precio: 19.00, total: 0.00 },
    { id: '9', nombre: 'COLAGENO HIDROLIZADO SQF NEUTRO FCO X 300 GR.', marca: 'SOLQUI...', existencia: 0.00, precio: 6.00, total: 1.00 },
    { id: '10', nombre: 'COLAGENO HIDROLIZADO SQF NARANJA FCO X 300 GR.', marca: 'SOLQUI...', existencia: 0.00, precio: 4.00, total: 0.00 },
  ];

  listitaProductos: ListitaItem[] = [];

  pedidoActual = {
    numero: 0
  };

  get filteredProductos() {
    return this.productos.filter(p =>
      p.nombre.toLowerCase().includes(this.searchProducto.toLowerCase()) ||
      p.marca.toLowerCase().includes(this.searchProducto.toLowerCase())
    );
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
  }

  agregarProducto(producto: Producto) {
    const existente = this.listitaProductos.find(item => item.producto.id === producto.id);
    if (existente) {
      existente.cantidad++;
    } else {
      this.listitaProductos.push({
        producto: { ...producto },
        cantidad: 1
      });
    }
  }

  toggleSelectProducto(producto: Producto) {
    const existente = this.listitaProductos.find(item => item.producto.id === producto.id);
    if (existente) {
      this.removerProducto(this.listitaProductos.indexOf(existente));
    } else {
      this.agregarProducto(producto);
    }
  }

  removerProducto(index: number) {
    this.listitaProductos.splice(index, 1);
  }

  calcularTotal(): number {
    return this.listitaProductos.reduce((total, item) =>
      total + (item.cantidad * item.producto.precio), 0);
  }

  calcularCantidadTotal(): number {
    return this.listitaProductos.reduce((total, item) => total + item.cantidad, 0);
  }
}
