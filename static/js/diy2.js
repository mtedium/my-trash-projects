// 配置不同桌面的默认尺寸 {长度, 宽度}，单位为 cm，同时配置 min/max 以便在切换时更新
const defaultSizes = {
    // 长桌的默认值（和 HTML 初始值保持一致，或者设置你想要的默认值）
    'Long': { len: 165, wid: 90, minLen: 100, maxLen: 240, minWid: 60, maxWid: 150 },
    // 方桌的默认值 (长宽相等，且范围更小)
    'Square': { len: 85, wid: 85, minLen: 50, maxLen: 150, minWid: 50, maxWid: 150 },
    // 圆桌的默认值 (长宽相等，使用直径，且范围更小)
    'Cricle': { len: 140, wid: 140, minLen: 100, maxLen: 180, minWid: 100, maxWid: 180 }
};

// 木材选择
function selectWood(el) {
    document.querySelectorAll('.wood-option').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    reloadTableTop();
    // reloadTableLegs();
    printCurrentConfig();
}

// 形状选择
function selectShape(el) {
    document.querySelectorAll('.shape-option').forEach(e => e.classList.remove('active'));
    el.classList.add('active');

    // 1. 根据选中的形状设置滑块的默认值、最小值、最大值
    const shape = el.dataset.shape;
    const config = defaultSizes[shape];

    if (config) {
        // 更新长度滑块
        const lenSlider = document.getElementById('len');
        lenSlider.min = config.minLen;
        lenSlider.max = config.maxLen;
        lenSlider.value = config.len;

        // 更新宽度滑块
        const widSlider = document.getElementById('wid');
        widSlider.min = config.minWid;
        widSlider.max = config.maxWid;

        if (shape === 'Cricle' || shape === 'Square') {
            // 方桌/圆桌：初始值设为长度值，实现长宽一致
            widSlider.value = config.len;
        } else {
            widSlider.value = config.wid;
        }

        // 2. 更新显示和 3D 模型
        updateSlider('len');
        updateSlider('wid');
    }

    reloadTableTop();
    printCurrentConfig();
}

// 桌腿选择
function selectLeg(el) {
    document.querySelectorAll('.leg-option').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    // reloadTableLegs();
    reloadTableTop();
    printCurrentConfig();
}

// 把当前所有选型拼成字符串
function printCurrentConfig() {
    const wood = document.querySelector('.wood-option.active')?.dataset.wood || '未选择';
    const shape = document.querySelector('.shape-option.active')?.dataset.shape || '未选择';
    const leg = document.querySelector('.leg-option.active')?.dataset.leg || '未选择';
    const len = document.getElementById('len').value;
    const wid = document.getElementById('wid').value;
    const th = document.getElementById('thickness').value;

    const str = `木材：${wood} | 形状：${shape} | 桌腿：${leg} | 尺寸：${len}×${wid}×${th} cm`;
    console.log(str); // 控制台输出
}

// 滑块更新
function updateSlider(id) {
    const slider = document.getElementById(id);
    const value = slider.value;
    document.getElementById(id + '-display').textContent = value;

    // 如果当前是方桌或圆桌，则联动另一个滑块
    const currentShape = document.querySelector('.shape-option.active')?.dataset.shape;
    if ((currentShape === 'Square' || currentShape === 'Cricle') &&
        (id === 'len' || id === 'wid')) {
        const otherId = (id === 'len') ? 'wid' : 'len';
        const otherSlider = document.getElementById(otherId);
        const otherDisplay = document.getElementById(otherId + '-display');

        // 只有当另一个滑块的值不等于当前值时才更新，防止死循环
        if (otherSlider.value !== value) {
            otherSlider.value = value;
            otherDisplay.textContent = value;
        }
    }

    if (window.applyConfig) window.applyConfig();
}

// PDF导出（占位）
function generatePDF() {
    alert('PDF导出功能开发中...\n\n当前配置：\n' +
        '木材：' + (document.querySelector('.wood-option.active')?.dataset.wood || '未选择') + '\n' +
        '形状：' + (document.querySelector('.shape-option.active')?.dataset.shape || '未选择') + '\n' +
        '桌腿：' + (document.querySelector('.leg-option.active')?.dataset.leg || '未选择') + '\n' +
        '尺寸：' + document.getElementById('len').value + 'cm × ' +
        document.getElementById('wid').value + 'cm\n' +
        '厚度：' + document.getElementById('thickness').value + 'cm');
}

// 初始化显示 (在页面加载时执行)
const initialShape = document.querySelector('.shape-option.active')?.dataset.shape || 'Long';
const initialConfig = defaultSizes[initialShape];

// 使用初始配置设置滑块的 min/max/value
if (initialConfig) {
    document.getElementById('len').min = initialConfig.minLen;
    document.getElementById('len').max = initialConfig.maxLen;
    document.getElementById('len').value = initialConfig.len;

    document.getElementById('wid').min = initialConfig.minWid;
    document.getElementById('wid').max = initialConfig.maxWid;
    document.getElementById('wid').value = initialConfig.wid;
}

updateSlider('len');
updateSlider('wid');
updateSlider('thickness');

// 在 DOMContentLoaded 后立即打印初始配置
window.addEventListener('DOMContentLoaded', printCurrentConfig);