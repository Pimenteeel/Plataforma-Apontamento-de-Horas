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