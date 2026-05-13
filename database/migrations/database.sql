-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: velvet_store
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `position` varchar(50) DEFAULT 'hero',
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (2,'',NULL,'https://static.zattini.com.br/bnn/l_zattini/2026-04-23/7627_crocsday_abr_desk_1922x500.gif','/product?id=2','hero',1,1,'2026-04-24 14:14:33'),(4,'',NULL,'https://flordecarlota.cdn.magazord.com.br/img/2026/04/banner/4195/desk.png','/product?id=3','hero',0,1,'2026-05-06 15:22:02');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variation_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cart_id` (`cart_id`),
  KEY `product_id` (`product_id`),
  KEY `variation_id` (`variation_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_3` FOREIGN KEY (`variation_id`) REFERENCES `product_variations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_carts_session` (`session_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,4,'451b54b2-f171-4235-bfb4-74478741f227','2026-05-12 19:24:51','2026-05-12 19:30:41'),(2,5,'82bd351a-3457-4438-9410-ed369486e367','2026-05-12 19:31:45','2026-05-13 01:03:45'),(3,NULL,'be66e968-da19-4d04-8591-c8251cc49427','2026-05-12 19:37:45',NULL);
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `image_url` varchar(500) DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Vestidos','vestidos',NULL,'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,4,'active','2026-04-21 18:07:10'),(2,'Blusas','blusas',NULL,'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,1,'active','2026-04-21 18:07:10'),(3,'Calças','calcas',NULL,'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,2,'active','2026-04-21 18:07:10'),(4,'Saias','saias',NULL,'https://images.pexels.com/photos/1457983/pexels-photo-1457983.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,3,'active','2026-04-21 18:07:10'),(5,'Acessórios','acessorios','teste','https://images.pexels.com/photos/1202402/pexels-photo-1202402.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,0,'active','2026-04-21 18:07:10'),(10,'Novidades','novidades',NULL,'https://images.pexels.com/photos/26933269/pexels-photo-26933269.jpeg',NULL,5,'active','2026-04-23 01:26:58'),(11,'Mais Vendidos','mais-vendidos',NULL,'https://images.pexels.com/photos/23602561/pexels-photo-23602561.jpeg',NULL,6,'active','2026-04-23 01:26:58');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon_usage`
--

DROP TABLE IF EXISTS `coupon_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_usage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coupon_id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_id` int NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_coupon_user` (`coupon_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `coupon_usage_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  CONSTRAINT `coupon_usage_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `coupon_usage_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_usage`
--

LOCK TABLES `coupon_usage` WRITE;
/*!40000 ALTER TABLE `coupon_usage` DISABLE KEYS */;
INSERT INTO `coupon_usage` VALUES (1,3,5,1,0.01,'2026-05-12 19:30:41');
/*!40000 ALTER TABLE `coupon_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `description` text,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_purchase` decimal(10,2) DEFAULT '0.00',
  `max_uses` int DEFAULT NULL,
  `used_count` int DEFAULT '0',
  `starts_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `coupon_type` varchar(50) DEFAULT NULL COMMENT 'Tipo especial pré-definido: first_purchase, etc.',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_coupon_type` (`coupon_type`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (1,'TESTE','testando cupom','fixed',15.00,1.00,1,0,'2026-04-24 14:15:00','2026-04-25 14:15:00','active',NULL,'2026-04-24 14:15:38'),(3,'PRIMEIRACOMPRA','Cupom de Primeira Compra','percentage',10.00,0.00,NULL,2,NULL,NULL,'active','first_purchase','2026-05-06 18:32:48');
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `identifier` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `attempted_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_identifier` (`identifier`),
  KEY `idx_attempted_at` (`attempted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
INSERT INTO `login_attempts` VALUES (2,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:26:12'),(3,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:30:00'),(4,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:32:14'),(6,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:36:13'),(7,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:37:31'),(9,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:37:59'),(10,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:51:56'),(11,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:55:26'),(12,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:58:16'),(13,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 17:05:22'),(14,'guilherme@gmail.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 19:54:26'),(15,'admin@velvetstore.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 19:56:26'),(16,'guilherme@gmail.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 20:13:42'),(17,'admin@velvetstore.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 20:18:24'),(18,'guilherme@gmail.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 20:21:39'),(19,'admin@velvetstore.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 20:56:37'),(20,'admin@velvetstore.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 20:59:17'),(21,'guilherme@gmail.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 21:04:13'),(22,'admin@velvetstore.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 21:04:39'),(23,'admin@velvetstore.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 21:44:49'),(24,'guilherme@gmail.com','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de',1,'2026-05-12 22:03:03');
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `color` varchar(50) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  `variation_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_variation` (`variation_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,3,'teste checkout','Branco','G',186,1,0.10,0.10,'2026-05-12 19:30:41'),(2,2,3,'teste checkout','Azul marinho','M',190,1,0.10,0.10,'2026-05-12 19:36:45'),(3,3,3,'teste checkout','Branco','M',187,1,0.10,0.10,'2026-05-12 23:17:11'),(4,4,3,'teste checkout','Azul marinho','P',191,1,0.10,0.10,'2026-05-12 23:22:46'),(5,5,3,'teste checkout','Azul marinho','P',191,1,0.10,0.10,'2026-05-12 23:26:36'),(6,6,3,'teste checkout','Branco','G',192,1,0.10,0.10,'2026-05-13 01:03:45');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) NOT NULL,
  `user_id` int DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `customer_document` varchar(20) DEFAULT NULL,
  `status` enum('pending','paid','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  `shipping_amount` decimal(10,2) DEFAULT '0.00',
  `shipping_tracking` varchar(50) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_id` varchar(100) DEFAULT NULL,
  `payment_preference_id` varchar(100) DEFAULT NULL,
  `payment_status` enum('pending','approved','rejected','refunded') DEFAULT 'pending',
  `shipping_address` json DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  KEY `idx_order_number` (`order_number`),
  KEY `idx_status` (`status`),
  KEY `idx_orders_customer_email` (`customer_email`),
  KEY `idx_orders_status_created` (`status`,`created_at`),
  KEY `idx_orders_payment_id` (`payment_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'VLT14241250',5,'Guilherme Silva','guilherme@gmail.com','(32) 99978-6543','123.123.123-22','pending',12.52,12.43,NULL,0.01,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Guilherme Silva\", \"state\": \"MT\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-05-12 19:30:41',NULL),(2,'VLT14605754',5,'Guilherme Silva','guilherme@gmail.com','(32) 99978-6543','123.123.123-22','delivered',12.53,12.43,'BR12312312BR',0.00,'checkout_pro','158214857513','3355416654-1a2fc253-40f3-47f9-a10e-e0669969e646','approved','{\"city\": \"Teste\", \"name\": \"Guilherme Silva\", \"state\": \"PA\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"32673-098\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-05-12 19:36:45','2026-05-12 19:43:39'),(3,'VLT27831879',5,'Guilherme Silva','guilherme@gmail.com','(32) 99978-6543','123.123.123-22','paid',12.53,12.43,NULL,0.00,'checkout_pro','158251053683','3355416654-26ff422e-65b8-4113-b202-7818bdd89309','approved','{\"city\": \"Betim\", \"name\": \"Guilherme Silva\", \"state\": \"MG\", \"number\": \"123\", \"street\": \"Rua Circular\", \"zip_code\": \"32673-098\", \"complement\": \"\", \"neighborhood\": \"Jardim das Alterosas - 2ª Seção\"}',NULL,'2026-05-12 23:17:11','2026-05-12 23:17:39'),(4,'VLT28166949',5,'Guilherme Silva','guilherme@gmail.com','(32) 99978-6543','123.123.123-22','paid',12.53,12.43,NULL,0.00,'checkout_pro','159024896598','3355416654-dcbb318c-3c48-41c1-9837-470cd5b1ae0a','approved','{\"city\": \"Betim\", \"name\": \"Guilherme Silva\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Circular\", \"zip_code\": \"32673-098\", \"complement\": \"\", \"neighborhood\": \"Jardim das Alterosas - 2ª Seção\"}',NULL,'2026-05-12 23:22:46','2026-05-12 23:23:24'),(5,'VLT28396584',5,'Guilherme Silva','guilherme@gmail.com','(32) 99978-6543','123.123.123-22','processing',12.53,12.43,NULL,0.00,'checkout_pro','159025329956','3355416654-12e8e904-c74c-4872-8e34-3ab88d17f013','approved','{\"city\": \"Betim\", \"name\": \"Guilherme Silva\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Circular\", \"zip_code\": \"32673-098\", \"complement\": \"\", \"neighborhood\": \"Jardim das Alterosas - 2ª Seção\"}',NULL,'2026-05-12 23:26:36','2026-05-12 23:26:58'),(6,'VLT34225706',5,'Guilherme Silva','guilherme@gmail.com','(32) 99978-6543','123.123.123-22','processing',12.53,12.43,NULL,0.00,'checkout_pro','159038190076','3355416654-9757abe7-13e3-4023-a474-034a91ea6b56','approved','{\"city\": \"Resende Costa\", \"name\": \"Guilherme Silva\", \"state\": \"AM\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-05-13 01:03:45','2026-05-13 01:04:08');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_colors`
--

DROP TABLE IF EXISTS `product_colors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_colors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `hex` varchar(20) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `images` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sort_order` int DEFAULT '0' COMMENT 'Ordem de exibição das cores',
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`),
  CONSTRAINT `product_colors_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_colors`
--

LOCK TABLES `product_colors` WRITE;
/*!40000 ALTER TABLE `product_colors` DISABLE KEYS */;
INSERT INTO `product_colors` VALUES (62,3,'Branco','#ffff',12,'[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]','2026-05-13 00:05:18',0),(63,3,'Azul marinho','#000080',13,'[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]','2026-05-13 00:05:18',1);
/*!40000 ALTER TABLE `product_colors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `is_main` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `comment` text,
  `images` json DEFAULT NULL COMMENT 'URLs das imagens enviadas pelo cliente',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES (9,3,5,5,'','Muito bom!','[\"/uploads/reviews/review_1778617560304_5u68lm4webk.webp\"]','approved','2026-05-12 20:26:01');
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variations`
--

DROP TABLE IF EXISTS `product_variations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `images` json DEFAULT NULL COMMENT 'URLs de imagens para esta cor',
  `stock` int DEFAULT '0',
  `price_adjustment` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_variations_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=198 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variations`
--

LOCK TABLES `product_variations` WRITE;
/*!40000 ALTER TABLE `product_variations` DISABLE KEYS */;
INSERT INTO `product_variations` VALUES (192,3,NULL,'G','Branco','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]',7,0.00,'2026-05-13 00:05:18'),(193,3,NULL,'M','Branco','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]',4,0.00,'2026-05-13 00:05:18'),(194,3,NULL,'P','Branco','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]',0,0.00,'2026-05-13 00:05:18'),(195,3,NULL,'G','Azul marinho','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]',2,0.00,'2026-05-13 00:05:18'),(196,3,NULL,'M','Azul marinho','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]',4,0.00,'2026-05-13 00:05:18'),(197,3,NULL,'P','Azul marinho','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]',7,0.00,'2026-05-13 00:05:18');
/*!40000 ALTER TABLE `product_variations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `promotional_price` decimal(10,2) DEFAULT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `sizes` varchar(255) DEFAULT NULL COMMENT 'Tamanhos: P, M, G, GG',
  `category_id` int DEFAULT NULL,
  `status` enum('active','inactive','draft') DEFAULT 'active',
  `is_featured` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '0' COMMENT 'Ordem de exibição dentro da categoria',
  `images` json DEFAULT NULL,
  `sales_count` int DEFAULT '0',
  `views_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_product_sort` (`category_id`,`sort_order`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_featured` (`is_featured`),
  KEY `idx_products_sales` (`sales_count`),
  KEY `idx_products_name` (`name`),
  KEY `idx_products_status_date` (`status`,`created_at`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (2,'teste','teste',NULL,123.00,109.00,NULL,1,NULL,5,'active',0,0,'[\"https://res.cloudinary.com/dr79k8vl1/image/upload/v1776717067/Preto_Algod%C3%A3o_bxxfmu.jpg\", \"https://res.cloudinary.com/dr79k8vl1/image/upload/v1776717068/Verde_Escuro_ug4owv.jpg\"]',2,0,'2026-04-22 01:58:03','2026-05-13 00:04:46'),(3,'teste checkout','teste-checkout','testando a descrição do produto',0.10,NULL,NULL,24,NULL,4,'active',1,10,'[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716133/Preto_Algod%C3%A3o_tij4bd.jpg\"]',18,0,'2026-04-23 17:07:27','2026-05-13 01:03:45');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_token_hash` (`token_hash`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (1,4,'935e44514ed3c44f5dd7aa08fe0ccc0f7c4f9f2b0551bfb2f58588746d06c200','2026-05-19 16:26:13','2026-05-12 16:26:40','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:26:12'),(2,5,'13c8f1ad5a59338828923897b5b961042095b8cd3c8d03be4df7a7f775cf4481','2026-05-19 16:30:01',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:30:00'),(3,4,'7e6af422f679e31231c64857ba3e4eaaa560bd0c5f2e81ecd6ff755fa428a59b','2026-05-19 16:32:14','2026-05-12 16:35:57','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:32:14'),(4,5,'49e1e1c3b44e31e21eed9789c38c1cf221f4b78f34538623e301f13c32b904b4','2026-05-19 16:36:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:36:13'),(5,4,'ee75bc735cf5f256b2b3d92172a247a599d972027c67817334ca878629680497','2026-05-19 16:37:31','2026-05-12 16:37:45','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:37:31'),(6,5,'fb24c5194626f3da608161dd9421a15bd9f86459e47b2d1e01c063254d86d176','2026-05-19 16:38:00','2026-05-12 16:50:34','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:37:59'),(7,5,'219b23ccd3773964320b1a514ac3cf5fe5f929fd27a68156f5d635b388602b95','2026-05-19 16:50:35',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:50:34'),(8,4,'5de4ddff0ae329cd39c825ea2560365c5e54a0b9353a827713b093fe700e9d00','2026-05-19 16:51:57','2026-05-12 16:55:18','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:51:56'),(9,5,'7af528ecf60d724901d92dedb2048083bdb596e51b1da0586b8027b3e78620e2','2026-05-19 16:55:27','2026-05-12 16:56:27','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:55:27'),(10,5,'0c93afedc63c98ad42d5dd54c42d79ac288261558e7c8a8f107b3f049700c5c4','2026-05-19 16:58:17','2026-05-12 17:05:01','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:58:16'),(11,5,'784d716ddb5900546010ccfc008dba5dd3f71b445403fec77f8f94a78fe20682','2026-05-19 17:05:22','2026-05-12 17:23:01','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 17:05:22'),(12,5,'fb0af692507e264e0e3900fd5e68ccb82cc249737de2c2221cddc11d50a97314','2026-05-19 17:23:02','2026-05-12 17:26:26','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 17:23:01'),(13,5,'5cd8d47b47e7ba964ebf5c0a0bc6b28f11a35f148ec6edea2fd46acbe0e1d9ed','2026-05-19 19:54:26',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 19:54:26'),(14,4,'4ce90113d13df44e350431688bff07e6f52479657f58e91cf4714abacfcde6e1','2026-05-19 19:56:26','2026-05-12 20:12:25','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 19:56:26'),(15,4,'212c669be0331d1920b8e9c0ebac46f78b7022a800c843a34a434b30cf3eb079','2026-05-19 20:12:26','2026-05-12 20:13:28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 20:12:25'),(16,5,'56f2c0d8a9bb2ca500999528fcc2c53767979b56d4b86865af04e886dac16baf','2026-05-19 20:13:43',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 20:13:42'),(17,4,'50fa1a43e9bf7e7ee90f99db45184ced2d1fcb2c67fe1d94fe5ba82c6e12e1ba','2026-05-19 20:18:24','2026-05-12 20:21:26','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 20:18:24'),(18,5,'a1da288c8e17e571dcc9a0bad20f0d913d8bb07a35aca1114622ac66a577fb11','2026-05-19 20:21:40','2026-05-12 20:40:12','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 20:21:39'),(19,5,'2fd512a2d12ca9868d81fb0fa6e0f6fa325e530f63b337b931cb150cde73ad5e','2026-05-19 20:40:13','2026-05-12 20:55:57','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 20:40:12'),(20,5,'08b0caf23fd1a21856d7a6356b0f398f9862d14ff38c14c7664d0aa3b31b4e54','2026-05-19 20:55:57','2026-05-12 20:55:57','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 20:55:57'),(21,5,'451f5282e8c3588d00f6a1c9f6a003cd990ce1a486b8644e1b191c8f0f54cd2f','2026-05-19 20:55:58',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 20:55:57'),(22,4,'c8c9094ea0e0fb8650c335906565345585edf070cd671f1c0adb69e9307344a0','2026-05-19 20:56:37','2026-05-12 20:58:20','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 20:56:37'),(23,4,'1a3a6212b9ecc54d6a7736132a646f6058db8276292cf7d71931066bf02e411f','2026-05-19 20:59:18','2026-05-12 21:04:04','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 20:59:17'),(24,5,'4f658db843b7eff37f890ae41efee25d4e3cc959a2c08528423d5747ea3dfb45','2026-05-19 21:04:13',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 21:04:13'),(25,4,'9a4eccae7775327e3b4587c08175afb59f324ae4e18fc882853f2fbb02d46067','2026-05-19 21:04:39','2026-05-12 21:44:38','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 21:04:39'),(26,4,'818ce9b23bb0b6bef45fc93edb69b328ef434378d5a018e394bfe000b373c5e2','2026-05-19 21:44:38','2026-05-12 21:44:39','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 21:44:38'),(27,4,'60021617b0fe905f908eec3982dcdb2bbf13ea66173e0d00ee886eece4a2e931','2026-05-19 21:44:49','2026-05-12 22:02:52','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 21:44:49'),(28,4,'ff18f24b703cb95f04f34003c890149d02f2da1e9b95868a5eda05a86ad5c8a7','2026-05-19 22:02:53','2026-05-12 22:02:56','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 22:02:52'),(29,5,'c05dd2c9d53e33c019a4b77182e868680751455774ecfe736aed16121fd17a5e','2026-05-19 22:03:04',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:7e96:ccff:4f0d:e5de','2026-05-12 22:03:03');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_alerts`
--

DROP TABLE IF EXISTS `store_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL,
  `message` text NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_alerts`
--

LOCK TABLES `store_alerts` WRITE;
/*!40000 ALTER TABLE `store_alerts` DISABLE KEYS */;
INSERT INTO `store_alerts` VALUES (3,NULL,'FRETE GRÁTIS PARA TODO O BRASIL',1,'2026-05-08 00:02:21',0),(4,NULL,'Cupom PRIMEIRACOMPRA acima de R$299,99',1,'2026-05-08 00:02:41',0),(5,NULL,'3%OFF no Pix',1,'2026-05-08 00:03:02',0);
/*!40000 ALTER TABLE `store_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_settings`
--

DROP TABLE IF EXISTS `store_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `setting_type` enum('text','number','boolean','json') DEFAULT 'text',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_settings`
--

LOCK TABLES `store_settings` WRITE;
/*!40000 ALTER TABLE `store_settings` DISABLE KEYS */;
INSERT INTO `store_settings` VALUES (1,'store_name','Velvet Store','text','2026-04-21 18:10:15'),(2,'store_email','contato@velvetstore.com','text','2026-04-21 18:10:15'),(3,'store_phone','(11) 99999-9999','text','2026-04-21 18:10:15'),(4,'free_shipping_min','299','number','2026-04-21 18:10:15'),(5,'default_shipping_fee','20','number','2026-04-21 18:10:15');
/*!40000 ALTER TABLE `store_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `street` varchar(255) NOT NULL,
  `number` varchar(20) NOT NULL,
  `complement` varchar(255) DEFAULT NULL,
  `neighborhood` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` char(2) NOT NULL,
  `zip_code` varchar(9) NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (1,5,'Rua Teste','143',NULL,'Teste','Teste','MT','30535-531',1,'2026-05-12 19:30:41'),(2,5,'Rua Teste','143',NULL,'Teste','Teste','PA','32673-098',0,'2026-05-12 19:36:46'),(3,5,'Rua Circular','123',NULL,'Jardim das Alterosas - 2ª Seção','Betim','MG','32673-098',0,'2026-05-12 23:17:12'),(4,5,'Rua Circular','141',NULL,'Jardim das Alterosas - 2ª Seção','Betim','MG','32673-098',0,'2026-05-12 23:22:46'),(5,5,'Rua Vicente Penido','141',NULL,'N S Aparecida','Resende Costa','AM','30535-531',0,'2026-05-13 01:03:46');
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `email_verify_token` varchar(255) DEFAULT NULL,
  `email_verify_expires` datetime DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `token_version` int NOT NULL DEFAULT '0',
  `auth_provider` varchar(20) NOT NULL DEFAULT 'local',
  `totp_secret` varchar(255) DEFAULT NULL,
  `totp_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `totp_verified` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cpf` (`cpf`),
  KEY `idx_reset_token` (`reset_token`),
  KEY `idx_users_reset_token` (`reset_token`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (4,'Administrador','admin@velvetstore.com',1,NULL,NULL,'$2b$10$DOqnFImbRCDjiAdwRN38Rug4sBEuN5H1fHo5gFeRSh86/ox1DoKGm','',NULL,'admin',NULL,NULL,NULL,NULL,'2026-04-21 18:17:16','2026-05-12 23:44:34',0,'local',NULL,0,0),(5,'Guilherme Silva','guilherme@gmail.com',0,NULL,NULL,'$2b$12$GM4RXN20URejTkKIj1YIp.mAb49t/Fg0svWXBYg7euA/os/1NkD16','(32) 99978-6543','123.123.123-22','user',NULL,NULL,NULL,NULL,'2026-05-12 19:29:49',NULL,0,'local',NULL,0,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_wishlist` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_wishlists_user` (`user_id`),
  CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlists_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlists` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-12 22:11:08
