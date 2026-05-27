var mapInstance = null;
var myCharts = {};

window.onload = function () {
    loadData();
    setupNavigation();
};

function loadData() {
    // 模拟数据（你可以继续使用 data/agriculture.json fetch 方式，这里为了演示方便直接写对象）
    // 实际项目中请保持 fetch 逻辑
    var data = {
        timeline: [
            { year: '公元前5000', value: 20, event: '河姆渡水稻', desc: '长江流域稻作起源' },
            { year: '前2世纪', value: 45, event: '铁犁牛耕', desc: '汉代生产力跃升' },
            { year: '公元6世纪', value: 60, event: '齐民要术', desc: '农学理论体系化' },
            { year: '公元9世纪', value: 85, event: '曲辕犁', desc: '传统步犁定型' },
            { year: '公元13世纪', value: 95, event: '王祯农书', desc: '南北农业大成' }
        ],
        mapPoints: [
            { name: "河姆渡遗址", geo: [121.37, 29.98], info: "世界上最早的稻作遗存之一" },
            { name: "半坡遗址", geo: [109.05, 34.27], info: "黄河流域粟作农业代表" },
            { name: "紫鹊界梯田", geo: [111.03, 27.50], info: "南方稻作梯田灌溉系统" }
        ],
        compare: [
            { name: '古代筒车', value: [60, 10, 30, 95, 100] }, // 效率, 能耗, 成本, 环保, 历史
            { name: '现代水泵', value: [95, 90, 60, 40, 20] }
        ]
    };

    initCharts(data);
}

function initCharts(data) {
    initTimelineChart(data.timeline);
    initRadarChart(data.compare);
    // 地图需要等待 API 加载，通常很快，但安全起见延迟一点或检测对象
    if (window.AMap) {
        initAMap(data.mapPoints);
    } else {
        setTimeout(function () { initAMap(data.mapPoints); }, 1000);
    }
}

// 1. 时间轴 - 面积图 (模拟山峦)
function initTimelineChart(data) {
    var chart = echarts.init(document.getElementById('timeline-chart'));
    myCharts.timeline = chart;

    var option = {
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.7)', textStyle: { color: '#fff' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.map(function (i) { return i.year; }),
            axisLine: { lineStyle: { color: '#aaa' } },
            axisLabel: { color: '#fff', fontSize: 14 }
        },
        yAxis: { type: 'value', show: false },
        series: [{
            name: '农业发展指数',
            type: 'line',
            smooth: true,
            symbolSize: 15,
            itemStyle: { color: '#ffd700', borderWidth: 3, borderColor: '#fff' },
            lineStyle: { width: 4, color: '#ffd700' },
            areaStyle: {
                opacity: 0.5,
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(255, 215, 0, 0.6)' },
                    { offset: 1, color: 'rgba(255, 215, 0, 0)' }
                ])
            },
            data: data.map(function (i) { return i.value; }),
            markPoint: {
                data: data.map(function (item, index) {
                    return { coord: [index, item.value], value: item.event };
                }),
                itemStyle: { color: '#00f2ffab' },
                label: { color: '#ffd700', fontWeight: 'bold' }
            }
        }]
    };
    chart.setOption(option);
}

// 2. 高德地图 - 深色底图
function initAMap(points) {
    mapInstance = new AMap.Map('amap-container', {
        zoom: 4.5,
        center: [108.0, 34.0],
        viewMode: '2D',
        pitch: 30,
        // 或者使用 'amap://styles/grey' (雅士灰)
        mapStyle: 'amap://styles/blue',
    });

    // 可以在 CSS 里给 #amap-container 加一个 filter: sepia(30%); 
    // 让蓝色的地图带一点点黄旧的感觉，更像古地图。

    points.forEach(function (p) {
        // 自定义标记：简单的红点，或者你可以找个 SVG 图片
        var content = '<div style="width:12px;height:12px;background:#e2d849;border-radius:50%;box-shadow:0 0 10px #e2d849;border:2px solid #fff;"></div>';

        var marker = new AMap.Marker({
            position: new AMap.LngLat(p.geo[0], p.geo[1]),
            content: content, // 使用自定义 HTML 内容
            anchor: 'center', // 中心对齐
            offset: new AMap.Pixel(0, 0)
        });

        marker.on('click', function () {
            var infoPanel = document.getElementById('map-info-panel');
            infoPanel.innerHTML =
                '<h4 style="color:var(--primary)">' + p.name + '</h4>' +
                '<p>' + p.info + '</p>' +
                '<p style="font-size:12px;color:#aaa">坐标: ' + p.geo.join(', ') + '</p>';
        });

        mapInstance.add(marker);
    });
}

// 3. 雷达图 - 古朴配色
function initRadarChart(data) {
    var chart = echarts.init(document.getElementById('radar-chart'));
    myCharts.radar = chart;

    var option = {
        color: ['#e2d849', '#7fbc9b'], // 金 vs 青
        tooltip: { backgroundColor: 'rgba(50,50,50,0.9)' },
        legend: { bottom: 0, textStyle: { color: '#d9d9d9', fontFamily: 'SimSun' } },
        radar: {
            indicator: [
                { name: '生产效率', max: 100 },
                { name: '能源消耗', max: 100 },
                { name: '维护成本', max: 100 },
                { name: '环境友好', max: 100 },
                { name: '历史价值', max: 100 }
            ],
            // 雷达背景：几层同心圆，颜色交替
            splitArea: { 
                areaStyle: { 
                    color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] 
                } 
            },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            name: { textStyle: { color: '#e2d849', fontFamily: 'SimSun', fontSize: 14 } }
        },
        series: [{
            type: 'radar',
            data: data,
            symbol: 'circle',
            symbolSize: 8,
            areaStyle: { opacity: 0.4 },
            lineStyle: { width: 2 }
        }]
    };
    chart.setOption(option);
}

// 导航交互与 Resize
function setupNavigation() {
    var links = document.querySelectorAll('.side-nav li');
    links.forEach(function (li) {
        li.addEventListener('click', function () {
            var targetId = this.getAttribute('data-target');
            document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });

            // 更新 active 状态
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    window.addEventListener('resize', function () {
        if (myCharts.timeline) myCharts.timeline.resize();
        if (myCharts.radar) myCharts.radar.resize();
    });
}