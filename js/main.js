// 全局变量
let scene, camera, renderer, controls;
let treeParticles, starParticles, textParticles, rippleMesh;
let clock = new THREE.Clock();

// 参数配置
const params = {
    particleCount: 30000, // 增加粒子数量以获得更密集的螺旋效果
    treeHeight: 12,
    treeRadius: 5,
    particleSize: 0.12, // 稍微调大一点，增加发光感
    rotationSpeed: 0.001, // 慢一点
    rippleColor: '#ffb6c1',
    titleText: 'To lje' // 默认文字
};

init();
animate();

function init() {
    // 1. 初始化场景
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02); // 纯黑背景雾
    
    // 2. 初始化相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 18); // 稍微远一点，看全景

    // 3. 初始化渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1); // 纯黑背景
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 4. 添加控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    // 5. 创建螺旋圣诞树
    createSpiralTree();

    // 6. 创建背景星空
    createStars();

    // 7. 创建文字
    createTextParticles();
    
    // 8. 创建底部波纹
    createRipple();

    // 9. 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 9. 窗口自适应
    window.addEventListener('resize', onWindowResize);

    // 10. 更新UI
    document.getElementById('info').innerHTML = '3D螺旋粒子圣诞树<br>鼠标：左键拖拽旋转，滚轮缩放。';

    // 11. 初始化GUI (可选)
    initGUI();
}

function createStars() {
    const starCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    for(let i=0; i<starCount; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 60 + 20; // 偏上方
        const z = (Math.random() - 0.5) * 100;
        positions.push(x, y, z);
        
        const brightness = Math.random();
        colors.push(brightness, brightness, brightness);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        map: createParticleTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    starParticles = new THREE.Points(geometry, material);
    scene.add(starParticles);
}

function createTextParticles() {
    if (textParticles) {
        scene.remove(textParticles);
        textParticles.geometry.dispose();
        textParticles.material.dispose();
    }

    // 创建两行文字
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 字体设置
    ctx.font = 'italic bold 60px "Times New Roman", serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // 绘制文字
    ctx.fillText(params.titleText, 50, 100);
    ctx.font = 'italic 40px "Times New Roman", serif';
    ctx.fillText("Merry Christmas", 50, 180);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const positions = [];
    const colors = [];
    
    for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
            const index = (y * canvas.width + x) * 4;
            const r = data[index];
            
            if (r > 128) {
                // 映射到3D空间，放在左侧
                const pX = (x - canvas.width / 2) * 0.04 - 6; // 左移
                const pY = (canvas.height - y) * 0.04 + 4; // 上移
                const pZ = 0;
                
                positions.push(pX, pY, pZ);
                colors.push(1.0, 0.9, 0.95); // 亮白带一点粉，更醒目
            }
        }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.15, // 增大粒子尺寸
        vertexColors: true,
        transparent: true,
        opacity: 1.0, // 不透明度拉满
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: createParticleTexture()
    });
    
    textParticles = new THREE.Points(geometry, material);
    // 让文字始终朝向相机一点
    textParticles.rotation.y = 0.2;
    scene.add(textParticles);
}

function createSpiralTree() {
    if (treeParticles) {
        scene.remove(treeParticles);
        treeParticles.geometry.dispose();
        treeParticles.material.dispose();
    }

    const totalParticles = params.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);

    // 颜色定义
    const pinkColor = new THREE.Color(1.0, 0.6, 0.75); // 主粉色
    const deepPink = new THREE.Color(0.8, 0.2, 0.4); // 深粉
    const whiteColor = new THREE.Color(1.0, 1.0, 1.0); // 亮白
    const trunkColor = new THREE.Color(0.4, 0.2, 0.1); // 棕色

    let pIndex = 0;

    // --- 1. 螺旋主体 (Spiral Body) ---
    // 占据大部分粒子，增加比例以减少树干粒子
    const spiralParticles = Math.floor(totalParticles * 0.85); // 恢复到 0.85，留更多粒子给树桩
    const loops = 11; // 减少一圈
    const height = params.treeHeight;
    
    for (let i = 0; i < spiralParticles; i++) {
        // 进度 t: 0(底) -> 1(顶)
        let t = i / spiralParticles;
        t = Math.pow(t, 0.8); 
        
        const y = t * height;
        
        // 螺旋半径：底部大，顶部小
        let radius = params.treeRadius * (1 - t);
        // 减弱裙摆效果，让整体更像树
        if (t < 0.1) {
            radius += (0.1 - t) * 5.0; 
        }

        // 螺旋角度
        const angle = t * loops * Math.PI * 2; 
        
        // 模拟树叶的蓬松感：
        // 在螺旋主路径周围生成一个“云团”
        // 扩散范围随高度变化
        const spread = 1.2 * (1 - t * 0.5) + 0.2; 
        
        // 随机偏移 (球形分布)
        const rOffset = Math.random() * spread;
        const aOffset = Math.random() * Math.PI * 2;
        const yOffset = (Math.random() - 0.5) * spread * 0.8;
        
        // 计算位置：基于螺旋中心向外扩散
        // 先计算螺旋中心点
        const cx = radius * Math.cos(angle);
        const cz = radius * Math.sin(angle);

        // 加上随机偏移
        const x = cx + rOffset * Math.cos(aOffset);
        const z = cz + rOffset * Math.sin(aOffset);
        const finalY = y + yOffset;
        
        positions[pIndex * 3] = x;
        positions[pIndex * 3 + 1] = finalY;
        positions[pIndex * 3 + 2] = z;

        // 颜色：粉色为主，边缘发白
        const colorMix = Math.random();
        let c;
        if (colorMix > 0.9) c = whiteColor;
        else if (colorMix > 0.3) c = pinkColor;
        else c = deepPink;
        
        colors[pIndex * 3] = c.r;
        colors[pIndex * 3 + 1] = c.g;
        colors[pIndex * 3 + 2] = c.b;
        
        sizes[pIndex] = params.particleSize * (0.5 + Math.random());
        
        pIndex++;
    }

    // --- 2. 顶部实体爱心 (Heart) ---
    const heartParticles = 1500;
    const heartCenterY = height + 0.5;
    const heartScale = 0.5;
    let heartCount = 0;
    
    while(heartCount < heartParticles && pIndex < totalParticles) {
        const x = (Math.random() - 0.5) * 3;
        const y = (Math.random() - 0.5) * 3;
        const z = (Math.random() - 0.5) * 3;
        
        const a = x*x + 2.25*z*z + y*y - 1;
        const b = x*x * y*y*y + 0.1125 * z*z * y*y*y;
        
        if (a*a*a - b <= 0) {
            positions[pIndex * 3] = x * heartScale;
            positions[pIndex * 3 + 1] = y * heartScale + heartCenterY;
            positions[pIndex * 3 + 2] = z * heartScale;
            
            // 爱心颜色：亮红粉
            const c = new THREE.Color(1.0, 0.1, 0.3);
            colors[pIndex * 3] = c.r;
            colors[pIndex * 3 + 1] = c.g;
            colors[pIndex * 3 + 2] = c.b;
            
            sizes[pIndex] = params.particleSize * 1.5; // 爱心粒子大一点
            
            pIndex++;
            heartCount++;
        }
    }

    // --- 3. 底部树干 (Trunk) ---
    // 稍微露一点点深色树干在底部中心
    // 减少树桩粒子数量：只使用剩余粒子的 60% (即减少 40%)
    let trunkParticles = totalParticles - pIndex;
    trunkParticles = Math.floor(trunkParticles * 0.6); 
    
    const trunkH = height * 0.15;
    const trunkR = params.treeRadius * 0.1;
    
    for (let i = 0; i < trunkParticles; i++) {
        const y = Math.random() * trunkH;
        const r = Math.random() * trunkR;
        const theta = Math.random() * Math.PI * 2;
        
        positions[pIndex * 3] = r * Math.cos(theta);
        positions[pIndex * 3 + 1] = y;
        positions[pIndex * 3 + 2] = r * Math.sin(theta);
        
        colors[pIndex * 3] = trunkColor.r;
        colors[pIndex * 3 + 1] = trunkColor.g;
        colors[pIndex * 3 + 2] = trunkColor.b;
        
        sizes[pIndex] = params.particleSize;
        pIndex++;
    }

    // 注意：由于减少了树桩粒子，pIndex 可能小于 totalParticles
    // 我们需要截断数组，或者在创建 BufferAttribute 时只使用有效部分
    // 最简单的方法是把剩下的位置设为不可见（例如放在无限远处或大小为0）
    for (; pIndex < totalParticles; pIndex++) {
        positions[pIndex * 3] = 0;
        positions[pIndex * 3 + 1] = -1000; // 移到视野外
        positions[pIndex * 3 + 2] = 0;
        sizes[pIndex] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 动画数据
    geometry.userData.originalPositions = positions.slice();
    const randomOffsets = new Float32Array(totalParticles);
    const noiseSeeds = new Float32Array(totalParticles);
    for(let i=0; i<totalParticles; i++) {
        randomOffsets[i] = Math.random() * Math.PI * 2;
        noiseSeeds[i] = Math.random();
    }
    geometry.userData.randomOffsets = randomOffsets;
    geometry.userData.noiseSeeds = noiseSeeds;

    // Shader Material for glowing effect
    const vertexShader = `
        varying vec3 vColor;
        uniform float uTime;
        
        void main() {
            vColor = color;
            vec3 pos = position;
            
            // 视觉流动效果：
            // 让粒子大小随 Y 轴和时间变化，产生向上流动的光点效果
            // 不改变物理位置，只改变渲染大小
            float flow = sin(pos.y * 0.8 - uTime * 3.0);
            float sizePulse = 1.0 + flow * 0.4;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            // 大小随距离变化，并叠加流动脉冲
            gl_PointSize = (150.0 * sizePulse) / -mvPosition.z; 
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
            vec4 texColor = texture2D(pointTexture, gl_PointCoord);
            if (texColor.a < 0.1) discard;
            
            // 增强发光感
            gl_FragColor = vec4(vColor, 1.0) * texColor;
        }
    `;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            pointTexture: { value: createParticleTexture() }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    treeParticles = new THREE.Points(geometry, material);
    scene.add(treeParticles);
}

// ... (createParticleTexture, createRipple, initGUI, onWindowResize, animate 保持不变或微调)


// 创建一个简单的圆形渐变纹理
function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createRipple() {
    const geometry = new THREE.PlaneGeometry(20, 20);
    
    // 自定义着色器
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
            float distanceToCenter = length(vUv - vec2(0.5));
            
            // 波纹效果：sin函数
            // distanceToCenter * 20.0 控制波纹密度
            // uTime * 2.0 控制扩散速度
            float wave = sin(distanceToCenter * 20.0 - uTime * 4.0) * 0.5 + 0.5;
            
            // 边缘衰减：距离中心越远越透明
            float fade = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
            
            // 结合波纹和衰减
            // 只有在 fade > 0 的地方才显示
            // 使用 pow 让波纹峰值更锐利一点，或者直接用 wave
            float alpha = wave * fade * 1.0; // 提高不透明度到 1.0
            
            // 也可以让波纹是环状的，而不是整个面都在波动
            // 这里简单实现手册里的效果
            
            gl_FragColor = vec4(uColor, alpha);
        }
    `;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(params.rippleColor) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });

    rippleMesh = new THREE.Mesh(geometry, material);
    rippleMesh.rotation.x = -Math.PI / 2; // 水平放置
    rippleMesh.position.y = -0.5; // 稍微下移一点，避免和树底冲突，但要保证可见
    scene.add(rippleMesh);
}

function initGUI() {
    const gui = new dat.GUI();
    gui.add(params, 'particleCount', 1000, 30000).step(100).onChange(createSpiralTree);
    gui.add(params, 'treeHeight', 5, 20).onChange(createSpiralTree);
    gui.add(params, 'treeRadius', 2, 10).onChange(createSpiralTree);
    gui.add(params, 'particleSize', 0.01, 0.5).onChange(() => {
        if(treeParticles) {
            // 如果是 ShaderMaterial，需要更新 uniform 或者重新编译
            // 这里简单处理：如果是 PointsMaterial 直接改 size
            if (treeParticles.material.size !== undefined) {
                treeParticles.material.size = params.particleSize;
            }
        }
    });
    gui.add(params, 'rotationSpeed', 0, 0.02);
    gui.addColor(params, 'rippleColor').onChange((val) => {
        if(rippleMesh) rippleMesh.material.uniforms.uColor.value.set(val);
    });

    // 添加受密码保护的文字修改功能
    const textFolder = gui.addFolder('Text Settings');
    const textParams = {
        newText: params.titleText,
        password: '',
        applyChange: function() {
            if (this.password === '7970') {
                params.titleText = this.newText;
                createTextParticles();
                alert('修改成功！');
                this.password = ''; // 清空密码
            } else {
                alert('密码错误！无法修改文字。');
            }
        }
    };
    
    textFolder.add(textParams, 'newText').name('New Title');
    textFolder.add(textParams, 'password').name('Password'); // 简单的文本框，dat.gui默认不支持type="password"
    textFolder.add(textParams, 'applyChange').name('Apply Change');
    textFolder.open();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // 更新波纹
    if (rippleMesh) {
        rippleMesh.material.uniforms.uTime.value = elapsedTime;
    }

    // 更新粒子动画
    if (treeParticles) {
        // 1. 整体旋转：绕Y轴匀速转动
        treeParticles.rotation.y -= params.rotationSpeed * 2.0; // 稍微加快一点旋转速度

        // 2. 更新 Shader 时间，驱动光效流动
        if (treeParticles.material.uniforms) {
            treeParticles.material.uniforms.uTime.value = elapsedTime;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}
