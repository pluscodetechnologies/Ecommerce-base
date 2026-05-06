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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (2,'Teste','teste','https://static.zattini.com.br/bnn/l_zattini/2026-04-23/7627_crocsday_abr_desk_1922x500.gif','/product?id=2','hero',2,1,'2026-04-24 14:14:33'),(4,'Teste Imagem 2','teste 2','https://flordecarlota.cdn.magazord.com.br/img/2026/04/banner/4195/desk.png','/product?id=3','hero',0,1,'2026-05-06 15:22:02');
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (34,2,3,NULL,1,0.10,'2026-05-05 15:46:44');
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
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,NULL,'0f7938d9-0675-4315-987c-625bddf49b37','2026-04-23 00:38:59','2026-04-28 21:23:49'),(2,NULL,'451b54b2-f171-4235-bfb4-74478741f227','2026-04-24 16:15:50','2026-05-05 15:46:44');
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
INSERT INTO `categories` VALUES (1,'Vestidos','vestidos',NULL,'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,0,'active','2026-04-21 18:07:10'),(2,'Blusas','blusas',NULL,'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,0,'active','2026-04-21 18:07:10'),(3,'Calças','calcas',NULL,'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,0,'active','2026-04-21 18:07:10'),(4,'Saias','saias',NULL,'https://images.pexels.com/photos/1457983/pexels-photo-1457983.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,0,'active','2026-04-21 18:07:10'),(5,'Acessórios','acessorios','teste','https://images.pexels.com/photos/1202402/pexels-photo-1202402.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',NULL,0,'active','2026-04-21 18:07:10'),(10,'Novidades','novidades',NULL,'https://images.pexels.com/photos/26933269/pexels-photo-26933269.jpeg',NULL,1,'active','2026-04-23 01:26:58'),(11,'Mais Vendidos','mais-vendidos',NULL,'https://images.pexels.com/photos/23602561/pexels-photo-23602561.jpeg',NULL,2,'active','2026-04-23 01:26:58');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_usage`
--

LOCK TABLES `coupon_usage` WRITE;
/*!40000 ALTER TABLE `coupon_usage` DISABLE KEYS */;
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
INSERT INTO `coupons` VALUES (1,'TESTE','testando cupom','fixed',15.00,1.00,1,0,'2026-04-24 14:15:00','2026-04-25 14:15:00','active',NULL,'2026-04-24 14:15:38'),(3,'PRIMEIRACOMPRA','Cupom de Primeira Compra','percentage',10.00,0.00,NULL,0,NULL,NULL,'active','first_purchase','2026-05-06 18:32:48');
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
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
  `product_id` int NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,2,'teste',1,109.00,109.00,'2026-04-23 17:04:23'),(2,2,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:09:16'),(3,3,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:11:19'),(4,4,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:19:14'),(5,5,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:20:21'),(6,6,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:38:43'),(7,7,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:40:12'),(8,8,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:42:40'),(9,9,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:45:43'),(10,10,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:50:44'),(11,11,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:53:40'),(12,12,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:58:08'),(13,13,3,'teste checkout',1,0.10,0.10,'2026-04-23 17:59:36'),(14,14,3,'teste checkout',1,0.10,0.10,'2026-04-23 18:28:34'),(15,15,3,'teste checkout',1,0.10,0.10,'2026-04-23 18:33:58'),(16,16,3,'teste checkout',1,0.10,0.10,'2026-04-23 18:35:08'),(17,17,3,'teste checkout',1,0.10,0.10,'2026-04-23 18:39:36'),(18,18,3,'teste checkout',1,0.10,0.10,'2026-04-23 18:42:07'),(19,19,3,'teste checkout',1,0.10,0.10,'2026-04-28 21:13:38'),(20,20,3,'teste checkout',1,0.10,0.10,'2026-04-28 21:22:10'),(21,21,3,'teste checkout',1,0.10,0.10,'2026-04-28 21:23:49'),(22,22,3,'teste checkout',1,0.10,0.10,'2026-04-28 21:41:15'),(23,23,3,'teste checkout',1,0.10,0.10,'2026-04-28 21:43:20'),(24,24,3,'teste checkout',1,0.10,0.10,'2026-04-28 21:46:04'),(25,25,3,'teste checkout',1,0.10,0.10,'2026-04-28 21:52:52');
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
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'VLT63863409',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',109.00,0.00,NULL,0.00,'pix',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:04:23','2026-04-24 14:07:16'),(2,'VLT64156419',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pix',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:09:16',NULL),(3,'VLT64279962',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pix',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:11:19',NULL),(4,'VLT64754329',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:19:14',NULL),(5,'VLT64821736',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-72bb7d9f-9b42-4d4b-876b-abef33c95f88','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:20:21','2026-04-23 17:20:22'),(6,'VLT65923933',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:38:43',NULL),(7,'VLT66012355',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:40:12',NULL),(8,'VLT66160200',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:42:40',NULL),(9,'VLT66343135',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-8a74cc73-dc4f-48c1-abc1-1ffe74a02047','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:45:43','2026-04-23 17:45:43'),(10,'VLT66644840',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-7caccedd-8c46-49d9-962f-e74defc6bd4e','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:50:44','2026-04-23 17:50:45'),(11,'VLT66820565',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-65ec94ce-a5aa-47e1-8e1e-353ed549b97e','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:53:40','2026-04-23 17:53:41'),(12,'VLT67088249',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-f4534dfa-77ea-463a-938b-abf5fd7dec34','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:58:08','2026-04-23 17:58:08'),(13,'VLT67176120',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pix',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:59:36',NULL),(14,'VLT68914187',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:28:34',NULL),(15,'VLT69238190',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:33:58',NULL),(16,'VLT69308213',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro','11192',NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:35:08','2026-04-23 18:35:08'),(17,'VLT69576014',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro','11192',NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:39:36','2026-04-23 18:39:36'),(18,'VLT69727537',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro','11192',NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:42:07','2026-04-23 18:42:08'),(19,'VLT10818347',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','pending',16.00,15.90,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:13:38',NULL),(20,'VLT11330939',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','pending',16.00,15.90,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:22:10',NULL),(21,'VLT11429497',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','pending',16.00,15.90,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:23:49',NULL),(22,'VLT12475129',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','pending',16.00,15.90,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:41:15',NULL),(23,'VLT12600892',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','paid',16.00,15.90,NULL,0.00,'checkout_pro','156842780508',NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:43:20','2026-04-28 21:43:37'),(24,'VLT12764323',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','paid',0.10,0.00,NULL,0.00,'checkout_pro','156843089658',NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:46:04','2026-04-28 21:46:19'),(25,'VLT13172206',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','paid',16.00,15.90,NULL,0.00,'checkout_pro','156844330114',NULL,'pending','{\"city\": \"Betim\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Circular\", \"zip_code\": \"32673-098\", \"complement\": \"\", \"neighborhood\": \"Jardim das Alterosas - 2ª Seção\"}',NULL,'2026-04-28 21:52:52','2026-04-28 21:53:08');
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
  `sort_order` int DEFAULT '0' COMMENT 'Ordem de exibição das cores',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`),
  CONSTRAINT `product_colors_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_colors`
--

LOCK TABLES `product_colors` WRITE;
/*!40000 ALTER TABLE `product_colors` DISABLE KEYS */;
INSERT INTO `product_colors` VALUES (33,3,'Azul marinho','#000080',17,'[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]','2026-05-06 18:41:23'),(34,3,'Branco','#ffff',20,'[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]','2026-05-06 18:41:23');
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
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variations`
--

LOCK TABLES `product_variations` WRITE;
/*!40000 ALTER TABLE `product_variations` DISABLE KEYS */;
INSERT INTO `product_variations` VALUES (115,3,NULL,'G','Azul marinho','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]',2,0.00,'2026-05-06 18:41:23'),(116,3,NULL,'M','Azul marinho','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]',5,0.00,'2026-05-06 18:41:23'),(117,3,NULL,'P','Azul marinho','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]',10,0.00,'2026-05-06 18:41:23'),(118,3,NULL,'G','Branco','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]',10,0.90,'2026-05-06 18:41:23'),(119,3,NULL,'M','Branco','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]',5,0.90,'2026-05-06 18:41:23'),(120,3,NULL,'P','Branco','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]',5,0.90,'2026-05-06 18:41:23');
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
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (2,'teste','teste',NULL,123.00,109.00,NULL,12,NULL,5,'active',0,0,'[\"https://res.cloudinary.com/dr79k8vl1/image/upload/v1776717067/Preto_Algod%C3%A3o_bxxfmu.jpg\", \"https://res.cloudinary.com/dr79k8vl1/image/upload/v1776717068/Verde_Escuro_ug4owv.jpg\"]',1,0,'2026-04-22 01:58:03','2026-05-06 20:11:26'),(3,'teste checkout','teste-checkout','testando a descrição do produto',0.10,NULL,NULL,5,NULL,4,'active',0,10,'[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716133/Preto_Algod%C3%A3o_tij4bd.jpg\"]',5,0,'2026-04-23 17:07:27','2026-05-06 20:11:26');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_alerts`
--

LOCK TABLES `store_alerts` WRITE;
/*!40000 ALTER TABLE `store_alerts` DISABLE KEYS */;
INSERT INTO `store_alerts` VALUES (1,'CUPOM','Use VELVET20 e ganhe desconto na primeira compra',1,'2026-04-24 14:36:14'),(2,'TESTE','Tô testando essa mensagem',1,'2026-05-05 03:12:20');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
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
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Lucas Alves Resende','lucas@gmail.com','$2b$10$2RjBQZYWViGIelS6fjQ/Ue0dhp4StSzXWp8vEyTSgneXSOVNtyLli','(32) 99943-0189',NULL,'user',NULL,NULL,NULL,NULL,'2026-04-21 18:07:40',NULL),(4,'Administrador','admin@velvetstore.com','$2b$10$DOqnFImbRCDjiAdwRN38Rug4sBEuN5H1fHo5gFeRSh86/ox1DoKGm',NULL,NULL,'admin','6770fe6389c7ea8149ce14163c99976ed73e53c9f1295499fe8b86e7a5a9613f','2026-05-05 01:02:25',NULL,NULL,'2026-04-21 18:17:16','2026-05-05 03:02:24'),(5,'João Gabriel','joao@gmail.com','$2b$10$iD2ZX.m5XH6mqtyUt54OUOIeMxZPnyLHtjVGVPd5LTLqpxFQXILkC','(31) 999970-7070','111.111.111-11','user',NULL,NULL,NULL,NULL,'2026-04-24 16:17:09',NULL);
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
  CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlists_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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

-- Dump completed on 2026-05-06 17:15:36