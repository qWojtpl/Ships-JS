DROP DATABASE IF EXISTS ships;

CREATE DATABASE IF NOT EXISTS ships;

USE ships;

CREATE TABLE IF NOT EXISTS games (
    id_game INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    status INT,
    opened BIT,
    corners BIT,
    createDate DATE
);

ALTER TABLE games AUTO_INCREMENT = 10000;

CREATE TABLE IF NOT EXISTS ships (
    id_ship INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    isHost BIT,
    id_game INT NOT NULL,
    cordX INT,
    cordY INT,
    defaultLength INT,
    isRotated INT,
    FOREIGN KEY (id_game) REFERENCES games(id_game)
);

CREATE TABLE IF NOT EXISTS shots (
    id_shot INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    isHost BIT,
    id_game INT NOT NULL,
    cordX INT,
    cordY INT,
    FOREIGN KEY (id_game) REFERENCES games(id_game)
);

CREATE TABLE IF NOT EXISTS shipPlacementCount (
    id_place INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    shipType INT,
    shipCount INT,
    id_game INT,
    isHost BIT,
    FOREIGN KEY (id_game) REFERENCES games(id_game)
)