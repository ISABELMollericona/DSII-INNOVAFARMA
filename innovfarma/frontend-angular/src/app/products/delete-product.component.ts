import { Component } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-delete-product',
  template: `
    <div class="modal fade" id="deleteProductModal" tabindex="-1" aria-labelledby="deleteProductLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title" id="deleteProductLabel">
              <i class="bi bi-exclamation-triangle"></i> Confirmar Eliminación
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">
              <strong>¿Está seguro que desea eliminar este producto?</strong>
            </p>
            <p class="text-muted mb-0">
              <i class="bi bi-info-circle"></i> Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="loading">
              <span *ngIf="loading">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Eliminando...
              </span>
              <span *ngIf="!loading">Eliminar Producto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DeleteProductComponent {
  productId: number = 0;
  loading: boolean = false;

  constructor(
    private productService: ProductService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  setProductId(id: number): void {
    this.productId = id;
  }

  confirmDelete(): void {
    if (this.productId <= 0) {
      this.toastr.error('ID de producto inválido');
      return;
    }

    this.loading = true;
    this.productService.deleteProduct(this.productId).subscribe({
      next: () => {
        this.toastr.success('Producto eliminado exitosamente');
        this.loading = false;
        // Emitir evento o llamar a función padre para refrescar lista
        this.router.navigate(['/products']);
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        this.toastr.error('Error al eliminar el producto');
        this.loading = false;
      }
    });
  }
}
