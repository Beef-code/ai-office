import * as THREE from 'three';

export function createOfficeScene(container, callbacks = {}) {
  const { onTimeUpdate, onStatusUpdate, onMeetingChange } = callbacks;

  class RNG{constructor(s=42){this.s=s}n(){this.s=(this.s*16807)%2147483647;return(this.s-1)/2147483646}r(a,b){return a+this.n()*(b-a)}i(a,b){return Math.floor(this.r(a,b+1))}}
  const rng=new RNG(2026);

  // 1-6 楼层职能特工名单
  const AGENTS=[
    {name:'RONIN',  color:0x0DEEF3,floor:1,hair:0x1a1a2e,shirt:0x0A3D5C,pants:0x0A1628},
    {name:'SAGE',   color:0xF5A623,floor:1,hair:0x8B4513,shirt:0x8B6914,pants:0x3E2723},
    {name:'MUSE',   color:0xE040FB,floor:2,hair:0x4A148C,shirt:0x6A1B9A,pants:0x1a1a2e},
    {name:'ATLAS',  color:0x448AFF,floor:3,hair:0x3E2723,shirt:0x1565C0,pants:0x263238},
    {name:'CIPHER', color:0x00E676,floor:4,hair:0x222222,shirt:0x1B5E20,pants:0x1a1a2e},
    {name:'FORGE',  color:0xFF9100,floor:5,hair:0x1a1a1a,shirt:0xD35400,pants:0x2C3E50},
    {name:'SPARK',  color:0xFF5252,floor:6,hair:0xD84315,shirt:0xC62828,pants:0x212121},
  ];

  // ─── THREE.JS 初始化 ────────────────────────────────
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x020F24);
  scene.fog=new THREE.FogExp2(0x020F24,0.004);
  const camera=new THREE.PerspectiveCamera(30,container.clientWidth/container.clientHeight,0.1,500);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(container.clientWidth,container.clientHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  container.appendChild(renderer.domElement);

  // ─── 仰望视轨相机 ───────────────────────────────────
  let isDrag=false,prev={x:0,y:0};
  let sph={theta:Math.PI/4.2,phi:Math.PI/4.8,radius:60}; 
  const tgt=new THREE.Vector3(0,11,0);                  
  function updCam(){const p=Math.max(.15,Math.min(Math.PI/2.1,sph.phi));camera.position.set(sph.radius*Math.sin(p)*Math.sin(sph.theta)+tgt.x,sph.radius*Math.cos(p)+tgt.y,sph.radius*Math.sin(p)*Math.cos(sph.theta)+tgt.z);camera.lookAt(tgt)}
  updCam();
  
  renderer.domElement.addEventListener('pointerdown',e=>{isDrag=true;prev={x:e.clientX,y:e.clientY}});
  addEventListener('pointerup',()=>{isDrag=false});
  addEventListener('pointermove',e=>{if(!isDrag)return;sph.theta-=(e.clientX-prev.x)*.004;sph.phi+=(e.clientY-prev.y)*.004;prev={x:e.clientX,y:e.clientY};updCam()});
  renderer.domElement.addEventListener('wheel',e=>{sph.radius=Math.max(20,Math.min(95,sph.radius+e.deltaY*.04));updCam()},{passive:true});

  const ambient=new THREE.AmbientLight(0xffffff,0.7);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xFFF6E5,1.1);
  sun.position.set(20,35,15);scene.add(sun);
  
  const M=(c)=>new THREE.MeshStandardMaterial({color:c});
  const Glass=()=>new THREE.MeshPhysicalMaterial({color:0x7FB3D5,transparent:true,opacity:0.06,roughness:0.05});

  // ═══════════════════════════════════════════════════
  // 1. 楼外宏观环境（中央公园与大型停车场）
  // ═══════════════════════════════════════════════════
  const ground = new THREE.Mesh(new THREE.BoxGeometry(160, 0.2, 140), M(0x0D1B2A));
  ground.position.y = -0.2; scene.add(ground);

  const park = new THREE.Mesh(new THREE.BoxGeometry(70, 0.05, 45), M(0x1E4620));
  park.position.set(-15, 0, 25); scene.add(park);
  
  // 生成公园小树
  [[-25,15],[-10,30],[-30,35]].forEach(([tx, tz]) => {
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), M(0x5C4033));
    trunk.position.set(tx, 0.6, tz); scene.add(trunk);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), M(0x2E7D32));
    leaves.position.set(tx, 1.6, tz); scene.add(leaves);
  });

  // 户外停车场及小车
  const parkingLot = new THREE.Mesh(new THREE.BoxGeometry(40, 0.04, 35), M(0x2C3E50));
  parkingLot.position.set(40, 0, 15); scene.add(parkingLot);
  
  [[28,8,0x95A5A6],[35,18,0xC0392B],[45,5,0x2980B9]].forEach(([cx, cz, cc]) => {
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 1.2), M(cc));
    car.position.set(cx, 0.4, cz); scene.add(car);
  });

  // ═══════════════════════════════════════════════════
  // 2. 总部大楼核心骨架与各层软装填充
  // ═══════════════════════════════════════════════════
  const office = new THREE.Group(); scene.add(office);

  const FLOORS = [
    { level: 1, height: 0.0, color: 0xF8F9FA },
    { level: 2, height: 4.5, color: 0xEEF2F5 },
    { level: 3, height: 9.0, color: 0xE4E9ED },
    { level: 4, height: 13.5, color: 0xDAE1E7 },
    { level: 5, height: 18.0, color: 0xD0D8DF }, // 5层：Chairman房间
    { level: 6, height: 22.5, color: 0xC5D0D7, isRoof: true } // 6层：泳池Club
  ];

  const agentMeshes = [];

  FLOORS.forEach((f) => {
    const floorGroup = new THREE.Group();
    floorGroup.position.y = f.height;

    // A. 地板
    const fl = new THREE.Mesh(new THREE.BoxGeometry(26, 0.15, 20), M(f.color));
    fl.position.y = -0.075; floorGroup.add(fl);

    // B. 透明中央电梯井 + 轿厢
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(4, 4.5, 3), Glass());
    shaft.position.set(-10, 2.25, -8.3); floorGroup.add(shaft);
    const lift = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 2.2), M(0xD4AF37)); 
    lift.position.set(-10, 1.8, -8.3); floorGroup.add(lift);

    // C. 旋转楼梯小台阶
    for(let i=0; i<12; i++) {
      const ang = (i / 12) * Math.PI * 1.5;
      const stair = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.6), M(0x95A5A6));
      stair.position.set(10.5 + Math.sin(ang)*1.5, (i * 0.35) + 0.1, -4 + Math.cos(ang)*1.5);
      stair.rotation.y = -ang; floorGroup.add(stair);
    }

    // D. 各楼层室内装潢精细化归类
    if (f.level === 1) {
      // 1楼前台与独立会议室
      const mWall = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 0.25), M(0x2C3E50));
      mWall.position.set(-2, 1.6, -5.5); floorGroup.add(mWall);
      const desk = new THREE.Mesh(new THREE.BoxGeometry(4, 0.95, 1.1), M(0xFAFAFA));
      desk.position.set(-2, 0.475, -4); floorGroup.add(desk);
      const cTable = new THREE.Mesh(new THREE.BoxGeometry(6, 0.75, 2.5), M(0x5C4033));
      cTable.position.set(4, 0.375, 2); floorGroup.add(cTable);
    } 
    else if (f.level >= 2 && f.level <= 4) {
      // 1-4楼常规办公桌椅卡座
      [-4, 2].forEach(ox => {
        const desk = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.75, 2), M(0xBDC3C7));
        desk.position.set(ox, 0.375, 0); floorGroup.add(desk);
      });
    } 
    else if (f.level === 5) {
      // 5楼高级 Chairman 主席独立套房
      const bDesk = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.85, 2.8), M(0x4A235A)); 
      bDesk.position.set(0, 0.425, -3); floorGroup.add(bDesk);
      const bChair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.8), M(0xD4AF37));
      bChair.position.set(0, 0.75, -4.6); floorGroup.add(bChair);
      const luxuryCarpet = new THREE.Mesh(new THREE.BoxGeometry(16, 0.02, 12), M(0x7B241C));
      luxuryCarpet.position.set(0, 0.01, 1); floorGroup.add(luxuryCarpet);
    } 
    else if (f.isRoof) {
      // 6楼开放式 Club 与天空无边泳池
      const bar = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 1.5), M(0x111111));
      bar.position.set(-5, 0.55, -2); floorGroup.add(bar);
      const pool = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 14), new THREE.MeshPhysicalMaterial({color: 0x00D2FF, transparent: true, opacity: 0.6}));
      pool.position.set(6, -0.1, 1); floorGroup.add(pool);
    }

    // E. 核心修复：全景大玻璃幕墙（包裹在正确的大括号内部！）
    if (!f.isRoof) { 
      [[0,-9.7,26,4.5,0.05],[0,9.7,26,4.5,0.05],[-12.7,0,0.05,4.5,20],[12.7,0,0.05,4.5,20]].forEach(([x,z,w,h,d])=>{
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), Glass());
        wall.position.set(x, h/2, z); floorGroup.add(wall);
      });
    }

    // F. 人员装载与行为映射
    AGENTS.forEach(agent => {
      if (agent.floor === f.level) {
        const aGroup = new THREE.Group();
        aGroup.userData = { baseX: rng.r(-4, 4), baseZ: rng.r(-4, 4), angle: rng.r(0, Math.PI*2), speed: rng.r(0.01, 0.02) };
        
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.28), M(agent.shirt));
        body.position.y = 0.4; aGroup.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), M(agent.hair));
        head.position.y = 0.8; aGroup.add(head);

        floorGroup.add(aGroup);
        agentMeshes.push(aGroup);
      }
    });

    office.add(floorGroup);
  });

  // ─── 帧动画渲染循环 ─────────────────────────────────
  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    sph.theta += 0.0006; updCam(); // 缓慢转动展示外部景观公园

    agentMeshes.forEach(a => {
      const ud = a.userData; ud.angle += ud.speed;
      a.position.set(ud.baseX + Math.sin(ud.angle)*3, 0, ud.baseZ + Math.cos(ud.angle)*2.2);
    });
    renderer.render(scene, camera);
  }
  animate();

  return {
    destroy: () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if(container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    },
    resize: (w, h) => {
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    }
  };
}
