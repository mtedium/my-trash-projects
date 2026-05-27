from flask import Flask, jsonify, request, render_template
from services.data_engine import get_clustered_earthquake_data
from services.ai_engine import analyze_seismic_activity

app = Flask(__name__)

# 1. 页面路由
@app.route('/')
def index():
    return render_template('index.html')

# 2. API: 获取聚类后的地球数据
@app.route('/api/v1/cluster_data', methods=['GET'])
def api_cluster_data():
    data = get_clustered_earthquake_data()
    return jsonify(data)

# 3. API: 触发 AI 分析
@app.route('/api/v1/analyze_hotspot', methods=['POST'])
def api_analyze_hotspot():
    req_data = request.json
    # 提取前端传来的参数
    lat = req_data.get('lat')
    lng = req_data.get('lng')
    max_mag = req_data.get('maxMag')
    place = req_data.get('place')
    count = req_data.get('count')

    if not lat or not lng:
        return jsonify({"error": "Missing coordinates"}), 400

    report = analyze_seismic_activity(lat, lng, max_mag, place, count)
    
    return jsonify({"report": report})

if __name__ == '__main__':
    app.run(debug=True, port=5000)