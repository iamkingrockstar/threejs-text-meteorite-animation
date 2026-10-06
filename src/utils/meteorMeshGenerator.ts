import * as THREE from 'three';
import { MeteorStyle } from '../types/simulation';

export interface MeteorMeshResult {
  group: THREE.Group;
  materials: THREE.Material[];
  update: (time: number, speedMultiplier: number, phaseProgress: number) => void;
  getCenterPosition: () => THREE.Vector3;
}

/**
 * Creates high-detail 3D Text Asteroid from Korean text strings.
 */
export function createTextMeteor(text: string = '장재덕 뒷공부 그만', style: MeteorStyle = 'magma'): MeteorMeshResult {
  const group = new THREE.Group();
  const materials: THREE.Material[] = [];

  // Split text into words or balanced chunks (e.g., ["장재덕", "뒷공부", "그만"])
  const words = text.trim().split(/\s+/).filter(Boolean);
  const textLines = words.length > 0 ? words : ['장재덕', '뒷공부', '그만'];

  // Texture generator for character faces and magma displacement
  const lineMeshes: THREE.Mesh[] = [];
  const lineCount = textLines.length;

  textLines.forEach((line, index) => {
    // Generate text canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;

    // Background transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render rock/fire texture onto Korean font glyphs
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 160px "Black Han Sans", "Noto Sans KR", Impact, sans-serif';

    // Measure text width to fit
    const textMetrics = ctx.measureText(line);
    const scaleFactor = Math.min(1.0, (canvas.width - 60) / (textMetrics.width || 1));
    if (scaleFactor < 1.0) {
      ctx.font = `900 ${Math.floor(160 * scaleFactor)}px "Black Han Sans", "Noto Sans KR", Impact, sans-serif`;
    }

    // Shadow & outer crust
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;
    ctx.fillText(line, canvas.width / 2, canvas.height / 2);

    // Fill again without shadow for crisp inner core
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, canvas.width / 2, canvas.height / 2);

    // Create high-res normal/bump & emissive lava map for this text line
    const emissiveCanvas = document.createElement('canvas');
    emissiveCanvas.width = 1024;
    emissiveCanvas.height = 384;
    const eCtx = emissiveCanvas.getContext('2d')!;
    eCtx.drawImage(canvas, 0, 0);

    // Add glowing magma cracks pattern
    const imgData = eCtx.getImageData(0, 0, 1024, 384);
    for (let p = 0; p < imgData.data.length; p += 4) {
      const alpha = imgData.data[p + 3];
      if (alpha > 40) {
        const x = (p / 4) % 1024;
        const y = Math.floor((p / 4) / 1024);
        const noise = Math.sin(x * 0.08) * Math.cos(y * 0.08) + Math.sin(x * 0.02 + y * 0.03);
        if (noise > 0.4) {
          imgData.data[p] = 255;     // Hot Red
          imgData.data[p + 1] = 160; // Yellow-orange
          imgData.data[p + 2] = 20;
        } else {
          imgData.data[p] = 80;
          imgData.data[p + 1] = 20;
          imgData.data[p + 2] = 10;
        }
      }
    }
    eCtx.putImageData(imgData, 0, 0);

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.colorSpace = THREE.SRGBColorSpace;
    const emissiveTex = new THREE.CanvasTexture(emissiveCanvas);
    emissiveTex.colorSpace = THREE.SRGBColorSpace;

    // Create 3D thick block rock mesh with displacement
    const width = 16 * (line.length / 3);
    const height = 5.2;
    const depth = 4.0;

    // Box with high segmentation for rocky vertex deformation
    const geom = new THREE.BoxGeometry(width, height, depth, 48, 24, 20);
    const pos = geom.attributes.position;

    // Displace vertices to form organic craggy asteroid contours
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      // Noise deformation
      const n1 = Math.sin(vx * 0.6) * Math.cos(vy * 0.8) * Math.sin(vz * 0.7) * 0.6;
      const n2 = Math.sin(vx * 1.8 + vz * 1.5) * 0.3;
      
      // Keep front/back relatively flat for readable Korean text, cragify sides and edges
      const isZFace = Math.abs(vz) > depth * 0.45;
      const factor = isZFace ? 0.35 : 1.2;

      pos.setXYZ(i, vx + n1 * factor, vy + (n1 + n2) * factor, vz + n2 * 0.4);
    }
    geom.computeVertexNormals();

    // Material based on style
    const mat = getMeteorMaterial(style, diffuseTex, emissiveTex);
    materials.push(mat);

    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Position text lines vertically stacked / staggered like an epic orbital battlegroup
    const yOffset = (lineCount - 1) * 3.2 - index * 6.5;
    const zOffset = (index - lineCount / 2) * 1.8;
    const xOffset = (index % 2 === 1 ? 0.6 : -0.6);

    mesh.position.set(xOffset, yOffset, zOffset);
    // Slight random angular tilt for asteroid feel
    mesh.rotation.x = 0.12 * (index - 1);
    mesh.rotation.y = -0.1 * (index - 1);
    mesh.rotation.z = 0.05 * (index % 2 === 0 ? 1 : -1);

    group.add(mesh);
    lineMeshes.push(mesh);

    // Add rocky debris cluster around this text block
    const debris = createAsteroidDebrisCluster(style, 6, 8);
    debris.position.copy(mesh.position);
    group.add(debris);
  });

  // Add Outer Fiery Plasma Atmosphere Shock Cone (Bow shock when falling)
  const plasmaShieldGeom = new THREE.SphereGeometry(14, 32, 24);
  const plasmaShieldMat = createPlasmaShieldMaterial(style);
  materials.push(plasmaShieldMat);
  const plasmaShield = new THREE.Mesh(plasmaShieldGeom, plasmaShieldMat);
  plasmaShield.scale.set(1.4, 1.2, 0.7);
  plasmaShield.position.set(0, 0, 2);
  group.add(plasmaShield);

  // Add Dynamic Fiery Core Point Light
  const coreLight = new THREE.PointLight(
    style === 'ice' ? 0x60d5ff : style === 'cyber_neon' ? 0xff007f : 0xff5500,
    15,
    120
  );
  coreLight.position.set(0, 0, 0);
  group.add(coreLight);

  // Update loop
  const update = (time: number, speedMultiplier: number, phaseProgress: number) => {
    // Gentle asteroid tumble and roll
    const tumbleSpeed = 0.4 * speedMultiplier;
    group.rotation.x = Math.sin(time * 0.8 * tumbleSpeed) * 0.15;
    group.rotation.y = Math.cos(time * 0.6 * tumbleSpeed) * 0.18;
    group.rotation.z = Math.sin(time * 0.4 * tumbleSpeed) * 0.08;

    // Individual line floating tension
    lineMeshes.forEach((mesh, idx) => {
      mesh.position.y += Math.sin(time * 3 + idx * 2) * 0.008;
    });

    // Animate plasma shield intensity based on entry progress
    if (plasmaShieldMat.uniforms) {
      plasmaShieldMat.uniforms.uTime.value = time * 4.0;
      plasmaShieldMat.uniforms.uIntensity.value = 0.5 + phaseProgress * 2.5;
    }

    // Light pulsation
    coreLight.intensity = (12 + Math.sin(time * 15) * 4) * (1 + phaseProgress * 1.5);
  };

  const getCenterPosition = () => {
    const center = new THREE.Vector3();
    group.getWorldPosition(center);
    return center;
  };

  return {
    group,
    materials,
    update,
    getCenterPosition,
  };
}

/**
 * Creates rock fragment chunks tumbling around the main text
 */
function createAsteroidDebrisCluster(style: MeteorStyle, count: number, radius: number): THREE.Group {
  const cluster = new THREE.Group();

  for (let i = 0; i < count; i++) {
    const size = 0.6 + Math.random() * 1.2;
    const geom = new THREE.DodecahedronGeometry(size, 1);
    
    // Distort rock
    const pos = geom.attributes.position;
    for (let p = 0; p < pos.count; p++) {
      const vx = pos.getX(p) * (0.8 + Math.random() * 0.4);
      const vy = pos.getY(p) * (0.8 + Math.random() * 0.4);
      const vz = pos.getZ(p) * (0.8 + Math.random() * 0.4);
      pos.setXYZ(p, vx, vy, vz);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: style === 'ice' ? 0x88ccff : style === 'gold' ? 0xd4af37 : 0x22110c,
      roughness: 0.8,
      metalness: style === 'gold' ? 0.9 : 0.2,
      emissive: style === 'magma' ? 0xff3300 : style === 'cyber_neon' ? 0x00ffff : 0x000000,
      emissiveIntensity: 0.6,
    });

    const mesh = new THREE.Mesh(geom, mat);
    const angle = Math.random() * Math.PI * 2;
    const dist = radius * (0.7 + Math.random() * 0.6);
    mesh.position.set(
      Math.cos(angle) * dist,
      (Math.random() - 0.5) * 8,
      Math.sin(angle) * dist + (Math.random() - 0.5) * 4
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    cluster.add(mesh);
  }

  return cluster;
}

/**
 * Custom Material for Meteor Rock based on chosen visual style
 */
function getMeteorMaterial(style: MeteorStyle, diffuseTex: THREE.Texture, emissiveTex: THREE.Texture): THREE.Material {
  switch (style) {
    case 'cyber_neon':
      return new THREE.MeshStandardMaterial({
        color: 0x0a1128,
        map: diffuseTex,
        emissiveMap: emissiveTex,
        emissive: new THREE.Color(0x00f0ff),
        emissiveIntensity: 1.8,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false,
      });

    case 'gold':
      return new THREE.MeshStandardMaterial({
        color: 0xffd700,
        map: diffuseTex,
        emissive: new THREE.Color(0xff8c00),
        emissiveIntensity: 0.7,
        roughness: 0.25,
        metalness: 0.95,
      });

    case 'ice':
      return new THREE.MeshPhysicalMaterial({
        color: 0xa0e7ff,
        map: diffuseTex,
        emissive: new THREE.Color(0x2da8ff),
        emissiveIntensity: 0.9,
        roughness: 0.15,
        metalness: 0.1,
        transmission: 0.4,
        ior: 1.33,
        thickness: 1.5,
      });

    case 'dark_matter':
      return new THREE.MeshStandardMaterial({
        color: 0x120024,
        map: diffuseTex,
        emissive: new THREE.Color(0xaa00ff),
        emissiveIntensity: 1.4,
        roughness: 0.3,
        metalness: 0.7,
      });

    case 'magma':
    default:
      return new THREE.MeshStandardMaterial({
        color: 0x1c1410,
        map: diffuseTex,
        emissiveMap: emissiveTex,
        emissive: new THREE.Color(0xff4500),
        emissiveIntensity: 2.2,
        roughness: 0.85,
        metalness: 0.15,
        bumpScale: 0.6,
      });
  }
}

/**
 * Creates atmospheric plasma bow shock cone shader
 */
function createPlasmaShieldMaterial(style: MeteorStyle): THREE.ShaderMaterial {
  const colorMap: Record<MeteorStyle, THREE.Color> = {
    magma: new THREE.Color(0xff4400),
    cyber_neon: new THREE.Color(0x00ffff),
    gold: new THREE.Color(0xffbb00),
    ice: new THREE.Color(0x00ccff),
    dark_matter: new THREE.Color(0x9d00ff),
  };

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPos;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColor;
    varying vec3 vNormal;
    varying vec3 vPos;

    void main() {
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.2);
      float flameWave = sin(vPos.y * 1.5 + uTime * 6.0) * cos(vPos.x * 1.5 - uTime * 4.0) * 0.5 + 0.5;
      float alpha = fresnel * (0.4 + flameWave * 0.6) * uIntensity * 0.4;
      gl_FragColor = vec4(uColor * (1.2 + flameWave), alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uColor: { value: colorMap[style] || new THREE.Color(0xff4400) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
