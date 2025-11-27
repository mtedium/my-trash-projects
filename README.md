# 📊 ProKanban - 轻量级项目进度看板

这是一个基于 Python `web.py` 和 MySQL 构建的小型项目管理工具。它提供了现代化的任务看板（Dashboard）和全功能的任务管理界面，前端采用 Bootstrap 5 和 ECharts 实现响应式布局与数据可视化。

## ✨ 主要功能

* **📈 数据看板 (Dashboard)**
  * **工作完成度**：通过饼图直观展示任务状态分布。
  * **团队负载**：堆叠柱状图分析每位成员在不同状态下的任务量。
  * **新增趋势**：折线/面积图展示每日任务创建趋势（自动补全数据点）。
* **📝 任务管理 (Task Manager)**
  * **CRUD 操作**：支持任务的新增、查询、编辑和删除。
  * **无刷新交互**：使用 AJAX + Bootstrap Modal 实现流畅的用户体验。
  * **筛选功能**：支持按“状态”和“负责人”快速过滤任务。
  * **状态高亮**：根据任务优先级和状态自动应用不同的颜色标签。

## 🛠️ 技术栈

* **后端**：Python 3.x, web.py (0.62)
* **数据库**：MySQL (PyMySQL 驱动)
* **前端**：Bootstrap 5.3, ECharts 5.4, Native JavaScript (Fetch API)
* **模板引擎**：web.py 内置模板 (Templetor)

## 🚀 快速开始

### 1. 环境准备

确保您的系统已安装：

* Python 3.8+
* MySQL 5.7 或 8.0+

### 2. 安装依赖

在项目根目录下创建虚拟环境（推荐）并安装依赖：

```bash
# 安装核心依赖
pip install web.py==0.62 pymysql==1.1.0 cryptography
```

### 3. 数据库配置

1. 登录您的 MySQL 数据库。
2. 执行以下 SQL 语句创建数据库和表结构：

```sql
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

-- (可选) 插入测试数据
INSERT INTO tasks (title, assignee, priority, status, due_date, created_at) VALUES 
('搭建后端框架', 'Admin', 'High', 'Done', CURDATE(), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('集成 ECharts 图表', 'Dev', 'Medium', 'In Progress', CURDATE(), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('编写测试用例', 'QA', 'Low', 'Todo', DATE_ADD(CURDATE(), INTERVAL 3 DAY), NOW());
```

### 4. 修改连接配置

打开 `app.py`，找到数据库连接部分，修改为您自己的数据库密码：

```python
db = web.database(dbn='mysql', user='root', pw='YOUR_PASSWORD', db='todo_project', driver='pymysql')
```

### 5. 运行项目

```bash
python app.py
```

终端显示 `http://0.0.0.0:8080/` 即表示启动成功。
请在浏览器访问：[http://localhost:8080](http://localhost:8080)

## 📂 项目目录结构

```text
todo-project/
│
├── app.py              # 核心后端逻辑 (路由、API、数据库操作)
├── README.md           # 项目说明文档
├── requirements.txt    # 依赖列表
└── templates/          # 前端模板文件
    ├── layout.html     # 全局布局 (Navbar, JS/CSS 引用)
    ├── dashboard.html  # 看板页 (ECharts 图表)
    └── tasks.html      # 任务列表页 (模态框, 表格)
```

## ⚠️ 常见问题与修复 (Troubleshooting)

本项目已针对 Windows 环境和 web.py 的常见陷阱进行了特殊处理，如果您修改代码时遇到问题，请参考：

1. **Windows 下的编码错误 (`UnicodeDecodeError: 'gbk'`)**
    * **原因**：web.py 默认使用系统编码读取模板。
    * **解法**：项目中已通过 `class Utf8Render` 强制重写了模板加载逻辑，请勿删除 `app.py` 中的该类定义。

2. **JSON 序列化错误 (`TypeError: Object of type date is not JSON serializable`)**
    * **原因**：Python 的 `datetime` 对象无法直接转为 JSON。
    * **解法**：项目中已包含 `DateEncoder` 类和 `json_dumps` 辅助函数，确保在模板中使用 `$json_dumps(obj)` 而不是原生 `json`。

3. **Bootstrap 模态框报错 (`bootstrap is not defined`)**
    * **原因**：JS 加载顺序错误。
    * **解法**：`layout.html` 中已将 Bootstrap 的 `<script>` 标签移至 `<head>`，确保子页面加载时库已就绪。

4. **SQL 语法错误 (1064 Error)**
    * **原因**：混用 `%s` 和 web.py 的 `vars` 参数。
    * **解法**：始终使用 `db.query("... $param ...", vars={'param': val})` 的写法，避免手动拼接字符串。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进这个项目！
