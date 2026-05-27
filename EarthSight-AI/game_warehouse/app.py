# -*- coding: utf-8 -*-
import web

# 1. 路由配置：定义访问哪个 URL 执行哪个类
urls = ("/", "Index", "/add", "Add", "/edit/(\d+)", "Edit", "/delete/(\d+)", "Delete")

# 2. 数据库连接配置 (请修改为你自己的 MySQL 账号密码)
db = web.database(
    dbn="mysql",
    host="127.0.0.1",
    port=3306,
    user="root",  # 你的用户名
    pw="yutujun060112",  # 你的密码
    db="game_db",
    charset="utf8mb4",
)

# 3. 指定模板目录
render = web.template.render("templates/")


class Index:
    def GET(self):
        # 获取 URL 参数，比如 /?keyword=战神
        i = web.input(keyword=None)

        # 1. 查询游戏列表（加入搜索逻辑）
        if i.keyword:
            # 使用 SQL 的 LIKE 进行模糊查询，%$i.keyword% 表示包含该文字即可
            games = db.select(
                "games",
                where="title LIKE $k",
                vars={"k": "%" + i.keyword + "%"},
                order="id DESC",
            )
        else:
            # 如果没有关键词，显示全部
            games = db.select("games", order="id DESC")

        # 2. 为 ECharts 准备全局统计数据（图表通常展示整体情况，不随搜索改变）
        stats_raw = db.query(
            "SELECT platform, COUNT(*) as count FROM games GROUP BY platform"
        )
        stats_list = list(stats_raw)

        total = db.query("SELECT COUNT(*) as count FROM games")[0].count
        completed = db.query(
            "SELECT COUNT(*) as count FROM games WHERE status='已通关'"
        )[0].count
        rate = round((completed / total * 100), 2) if total > 0 else 0

        # 返回页面，同时把搜索词 keyword 传回去，让搜索框显示“你刚才搜了啥”
        return render.index(games=games, stats=stats_list, rate=rate, keyword=i.keyword)


class Add:
    def GET(self):
        return render.add()

    def POST(self):
        i = web.input()
        # 将前端表单数据插入数据库
        db.insert(
            "games",
            title=i.title,
            platform=i.platform,
            genre=i.genre,
            status=i.status,
            rating=int(i.rating),
        )
        raise web.seeother("/")


class Edit:
    def GET(self, gid):
        # 根据 ID 获取单个游戏信息
        game = db.select("games", where="id=$gid", vars={"gid": gid})[0]
        return render.edit(game=game)

    def POST(self, gid):
        i = web.input()
        # 更新记录
        db.update(
            "games",
            where="id=$gid",
            vars={"gid": gid},
            title=i.title,
            platform=i.platform,
            genre=i.genre,
            status=i.status,
            rating=int(i.rating),
        )
        raise web.seeother("/")


class Delete:
    def GET(self, gid):
        # 删除记录
        db.delete("games", where="id=$gid", vars={"gid": gid})
        raise web.seeother("/")


if __name__ == "__main__":
    app = web.application(urls, globals())
    app.run()
