import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-list-products',
  templateUrl: './list-products.component.html',
  styleUrls: ['./list-products.component.css']
})
export class ListProductsComponent implements OnInit {
  productos: any[] = [];
  filtrados: any[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  limit: number = 100;
  skip: number = 0;

  constructor(
    private productService: ProductService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(this.limit, this.skip).subscribe({
      next: (response: any) => {
        this.productos = response.productos || [];
        this.filtrados = response.productos || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.toastr.error('Error al cargar productos');
        this.loading = false;
      }
    });
  }

  buscar(): void {
    if (this.searchTerm.trim() === '') {
      this.filtrados = this.productos;
      return;
    }

    this.loading = true;
    this.productService.filterProducts(this.searchTerm).subscribe({
      next: (response: any) => {
        this.filtrados = response.productos || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la búsqueda:', error);
        this.toastr.error('Error en la búsqueda');
        this.loading = false;
      }
    });
  }

  editProduct(id: number): void {
    this.router.navigate(['/products', id, 'edit']);
  }

  deleteProduct(id: number): void {
    if (confirm('¿Está seguro que desea eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.toastr.success('Producto eliminado');
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.toastr.error('Error al eliminar producto');
        }
      });
    }
  }

  createNew(): void {
    this.router.navigate(['/products/create']);
  }
}
