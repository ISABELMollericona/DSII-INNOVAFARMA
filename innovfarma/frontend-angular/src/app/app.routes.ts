import { Routes } from '@angular/router';
import { InicioComponent } from './components/content/inicio.component';
import { ProductosComponent } from './components/content/productos.component';
import { UsuariosComponent } from './components/content/usuarios.component';
import { ConfiguracionesComponent } from './components/content/configuraciones.component';
import { LoginComponent } from './components/login.component';
import { TextoPlanoComponent } from './components/facturas/texto-plano.component';
import { FacturacionComponent } from './components/content/facturacion.component';
import { ComprasComponent } from './components/content/compras.component';
import { VentasCajaComponent } from './components/content/ventas-caja.component';
import { ReportesVentasComponent } from './components/content/reportes-ventas.component';
import { ReportesCuentasComponent } from './components/content/reportes-cuentas.component';
import { ReportesInventarioComponent } from './components/content/reportes-inventario.component';
import { InventarioTraspasosComponent } from './components/content/inventario-traspasos.component';
import { InventarioIngresosComponent } from './components/content/inventario-ingresos.component';
import { InventarioSalidasComponent } from './components/content/inventario-salidas.component';
import { FinanzasComponent } from './components/content/finanzas.component';
import { UsuariosPrivilegiosComponent } from './components/admin/usuarios-privilegios.component';
import { GestionClientesComponent } from './components/admin/gestion-clientes.component';

export const routes: Routes = [
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'configuraciones', component: ConfiguracionesComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'login', component: LoginComponent },
  // Admin routes
  { path: 'admin/usuarios', component: UsuariosPrivilegiosComponent },
  { path: 'admin/clientes', component: GestionClientesComponent },
  // Facturas
  { path: 'facturas/texto-plano', component: TextoPlanoComponent },
  // Compras (nuevo componente con tabs)
  { path: 'compras', component: ComprasComponent },
  // Ventas
  { path: 'ventas/facturacion', component: FacturacionComponent },
  { path: 'ventas/caja', component: VentasCajaComponent },
  // Reportes
  { path: 'reportes/ventas', component: ReportesVentasComponent },
  { path: 'reportes/cuentas', component: ReportesCuentasComponent },
  { path: 'reportes/inventario', component: ReportesInventarioComponent },
  // Inventario
  { path: 'inventario/traspasos', component: InventarioTraspasosComponent },
  { path: 'inventario/ingresos', component: InventarioIngresosComponent },
  { path: 'inventario/salidas', component: InventarioSalidasComponent },
  // Finanzas
  { path: 'finanzas', component: FinanzasComponent },
  { path: '**', redirectTo: '/inicio' }
];
