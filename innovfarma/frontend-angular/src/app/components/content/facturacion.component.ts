import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Producto {
  id: number;
  codigo: string;
  nombre_comercial: string;
  nombre_generico: string;
  forma_farmaceutica: string;
  concentracion: string;
  accion_terapeutica: string;
  presentacion: string;
  laboratorio: string;
  precio_venta: number;
  existencia: number;
  vencimiento: string;
  dias_vencimiento: number;
}

interface ProductoDetalle {
  id: number;
  codigo: string;
  nombre_comercial: string;
  forma_farmaceutica: string;
  concentracion: string;
  laboratorio: string;
  cantidad: number;
  precio_unit: number;
  vencimiento: string;
  existencia: number;
}

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.css']
})
export class FacturacionComponent implements OnInit {
  productos: Producto[] = [];
  detalleVenta: ProductoDetalle[] = [];
  
  // Filtros
  filtroSearchProducto = '';
  filtroCodigoBarras = '';
  
  // Descuento
  descuentoModo: 'porcentaje' | 'bs' = 'porcentaje';
  descuentoValor = 0;
  
  // Totales
  cantidadTotal = 0;
  importeTotal = 0;
  totalBs = 0;
  
  // Usuario y sucursal
  userName = 'Usuario';
  sucursalId = '1';
  sucursalNombre = 'Sucursal Principal';
  
  // Modal de pago
  tipoDocumento = 'ci';
  documentoCI = '';
  documentoComplemento = '';
  nombreFiscal = 'CONSUMIDOR FINAL';
  email = '';
  
  // Pago
  efectivoBs = 0;
  efectivoUsd = 0;
  transferenciaBs = 0;
  transferenciaUsd = 0;
  cambio = 0;
  tipoCambio = 1;
  
  // Errores
  mostrarErrorFactura = false;
  errorFacturaMsg = '';

  constructor() {
    this.cargarProductos();
    this.restaurarCarrito();
  }

  ngOnInit() {
    // Inicializar
  }

  cargarProductos() {
    // Simulamos carga de productos
    // En producción, esto vendría de una API
    this.productos = [
      {
        id: 1,
        codigo: 'PROD001',
        nombre_comercial: 'Ibuprofeno 400mg',
        nombre_generico: 'Ibuprofeno',
        forma_farmaceutica: 'Tableta',
        concentracion: '400mg',
        accion_terapeutica: 'Antiinflamatorio',
        presentacion: 'Caja x 20',
        laboratorio: 'Laboratorio X',
        precio_venta: 25.50,
        existencia: 100,
        vencimiento: '2025-12-31',
        dias_vencimiento: 413
      },
      {
        id: 2,
        codigo: 'PROD002',
        nombre_comercial: 'Amoxicilina 500mg',
        nombre_generico: 'Amoxicilina',
        forma_farmaceutica: 'Cápsula',
        concentracion: '500mg',
        accion_terapeutica: 'Antibiótico',
        presentacion: 'Caja x 30',
        laboratorio: 'Laboratorio Y',
        precio_venta: 35.00,
        existencia: 50,
        vencimiento: '2026-01-15',
        dias_vencimiento: 429
      }
    ];
  }

  restaurarCarrito() {
    const carritoGuardado = localStorage.getItem('detalleVentaCarrito');
    if (carritoGuardado) {
      try {
        this.detalleVenta = JSON.parse(carritoGuardado);
        this.calcularTotales();
      } catch (e) {
        this.detalleVenta = [];
      }
    }
  }

  guardarCarrito() {
    localStorage.setItem('detalleVentaCarrito', JSON.stringify(this.detalleVenta));
  }

  agregarAlDetalle(producto: Producto) {
    if (producto.existencia <= 0) {
      alert('No hay stock disponible para este producto.');
      return;
    }

    const existe = this.detalleVenta.findIndex(p => p.id === producto.id);
    if (existe !== -1) {
      if (this.detalleVenta[existe].cantidad + 1 > producto.existencia) {
        alert('No puedes agregar más de la existencia disponible.');
        return;
      }
      this.detalleVenta[existe].cantidad += 1;
    } else {
      this.detalleVenta.push({
        id: producto.id,
        codigo: producto.codigo,
        nombre_comercial: producto.nombre_comercial,
        forma_farmaceutica: producto.forma_farmaceutica,
        concentracion: producto.concentracion,
        laboratorio: producto.laboratorio,
        cantidad: 1,
        precio_unit: producto.precio_venta,
        vencimiento: producto.vencimiento,
        existencia: producto.existencia
      });
    }

    this.calcularTotales();
    this.guardarCarrito();
  }

  sumarCantidad(idx: number) {
    if (this.detalleVenta[idx].cantidad + 1 > this.detalleVenta[idx].existencia) {
      alert('No puedes agregar más de la existencia disponible.');
      return;
    }
    this.detalleVenta[idx].cantidad += 1;
    this.calcularTotales();
    this.guardarCarrito();
  }

  restarCantidad(idx: number) {
    if (this.detalleVenta[idx].cantidad > 1) {
      this.detalleVenta[idx].cantidad -= 1;
      this.calcularTotales();
      this.guardarCarrito();
    }
  }

  eliminarProducto(idx: number) {
    this.detalleVenta.splice(idx, 1);
    this.calcularTotales();
    this.guardarCarrito();
  }

  calcularTotales() {
    this.cantidadTotal = 0;
    this.importeTotal = 0;

    this.detalleVenta.forEach(prod => {
      this.cantidadTotal += prod.cantidad;
      this.importeTotal += prod.cantidad * prod.precio_unit;
    });

    let descuento = this.descuentoValor;
    if (this.descuentoModo === 'porcentaje') {
      if (descuento < 0) descuento = 0;
      if (descuento > 100) descuento = 100;
      this.totalBs = this.importeTotal - (this.importeTotal * descuento / 100);
    } else {
      if (descuento < 0) descuento = 0;
      if (descuento > this.importeTotal) descuento = this.importeTotal;
      this.totalBs = this.importeTotal - descuento;
    }
  }

  cambiarModoDescuento(modo: 'porcentaje' | 'bs') {
    this.descuentoModo = modo;
    this.calcularTotales();
  }

  abrirModalPago() {
    // Modal se abrirá mediante Bootstrap en el template
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalMetodoPago'));
    modal.show();
  }

  calcularCambioModal() {
    const tipoCambio = this.tipoCambio;
    const recibido = this.efectivoBs + (this.efectivoUsd * tipoCambio) + this.transferenciaBs + (this.transferenciaUsd * tipoCambio);
    this.cambio = Math.max(0, recibido - this.totalBs);
  }

  validarPago(): boolean {
    const total = this.totalBs;
    const efectivoBs = this.efectivoBs || 0;
    const efectivoUsd = this.efectivoUsd || 0;
    const transferBs = this.transferenciaBs || 0;
    const transferUsd = this.transferenciaUsd || 0;

    if (efectivoBs === 0 && efectivoUsd === 0 && transferBs === 0 && transferUsd === 0) {
      alert('Debe ingresar al menos un monto de pago.');
      return false;
    }

    const tipoCambio = this.tipoCambio;
    const recibido = efectivoBs + (efectivoUsd * tipoCambio) + transferBs + (transferUsd * tipoCambio);

    if (recibido < total) {
      alert('El monto recibido es insuficiente.');
      return false;
    }

    return true;
  }

  confirmarPago() {
    if (!this.validarPago()) {
      return;
    }

    // Aquí iría la lógica para enviar la factura al backend
    alert('Factura confirmada. (Integraci\u00f3n con backend pendiente)');
    
    // Limpiar carrito después de confirmar
    this.detalleVenta = [];
    this.guardarCarrito();
    this.calcularTotales();
  }

  generarCotizacion() {
    if (this.detalleVenta.length === 0) {
      alert('Agrega productos antes de generar una cotización.');
      return;
    }

    const cotizacion = {
      id: 'COT-' + Date.now(),
      fecha: new Date().toISOString(),
      items: this.detalleVenta.map(p => ({
        id: p.id,
        codigo: p.codigo,
        nombre_comercial: p.nombre_comercial,
        cantidad: p.cantidad,
        precio_unit: p.precio_unit
      })),
      importeTotal: this.importeTotal,
      totalBs: this.totalBs
    };

    // Guardamos localmente como demo; en producción enviarlo al backend
    localStorage.setItem('ultimaCotizacion', JSON.stringify(cotizacion));
    alert('Cotización generada y guardada localmente (clave: ultimaCotizacion).\nID: ' + cotizacion.id);
  }

  nuevoDocumento() {
    this.detalleVenta = [];
    this.descuentoValor = 0;
    this.efectivoBs = 0;
    this.efectivoUsd = 0;
    this.transferenciaBs = 0;
    this.transferenciaUsd = 0;
    this.guardarCarrito();
    this.calcularTotales();
  }

  obtenerProductosFiltrados(): Producto[] {
    return this.productos.filter(prod => {
      const coincideNombre = prod.nombre_comercial.toLowerCase().includes(this.filtroSearchProducto.toLowerCase());
      const coincideCodigo = prod.codigo.toLowerCase().includes(this.filtroCodigoBarras.toLowerCase());
      return coincideNombre || coincideCodigo;
    });
  }
}
