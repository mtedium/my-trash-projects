CREATE DATABASE IF NOT EXISTS game_db CHARACTER SET utf8mb4;
USE game_db;

CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL COMMENT '游戏名称',
    platform VARCHAR(50) NOT NULL COMMENT '平台: Steam/Switch/PS5/Epic',
    genre VARCHAR(50) COMMENT '类型: RPG/FPS/ACT',
    status VARCHAR(20) DEFAULT '吃灰中' COMMENT '状态: 吃灰中/进行中/已通关',
    rating INT DEFAULT 0 COMMENT '评分: 1-10',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);