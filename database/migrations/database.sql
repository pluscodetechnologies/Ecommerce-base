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
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (53,2,3,187,1,0.10,'2026-05-12 19:14:21');
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
INSERT INTO `carts` VALUES (1,NULL,'0f7938d9-0675-4315-987c-625bddf49b37','2026-04-23 00:38:59','2026-04-28 21:23:49'),(2,NULL,'451b54b2-f171-4235-bfb4-74478741f227','2026-04-24 16:15:50','2026-05-12 19:14:21'),(3,NULL,'7145db81-f341-4bf5-96bd-ef54e92f1359','2026-05-11 19:30:34',NULL);
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
INSERT INTO `coupon_usage` VALUES (1,3,10,35,0.01,'2026-05-12 18:58:53');
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
INSERT INTO `coupons` VALUES (1,'TESTE','testando cupom','fixed',15.00,1.00,1,0,'2026-04-24 14:15:00','2026-04-25 14:15:00','active',NULL,'2026-04-24 14:15:38'),(3,'PRIMEIRACOMPRA','Cupom de Primeira Compra','percentage',10.00,0.00,NULL,1,NULL,NULL,'active','first_purchase','2026-05-06 18:32:48');
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
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
INSERT INTO `login_attempts` VALUES (3,'leandro@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',1,'2026-05-11 16:36:10'),(4,'leandro@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',0,'2026-05-11 16:39:30'),(5,'leandro@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',0,'2026-05-11 16:39:33'),(6,'leandro@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',0,'2026-05-11 16:39:34'),(7,'leandro@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',0,'2026-05-11 16:39:34'),(8,'leandro@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',0,'2026-05-11 16:39:35'),(9,'davi@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',0,'2026-05-11 16:41:56'),(10,'davi@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',0,'2026-05-11 16:41:59'),(11,'davi@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',0,'2026-05-11 16:42:02'),(12,'guilherme@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',1,'2026-05-11 16:43:16'),(13,'guilherme@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',1,'2026-05-11 17:08:36'),(14,'guilherme@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',1,'2026-05-11 17:13:47'),(15,'guilherme@gmail.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',1,'2026-05-11 17:18:01'),(16,'admin@velvetstore.com','2804:14c:5bd6:92ab:202b:2537:a395:445c',1,'2026-05-11 17:19:39'),(17,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 22:59:26'),(18,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 23:16:06'),(19,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 23:21:20'),(20,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 23:21:21'),(21,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 23:21:58'),(22,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 23:23:16'),(23,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 23:32:37'),(24,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 23:34:42'),(25,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 23:43:58'),(26,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-11 23:44:52'),(27,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 00:04:09'),(28,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 10:15:24'),(29,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 10:32:56'),(30,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 10:37:01'),(31,'lucasalves2180@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 10:41:19'),(32,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 10:43:43'),(33,'lucasalves2180@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 10:46:09'),(34,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 15:16:55'),(35,'joaogabriel@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 15:19:56'),(36,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 15:20:45'),(37,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 15:42:53'),(38,'joaogabriel@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 15:45:40'),(39,'joaogabriel@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 15:58:07'),(40,'guilherme@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:01:18'),(41,'gustavo@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:02:41'),(42,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:04:31'),(43,'joaogabriel@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:05:35'),(44,'junior@gmail.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:11:40'),(45,'admin@velvetstore.com','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8',1,'2026-05-12 16:14:29');
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,2,'teste',NULL,NULL,NULL,1,109.00,109.00,'2026-04-23 17:04:23'),(2,2,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:09:16'),(3,3,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:11:19'),(4,4,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:19:14'),(5,5,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:20:21'),(6,6,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:38:43'),(7,7,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:40:12'),(8,8,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:42:40'),(9,9,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:45:43'),(10,10,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:50:44'),(11,11,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:53:40'),(12,12,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:58:08'),(13,13,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 17:59:36'),(14,14,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 18:28:34'),(15,15,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 18:33:58'),(16,16,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 18:35:08'),(17,17,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 18:39:36'),(18,18,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-23 18:42:07'),(19,19,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-28 21:13:38'),(20,20,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-28 21:22:10'),(21,21,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-28 21:23:49'),(22,22,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-28 21:41:15'),(23,23,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-28 21:43:20'),(24,24,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-28 21:46:04'),(25,25,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-04-28 21:52:52'),(26,29,NULL,'Cinto',NULL,NULL,NULL,3,50.00,150.00,'2026-05-08 01:54:15'),(27,30,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-05-11 19:52:49'),(28,31,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-05-11 20:05:44'),(29,32,3,'teste checkout',NULL,NULL,NULL,1,0.10,0.10,'2026-05-12 02:15:05'),(30,33,3,'teste checkout','Azul marinho','G',NULL,1,0.10,0.10,'2026-05-12 02:21:44'),(31,34,3,'teste checkout','Branco','G',180,1,0.90,0.90,'2026-05-12 13:42:32'),(32,35,3,'teste checkout','Azul marinho','P',191,1,0.10,0.10,'2026-05-12 18:58:53'),(33,36,2,'teste',NULL,NULL,NULL,1,109.00,109.00,'2026-05-12 19:00:53'),(34,37,3,'teste checkout','Branco','P',188,1,0.10,0.10,'2026-05-12 19:13:11');
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
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'VLT63863409',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',109.00,0.00,NULL,0.00,'pix',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:04:23','2026-04-24 14:07:16'),(2,'VLT64156419',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pix',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:09:16',NULL),(3,'VLT64279962',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pix',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:11:19',NULL),(4,'VLT64754329',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:19:14',NULL),(5,'VLT64821736',4,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-72bb7d9f-9b42-4d4b-876b-abef33c95f88','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:20:21','2026-04-23 17:20:22'),(6,'VLT65923933',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:38:43',NULL),(7,'VLT66012355',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:40:12',NULL),(8,'VLT66160200',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:42:40',NULL),(9,'VLT66343135',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-8a74cc73-dc4f-48c1-abc1-1ffe74a02047','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:45:43','2026-04-23 17:45:43'),(10,'VLT66644840',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-7caccedd-8c46-49d9-962f-e74defc6bd4e','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:50:44','2026-04-23 17:50:45'),(11,'VLT66820565',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-65ec94ce-a5aa-47e1-8e1e-353ed549b97e','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:53:40','2026-04-23 17:53:41'),(12,'VLT67088249',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'checkout_pro',NULL,'3355416654-f4534dfa-77ea-463a-938b-abf5fd7dec34','pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:58:08','2026-04-23 17:58:08'),(13,'VLT67176120',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','32999430189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pix',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 17:59:36',NULL),(14,'VLT68914187',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:28:34',NULL),(15,'VLT69238190',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:33:58',NULL),(16,'VLT69308213',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro','11192',NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:35:08','2026-04-23 18:35:08'),(17,'VLT69576014',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro','11192',NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:39:36','2026-04-23 18:39:36'),(18,'VLT69727537',NULL,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','pending',0.10,0.00,NULL,0.00,'pagseguro','11192',NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-04-23 18:42:07','2026-04-23 18:42:08'),(19,'VLT10818347',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','pending',16.00,15.90,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:13:38',NULL),(20,'VLT11330939',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','pending',16.00,15.90,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:22:10',NULL),(21,'VLT11429497',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','pending',16.00,15.90,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:23:49',NULL),(22,'VLT12475129',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','pending',16.00,15.90,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:41:15','2026-05-08 02:00:25'),(23,'VLT12600892',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','paid',16.00,15.90,NULL,0.00,'checkout_pro','156842780508',NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:43:20','2026-04-28 21:43:37'),(24,'VLT12764323',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','paid',0.10,0.00,NULL,0.00,'checkout_pro','156843089658',NULL,'pending','{\"city\": \"Teste\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Teste\", \"zip_code\": \"30535-531\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-04-28 21:46:04','2026-04-28 21:46:19'),(25,'VLT13172206',NULL,'Joao','joao@gmail.com','31999707070','111.111.111-11','paid',16.00,15.90,NULL,0.00,'checkout_pro','156844330114',NULL,'pending','{\"city\": \"Betim\", \"name\": \"Joao\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Circular\", \"zip_code\": \"32673-098\", \"complement\": \"\", \"neighborhood\": \"Jardim das Alterosas - 2ª Seção\"}',NULL,'2026-04-28 21:52:52','2026-04-28 21:53:08'),(26,'MAN-1778204406246',NULL,'Lucas','lucas@gmail.com','32999430182','12007886642','paid',329.00,0.00,NULL,0.00,'manual',NULL,NULL,'pending','{\"name\": \"Lucas\", \"phone\": \"32999430182\"}',NULL,'2026-05-08 01:40:06',NULL),(27,'MAN-1778205046929',NULL,'Lucas Resende','manual@velvetatelier.com','','','paid',1803.00,0.00,NULL,0.00,'manual',NULL,NULL,'pending','{\"name\": \"Lucas Resende\"}',NULL,'2026-05-08 01:50:46',NULL),(28,'MAN-1778205164094',NULL,'Lucas Resende','manual@velvetatelier.com','','','paid',900.00,0.00,NULL,0.00,'manual',NULL,NULL,'pending','{\"name\": \"Lucas Resende\"}',NULL,'2026-05-08 01:52:44',NULL),(29,'MAN-1778205255697',NULL,'Lucas Alves','manual@velvetatelier.com','','','paid',150.00,0.00,NULL,0.00,'manual',NULL,NULL,'pending','{\"name\": \"Lucas Alves\"}',NULL,'2026-05-08 01:54:15','2026-05-08 01:55:35'),(30,'VLT29169434',8,'Guilherme Silva','guilherme@gamil.com','31999707070','111.111.111-11','pending',12.53,12.43,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Guilherme Silva\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-05-11 19:52:49','2026-05-11 20:22:02'),(31,'VLT29944061',8,'Guilherme Silva','guilherme@gmail.com','(31) 99932-1455','120.987.654-22','pending',19.62,19.52,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Guilherme Silva\", \"state\": \"MG\", \"number\": \"123\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-05-11 20:05:44',NULL),(32,'VLT52105494',NULL,'Administrador','admin@velvetstore.com','(32) 99943-0189','111.111.111-11','pending',19.62,19.52,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Administrador\", \"state\": \"PB\", \"number\": \"141\", \"street\": \"Rua Teste\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-05-12 02:15:05',NULL),(33,'VLT52504778',8,'Guilherme Silva','guilherme@gmail.com','(31) 99932-1455','120.987.654-22','delivered',0.10,0.00,'VLT52504778',0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Guilherme Silva\", \"state\": \"PE\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-05-12 02:21:44','2026-05-12 03:21:54'),(34,'VLT93352793',9,'Lucas Alves Resende','lucasalves2180@gmail.com','(32) 99943-0189','120.078.866-42','shipped',0.90,0.00,'VLT93352793',0.00,'pix',NULL,NULL,'pending','{\"city\": \"Resende Costa\", \"name\": \"Lucas Alves Resende\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"36340-000\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-05-12 13:42:32','2026-05-12 13:44:23'),(35,'VLT12333725',10,'João Gabriel','joaogabriel@gmail.com','(31) 77987-4244','111.929.019-12','shipped',12.52,12.43,'BR123456BR',0.01,'pix',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"João Gabriel\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Teste\", \"zip_code\": \"32673-098\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-05-12 18:58:53','2026-05-12 19:05:22'),(36,'VLT12453018',10,'João Gabriel','joaogabriel@gmail.com','(31) 77987-4244','111.929.019-12','pending',121.43,12.43,NULL,0.00,'checkout_pro',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"João Gabriel\", \"state\": \"MG\", \"number\": \"141\", \"street\": \"Rua Teste\", \"zip_code\": \"32673-098\", \"complement\": \"\", \"neighborhood\": \"Teste\"}',NULL,'2026-05-12 19:00:53',NULL),(37,'VLT13191049',13,'Junior','junior@gmail.com','(39) 87461-7284','111.111.111-11','pending',0.10,0.00,NULL,0.00,'pix',NULL,NULL,'pending','{\"city\": \"Teste\", \"name\": \"Junior\", \"state\": \"MG\", \"number\": \"143\", \"street\": \"Rua Vicente Penido\", \"zip_code\": \"32673-098\", \"complement\": \"\", \"neighborhood\": \"N S Aparecida\"}',NULL,'2026-05-12 19:13:11',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_colors`
--

LOCK TABLES `product_colors` WRITE;
/*!40000 ALTER TABLE `product_colors` DISABLE KEYS */;
INSERT INTO `product_colors` VALUES (60,3,'Branco','#ffff',19,'[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]','2026-05-12 18:43:50',0),(61,3,'Azul marinho','#000080',17,'[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]','2026-05-12 18:43:50',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=192 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variations`
--

LOCK TABLES `product_variations` WRITE;
/*!40000 ALTER TABLE `product_variations` DISABLE KEYS */;
INSERT INTO `product_variations` VALUES (186,3,NULL,'G','Branco','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]',9,0.00,'2026-05-12 18:43:50'),(187,3,NULL,'M','Branco','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]',5,0.00,'2026-05-12 18:43:50'),(188,3,NULL,'P','Branco','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716138/Branco_u1wfae.jpg\"]',4,0.00,'2026-05-12 18:43:50'),(189,3,NULL,'G','Azul marinho','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]',2,0.00,'2026-05-12 18:43:50'),(190,3,NULL,'M','Azul marinho','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]',5,0.00,'2026-05-12 18:43:50'),(191,3,NULL,'P','Azul marinho','[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716142/Marinho_mlcxp9.jpg\"]',9,0.00,'2026-05-12 18:43:50');
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
INSERT INTO `products` VALUES (2,'teste','teste',NULL,123.00,109.00,NULL,11,NULL,5,'active',0,0,'[\"https://res.cloudinary.com/dr79k8vl1/image/upload/v1776717067/Preto_Algod%C3%A3o_bxxfmu.jpg\", \"https://res.cloudinary.com/dr79k8vl1/image/upload/v1776717068/Verde_Escuro_ug4owv.jpg\"]',2,0,'2026-04-22 01:58:03','2026-05-12 19:00:53'),(3,'teste checkout','teste-checkout','testando a descrição do produto',0.10,NULL,NULL,34,NULL,4,'active',1,10,'[\"https://res.cloudinary.com/dyhvs3usc/image/upload/v1776716133/Preto_Algod%C3%A3o_tij4bd.jpg\"]',12,0,'2026-04-23 17:07:27','2026-05-12 19:13:11');
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
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (1,7,'be3d9842dec916a4201d7f166b300955a609abfba0f6ea29f5d8beb9b0a066c1','2026-05-18 16:36:11','2026-05-11 16:39:22','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 16:36:10'),(2,8,'91fba3eca77a9046bd54df0bafa8c4abaa3354301b665b0d4a8efc7d5c60e2ca','2026-05-18 16:43:16','2026-05-11 16:44:16','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 16:43:16'),(3,8,'d196e47331ce6be20aee1534c187f0a60076b535d9d01c1f198929096aa68b6c','2026-05-18 16:44:16','2026-05-11 17:03:50','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 16:44:16'),(4,8,'8e6c5b1b01b69f4155086271a6c7d86fd62729b6a7bcd050f35db6a60951aaab','2026-05-18 17:03:50','2026-05-11 17:08:26','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 17:03:50'),(5,8,'dda774a4b842b1d5386a64853edea67e882c87ad78028f41c9dbe2bd7c5c2f25','2026-05-18 17:08:37','2026-05-11 17:09:18','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 17:08:36'),(6,8,'cb8607a0ef17d91b1893a06ca8dce3248709dda09aef1f8fc95beeee67140904','2026-05-18 17:09:18','2026-05-11 17:09:35','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 17:09:18'),(7,8,'57ca5de7010bb31fb4a2f378fd6076f56eabdb6f863793f17e7df7657e3cc072','2026-05-18 17:09:36','2026-05-11 17:09:50','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 17:09:35'),(8,8,'1f499fbd07610e6c8e68969475e2bdff42de0e917a8f0ddb18b104222ac77ab4','2026-05-18 17:13:48','2026-05-11 17:17:48','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 17:13:47'),(9,8,'f6492fd68aca227119519139f5873686c28108309b542a7e01da30c361edfbf9','2026-05-18 17:17:49','2026-05-11 17:17:52','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 17:17:48'),(10,8,'d607891ca41428d8e7233f722093250b495cbeff1325a2b7ac68e5e8534591b6','2026-05-18 17:18:02',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 17:18:01'),(11,4,'6a02eb4907615f52a1ad935333af95f51ee1c172a2eb2afdab45fc4324977923','2026-05-18 17:19:40',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:202b:2537:a395:445c','2026-05-11 17:19:39'),(12,4,'b7d49ad4dbaf3e76609cd7e057f120277df3df29595f60f99dab202b31408e95','2026-05-18 22:59:27',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 22:59:26'),(13,4,'225ef0508ad9aff5774a25400cd2584442cac5b013c30ae0e3a87e9438078da5','2026-05-18 23:16:06','2026-05-11 23:21:07','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 23:16:06'),(14,8,'2110dd1c228cd6ea9105378a3f7ac908f4626fa99afab975338f6dbb123770b5','2026-05-18 23:21:21',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 23:21:20'),(15,8,'acd45acfcf5c9e1029d8c2e1e79447c1dd12ce2ea32e967542d592858cf7cfa8','2026-05-18 23:21:21',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 23:21:21'),(16,4,'aeab9f7a86e664647058e79bde9e9ddc82a7956505ffceea58565978583d2f54','2026-05-18 23:21:58','2026-05-11 23:23:03','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 23:21:58'),(17,8,'9403d1b141c9e2e265102577c380d25ba76679451dbc8b4112ba23addaf2cb42','2026-05-18 23:23:16',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 23:23:16'),(18,4,'ac7545e74ff7f03e0ab8915d4a034bcce0fc12a986d96f035763c32f2be9ea92','2026-05-18 23:32:38',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 23:32:37'),(19,4,'f1692b9ab8fad858db8e697b6998cefd24f8d12ac8e5d15dbcc71cae85e9dce4','2026-05-18 23:34:42',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 23:34:42'),(20,4,'d5f213f5fa243909b74d1ebac06d78fe992dbf2ead93d7af4362136e1a707346','2026-05-18 23:43:59',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 23:43:58'),(21,4,'479d095a42a443400ceaa81cbd432fa2596136b7db3783010e4b701edceaa4b1','2026-05-18 23:44:52',NULL,'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-11 23:44:52'),(22,4,'148f8e04c517335cee13d71d63472ce33671c4f22ce7b5f3764e993ad7c0367a','2026-05-19 00:04:09','2026-05-12 00:21:08','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 00:04:09'),(23,4,'05ce058aae378b73e9ca9124900032b852e34f1d1d00a6517a9204423ca68da5','2026-05-19 00:21:08','2026-05-12 00:36:30','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 00:21:08'),(24,4,'dc40b5ef0f575179ec34bdbc9676951224099069780bf0fc5eb51f63bde63ec4','2026-05-19 00:36:30',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 00:36:30'),(25,4,'52586d3bd2b4b0035b9d602ecebe0a54222876b7e8d79eafeda9b2df1b5f74b7','2026-05-19 10:15:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 10:15:24'),(26,4,'4d70805a822070e4af17c49eb472696ec0b3662777625a1af4ecdca6ab31b09a','2026-05-19 10:32:56','2026-05-12 10:36:56','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 10:32:56'),(27,4,'5d06b068392d905d2d0646ac4556efa4402145b89e85513068ede052fd7ac710','2026-05-19 10:37:09','2026-05-12 10:40:00','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 10:37:08'),(28,9,'982717814950b27779e5215738e30da2549ceccbe029570268e9aec0a81393c2','2026-05-19 10:41:19',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 10:41:19'),(29,4,'3339ab6e601ae58836eab8bd3c30a027acc40a34f043391d35de54c564b080c2','2026-06-11 10:43:55','2026-05-12 10:46:01','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 10:43:54'),(30,9,'8fa9be1b4abf6574a480cc299071b3fb0206e83f7d15858fd2c31607cd94581a','2026-05-19 10:46:10','2026-05-12 15:16:35','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 10:46:09'),(31,9,'fcab9fa2f080d7936bab5988b7cd4b104dae91d747ae3b423c201db5c2fad0b6','2026-05-19 15:16:35',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 15:16:35'),(32,4,'6747c0d295200160042a859300971339ef13f5606965018512acde1f211df6a2','2026-06-11 15:17:20','2026-05-12 15:18:04','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 15:17:19'),(33,10,'f8afa256d07f5fa07a91ef820813c7485532bdba7216fbef9a2929b79d5fc678','2026-05-19 15:19:57',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 15:19:56'),(34,4,'c9ca3fba6a3c12974a9beabb7f3d038279853b5b32feedcd3a625f8935afb9cd','2026-05-19 15:20:46','2026-05-12 15:37:30','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 15:20:45'),(35,4,'754edefcc418e439f5e94bbd04c170e036a6e411e0ed2227a282bc4c96b526c7','2026-05-19 15:42:54','2026-05-12 15:45:09','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 15:42:53'),(36,10,'4a781e4cab8885e06c6b3028c0c0cad5e7d513d450f764de9bcde45026f93c75','2026-05-19 15:45:40','2026-05-12 15:55:19','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 15:45:40'),(37,10,'358d9dcf5cf007f74bb542bae16b3dd12cacc800e80826976105ac9fe5e62494','2026-05-19 15:58:07','2026-05-12 16:01:10','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 15:58:07'),(38,8,'03466ea867540405f8fa7d701166b394c8f50922a060b322c05de3e21efd3c6e','2026-05-19 16:01:19','2026-05-12 16:01:56','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:01:18'),(39,11,'fb65f41bd522dcb50949b20adb117fd9add0ad286b2787d3d1b91ca8e041b4b4','2026-05-19 16:02:41','2026-05-12 16:04:24','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:02:41'),(40,4,'8d61f84c9cfe8310b558227a528620f7fa258167c137681d2de876d6d71cf20f','2026-05-19 16:04:31','2026-05-12 16:05:26','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:04:31'),(41,10,'d3655dc47e6f129428161827ee8a1b54501f63b3529aff75382652e6a05d5fae','2026-05-19 16:05:36','2026-05-12 16:10:20','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:05:35'),(42,13,'3d9d6e20f09ccfc87b2ac55f84c1ebceacedd2206467a07b0c77f5f35a05792e','2026-05-19 16:11:40',NULL,'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:11:40'),(43,4,'6b2d16fc01a8c835c36d405af415eb29b70b5015ad15a512fa83c64f7489bdbf','2026-05-19 16:14:30',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2804:14c:5bd6:92ab:acec:102c:1b86:b6f8','2026-05-12 16:14:29');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (1,8,'Rua Vicente Penido','141',NULL,'N S Aparecida','Resende Costa','PE','36340-000',1,'2026-05-12 02:21:45'),(2,9,'Rua Vicente Penido','141',NULL,'N S Aparecida','Resende Costa','MG','36340-000',1,'2026-05-12 13:42:33'),(3,10,'Rua Teste','141',NULL,'N S Aparecida','Teste','MG','32673-098',1,'2026-05-12 18:58:54'),(4,13,'Rua Vicente Penido','143',NULL,'N S Aparecida','Teste','MG','32673-098',1,'2026-05-12 19:13:11');
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Lucas Alves Resende','lucas@gmail.com','$2b$10$2RjBQZYWViGIelS6fjQ/Ue0dhp4StSzXWp8vEyTSgneXSOVNtyLli','(32) 99943-0189',NULL,'user',NULL,NULL,NULL,NULL,'2026-04-21 18:07:40',NULL,0,'local',NULL,0,0),(4,'Administrador','admin@velvetstore.com','$2b$10$DOqnFImbRCDjiAdwRN38Rug4sBEuN5H1fHo5gFeRSh86/ox1DoKGm','',NULL,'admin',NULL,NULL,NULL,NULL,'2026-04-21 18:17:16','2026-05-12 18:17:28',0,'local',NULL,0,0),(5,'João Gabriel','joao@gmail.com','$2b$10$iD2ZX.m5XH6mqtyUt54OUOIeMxZPnyLHtjVGVPd5LTLqpxFQXILkC','(31) 999970-7070','111.111.111-11','user',NULL,NULL,NULL,NULL,'2026-04-24 16:17:09',NULL,0,'local',NULL,0,0),(6,'Pedro Resende','pedro@gmail.com','$2b$10$GwcCYG1yHHrg0kxNLvWNn..rS3311tUkP3OtjonMPo2UXBpEE.Zsa','(32) 99945-6789','120.077.654-32','user',NULL,NULL,NULL,NULL,'2026-05-07 17:04:34','2026-05-08 19:06:01',0,'local',NULL,0,0),(7,'Leandro Alencar','leandro@gmail.com','$2b$12$POrR9sw1JOFIUMxzOqjSOuM5HarKlvGDnB84FOj6nQAMloRynV1T6','(32) 99930-3221','120.078.866-54','user',NULL,NULL,NULL,NULL,'2026-05-11 19:35:52',NULL,0,'local',NULL,0,0),(8,'Guilherme Silva','guilherme@gmail.com','$2b$12$4lf9ebBwVrvPJQ2vw9O/9ur6l9IFEd0czeXaE7h9tXa0rIPlleBRW','(31) 99932-1455','120.987.654-22','user',NULL,NULL,NULL,NULL,'2026-05-11 19:43:03','2026-05-11 20:17:48',1,'local',NULL,0,0),(9,'Lucas Alves Resende','lucasalves2180@gmail.com','$2b$12$W6xEbjZcQTk32DV4OY6vn.8csk6rBRp5OCG/YKUrLLwy422pKXqsC','(32) 99943-0189','120.078.866-42','user',NULL,NULL,NULL,NULL,'2026-05-12 13:40:35',NULL,0,'local',NULL,0,0),(10,'João Gabriel','joaogabriel@gmail.com','$2b$12$Jb1RZ49vH3RwUTCc4Er/meYmh7bXhVjtzDQFJQfPtzs7KEaAGn4Za','(31) 77987-4244','111.929.019-12','user',NULL,NULL,NULL,NULL,'2026-05-12 18:19:45',NULL,0,'local',NULL,0,0),(11,'Gustavo Silva','gustavo@gmail.com','$2b$12$IuJjp0BqcXVSshTLVQz9fefPEL/908L0UQugrmQ.He7zj4mwCUTVe','(31) 99978-6542','111.111.111-23','user',NULL,NULL,NULL,NULL,'2026-05-12 19:02:32',NULL,0,'local',NULL,0,0),(13,'Junior','junior@gmail.com','$2b$12$r435DEdTrNwcNMqnA8pyhOUMxq3Dx3OBsOQ0RiNIznX8ZZAkxob/K','(39) 87461-7284',NULL,'user',NULL,NULL,NULL,NULL,'2026-05-12 19:11:29',NULL,0,'local',NULL,0,0);
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
INSERT INTO `wishlists` VALUES (4,4,3,'2026-05-08 01:04:03');
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

-- Dump completed on 2026-05-12 16:16:52
