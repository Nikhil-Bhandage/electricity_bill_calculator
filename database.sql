CREATE DATABASE IF NOT EXISTS power_grid;
USE power_grid;

CREATE TABLE config (
    id INT PRIMARY KEY,
    days INT,
    rate DECIMAL(10,2),
    fixed_charge DECIMAL(10,2),
    tax DECIMAL(5,2)
);

INSERT INTO config
VALUES (1, 30, 8, 150, 5);

CREATE TABLE appliances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    power FLOAT,
    hours FLOAT,
    qty INT
);