// 1. 初始化 Globe
const elem = document.getElementById('globeViz');
const statusElem = document.getElementById('status');
const modal = document.getElementById('ai-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

const world = Globe()
    (elem)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .atmosphereColor('#3a228a')
    .atmosphereAltitude(0.25)
    // 配置标签 (用于显示热点)
    .pointOfView({ lat: 20, lng: 100, altitude: 2.5 }) // 初始视角
    .labelLat(d => d.lat)
    .labelLng(d => d.lng)
    .labelText(d => `${d.place}`)
    .labelSize(d => Math.sqrt(d.count) * 0.5 + 0.5) // 根据聚类数量决定标签大小
    .labelDotRadius(d => d.maxMag * 0.5) // 根据最大震级决定圆点大小
    .labelColor(() => 'rgba(255, 165, 0, 0.75)')
    .labelResolution(2)
    // 关键：点击交互
    .onLabelClick(handleHotspotClick);

// 2. 获取数据函数
async function fetchData() {
    statusElem.innerText = "正在同步后端数据 (Python/Pandas)...";
    try {
        const response = await fetch('/api/v1/cluster_data');
        const data = await response.json();
        
        // 绑定数据到地球
        world.labelsData(data);
        
        statusElem.innerText = `数据已更新: 检测到 ${data.length} 个活跃地震簇`;
        
        // 添加一些动态波纹效果 (Rings)
        world.ringsData(data)
             .ringColor(() => colorInterpolator)
             .ringMaxRadius(d => d.maxMag * 5)
             .ringPropagationSpeed(2)
             .ringRepeatPeriod(1000);
             
    } catch (error) {
        console.error("Fetch error:", error);
        statusElem.innerText = "数据同步失败";
        statusElem.style.color = "red";
    }
}

const colorInterpolator = t => `rgba(255, 100, 50, ${1-t})`;

// 3. 处理点击交互
async function handleHotspotClick(point) {
    // 聚焦相机
    world.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);

    // 打开弹窗
    modal.classList.remove('hidden');
    modalTitle.innerText = point.place;
    modalBody.innerText = "正在请求 AI 地质分析引擎...";

    // 请求后端 AI
    try {
        const res = await fetch('/api/v1/analyze_hotspot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(point)
        });
        const result = await res.json();
        
        // 简单的打字机效果展示
        typeWriterEffect(result.report);

    } catch (e) {
        modalBody.innerText = "分析服务不可用。";
    }
}

function typeWriterEffect(text) {
    modalBody.innerText = "";
    let i = 0;
    const speed = 30; 
    function type() {
        if (i < text.length) {
            modalBody.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// 关闭弹窗
window.closeModal = function() {
    modal.classList.add('hidden');
}

// 4. 启动逻辑
fetchData();
// 每60秒轮询一次
setInterval(fetchData, 60000);