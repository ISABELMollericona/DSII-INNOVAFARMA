import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.css']
})
export class EditProductComponent implements OnInit {
  productForm: FormGroup;
  loading: boolean = false;
  loadingData: boolean = false;
  productId: number = 0;
  marcas: any[] = [];
  formasFarmaceuticas: any[] = [];
  laboratorios: any[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.productId = parseInt(this.route.snapshot.params['id']) || 0;
    this.productForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3)]],
      Nombre_comercial: ['', [Validators.required, Validators.minLength(3)]],
      Nombre_generico: [''],
      Cod_barrras: [''],
      Accion_terapeutica: [''],
      Principio_activo: [''],
      Concentracion: [''],
      Presentacion: [''],
      Precio_compra: ['', [Validators.required, Validators.min(0)]],
      Precio_venta: ['', [Validators.required, Validators.min(0)]],
      Margen_utilidad: [''],
      id_marca: [''],
      id_forma_farmaceutica: [''],
      id_laboratorio: [''],
      Control_inventario: [false],
      Receta_medica: [false],
      Favorito: [false],
      Granel: [false],
      Medicamento_controlado: [false],
      Solo_compra: [false]
    });
  }

  ngOnInit(): void {
    this.loadProduct();
    this.loadRelatedData();
  }

  loadProduct(): void {
    if (this.productId <= 0) {
      this.toastr.error('ID de producto inválido');
      this.router.navigate(['/products']);
      return;
    }

    this.loadingData = true;
    this.productService.getProduct(this.productId).subscribe({
      next: (producto: any) => {
        this.productForm.patchValue(producto);
        this.loadingData = false;
      },
      error: (error) => {
        console.error('Error al cargar el producto:', error);
        this.toastr.error('Error al cargar el producto');
        this.loadingData = false;
        this.router.navigate(['/products']);
      }
    });
  }

  loadRelatedData(): void {
    this.productService.getMarcas().subscribe({
      next: (data: any) => this.marcas = data || [],
      error: () => this.marcas = []
    });
    this.productService.getFormasFarmaceuticas().subscribe({
      next: (data: any) => this.formasFarmaceuticas = data || [],
      error: () => this.formasFarmaceuticas = []
    });
    this.productService.getLaboratorios().subscribe({
      next: (data: any) => this.laboratorios = data || [],
      error: () => this.laboratorios = []
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.toastr.error('Formulario inválido');
      return;
    }

    this.loading = true;
    this.productService.updateProduct(this.productId, this.productForm.value).subscribe({
      next: (response: any) => {
        this.toastr.success('Producto actualizado exitosamente');
        this.router.navigate(['/products']);
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.toastr.error(error.error?.message || 'Error al actualizar el producto');
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}
