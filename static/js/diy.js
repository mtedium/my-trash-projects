import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { FileLoader } from 'three';

// 1 场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// 2 相机
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(18, 20, -15);
camera.lookAt(0, 0, 0);

// 3 渲染器 
const canvasBox = document.getElementById('canvas-box');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasBox.appendChild(renderer.domElement);

function resizeRenderer() {
    const width = canvasBox.clientWidth;
    const height = canvasBox.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}
resizeRenderer();
window.addEventListener('resize', resizeRenderer);

// 4 控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

// 5 灯光
const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(10, 20, 14);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

// 6 地面
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 7 加载obj
let currentTop = null, currentLegs = null;
const TablePath = '/static/images/models';

//通用的 MTL 文件路径
const COMMON_MTL_URL = '/static/images/models/common.mtl';
//贴图基础路径
const TEXTURE_BASE_PATH = '/static/images/models/textures/';

// 贴图缓存对象，避免重复加载
const textureCache = {};
const textureLoader = new THREE.TextureLoader();

// 异步加载贴图（带缓存）
function getTexture(woodType) {
    if (textureCache[woodType]) {
        return Promise.resolve(textureCache[woodType]);
    }

    // 动态构建贴图 URL，例如：'/static/images/textures/oak_DIF.png'
    const textureUrl = `${TEXTURE_BASE_PATH}${woodType}_DIF.png`;

    return new Promise((resolve, reject) => {
        const texture = textureLoader.load(textureUrl,
            (tex) => {
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(1, 1);
                textureCache[woodType] = tex; // 缓存贴图
                resolve(tex);
            },
            undefined, // 进度
            (error) => {
                console.error(`加载贴图失败: ${textureUrl}`, error);
                reject(error);
            }
        );
    });
}

// 统一的加载器 (使用 common.mtl，并传入动态贴图)
async function loadModel(objUrl, woodType, onFinished) {

    const mtlLoader = new MTLLoader();
    const fileLoader = new THREE.FileLoader();

    try {
        // 1. 异步加载新的动态贴图
        const newTexture = await getTexture(woodType);

        // 2. 读取 COMMON_MTL 文件的原始文本内容
        const mtlText = await fileLoader.loadAsync(COMMON_MTL_URL);

        // 3. 替换/移除所有贴图相关的指令 (确保 common.mtl 中如果有贴图路径，也会被移除)
        const cleanedMtlText = mtlText.replace(
            /^\s*(map_Kd|map_Ka|map_Ks|map_Ns|map_bump|bump|disp|decal)\s+.*$/img,
            ''
        );

        // 4. 将清理过的 MTL 内容交给 MTLLoader 解析材质
        const materials = mtlLoader.parse(cleanedMtlText);

        // 5. 遍历并强制应用动态贴图
        const material = materials.materials[Object.keys(materials.materials)[0]]; // 取得 MTL 中的第一个材质

        if (material && material.isMaterial) {
            material.map = newTexture; // <-- 关键：使用动态加载的贴图
            material.needsUpdate = true;
        } else {
            // 如果 common.mtl 是空的或解析失败，我们创建一个新的 MeshStandardMaterial
            const defaultMaterial = new THREE.MeshStandardMaterial({ map: newTexture, color: 0xffffff });
            materials.materials = { 'default': defaultMaterial };
        }

        materials.preload();

        // 6. 加载 OBJ 模型并应用处理后的材质
        const obj = await new OBJLoader().setMaterials(materials).loadAsync(objUrl);

        // 7. 最终检查和应用：遍历 OBJ 的所有子网格，并确保应用了正确的贴图材质
        const finalMaterial = material || materials.materials['default'];

        obj.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // 确保网格材质被我们处理过的材质替换
                if (finalMaterial) {
                    child.material = finalMaterial;
                }
            }
        });

        onFinished(obj);

    } catch (error) {
        console.error('模型加载过程中发生错误 (MTL, OBJ 或贴图):', error);
        onFinished(null);
    }
};

// 8 渲染循环
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
};
animate();

// 9 交互控制
// 返回当前选中的形状字符串：'Long' | 'Square' | 'Cricle'
function getCurrentShape() {
    const active = document.querySelector('.shape-option.active');
    // 如果页面还没有选中任何形状，先回退到 Long
    return active ? active.dataset.shape : 'Long';
}

// 根据形状拿到对应的默认尺寸对象
function getDefaultSize(shape) {
    return defaultSizes[shape] || defaultSizes['Long'];
}

//缩放
//  假设这是您的模型尺寸基准值，从调试信息中得出
const LEGS_HEIGHT = 6.3; // 桌腿模型在 TT=0.0100 缩放下的总高度
const TOP_BOTTOM_OFFSET_SCALE_001 = 6.4; // 桌面模型在 T=0.0100 缩放下，底部距离世界原点的 Y 坐标

window.applyConfig = function () {
    const lenCm = +document.getElementById('len').value;
    const widCm = +document.getElementById('wid').value;
    const thCm = +document.getElementById('thickness').value;

    //当前形状
    const shape = getCurrentShape();
    const def = getDefaultSize(shape);

    //计算缩放比例
    const L = (lenCm / 100) / def.len;  // 长度方向
    const W = (widCm / 100) / def.wid;  // 宽度方向
    const T = (thCm  / 100) / 5;   // 厚度方向
    const TT = (5  / 100) / 5;   // 厚度方向

     if (currentTop) {
        currentTop.scale.set(L, T, W);
        
        // 关键补偿计算
        // 1. 计算桌面在当前缩放 T 下，其底部的 Y 坐标 (如果 position.y=0)
        //     (6.4067 / 0.0100) 是桌面模型的原始底部到原始几何中心的距离 (未缩放)
        //     TOP_BOTTOM_OFFSET_SCALE_001 / 0.0100 * T
        const currentTopBottomY = (TOP_BOTTOM_OFFSET_SCALE_001 / 0.0100) * T; 
        
        // 2. 目标底部 Y 坐标是桌腿的高度 (LEGS_HEIGHT)
        const targetTopBottomY = LEGS_HEIGHT;
        
        // 3. 计算 position.y 补偿值 (目标底部 - 当前底部)
        const positionY_compensation = targetTopBottomY - currentTopBottomY;
        
        // 应用补偿值
        currentTop.position.y = positionY_compensation;
    }

    if (currentLegs) currentLegs.scale.set(L, TT, W);
};

// 根据当前选项加载桌面+桌腿 (只传 OBJ 路径和 woodType)
window.reloadTableTop = function () {
    const wood = document.querySelector('.wood-option.active').dataset.wood;
    const shape = document.querySelector('.shape-option.active').dataset.shape;
    const leg = document.querySelector('.leg-option.active').dataset.leg;
    // OBJ
    const obj = `${TablePath}/TableTop_${shape}.obj`;
    const obj_legs = `${TablePath}/TableLegs_${shape}_${leg}.obj`;

    if (currentTop) scene.remove(currentTop);
    // 调用 loadModel，传入 wood 类型
    loadModel(obj, wood, (obj) => {
        currentTop = obj;
        scene.add(obj);
        applyConfig();
    });

    if (currentLegs) scene.remove(currentLegs);
    // 调用 loadModel，传入 wood 类型
    loadModel(obj_legs, wood, (obj) => {
        currentLegs = obj;
        scene.add(obj);
        applyConfig();
    });
};

// 辅助函数：输出表格关键调试信息
window.logTableDebugInfo = function () {
    console.log("%c--- 🛠️ THREE.js 调试信息 ---", "color: #1e90ff; font-size: 14px; font-weight: bold;");

    // 1. 获取用户输入数据
    const lenCm = +document.getElementById('len').value;
    const widCm = +document.getElementById('wid').value;
    const thCm = +document.getElementById('thickness').value;

    console.log(`用户输入：长度=${lenCm}cm, 宽度=${widCm}cm, 厚度=${thCm}cm`);

    // 2. 模拟计算缩放比例
    const shape = getCurrentShape();
    const def = getDefaultSize(shape);
    const L = (lenCm / 100) / def.len;
    const W = (widCm / 100) / def.wid;
    const T = (thCm / 100) / 5;
    const TT = (50 / 100) / 50;

    console.log(`计算的缩放比例：L=${L.toFixed(4)}, W=${W.toFixed(4)}, 桌面T=${T.toFixed(4)}, 桌腿TT=${TT.toFixed(4)}`);
    console.log(`----------------------------------`);

    // 3. 检查并输出桌面信息 (currentTop)
    if (currentTop && currentTop.isObject3D) {

        // 确保世界矩阵更新以获取准确的边界盒
        currentTop.updateWorldMatrix(true);

        const box = new THREE.Box3().setFromObject(currentTop);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        console.groupCollapsed("%c[桌面 currentTop]", "color: orange; font-weight: bold;");
        console.log("当前 Position Y:", currentTop.position.y.toFixed(4));
        console.log("当前 Scale Y:", currentTop.scale.y.toFixed(4));
        console.log("--- 模型几何信息 (应用缩放): ---");
        console.log(`原始模型 Y 尺寸 (厚度): ${size.y.toFixed(4)}`);
        console.log(`模型几何中心 Y 坐标: ${center.y.toFixed(4)}`);
        console.log(`原始模型底部 Y 坐标 (Center - Size/2): ${(center.y - size.y / 2).toFixed(4)}`);
        console.groupEnd();

    } else {
        console.warn("桌面模型 (currentTop) 未加载或无效。");
    }

    // 4. 检查并输出桌腿信息 (currentLegs)
    if (currentLegs && currentLegs.isObject3D) {

        currentLegs.updateWorldMatrix(true);

        const box = new THREE.Box3().setFromObject(currentLegs);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        console.groupCollapsed("%c[桌腿 currentLegs]", "color: green; font-weight: bold;");
        console.log("当前 Position Y:", currentLegs.position.y.toFixed(4));
        console.log("当前 Scale Y:", currentLegs.scale.y.toFixed(4));
        console.log("--- 模型几何信息 (应用缩放): ---");
        console.log(`原始模型 Y 尺寸 (高度): ${size.y.toFixed(4)}`);
        console.log(`模型几何中心 Y 坐标: ${center.y.toFixed(4)}`);
        console.log(`原始模型底部 Y 坐标 (Center - Size/2): ${(center.y - size.y / 2).toFixed(4)}`);
        console.groupEnd();

    } else {
        console.warn("桌腿模型 (currentLegs) 未加载或无效。");
    }

    console.log("----------------------------------");
    console.log("✅ 请在 `applyConfig` 中添加 position.y 补偿来解决浮动问题。");
};

// 确保初始化加载
window.addEventListener('DOMContentLoaded', (event) => {
    // 假设在 HTML 中已经为第一个 wood/shape/leg 选项添加了 'active' 类
    if (window.reloadTableTop) window.reloadTableTop();
    // if (window.reloadTableLegs) window.reloadTableLegs();
});