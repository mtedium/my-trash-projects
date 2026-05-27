import requests
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
import time

# 简单内存缓存
CACHE = {
    "data": None,
    "timestamp": 0
}
CACHE_DURATION = 300  # 5分钟刷新一次

def get_clustered_earthquake_data():
    global CACHE
    current_time = time.time()

    # 1. 缓存检查
    if CACHE["data"] is not None and (current_time - CACHE["timestamp"] < CACHE_DURATION):
        print("Using cached data")
        return CACHE["data"]

    try:
        # 2. 调用 USGS API (过去24小时的所有地震)
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
        response = requests.get(url)
        data = response.json()
        
        features = data.get('features', [])
        if not features:
            return []

        # 3. Pandas 数据清洗
        df_list = []
        for f in features:
            props = f['properties']
            geom = f['geometry']['coordinates']
            df_list.append({
                'lat': geom[1],
                'lng': geom[0],
                'mag': props.get('mag', 0) or 0, # 处理 None
                'place': props.get('place', 'Unknown')
            })
        
        df = pd.DataFrame(df_list)

        # 4. Scikit-learn DBSCAN 聚类
        # 地理坐标聚类通常需要将度数转换为弧度，使用 Haversine 距离
        # eps 是聚类半径 (例如 0.05 弧度约等于 300km)，min_samples 是构成核心点的最小数量
        coords = np.radians(df[['lat', 'lng']].values)
        kms_per_radian = 6371.0088
        epsilon = 300 / kms_per_radian # 300km 半径
        
        db = DBSCAN(eps=epsilon, min_samples=3, metric='haversine', algorithm='ball_tree').fit(coords)
        
        df['cluster'] = db.labels_

        # 5. 聚合结果，生成热点数据
        results = []
        # 过滤掉噪声点 (cluster == -1)
        grouped = df[df['cluster'] != -1].groupby('cluster')

        for cluster_id, group in grouped:
            # 计算中心点
            center_lat = group['lat'].mean()
            center_lng = group['lng'].mean()
            # 获取该簇内最大震级
            max_mag = group['mag'].max()
            count = len(group)
            # 获取最具代表性的地点名 (震级最大的那个)
            top_place = group.loc[group['mag'].idxmax()]['place']

            results.append({
                "lat": float(center_lat),
                "lng": float(center_lng),
                "maxMag": float(max_mag),
                "count": int(count),
                "place": top_place,
                "label": f"Cluster #{cluster_id}"
            })

        # 也把未聚类的大地震(例如 > 5.0) 单独加进去，以免漏掉孤立的大地震
        noise_high_mag = df[(df['cluster'] == -1) & (df['mag'] >= 4.5)]
        for _, row in noise_high_mag.iterrows():
             results.append({
                "lat": float(row['lat']),
                "lng": float(row['lng']),
                "maxMag": float(row['mag']),
                "count": 1,
                "place": row['place'],
                "label": "Isolated Event"
            })

        CACHE["data"] = results
        CACHE["timestamp"] = current_time
        print(f"Processed {len(results)} clusters/hotspots.")
        return results

    except Exception as e:
        print(f"Error in data processing: {e}")
        return []