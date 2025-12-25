// Three.js 场景设置
let scene, camera, renderer;
let christmasTree, snowflakes, stars;
let rotationSpeed = 0.01;
let treeScale = 1.0;
let particleSize = 1.0;

// 初始化场景
function init() {
    // 创建场景
    scene = new THREE.Scene();

    // 创建相机
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 50;
    camera.position.y = 10;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffd700, 1, 100);
    pointLight.position.set(0, 30, 20);
    scene.add(pointLight);

    // 创建圣诞树
    createChristmasTree();

    // 创建雪花
    createSnowflakes();

    // 创建背景星星
    createBackgroundStars();

    // 添加控制器事件监听
    setupControls();

    // 窗口大小调整
    window.addEventListener('resize', onWindowResize, false);

    // 开始动画
    animate();
}

// 创建圣诞树粒子
function createChristmasTree() {
    const particleCount = 4000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    // 圣诞树颜色
    const treeColors = [
        new THREE.Color(0x0d5c0d), // 深绿
        new THREE.Color(0x1a8c1a), // 中绿
        new THREE.Color(0x26b326), // 亮绿
    ];

    // 装饰球颜色
    const ornamentColors = [
        new THREE.Color(0xff0000), // 红色
        new THREE.Color(0xffd700), // 金色
        new THREE.Color(0x0066ff), // 蓝色
        new THREE.Color(0xff69b4), // 粉色
    ];

    for (let i = 0; i < particleCount; i++) {
        // 圆锥形分布
        const y = Math.random() * 30 - 5; // 高度
        const radius = (30 - y) * 0.3; // 半径随高度减小
        const angle = Math.random() * Math.PI * 2;

        const x = Math.cos(angle) * radius * (Math.random() * 0.8 + 0.2);
        const z = Math.sin(angle) * radius * (Math.random() * 0.8 + 0.2);

        positions.push(x, y, z);

        // 颜色设置
        let color;
        if (i < particleCount * 0.1) {
            // 10% 装饰球
            color = ornamentColors[Math.floor(Math.random() * ornamentColors.length)];
        } else {
            // 90% 树的主体
            const colorIndex = Math.floor(y / 10);
            color = treeColors[Math.min(colorIndex, treeColors. length - 1)];
        }

        colors.push(color.r, color.g, color.b);

        // 粒子大小
        sizes. push(Math.random() * 2 + 1);
    }

    // 树顶星星
    positions.push(0, 30, 0);
    const starColor = new THREE.Color(0xffd700);
    colors.push(starColor.r, starColor.g, starColor. b);
    sizes.push(8);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE. Float32BufferAttribute(sizes, 1));

    // 粒子材质
    const material = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
    });

    christmasTree = new THREE.Points(geometry, material);
    scene.add(christmasTree);
}

// 创建雪花
function createSnowflakes() {
    const particleCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            Math.random() * 100 - 50,
            Math.random() * 100,
            Math.random() * 100 - 50
        );
        velocities.push(Math.random() * 0.1 + 0.05);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 1));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        transparent: true,
        opacity: 0.8,
    });

    snowflakes = new THREE.Points(geometry, material);
    scene.add(snowflakes);
}

// 创建背景星星
function createBackgroundStars() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            Math.random() * 200 - 100,
            Math.random() * 100 - 20,
            Math.random() * 100 - 100
        );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        transparent: true,
        opacity: 0.6,
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

// 设置控制器
function setupControls() {
    const speedSlider = document.getElementById('speed');
    const heightSlider = document.getElementById('height');
    const sizeSlider = document.getElementById('size');

    const speedValue = document.getElementById('speed-value');
    const heightValue = document.getElementById('height-value');
    const sizeValue = document.getElementById('size-value');

    speedSlider.addEventListener('input', (e) => {
        rotationSpeed = parseFloat(e.target. value) * 0.01;
        speedValue.textContent = parseFloat(e.target.value).toFixed(1);
    });

    heightSlider.addEventListener('input', (e) => {
        treeScale = parseFloat(e.target.value) / 100;
        heightValue.textContent = e.target.value;
        christmasTree.scale.set(1, treeScale, 1);
    });

    sizeSlider.addEventListener('input', (e) => {
        particleSize = parseFloat(e.target.value);
        sizeValue.textContent = parseFloat(e.target.value).toFixed(1);
        christmasTree.material.size = particleSize;
    });
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    // 圣诞树旋转
    if (christmasTree) {
        christmasTree.rotation.y += rotationSpeed;
    }

    // 雪花飘落
    if (snowflakes) {
        const positions = snowflakes.geometry.attributes.position.array;
        const velocities = snowflakes.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= velocities[i / 3];

            // 重置雪花位置
            if (positions[i + 1] < -10) {
                positions[i + 1] = 100;
            }
        }

        snowflakes.geometry.attributes.position.needsUpdate = true;
    }

    // 星星闪烁
    if (stars) {
        stars.material.opacity = 0.3 + Math.sin(Date. now() * 0.001) * 0.3;
    }

    // 树顶星星闪烁
    if (christmasTree) {
        const sizes = christmasTree.geometry.attributes.size.array;
        const lastIndex = sizes.length - 1;
        sizes[lastIndex] = 8 + Math.sin(Date.now() * 0.005) * 2;
        christmasTree.geometry.attributes. size.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

// 窗口大小调整
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window. innerHeight);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);