# InnovFarma Frontend - Angular

Frontend de la aplicación de gestión de farmacia usando Angular 16.

## Requisitos previos

- Node.js 18+ instalado
- npm o yarn como gestor de paquetes

## Instalación

```bash
# 1. Instala las dependencias del proyecto
npm install

# 2. Si necesitas resolver dependencias de toastr y otras librerías
npm install ngx-toastr@latest --save
npm install @angular/animations @angular/common @angular/forms @angular/platform-browser-dynamic --save
```

## Ejecutar el proyecto

```bash
# Modo desarrollo (abre automáticamente en http://localhost:4200)
npm start

# Construcción para producción
npm run build

# Linting (si está configurado)
npm run lint
```

## Estructura del proyecto

```
src/
├── app/
│   ├── components/        # Componentes generales (header, sidebar, layout)
│   ├── products/          # Módulo de productos (CRUD)
│   │   ├── create-product.component.ts
│   │   ├── list-products.component.ts
│   │   ├── edit-product.component.ts
│   │   ├── delete-product.component.ts
│   │   └── templates HTML (.html)
│   ├── services/          # Servicios (ProductService, etc.)
│   ├── app.routes.ts      # Rutas de la aplicación
│   └── app.component.ts   # Componente raíz
├── environments/          # Configuración de ambientes
│   ├── environment.ts
│   └── environment.prod.ts
└── index.html
```

## Módulos disponibles

### Productos (Completamente implementado)
- **Listar productos**: `GET /productos`
- **Crear producto**: `POST /productos`
- **Editar producto**: `PUT /productos/:id`
- **Eliminar producto**: `DELETE /productos/:id`
- **Buscar/Filtrar**: `POST /productos/filtrar`

Componentes:
- `ListProductsComponent` — listar y buscar
- `CreateProductComponent` — crear nuevo
- `EditProductComponent` — editar existente
- `DeleteProductComponent` — confirmación de eliminación

## Configuración de la API

La API base se configura en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

Cambiar la URL según tu entorno (desarrollo, producción, etc.).

## Notas importantes

1. **Versiones**: Angular 16, TypeScript 5.1, RxJS 7.8
2. **Bootstrap**: Usa Bootstrap 5 (clases CSS como `btn`, `form-control`, etc.)
3. **Toastr**: Mensajes emergentes (confirmaciones, errores)
4. **Standalone components**: Algunos componentes usan `standalone: true`

## Troubleshooting

### Error: "No se encuentra el módulo ngx-toastr"
```bash
npm install ngx-toastr@latest --save
```

### Error: "No se encuentra el módulo ProductService"
Asegúrate de que:
1. El archivo `src/app/services/product.service.ts` existe
2. Las rutas de importación en los componentes son correctas (ej: `../../services/product.service`)

### Error en tsconfig
Ejecuta:
```bash
npm install --save-dev typescript@latest
```

## Contacto / Soporte

Para más información sobre la configuración del backend (Flask), revisa `BACKEND_SETUP.md` en la carpeta raíz del proyecto.

---
**Última actualización:** 16 de noviembre de 2025
