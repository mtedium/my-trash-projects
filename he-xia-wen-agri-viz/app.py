from flask import Flask, send_from_directory

# 初始化 Flask
# static_folder='static': 告诉 Flask 你的文件存在哪里
# static_url_path='': 告诉 Flask 在 URL 中不使用前缀（直接映射到根路径）
app = Flask(__name__, static_folder='static', static_url_path='')

@app.route('/')
def root():
    # 当访问 http://127.0.0.1:5000/ 时，主动返回 index.html
    return send_from_directory('static', 'index.html')

# 注意：
# 不需要再写其他 route 了。
# 因为设置了 static_url_path=''，Flask 会自动去 static 文件夹里
# 寻找 style.css, script.js, data/agriculture.json 等文件。

if __name__ == '__main__':
    print("---------------------------------------")
    print(" 禾下问演示服务器启动")
    print(" 访问地址: http://127.0.0.1:5000")
    print(" 请确保 index.html, css, js 都在 static 文件夹内")
    print("---------------------------------------")
    # debug=True 方便修改前端代码后刷新即生效
    app.run(port=5000, debug=True)