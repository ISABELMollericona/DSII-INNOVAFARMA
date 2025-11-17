import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-product',
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent implements OnInit {
  productForm: FormGroup;
  loading = false;
  marcas: any[] = [];
  categorias: any[] = [];
  formasFarmaceuticas: any[] = [];
  laboratorios: any[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private toastr: ToastrService
  ) {
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
    this.loadRelatedData();
  }

  loadRelatedData(): void {
    this.productService.getMarcas().subscribe({ next: (data: any) => this.marcas = data, error: () => this.marcas = [] });
    this.productService.getFormasFarmaceuticas().subscribe({ next: (data: any) => this.formasFarmaceuticas = data, error: () => this.formasFarmaceuticas = [] });
    this.productService.getLaboratorios().subscribe({ next: (data: any) => this.laboratorios = data, error: () => this.laboratorios = [] });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.toastr.error('Formulario inválido');
      return;
    }

    this.loading = true;
    this.productService.createProduct(this.productForm.value).subscribe({
      next: (response: any) => {
        this.toastr.success('Producto creado exitosamente');
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'Error al crear producto');
        this.loading = false;
      }
    });
  }
}
