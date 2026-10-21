// ═══════════════════════════════════════════════════
// FIVE-STORY OFFICE BUILDING STRUCTURE (RECONFIGURED)
// ═══════════════════════════════════════════════════

const office = new THREE.Group();
scene.add(office);

// 定义高阶 5 层企业大楼的层级架构
const DEF_FLOORS = [
  { level: 1, name: "1F - 集团前台大厅与访客中心", height: 0.0, color: 0xF2F4F7, isLobby: true },
  { level: 2, name: "2F - 财务与人力资源部 (HR/FIN)", height: 4.5, color: 0xE8ECEF, isLobby: false },
  { level: 3, name: "3F - 市场运营与多媒体直播中心", height: 9.0, color: 0xDFE4E8, isLobby: false },
  { level: 4, name: "4F - 技术研发中心与云核心机房", height: 13.5, color: 0xD7DEE3, isLobby: false },
  { level: 5, name: "5F - 总裁办与空中会客花园", height: 18.0, color: 0xCFD8DE, isLobby: false }
];

// 使用矩阵循环，全自动渲染 5 层大楼的独立空间
DEF_FLOORS.forEach((f) => {
  const floorGroup = new THREE.Group();
  floorGroup.position.y = f.height;

  // 1. 每层的地板 (带高低错落的高级质感底座)
  const fl = new THREE.Mesh(new THREE.BoxGeometry(26, 0.15, 20), M(f.color));
  fl.position.y = -0.075;
  fl.receiveShadow = true;
  floorGroup.add(fl);

  // 2. 特殊化定制：如果是 1 楼底层，渲染企业前台与接待大厅
  if (f.isLobby) {
    // 渲染高档大理石前台背景墙
    const receptionWall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 0.3), M(0x2C3E50));
    receptionWall.position.set(-2, 1.6, -7);
    receptionWall.castShadow = true;
    floorGroup.add(receptionWall);

    // 渲染前台接待桌
    const desk = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.0, 1.2), M(0xFAFAFA));
    desk.position.set(-2, 0.5, -5);
    desk.castShadow = true;
    floorGroup.add(desk);

    // 访客休息区高端地毯
    const cpLobby = new THREE.Mesh(new THREE.BoxGeometry(7, 0.02, 6), M(0x34495E));
    cpLobby.position.set(4, 0.01, 2);
    cpLobby.receiveShadow = true;
    floorGroup.add(cpLobby);
  } else {
    // 如果是 2-5 层普通工作区，生成地毯和常规办公卡座底座
    const cp = new THREE.Mesh(new THREE.BoxGeometry(10, 0.02, 8), M(0xD0D8E0));
    cp.position.set(-3, 0.01, 0);
    cp.receiveShadow = true;
    floorGroup.add(cp);
  }

  // 3. 每层全面环绕的四面高级透明全景落地大玻璃墙
  [[0, -9.5, 26, 4.2, 0.06], [0, 9.5, 26, 4.2, 0.06], [-12.5, 0, 0.06, 4.2, 20], [12.5, 0, 0.06, 4.2, 20]].forEach(([x, z, w, h, d]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Glass());
    wall.position.set(x, h / 2, z);
    floorGroup.add(wall);
  });

  // 4. 金属边框结构线 (支撑起五层楼的立体感)
  [[-12.5, -9.5], [-12.5, 9.5], [12.5, -9.5], [12.5, 9.5]].forEach(([x, z]) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 0.1), M(0x95A5A6));
    frame.position.set(x, 2.1, z);
    floorGroup.add(frame);
  });

  // 5. 每层的深蓝色天花板
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(26, 0.1, 20), new THREE.MeshLambertMaterial({
    color: 0x0A1628,
    transparent: true,
    opacity: 0.35
  }));
  ceil.position.y = 4.25;
  floorGroup.add(ceil);

  // 6. 内置矩阵式顶级防眩光照明天花板灯带 (每层全自动生成独立光源)
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

  // 将这层盖好的大楼放入主场景
  office.add(floorGroup);
});

// 调整镜头初始对准位置，确保完美容纳高度增加后的 5 层大楼
tgt.set(0, 9.0, 0);
sph.radius = 48;
updCam();

// ═══════════════════════════════════════════════════
// MEETING ROOM (Right side of specific corporate zone)
// ═══════════════════════════════════════════════════
const MRX=8, MRZ=-3;
const mrGlass = Glass();
// ...（以下保留原有的会议室桌椅和白板渲染逻辑即可）
