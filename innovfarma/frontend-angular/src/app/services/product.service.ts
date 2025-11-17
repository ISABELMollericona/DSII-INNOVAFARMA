import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  // READ - Listar productos
  getProducts(limit: number = 100, skip: number = 0): Observable<any> {
    return this.http.get(`${this.apiUrl}?limit=${limit}&skip=${skip}`);
  }

  // READ - Obtener un producto
  getProduct(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // READ - Filtrar productos
  filterProducts(term: string, limit: number = 200): Observable<any> {
    return this.http.post(`${this.apiUrl}/filtrar`, { term, limit });
  }

  // READ - Búsqueda avanzada
  filterAdvanced(filters: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/filtro-avanzado`, filters);
  }

  // READ - Búsqueda por código de barras
  searchByBarcode(codigo: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/codigo-barras/${codigo}`);
  }

  // CREATE - Crear producto
  createProduct(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  // UPDATE - Actualizar producto
  updateProduct(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // DELETE - Eliminar producto
  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Datos relacionados
  getMarcas(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/marcas`);
  }

  getFormasFarmaceuticas(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/formas-farmaceuticas`);
  }

  getLaboratorios(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/laboratorios`);
  }
}
