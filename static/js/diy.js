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
camera.position.set(1.8, 2, -1.8);
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
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

// 6 地面
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
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
window.applyConfig = function () {
    const lenCm = +document.getElementById('len').value;
    const widCm = +document.getElementById('wid').value;
    const thCm = +document.getElementById('thickness').value;

    const L = lenCm / 160000;
    const W = widCm / 120000;
    const T = thCm / 5000;

    if (currentTop) currentTop.scale.set(L, T, W);
    if (currentLegs) currentLegs.scale.set(L, T, W);
};

// 根据当前选项加载桌面 (只传 OBJ 路径和 woodType)
window.reloadTableTop = function () {
    const wood = document.querySelector('.wood-option.active').dataset.wood;
    const shape = document.querySelector('.shape-option.active').dataset.shape;
    // OBJ 路径保持不变
    const obj = `${TablePath}/TableTop_${shape}.obj`;

    if (currentTop) scene.remove(currentTop);
    // 调用 loadModel，传入 wood 类型
    loadModel(obj, wood, (obj) => {
        currentTop = obj;
        scene.add(obj);
        applyConfig();
    });
};

// 根据当前选项加载桌腿 (只传 OBJ 路径和 woodType)
window.reloadTableLegs = function () {
    const wood = document.querySelector('.wood-option.active').dataset.wood;
    const leg = document.querySelector('.leg-option.active').dataset.leg;
    // OBJ 路径保持不变
    const obj = `${TablePath}/TableLegs_${leg}.obj`;

    if (currentLegs) scene.remove(currentLegs);
    // 调用 loadModel，传入 wood 类型
    loadModel(obj, wood, (obj) => {
        currentLegs = obj;
        scene.add(obj);
        applyConfig();
    });
};

// 确保初始化加载
window.addEventListener('DOMContentLoaded', (event) => {
    // 假设在 HTML 中已经为第一个 wood/shape/leg 选项添加了 'active' 类
    if (window.reloadTableTop) window.reloadTableTop();
    if (window.reloadTableLegs) window.reloadTableLegs();
});
