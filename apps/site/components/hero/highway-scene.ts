// Ночная трасса к Москва-Сити: жёлтое такси Car City, потоки фар, город с окнами, блум.
// Чистый three.js без React, грузится лениво только на уровнях графики full и light (PRD 3.4).
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type SceneLevel = "full" | "light";

export interface HighwayScene {
  /** 0..1 — прогресс скролла героя: разгон и отъезд камеры */
  setScroll(p: number): void;
  /** -1..1 — положение курсора для параллакса */
  setPointer(x: number, y: number): void;
  /** Нажатие: короткий «газ в пол» */
  boost(on: boolean): void;
  setActive(on: boolean): void;
  dispose(): void;
}

const ROAD_LEN = 420;
const TAXI_X = 1.7;
const C = {
  signal: new THREE.Color("#FFB700"),
  soft: new THREE.Color("#FFD066"),
  sky: new THREE.Color("#449ACF"),
  teal: new THREE.Color("#439A9A"),
  night: new THREE.Color("#07090c"),
};

const rand = (() => {
  let s = 20261005;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
})();

export function createHighwayScene(canvas: HTMLCanvasElement, level: SceneLevel, onFirstFrame?: () => void): HighwayScene {
  const full = level === "full";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !full, powerPreference: "high-performance", alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, full ? 1.75 : 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new THREE.Scene();
  scene.background = C.night;
  scene.fog = new THREE.FogExp2(0x0a1016, 0.0105);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 900);
  const camBase = new THREE.Vector3(4.6, 1.75, 9.6);
  const lookBase = new THREE.Vector3(-3.2, 1.5, -8);

  const uniforms = { uTime: { value: 0 }, uTravel: { value: 0 } };
  const disposables: { dispose(): void }[] = [env, pmrem];
  const track = <T extends { dispose(): void }>(o: T) => (disposables.push(o), o);

  // — Небо: градиент с бирюзовым заревом города —
  {
    const g = track(new THREE.SphereGeometry(600, 32, 16));
    const m = track(
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTop: { value: new THREE.Color("#05070a") }, uHorizon: { value: new THREE.Color("#163440") }, uGlow: { value: C.sky.clone().multiplyScalar(0.55) } },
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: `uniform vec3 uTop,uHorizon,uGlow; varying vec3 vP;
          void main(){ float h = clamp(vP.y*2.2, 0., 1.);
            vec3 c = mix(uHorizon, uTop, pow(h, .55));
            float glow = exp(-pow(vP.y*9., 2.)) * smoothstep(.2, -1., vP.z);
            c += uGlow * glow * .55;
            gl_FragColor = vec4(c, 1.); }`,
      }),
    );
    scene.add(new THREE.Mesh(g, m));
  }

  // — Асфальт: мокрый, с бегущей разметкой и отражениями —
  {
    const g = track(new THREE.PlaneGeometry(26, ROAD_LEN, 1, 1));
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -ROAD_LEN / 2 + 20);
    const m = track(
      new THREE.ShaderMaterial({
        fog: true,
        uniforms: { ...uniforms, ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLine: { value: new THREE.Color("#d8d8d0") }, uSignal: { value: C.signal } },
        vertexShader: `#include <fog_pars_vertex>
          varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `#include <fog_pars_fragment>
          uniform float uTravel; uniform vec3 uLine, uSignal; varying vec3 vW;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
          void main(){
            float z = vW.z + uTravel;
            float x = vW.x;
            vec3 c = vec3(.028,.03,.034) + hash(floor(vW.xz*18.))*.012;
            // разметка: прерывистые между полосами, сплошные по краям
            float dash = step(.5, fract(z/9.));
            for (int i=-1;i<=1;i++){ float lx = float(i)*3.4 + 1.7; c = mix(c, uLine*.55, (1.-smoothstep(.06,.1,abs(x-lx)))*dash*step(abs(float(i)),0.5)); }
            c = mix(c, uLine*.5, (1.-smoothstep(.07,.11,abs(x+1.7)))*dash);
            c = mix(c, uSignal*.7, 1.-smoothstep(.08,.13,abs(abs(x)-8.6)));
            c = mix(c, uSignal*.35, (1.-smoothstep(.04,.07,abs(abs(x)-8.9))));
            // влажные блики фонарей вдоль обочин
            float wet = pow(max(0., 1.-abs(abs(x)-7.2)/3.5), 3.) * (.5+.5*sin(z*.35));
            c += vec3(1.,.72,.25)*wet*.05;
            gl_FragColor = vec4(c,1.);
            #include <fog_fragment>
          }`,
      }),
    );
    scene.add(new THREE.Mesh(g, m));
  }

  // — Потоки фар: встречка (тёплый белый) и попутные (красные стопы) —
  const trailCount = full ? 140 : 70;
  {
    const g = track(new THREE.PlaneGeometry(1, 1, 1, 1));
    g.rotateX(-Math.PI / 2);
    const inst = new THREE.InstancedBufferGeometry();
    inst.index = g.index;
    inst.setAttribute("position", g.getAttribute("position"));
    inst.setAttribute("uv", g.getAttribute("uv"));
    const aData = new Float32Array(trailCount * 4);
    const aCol = new Float32Array(trailCount * 3);
    const warm = new THREE.Color("#ffe7b0"), red = new THREE.Color("#ff2a2a"), yel = C.soft;
    for (let i = 0; i < trailCount; i++) {
      const oncoming = i % 2 === 0;
      const lane = oncoming ? -5.1 - Math.floor(rand() * 2) * 3.4 : 1.7 + Math.floor(rand() * 2) * 3.4;
      const side = (rand() > 0.5 ? 1 : -1) * 0.55;
      aData.set([lane + side, rand() * ROAD_LEN, 4 + rand() * 10, oncoming ? 34 + rand() * 18 : 8 + rand() * 8], i * 4);
      const col = oncoming ? (rand() > 0.85 ? yel : warm) : red;
      aCol.set([col.r, col.g, col.b], i * 3);
    }
    inst.setAttribute("aData", new THREE.InstancedBufferAttribute(aData, 4));
    inst.setAttribute("aCol", new THREE.InstancedBufferAttribute(aCol, 3));
    inst.instanceCount = trailCount;
    track(inst);
    const m = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms,
        vertexShader: `uniform float uTime, uTravel; attribute vec4 aData; attribute vec3 aCol; varying vec3 vCol; varying vec2 vUv; varying float vFade;
          void main(){
            float L = ${ROAD_LEN.toFixed(1)};
            float dir = aData.w > 30. ? 1. : -1.;
            float z = mod(aData.y + uTravel*(dir>0.?1.6:-.35) + uTime*aData.w*.15*dir, L) - L + 20.;
            vec3 p = position; p.x *= .16; p.z *= aData.z;
            p += vec3(aData.x, .32, z);
            vCol = aCol; vUv = uv; vFade = smoothstep(-L+20., -L+120., z) * (1. - smoothstep(6., 18., z));
            gl_Position = projectionMatrix * viewMatrix * vec4(p,1.);
          }`,
        fragmentShader: `varying vec3 vCol; varying vec2 vUv; varying float vFade;
          void main(){ float a = smoothstep(0.,.5,vUv.y)*smoothstep(1.,.5,vUv.y); a *= pow(1.-abs(vUv.x-.5)*2., 1.5);
            gl_FragColor = vec4(vCol*2.2, a*vFade); }`,
      }),
    );
    const mesh = new THREE.Mesh(inst, m);
    mesh.frustumCulled = false;
    scene.add(mesh);
  }

  // — Фонари вдоль дороги: столбы и тёплые плафоны —
  const lampCount = 26;
  const lampSpacing = 16;
  const lamps = new THREE.Group();
  {
    const poleG = track(new THREE.CylinderGeometry(0.06, 0.09, 7, 6));
    poleG.translate(0, 3.5, 0);
    const armG = track(new THREE.BoxGeometry(1.8, 0.08, 0.08));
    armG.translate(-0.9, 7, 0);
    const bulbG = track(new THREE.BoxGeometry(0.7, 0.12, 0.3));
    bulbG.translate(-1.6, 6.92, 0);
    const poleM = track(new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.6, metalness: 0.6 }));
    const bulbM = track(new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd9a0").multiplyScalar(3) }));
    for (let i = 0; i < lampCount; i++) {
      for (const s of [-1, 1]) {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(poleG, poleM), new THREE.Mesh(armG, poleM), new THREE.Mesh(bulbG, bulbM));
        g.position.set(s * 9.6, 0, -i * lampSpacing);
        g.scale.x = s;
        g.userData.z0 = -i * lampSpacing;
        lamps.add(g);
      }
    }
    scene.add(lamps);
  }

  // — Город: инстансы коробок с процедурными окнами —
  const buildingCount = full ? 260 : 140;
  {
    const g = track(new THREE.BoxGeometry(1, 1, 1));
    g.translate(0, 0.5, 0);
    const aScale = new Float32Array(buildingCount * 3);
    const aSeed = new Float32Array(buildingCount);
    const m = track(
      new THREE.ShaderMaterial({
        fog: true,
        uniforms: { ...uniforms, ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog) },
        vertexShader: `#include <fog_pars_vertex>
          attribute vec3 aScale; attribute float aSeed; varying vec3 vL; varying vec3 vN; varying float vSeed; varying float vH;
          void main(){ vL = position*aScale; vN = normal; vSeed = aSeed; vH = position.y;
            vec4 w = modelMatrix * instanceMatrix * vec4(position,1.); vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `#include <fog_pars_fragment>
          uniform float uTime; varying vec3 vL; varying vec3 vN; varying float vSeed; varying float vH;
          float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
          void main(){
            vec2 f = abs(vN.x) > .5 ? vL.zy : vL.xy;
            if (abs(vN.y) > .5) { gl_FragColor = vec4(.02,.022,.026,1.); return; }
            vec2 cell = vec2(1.15, 1.55);
            vec2 id = floor(f/cell); vec2 uv = fract(f/cell);
            float win = step(.18,uv.x)*step(uv.x,.82)*step(.22,uv.y)*step(uv.y,.78);
            float r = hash(vec3(id, vSeed));
            float lit = step(.8, r) * (.7 + .3*sin(uTime*.4 + r*40.));
            vec3 warm = mix(vec3(1.,.72,.38), vec3(.62,.82,1.), step(.93, hash(vec3(id.yx, vSeed*3.))));
            vec3 base = vec3(.035,.04,.05) * (.6 + .4*vH);
            vec3 c = base + win * lit * warm * 1.05 + win * (1.-lit) * vec3(.025,.035,.05);
            gl_FragColor = vec4(c,1.);
            #include <fog_fragment>
          }`,
      }),
    );
    const mesh = new THREE.InstancedMesh(g, m, buildingCount);
    const mtx = new THREE.Matrix4();
    for (let i = 0; i < buildingCount; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (17 + rand() * 50);
      const z = -10 - rand() * 330;
      const w = 5 + rand() * 9, d = 5 + rand() * 9;
      const h = 5 + Math.pow(rand(), 2.4) * (Math.abs(x) > 35 ? 60 : 30);
      mtx.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d));
      mesh.setMatrixAt(i, mtx);
      aScale.set([w, h, d], i * 3);
      aSeed[i] = rand() * 100;
    }
    g.setAttribute("aScale", new THREE.InstancedBufferAttribute(aScale, 3));
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));
    scene.add(mesh);
  }

  // — Москва-Сити на горизонте: стеклянные башни с кромками, «Эволюция» закручена —
  {
    const glass = track(
      new THREE.ShaderMaterial({
        fog: false,
        uniforms: { ...uniforms, uA: { value: C.teal }, uB: { value: C.sky } },
        vertexShader: `varying vec3 vL; varying vec3 vN; void main(){ vL = position; vN = normal; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `uniform vec3 uA,uB; uniform float uTime; varying vec3 vL; varying vec3 vN;
          void main(){ float h = vL.y/120.;
            vec3 c = mix(uA, uB, h) * (.22 + .2*abs(vN.x));
            float bands = step(.86, fract(vL.y*.35));
            c += mix(uA,uB,h) * bands * .35;
            float scan = smoothstep(.98,1.,sin(vL.y*.05 - uTime*.6)*.5+.5);
            c += vec3(1.,.8,.4)*scan*.35;
            float top = smoothstep(.97,1.,h); c += vec3(1.,.3,.25)*top*.6;
            gl_FragColor = vec4(c,1.); }`,
      }),
    );
    const towers: [number, number, number, number, boolean][] = [
      // x, z, height, width, twisted
      [-18, -330, 150, 12, false],
      [-4, -345, 190, 14, false],
      [10, -335, 120, 11, true],
      [24, -350, 170, 13, false],
      [36, -330, 95, 10, false],
      [-32, -340, 110, 10, false],
    ];
    for (const [x, z, h, w, twisted] of towers) {
      const g = track(new THREE.BoxGeometry(w, h, w, 1, twisted ? 40 : 1, 1));
      g.translate(0, h / 2, 0);
      if (twisted) {
        const p = g.getAttribute("position");
        const v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i);
          const a = (v.y / h) * Math.PI * 0.9;
          const cx = v.x * Math.cos(a) - v.z * Math.sin(a), cz = v.x * Math.sin(a) + v.z * Math.cos(a);
          p.setXYZ(i, cx, v.y, cz);
        }
        g.computeVertexNormals();
      }
      const t = new THREE.Mesh(g, glass);
      t.position.set(x, 0, z);
      t.rotation.y = rand() * 0.6;
      scene.add(t);
    }
  }

  // — Такси Car City: экструдированный профиль, шашка, стопы, фары —
  const taxi = new THREE.Group();
  let beam!: THREE.Mesh;
  const wheels: THREE.Mesh[] = [];
  {
    const s = new THREE.Shape();
    // профиль сбоку, длина 4.5 по X (нос в -X), высота 1.45
    s.moveTo(-2.25, 0.32);
    s.lineTo(-2.3, 0.62);
    s.quadraticCurveTo(-2.28, 0.78, -2.0, 0.84);
    s.lineTo(-1.15, 0.92);
    s.quadraticCurveTo(-0.75, 1.38, -0.35, 1.42);
    s.lineTo(0.85, 1.42);
    s.quadraticCurveTo(1.35, 1.38, 1.75, 0.98);
    s.lineTo(2.18, 0.9);
    s.quadraticCurveTo(2.3, 0.82, 2.28, 0.6);
    s.lineTo(2.22, 0.32);
    s.lineTo(-2.25, 0.32);
    const bodyG = track(new THREE.ExtrudeGeometry(s, { depth: 1.62, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 4, curveSegments: 16 }));
    bodyG.translate(0, 0, -0.81);
    const paint = track(new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#e8a200"), metalness: 0.5, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.7 }));
    const body = new THREE.Mesh(bodyG, paint);
    taxi.add(body);

    // стёкла: чуть утопленный силуэт кабины
    const w = new THREE.Shape();
    w.moveTo(-1.05, 0.95);
    w.quadraticCurveTo(-0.72, 1.33, -0.36, 1.36);
    w.lineTo(0.82, 1.36);
    w.quadraticCurveTo(1.28, 1.32, 1.6, 0.98);
    w.lineTo(-1.05, 0.95);
    const glassG = track(new THREE.ExtrudeGeometry(w, { depth: 1.72, bevelEnabled: false, curveSegments: 12 }));
    glassG.translate(0, 0.005, -0.86);
    const glassM = track(new THREE.MeshPhysicalMaterial({ color: 0x0b1218, metalness: 0.2, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.6 }));
    taxi.add(new THREE.Mesh(glassG, glassM));

    // шашка на боку
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 32;
    const cx = cv.getContext("2d")!;
    for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) {
      cx.fillStyle = (i + j) % 2 ? "#0B0B0C" : "#FFB700";
      cx.fillRect(i * 16, j * 16, 16, 16);
    }
    const tex = track(new THREE.CanvasTexture(cv));
    tex.colorSpace = THREE.SRGBColorSpace;
    const chkM = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.2 }));
    const chkG = track(new THREE.PlaneGeometry(2.2, 0.26));
    for (const zSide of [-1, 1]) {
      const p = new THREE.Mesh(chkG, chkM);
      p.position.set(0.1, 0.66, zSide * 0.935);
      if (zSide < 0) p.rotation.y = Math.PI;
      taxi.add(p);
    }

    // плафон TAXI на крыше
    const signG = track(new THREE.BoxGeometry(0.62, 0.2, 0.32));
    const signM = track(new THREE.MeshBasicMaterial({ color: new THREE.Color("#FFD066").multiplyScalar(2.2) }));
    const sign = new THREE.Mesh(signG, signM);
    sign.position.set(0.25, 1.62, 0);
    taxi.add(sign);

    // стопы и фары
    const tailM = track(new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff2020").multiplyScalar(4) }));
    const headM = track(new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff3d6").multiplyScalar(5) }));
    const lampG = track(new THREE.BoxGeometry(0.1, 0.16, 0.46));
    for (const z of [-0.62, 0.62]) {
      const t = new THREE.Mesh(lampG, tailM);
      t.position.set(2.44, 0.8, z);
      taxi.add(t);
      const h = new THREE.Mesh(lampG, headM);
      h.position.set(-2.38, 0.7, z);
      taxi.add(h);
    }

    // колёса
    const tireG = track(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 24));
    tireG.rotateX(Math.PI / 2);
    const tireM = track(new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.85 }));
    const rimG = track(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 6));
    rimG.rotateX(Math.PI / 2);
    const rimM = track(new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.3 }));
    for (const x of [-1.42, 1.42]) for (const z of [-0.82, 0.82]) {
      const wgrp = new THREE.Mesh(tireG, tireM);
      wgrp.add(new THREE.Mesh(rimG, rimM));
      wgrp.position.set(x, 0.36, z);
      wheels.push(wgrp);
      taxi.add(wgrp);
    }

    // луч фар на асфальте
    const beamG = track(new THREE.PlaneGeometry(1, 1));
    beamG.rotateX(-Math.PI / 2);
    const beamM = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uCol: { value: new THREE.Color("#ffdf9a") } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `uniform vec3 uCol; varying vec2 vUv; void main(){
          float t = vUv.y; float x = abs(vUv.x-.5)*2.;
          float cone = 1. - smoothstep(.12+.8*t, .2+.85*t, x);
          float a = cone * pow(1.-t, 1.5) * smoothstep(0.,.06,t) * .28;
          gl_FragColor = vec4(uCol, a); }`,
      }),
    );
    // луч в мировых координатах: от носа машины вперёд по -Z
    beam = new THREE.Mesh(beamG, beamM);
    beam.scale.set(5.5, 1, 22);
    beam.position.set(TAXI_X, 0.03, -2.3 - 11);
    scene.add(beam);

    // тень под машиной
    const shG = track(new THREE.PlaneGeometry(5.2, 2.4));
    shG.rotateX(-Math.PI / 2);
    const shM = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `varying vec2 vUv; void main(){ vec2 p = (vUv-.5)*2.; float a = 1.-smoothstep(.2,1.,length(p*vec2(.9,1.1))); gl_FragColor = vec4(0.,0.,0.,a*.75); }`,
      }),
    );
    const sh = new THREE.Mesh(shG, shM);
    sh.position.y = 0.02;
    taxi.add(sh);

    // машина едет от камеры по средней полосе
    taxi.rotation.y = -Math.PI / 2;
    taxi.position.set(TAXI_X, 0, 0);
    scene.add(taxi);
  }

  // — Свет —
  scene.add(new THREE.HemisphereLight(0x3a5a70, 0x080808, 0.5));
  const moon = new THREE.DirectionalLight(0x9fc6ff, 0.6);
  moon.position.set(-8, 14, -6);
  scene.add(moon);
  // фонарь, проезжающий над машиной: скользящий блик по кузову
  const sweep = new THREE.PointLight(0xffc77a, 14, 16, 2);
  scene.add(sweep);
  const rim = new THREE.PointLight(0xff3030, 6, 6, 2);
  rim.position.set(TAXI_X, 0.8, 3.2);
  scene.add(rim);

  // — Пост-обработка —
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  if (full) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.65, 0.45, 0.9);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // — Размер —
  let narrow = false;
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    bloom?.setSize(w, h);
    camera.aspect = w / h;
    // на узком экране камера отъезжает, чтобы такси влезло
    narrow = w / h < 0.8;
    if (narrow) { camBase.set(3.0, 3.4, 11.5); lookBase.set(0.9, -5.2, -8); } else { camBase.set(4.6, 1.75, 9.6); lookBase.set(-3.2, 1.5, -8); }
    camera.fov = narrow ? 64 : 50;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // — Цикл —
  let raf = 0, last = performance.now(), active = true, first = true;
  let scroll = 0, boostT = 0, boostOn = false;
  const ptr = new THREE.Vector2(), ptrS = new THREE.Vector2();
  let speed = 1;
  const look = new THREE.Vector3();

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!active) return;
    boostT += ((boostOn ? 1 : 0) - boostT) * Math.min(1, dt * 3);
    const target = 1 + scroll * 2.2 + boostT * 2.5;
    speed += (target - speed) * Math.min(1, dt * 2);
    uniforms.uTime.value += dt;
    uniforms.uTravel.value += dt * 22 * speed;
    const travel = uniforms.uTravel.value;

    const T = lampCount * lampSpacing;
    for (const l of lamps.children) {
      const zz = (((l.userData.z0 + travel) % T) + T) % T;
      l.position.z = zz - T + 14;
    }
    // ближайший фонарь освещает машину
    sweep.position.set(5, 6.4, ((travel * 1) % lampSpacing) - lampSpacing / 2);

    for (const w of wheels) w.rotation.z -= dt * speed * 22 / 0.36 * 0.12;
    taxi.position.y = Math.sin(uniforms.uTime.value * 9) * 0.008 * speed;
    taxi.position.x = TAXI_X + Math.sin(uniforms.uTime.value * 0.35) * 0.25;
    beam.position.x = taxi.position.x;
    rim.position.x = taxi.position.x;
    taxi.rotation.z = Math.sin(uniforms.uTime.value * 0.7) * 0.004;

    ptrS.lerp(ptr, Math.min(1, dt * 3));
    camera.position.set(camBase.x + ptrS.x * 1.1 - scroll * 2.4, camBase.y + ptrS.y * 0.45 + scroll * 1.6, camBase.z + scroll * 5 - boostT * 0.8);
    look.set(lookBase.x + ptrS.x * 0.4, lookBase.y, lookBase.z);
    camera.lookAt(look);
    camera.fov += ((narrow ? 64 : 50) + boostT * 8 - camera.fov) * Math.min(1, dt * 4);
    camera.updateProjectionMatrix();

    if (composer) composer.render();
    else renderer.render(scene, camera);
    if (first) {
      first = false;
      onFirstFrame?.();
    }
  };
  raf = requestAnimationFrame(frame);

  const onVis = () => {
    last = performance.now();
  };
  document.addEventListener("visibilitychange", onVis);

  return {
    setScroll(p) {
      scroll = Math.max(0, Math.min(1, p));
    },
    setPointer(x, y) {
      ptr.set(x, y);
    },
    boost(on) {
      boostOn = on;
    },
    setActive(on) {
      active = on;
      last = performance.now();
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      disposables.forEach((d) => d.dispose());
      composer?.dispose();
      renderer.dispose();
    },
  };
}
