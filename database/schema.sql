DROP DATABASE IF EXISTS bd_apontamentos;
CREATE DATABASE bd_apontamentos;
USE bd_apontamentos;

CREATE TABLE Area (
    ID_Area INT PRIMARY KEY AUTO_INCREMENT,
    NomeArea VARCHAR(100) NOT NULL
);

CREATE TABLE Time (
    ID_Time INT PRIMARY KEY AUTO_INCREMENT,
    NomeTime VARCHAR(100) NOT NULL,
    fk_ID_Area INT NOT NULL
);

CREATE TABLE Usuario (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    NomeUsuario VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Senha VARCHAR(255) NOT NULL,
    fk_ID_Time INT NOT NULL
);
 
ALTER TABLE Time ADD CONSTRAINT FK_Time_Area
    FOREIGN KEY (fk_ID_Area)
    REFERENCES Area (ID_Area)
    ON DELETE RESTRICT;

ALTER TABLE Usuario ADD CONSTRAINT FK_Usuario_Time
    FOREIGN KEY (fk_ID_Time)
    REFERENCES Time (ID_Time)
    ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS Pilares(
    ID_Pilar INT AUTO_INCREMENT PRIMARY KEY,
    NomePilar VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS Projetos (
    ID_Projeto INT AUTO_INCREMENT PRIMARY KEY,
    NomeProjeto VARCHAR(100) NOT NULL,

    fk_ID_Pilar INT NOT NULL,
    FOREIGN KEY (fk_ID_Pilar) REFERENCES Pilares(ID_Pilar)
);
CREATE TABLE IF NOT EXISTS Apotamentos (
    ID_Apontamento INT AUTO_INCREMENT PRIMARY KEY,
    Descricao VARCHAR(255),

    Data_Inicio DATETIME NOT NULL,
    Data_Fim DATETIME,

    fk_ID_Usuario INT NOT NULL,
    fk_ID_Projeto INT NOT NULL,

    FOREIGN KEY (fk_ID_Usuario) REFERENCES Usuario(ID),
    FOREIGN KEY (fk_ID_Projeto) REFERENCES Projetos(ID_Projeto)
);

INSERT INTO Pilares (NomePilar) VALUES
('Atividades Recorrentes'), 
('Pessoas'), 
('Ausência'), 
('Desenvolvimento de Produto'), 
('Suporte Técnico'), 
('LCM'), 
('OnePlan'), 
('DT²'), 
('Digital First');

INSERT INTO Projetos (NomeProjeto, fk_ID_Pilar) VALUES
('Análises e Documentações (Procs, Normas, Forms...)', 1),
('Gestão Financeira (Focal)', 1),
('Iniciativas Individuais (Melhorias)', 1),
('Planejamento de Atividades', 1),
('Edge Up', 9);

-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: bd_apontamentos
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `apontamentos`
--

DROP TABLE IF EXISTS `apontamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apontamentos` (
  `ID_Apontamento` int NOT NULL AUTO_INCREMENT,
  `Descricao` varchar(255) DEFAULT NULL,
  `Data_Inicio` datetime NOT NULL,
  `Data_Fim` datetime DEFAULT NULL,
  `fk_ID_Usuario` int NOT NULL,
  `fk_ID_Projeto` int NOT NULL,
  PRIMARY KEY (`ID_Apontamento`),
  KEY `fk_ID_Usuario` (`fk_ID_Usuario`),
  KEY `fk_ID_Projeto` (`fk_ID_Projeto`),
  CONSTRAINT `apontamentos_ibfk_1` FOREIGN KEY (`fk_ID_Usuario`) REFERENCES `usuario` (`ID`),
  CONSTRAINT `apontamentos_ibfk_2` FOREIGN KEY (`fk_ID_Projeto`) REFERENCES `projetos` (`ID_Projeto`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apontamentos`
--

LOCK TABLES `apontamentos` WRITE;
/*!40000 ALTER TABLE `apontamentos` DISABLE KEYS */;
INSERT INTO `apontamentos` VALUES (2,'Plataforma de Apontamentos','2025-10-09 20:07:06','2025-10-09 20:07:16',7,5),(3,'Plataforma de Apontamentos','2025-10-09 20:36:56','2025-10-09 20:37:07',7,5),(4,'Plataforma de Apontamentos','2025-10-09 21:06:43','2025-10-09 21:07:45',7,5),(5,'Plataforma de Apontamentos','2025-10-09 22:38:27','2025-10-09 22:38:43',7,5),(6,'PowerBi Custos','2025-10-09 22:54:02',NULL,7,3),(7,'aaa','2025-10-09 22:55:23','2025-10-09 22:55:23',7,2),(8,'Plataforma de Apontamentos','2025-10-09 22:56:36','2025-10-09 22:56:39',7,5),(9,'Plataforma de Apontamentos','2025-10-11 18:09:20','2025-10-11 18:10:01',12,5),(10,'Plataforma de Apontamentos','2025-10-11 21:44:44','2025-10-11 21:44:51',13,5);
/*!40000 ALTER TABLE `apontamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `area`
--

DROP TABLE IF EXISTS `area`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `area` (
  `ID_Area` int NOT NULL AUTO_INCREMENT,
  `NomeArea` varchar(100) NOT NULL,
  PRIMARY KEY (`ID_Area`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `area`
--

LOCK TABLES `area` WRITE;
/*!40000 ALTER TABLE `area` DISABLE KEYS */;
INSERT INTO `area` VALUES (1,'Engenharia'),(2,'Innovation'),(3,'Clinical');
/*!40000 ALTER TABLE `area` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pilares`
--

DROP TABLE IF EXISTS `pilares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pilares` (
  `ID_Pilar` int NOT NULL AUTO_INCREMENT,
  `NomePilar` varchar(100) NOT NULL,
  PRIMARY KEY (`ID_Pilar`),
  UNIQUE KEY `NomePilar` (`NomePilar`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pilares`
--

LOCK TABLES `pilares` WRITE;
/*!40000 ALTER TABLE `pilares` DISABLE KEYS */;
INSERT INTO `pilares` VALUES (1,'Atividades Recorrentes'),(3,'Aus├¬ncia'),(4,'Desenvolvimento de Produto'),(9,'Digital First'),(8,'DT┬▓'),(6,'LCM'),(7,'OnePlan'),(2,'Pessoas'),(5,'Suporte T├®cnico');
/*!40000 ALTER TABLE `pilares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projetos`
--

DROP TABLE IF EXISTS `projetos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projetos` (
  `ID_Projeto` int NOT NULL AUTO_INCREMENT,
  `NomeProjeto` varchar(100) NOT NULL,
  `fk_ID_Pilar` int NOT NULL,
  PRIMARY KEY (`ID_Projeto`),
  KEY `fk_ID_Pilar` (`fk_ID_Pilar`),
  CONSTRAINT `projetos_ibfk_1` FOREIGN KEY (`fk_ID_Pilar`) REFERENCES `pilares` (`ID_Pilar`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projetos`
--

LOCK TABLES `projetos` WRITE;
/*!40000 ALTER TABLE `projetos` DISABLE KEYS */;
INSERT INTO `projetos` VALUES (1,'An├ílises e Documenta├º├Áes (Procs, Normas, Forms...)',1),(2,'Gest├úo Financeira (Focal)',1),(3,'Iniciativas Individuais (Melhorias)',1),(4,'Planejamento de Atividades',1),(5,'Edge Up',9);
/*!40000 ALTER TABLE `projetos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `time`
--

DROP TABLE IF EXISTS `time`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time` (
  `ID_Time` int NOT NULL AUTO_INCREMENT,
  `NomeTime` varchar(100) NOT NULL,
  `fk_ID_Area` int NOT NULL,
  PRIMARY KEY (`ID_Time`),
  KEY `FK_Time_Area` (`fk_ID_Area`),
  CONSTRAINT `FK_Time_Area` FOREIGN KEY (`fk_ID_Area`) REFERENCES `area` (`ID_Area`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `time`
--

LOCK TABLES `time` WRITE;
/*!40000 ALTER TABLE `time` DISABLE KEYS */;
INSERT INTO `time` VALUES (1,'P&D',1),(2,'DT2',1),(3,'PMO',1),(4,'LCM',1),(5,'Performance',1);
/*!40000 ALTER TABLE `time` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `NomeUsuario` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Senha` varchar(255) NOT NULL,
  `fk_ID_Time` int NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Email` (`Email`),
  KEY `FK_Usuario_Time` (`fk_ID_Time`),
  CONSTRAINT `FK_Usuario_Time` FOREIGN KEY (`fk_ID_Time`) REFERENCES `time` (`ID_Time`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (6,'Thiago Moreira','thiago.moreira@neodent.com','$2b$12$MWRbHCZxeb/hY86RkibXYeW3C04rjVY7W2DDQV5/E/72ydeBoBv.m',3),(7,'Rafael Leal','rafael.leal@neodent.com','$2b$12$EitW4cnssoOyV2sXgThiPel/AfD8KSdmBljDjluKW5.M8n/uSkglG',5),(8,'Juca Marcelo','juca.marcelo@neodent.com','$2b$12$4jQJJ5XE6Q3fxcUNvwiMMeuqLeX09xEcTniRDviZK9q.7/tak35fC',1),(10,'Jo├úo Vitor Juk','joao.juk@neodent.com','$2b$12$CrUvBOuGm9w6CwOqnY0tBOxzECTmHU0gVZGRZGZkTK4xAD69DHcT6',2),(11,'Jacqueline Lima','jacqueline.lima@neodent.com','$2b$12$tUtNX42Q24iBfqzH.ahXBOpDGLAKWuVEO/fkrz7CD69BCFvouKPT.',1),(12,'Julia Pereira','julia.pereira@neodent.com','$2b$12$yxyKjzunFTmsKtUY39YjVO1/1duuK3ngdnTMvKk0MD0CAQjORgChm',5),(13,'Kleber Nunes','kleber.nunes@neodent.com','$2b$12$a1ESh8eCLRZNBS0tgxMOFO0l1iFtiXqPPWbXKmFVsjiLAK2waPIt2',1);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-11 22:26:55
