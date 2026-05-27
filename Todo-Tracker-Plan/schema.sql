CREATE DATABASE IF NOT EXISTS todo_project DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
USE todo_project;

CREATE TABLE IF NOT EXISTS tasks (
    task_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    assignee VARCHAR(50) NOT NULL,
    priority ENUM('Low', 'Medium', 'High') NOT NULL,
    status ENUM('Todo', 'In Progress', 'Done') NOT NULL,
    due_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入一些测试数据
INSERT INTO tasks (title, assignee, priority, status, due_date, created_at) VALUES 
('设计数据库架构', '张三', 'High', 'Done', '2025-11-01', '2025-10-25 10:00:00'),
('前端页面开发', '李四', 'Medium', 'In Progress', '2025-11-05', '2025-10-26 14:00:00'),
('后端接口编写', '张三', 'High', 'In Progress', '2025-11-06', '2025-10-27 09:00:00'),
('编写测试用例', '王五', 'Low', 'Todo', '2025-11-10', '2025-10-28 16:00:00'),
('部署上线', '李四', 'High', 'Todo', '2025-11-15', '2025-11-01 11:00:00');