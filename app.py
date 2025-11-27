import web
import pymysql
import json
import datetime
import os

# --- 配置 ---
urls = (
    "/",
    "Dashboard",
    "/tasks",
    "Tasks",
    "/api/stats",
    "ApiStats",
    "/api/tasks",
    "ApiTasks",
)

# --- 数据库连接 ---
# 请确保密码正确
db = web.database(
    dbn="mysql", user="root", pw="YOUR_PASSWORD", db="todo_project", driver="pymysql"
)


# --- JSON 序列化辅助函数 ---
class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)


# --- 模板渲染配置 (修复 Windows 编码问题) ---
class Utf8Render(web.template.render):
    def _load_template(self, name):
        path = os.path.join(self._loc, name)

        # 情况1：如果是目录（用于子目录模板）
        if os.path.isdir(path):
            return Utf8Render(
                path, base=self._base, globals=self._globals, builtins=self._builtins
            )

        # 情况2：文件不存在，尝试自动添加 .html 后缀
        # web.py 默认行为是允许省略后缀的，这里我们需要手动补回来
        if not os.path.exists(path):
            if os.path.exists(path + ".html"):
                path += ".html"
            else:
                # 如果加了后缀还不存在，就让 open() 去抛出异常，或者手动抛出
                # 这样可以保留原始的文件名报错信息
                pass

        # 强制使用 UTF-8 读取模板内容
        with open(path, "r", encoding="utf-8") as f:
            return web.template.Template(f.read(), filename=path, **self._keywords)


# 1. 定义一个专门给模板使用的序列化函数
def json_dumps(obj):
    return json.dumps(obj, cls=DateEncoder)


# 2. 初始化渲染器
# 将 'json_dumps': json_dumps 加入到 globals 中
render = Utf8Render("templates/", base="layout", globals={"json_dumps": json_dumps})


# --- 页面控制器 ---


class Dashboard:
    def GET(self):
        return render.dashboard()


class Tasks:
    def GET(self):
        # 获取查询参数
        data = web.input(status=None, assignee=None)

        # 1. 初始化查询语句和参数字典
        # 这里的 params 是一个字典，配合 SQL 中的 $key 使用
        query = "SELECT * FROM tasks"
        conditions = []
        params = {}

        # 2. 动态构建查询条件
        if data.status:
            # 这里的 $status 对应 params['status']
            conditions.append("status = $status")
            params["status"] = data.status

        if data.assignee:
            # 这里的 $assignee 对应 params['assignee']
            conditions.append("assignee LIKE $assignee")
            params["assignee"] = f"%{data.assignee}%"

        # 3. 拼接 WHERE 子句
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        # 4. 添加排序
        query += " ORDER BY created_at DESC"

        # 5. 执行查询
        # web.py 会自动把 SQL 中的 $key 替换为 params[key] 的安全转义值
        tasks = db.query(query, vars=params)

        return render.tasks(tasks)


# --- API 控制器 ---
class ApiStats:
    def GET(self):
        web.header("Content-Type", "application/json")

        try:
            # --- 1. 任务状态分布 (饼图) ---
            status_res = db.query(
                "SELECT status, COUNT(*) as count FROM tasks GROUP BY status"
            )
            status_data = [{"name": r.status, "value": r.count} for r in status_res]

            # --- 2. 负责人任务堆叠 (柱状图) ---
            # 兼容处理：确保 assignee 不为 None
            assignee_res = db.query(
                """
                SELECT assignee, status, COUNT(*) as count 
                FROM tasks 
                GROUP BY assignee, status
            """
            )

            # 过滤掉 assignee 为空的数据
            valid_assignees = [r for r in assignee_res if r.assignee]
            assignees_list = list(set([r.assignee for r in valid_assignees]))

            assignee_data = {
                "categories": assignees_list,
                "series": {
                    "Todo": [0] * len(assignees_list),
                    "In Progress": [0] * len(assignees_list),
                    "Done": [0] * len(assignees_list),
                },
            }

            for r in valid_assignees:
                if r.assignee in assignees_list:
                    idx = assignees_list.index(r.assignee)
                    if r.status in assignee_data["series"]:
                        assignee_data["series"][r.status][idx] = r.count

            # --- 3. 任务创建趋势 (折线图) ---
            # 使用 create_date 别名防止关键字冲突
            trend_res = db.query(
                """
                SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as create_date, COUNT(*) as count 
                FROM tasks 
                GROUP BY create_date 
                ORDER BY create_date ASC
            """
            )

            # 数据清洗：确保 date 是字符串格式
            clean_dates = []
            clean_counts = []

            for r in trend_res:
                if not r.create_date:
                    continue  # 跳过空日期

                # 兼容性处理：pymysql 有时返回 str，有时返回 date 对象
                d_val = r.create_date
                if isinstance(d_val, (datetime.date, datetime.datetime)):
                    d_str = d_val.strftime("%Y-%m-%d")
                else:
                    d_str = str(d_val)

                clean_dates.append(d_str)
                clean_counts.append(r.count)

            # 补点逻辑：如果只有一个数据点，补一个“昨天”的数据为0，让线条能画出来
            if len(clean_dates) == 1:
                try:
                    # 安全地解析日期
                    current_date = datetime.datetime.strptime(
                        clean_dates[0], "%Y-%m-%d"
                    )
                    yesterday = (current_date - datetime.timedelta(days=1)).strftime(
                        "%Y-%m-%d"
                    )
                    clean_dates.insert(0, yesterday)
                    clean_counts.insert(0, 0)
                except Exception:
                    # 如果日期解析失败，就不补了，保证不报错
                    pass

            trend_data = {"dates": clean_dates, "counts": clean_counts}

            # 成功返回
            return json.dumps(
                {
                    "status": "success",
                    "status_chart": status_data,
                    "assignee_chart": assignee_data,
                    "trend_chart": trend_data,
                },
                cls=DateEncoder,
            )

        except Exception as e:
            # 🔴 关键修改：如果出错，返回 JSON 格式的错误，而不是 None
            print(f"API Error: {e}")  # 在终端打印错误以便调试
            return json.dumps(
                {
                    "status": "error",
                    "message": str(e),
                    # 返回空数据结构防止前端 ECharts 报错
                    "status_chart": [],
                    "assignee_chart": {"categories": [], "series": {}},
                    "trend_chart": {"dates": [], "counts": []},
                }
            )


class ApiTasks:
    def POST(self):
        web.header("Content-Type", "application/json")
        data = json.loads(web.data())
        try:
            db.insert(
                "tasks",
                title=data["title"],
                assignee=data["assignee"],
                priority=data["priority"],
                status=data["status"],
                due_date=data.get("due_date") or None,
            )
            return json.dumps({"status": "success"})
        except Exception as e:
            return json.dumps({"status": "error", "message": str(e)})

    def PUT(self):
        web.header("Content-Type", "application/json")
        data = json.loads(web.data())
        task_id = data.get("task_id")
        if not task_id:
            return json.dumps({"status": "error"})

        try:
            db.update(
                "tasks",
                where="task_id=$task_id",
                vars={"task_id": task_id},
                title=data["title"],
                assignee=data["assignee"],
                priority=data["priority"],
                status=data["status"],
                due_date=data.get("due_date") or None,
            )
            return json.dumps({"status": "success"})
        except Exception as e:
            return json.dumps({"status": "error", "message": str(e)})

    def DELETE(self):
        web.header("Content-Type", "application/json")
        data = json.loads(web.data())
        task_id = data.get("task_id")
        try:
            db.delete("tasks", where="task_id=$task_id", vars={"task_id": task_id})
            return json.dumps({"status": "success"})
        except Exception as e:
            return json.dumps({"status": "error", "message": str(e)})


if __name__ == "__main__":
    app = web.application(urls, globals())
    app.run()
