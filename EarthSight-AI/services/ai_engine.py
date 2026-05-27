import os
# from openai import OpenAI 

def analyze_seismic_activity(lat, lng, max_mag, place, count):
    """
    接收热点数据，构建 Prompt，调用 LLM 返回分析。
    """
    
    # 构建 Prompt
    prompt = f"""
    作为一名资深地质学家，请分析以下地震数据：
    - 地点: {place}
    - 坐标: ({lat}, {lng})
    - 区域内最大震级: {max_mag}
    - 过去24小时聚类地震次数: {count}

    请简要分析该区域的地质构造背景（板块边界类型等），并评估当前的活跃程度风险。请用中文回答，限制在 150 字以内。
    """

    print(f"Generating AI report for: {place}...")

    # --- 方案 A: 模拟模式 (无需 API Key，直接运行演示) ---
    import random
    time_delay = 1.5 # 模拟网络延迟
    risk = "高" if max_mag > 5 else "中等" if count > 10 else "低"
    mock_response = (
        f"【AI 地质报告】\n"
        f"监测到 {place} 附近存在活跃的地震活动。该区域位于板块交界带，"
        f"本次检测到的震群（共{count}次，最大{max_mag}级）显示地壳应力正在释放。"
        f"当前风险等级评估为：{risk}。建议持续关注 USGS 后续数据。"
    )
    return mock_response

    # --- 方案 B: 真实调用 (需要 pip install openai 并配置 API KEY) ---
    # client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    # try:
    #     response = client.chat.completions.create(
    #         model="gpt-3.5-turbo",
    #         messages=[{"role": "user", "content": prompt}]
    #     )
    #     return response.choices[0].message.content
    # except Exception as e:
    #     return f"AI 服务暂时不可用: {str(e)}"