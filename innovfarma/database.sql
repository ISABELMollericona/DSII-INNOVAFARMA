-- ==========================================================
-- BASE DE DATOS: innovfarma
-- Versión final con módulo de compras
-- ==========================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Crear Base de Datos
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `innovfarma` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `innovfarma`;

-- -----------------------------------------------------
-- Tabla: usuarios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` ENUM('Administrador','Vendedor') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: clientes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `nit_ci` VARCHAR(20) UNIQUE,
  `correo` VARCHAR(100),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: categoria
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `categoria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: subcategoria
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `subcategoria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `id_categoria` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: forma_farmaceutica
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `forma_farmaceutica` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: laboratorios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `laboratorios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: marca
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `marca` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: unidad_medida
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `unidad_medida` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `abreviatura` VARCHAR(10),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: productos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `productos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(25) NOT NULL,
  `nombre_comercial` VARCHAR(100),
  `nombre_generico` VARCHAR(100) NOT NULL,
  `precio_compra` DECIMAL(10,2),
  `precio_venta` DECIMAL(10,2),
  `stock_actual` INT DEFAULT 0,
  `fecha_vencimiento` DATE,
  `id_marca` INT,
  `id_subcategoria` INT,
  `id_forma_farmaceutica` INT,
  `id_unidad_medida` INT,
  `id_laboratorio` INT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_marca`) REFERENCES `marca` (`id`),
  FOREIGN KEY (`id_subcategoria`) REFERENCES `subcategoria` (`id`),
  FOREIGN KEY (`id_forma_farmaceutica`) REFERENCES `forma_farmaceutica` (`id`),
  FOREIGN KEY (`id_unidad_medida`) REFERENCES `unidad_medida` (`id`),
  FOREIGN KEY (`id_laboratorio`) REFERENCES `laboratorios` (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: facturas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `facturas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT,
  `id_cliente` INT,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `total` DECIMAL(10,2),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`),
  FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: detalle_factura
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalle_factura` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_factura` INT,
  `id_producto` INT,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2),
  `subtotal` DECIMAL(10,2),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`),
  FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: proveedores
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `proveedores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `nit` VARCHAR(20),
  `telefono` VARCHAR(20),
  `direccion` VARCHAR(200),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: compras
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `compras` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT,
  `id_proveedor` INT,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `total` DECIMAL(10,2),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`),
  FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: detalle_compra
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalle_compra` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_compra` INT,
  `id_producto` INT,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2),
  `subtotal` DECIMAL(10,2),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id`),
  FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla: stock_inventario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_inventario` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_producto` INT NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX (`id_producto`),
  FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB;

-- ==========================================================
-- Limpieza de configuración
-- ==========================================================
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
