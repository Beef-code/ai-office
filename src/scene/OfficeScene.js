import * as THREE from 'three';

export function createOfficeScene(container, callbacks = {}) {
  const { onTimeUpdate, onStatusUpdate, onMeetingChange } = callbacks;

  // ═══════════════════════════════════════════════════
  // 随机数与特工假数据生成器 (保留原作者底层)
  // ═══════════════════════════════════════════════════
  class RNG{constructor(s=42){this.s=s}n(){this.s=(this.s*16807)%2147483647;return(this.s-1)/2147483646}r(a,b){return a+this.n()*(b-a)}i(a,b){return Math.floor(this.r(a,b+1))}pick(a){return a[this.i(0,a.length-1)]}}
  const rng=new RNG(2026);

  const AGENTS=[
    {name:'RONIN',  color:0x0DEEF3,hex:'#0DEEF3',role:'The Builder',    screen:'ronin',  hair:0x1a1a2e,shirt:0x0A3D5C,pants:0x0A1628},
    {name:'SAGE',   color:0xF5A623,hex:'#F5A623',role:'The Analyst',    screen:'charts', hair:0x8B4513,shirt:0x8B6914,pants:0x3E2723},
    {name:'CIPHER', color:0x00E676,hex:'#00E676',role:'The Coder',      screen:'terminal',hair:0x222222,shirt:0x1B5E20,pants:0x1a1a2e},
    {name:'MUSE',   color:0xE040FB,hex:'#E040FB',role:'The Creative',   screen:'palette',hair:0x4A148C,shirt:0x6A1B9A,pants:0x1a1a2e},
    {name:'ATLAS',  color:0x448AFF,hex:'#448AFF',role:'The Strategist', screen:'map',    hair:0x3E2723,shirt:0x1565C0,pants:0x263238},
    {name:'FORGE',  color:0xFF9100,hex:'#FF9100',role:'The Deployer',   screen:'deploy', hair:0x1a1a1a,shirt:0xBF360C,pants:0x3E2723},
    {name:'ECHO',   color:0x7C4DFF,hex:'#7C4DFF',role:'The Researcher', screen:'docs',   hair:0x4E342E,shirt:0x4527A0,pants:0x1a1a2e},
    {name:'SPARK',  color:0xFF5252,hex:'#FF5252',role:'The Tester',     screen:'bugs',   hair:0xD84315,shirt:0xC62828,pants:0x212121},
  ];

  // ─── THREE.JS 基础场景初始化 ───────────────────────
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x000C1E);
  scene.fog=new THREE.FogExp2(0x000C1E,0.005);
  const camera=new THREE.PerspectiveCamera(30,container.clientWidth/container.clientHeight,0.1,500);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(container.clientWidth,container.clientHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.3;
  container.appendChild(renderer.domElement);

  // ─── 鼠标拖拽轨道相机控制 ─────────────────────────
  let isDrag=false,prev={x:0,y:0};
  let sph={theta:Math.PI/4.5,phi:Math.PI/4.5,radius:48}; // 默认缩放半径调整为48，完美容纳五层楼
  const tgt=new THREE.Vector3(0,9.0,0);                  // 中心点抬高到9.0，对准大楼黄金分割线
  let autoRot=true,autoTmr;
  function updCam(){const p=Math.max(.18,Math.min(Math.PI/2.3,sph.phi));sph.phi=p;camera.position.set(sph.radius*Math.sin(p)*Math.sin(sph.theta)+tgt.x,sph.radius*Math.cos(p)+tgt.y,sph.radius*Math.sin(p)*Math.cos(sph.theta)+tgt.z);camera.lookAt(tgt)}
  updCam();
  renderer.domElement.addEventListener('pointerdown',e=>{isDrag=true;prev={x:e.clientX,y:e.clientY};autoRot=false;clearTimeout(autoTmr)});
  addEventListener('pointerup',()=>{isDrag=false;autoTmr=setTimeout(()=>autoRot=true,6000)});
  addEventListener('pointermove',e=>{if(!isDrag)return;sph.theta-=(e.clientX-prev.x)*.005;sph.phi+=(e.clientY-prev.y)*.005;prev={x:e.clientX,y:e.clientY};updCam()});
  renderer.domElement.addEventListener('wheel',e=>{sph.radius=Math.max(16,Math.min(70,sph.radius+e.deltaY*.03));updCam()},{passive:true});

  // ─── 光源控制（营造高级感舞台光影） ──────────────────
  const ambient=new THREE.AmbientLight(0xffffff,0.75);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xFFF8F0,1.2);
  sun.position.set(12,20,10);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.bias=-.001;
  scene.add(sun);
  scene.add(new THREE.DirectionalLight(0xCCDDFF,0.4).translateX(-10).translateY(12));
  scene.add(new THREE.HemisphereLight(0xDDE8F0,0xB0BEC5,0.4));

  // ─── 材质快捷定义 ─────────────────────────────────
  const office=new THREE.Group();scene.add(office);
  const M=(c,o={})=>new THREE.MeshLambertMaterial({color:c,...o});
  const MB=c=>new THREE.MeshBasicMaterial({color:c});
  const Glass=()=>new THREE.MeshPhysicalMaterial({color:0xBBCCDD,transparent:true,opacity:0.08,roughness:0});

  // ═══════════════════════════════════════════════════
  // 高级感五层企业大楼矩阵渲染
  // ═══════════════════════════════════════════════════
  const DEF_FLOORS = [
    { level: 1, name: "1F - 集团前台大厅与访客中心", height: 0.0, color: 0xF2F4F7, isLobby: true },
    { level: 2, name: "2F - 财务与人力资源部 (HR/FIN)", height: 4.5, color: 0xE8ECEF, isLobby: false },
    { level: 3, name: "3F - 市场运营与多媒体直播中心", height: 9.0, color: 0xDFE4E8, isLobby: false },
    { level: 4, name: "4F - 技术研发中心与云核心机房", height: 13.5, color: 0xD7DEE3, isLobby: false },
    { level: 5, name: "5F - 总裁办与空中会客花园", height: 18.0, color: 0xCFD8DE, isLobby: false }
  ];

  DEF_FLOORS.forEach((f) => {
    const floorGroup = new THREE.Group();
    floorGroup.position.y = f.height;

    // 地板底座
    const fl = new THREE.Mesh(new THREE.BoxGeometry(26, 0.15, 20), M(f.color));
    fl.position.y = -0.075;
    fl.receiveShadow = true;
    floorGroup.add(fl);

    // 1楼大厅特殊定制（前台桌与背景墙）
    if (f.isLobby) {
      const receptionWall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 0.3), M(0x2C3E50));
      receptionWall.position.set(-2, 1.6, -7);
      receptionWall.castShadow = true;
      floorGroup.add(receptionWall);

      const desk = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.0, 1.2), M(0xFAFAFA));
      desk.position.set(-2, 0.5, -5);
      desk.castShadow = true;
      floorGroup.add(desk);

      const cpLobby = new THREE.Mesh(new THREE.BoxGeometry(7, 0.02, 6), M(0x34495E));
      cpLobby.position.set(4, 0.01, 2);
      cpLobby.receiveShadow = true;
      floorGroup.add(cpLobby);
    } else {
      const cp = new THREE.Mesh(new THREE.BoxGeometry(10, 0.02, 8), M(0xD0D8E0));
      cp.position.set(-3, 0.01, 0);
      cp.receiveShadow = true;
      floorGroup.add(cp);
    }

    // 全景落地大玻璃外围四面墙
    [[0, -9.5, 26, 4.2, 0.06], [0, 9.5, 26, 4.2, 0.06], [-12.5, 0, 0.06, 4.2, 20], [12.5, 0, 0.06, 4.2, 20]].forEach(([x, z, w, h, d]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Glass());
      wall.position.set(x, h / 2, z);
      floorGroup.add(wall);
    });

    // 楼层边框结构柱
    [[-12.5, -9.5], [-12.5, 9.5], [12.5, -9.5], [12.5, 9.5]].forEach(([x, z]) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 0.1), M(0x95A5A6));
      frame.position.set(x, 2.1, z);
      floorGroup.add(frame);
    });

    // 天花板
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(26, 0.1, 20), new THREE.MeshLambertMaterial({
      color: 0x0A1628,
      transparent: true,
      opacity: 0.35
    }));
    ceil.position.y = 4.25;
    floorGroup.add(ceil);

    // 天花板阵列光源
    for (let i = -2; i <= 2; i++) {
      for (let j = -1; j <= 1; j++) {
        const lightPanel = new THREE.Mesh(new THREE.BoxGeometry(3, 0.03, 1), MB(0xFFFFFF));
        lightPanel.position.set(i * 4.5, 4.20, j * 5);
        floorGroup.add(lightPanel);
        
        const pl = new THREE.PointLight(0xFFFFFF, 0.18, 8, 1.5);
        pl.position.set(i * 4.5, 3.9, j * 5);
        floorGroup.add(pl);
      }
    }

    office.add(floorGroup);
  });

  // ─── 基础渲染器帧动画循环与退出注销 ─────────────────
  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    if (autoRot) { sph.theta += 0.001; updCam(); }
    renderer.render(scene, camera);
  }
  animate();

  // 必须返回原作者框架需要的销毁及操作接口（最底层的围墙）
  return {
    destroy: () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if(container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    },
    resize: (w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  };
}
