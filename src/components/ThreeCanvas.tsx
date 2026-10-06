import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraMode, SimulationConfig, TelemetryData } from '../types/simulation';
import { generateEarthTextures, createAtmosphereMaterial } from '../utils/earthTextures';
import { createTextMeteor, MeteorMeshResult } from '../utils/meteorMeshGenerator';
import { soundManager } from '../utils/audio';

interface ThreeCanvasProps {
  config: SimulationConfig;
  cameraMode: CameraMode;
  isPaused: boolean;
  timelineProgress: number; // 0.0 to 1.0
  onProgressUpdate: (data: TelemetryData) => void;
  onImpactTriggered: () => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  config,
  cameraMode,
  isPaused,
  timelineProgress,
  onProgressUpdate,
  onImpactTriggered,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mutable state references for 60fps render loop
  const stateRef = useRef({
    progress: timelineProgress,
    isPaused,
    cameraMode,
    config,
    hasImpactTriggered: false,
    impactTime: 0,
    cameraAngle: { azimuth: 0, elevation: 0.3, distance: 250 },
    isDragging: false,
    prevPointer: { x: 0, y: 0 },
  });

  stateRef.current.isPaused = isPaused;
  stateRef.current.cameraMode = cameraMode;
  stateRef.current.config = config;

  // Jump to specific timeline scrub
  useEffect(() => {
    stateRef.current.progress = timelineProgress;
    if (timelineProgress < 0.95) {
      stateRef.current.hasImpactTriggered = false;
    }
  }, [timelineProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. SCENE & RENDERER SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040b, 0.0007);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      8000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- 2. LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x223355, 0.7);
    scene.add(ambientLight);

    // Distant Sun
    const sunLight = new THREE.DirectionalLight(0xfffaed, 3.2);
    sunLight.position.set(450, 200, 350);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 50;
    sunLight.shadow.camera.far = 1000;
    const shadowD = 140;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    scene.add(sunLight);

    // Sun Visual Billboard
    const sunGeom = new THREE.SphereGeometry(18, 32, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffbe6 });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunMesh.position.copy(sunLight.position);
    scene.add(sunMesh);

    // --- 3. STARFIELD SKYBOX ---
    const starCount = 3500;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 2500 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const tint = Math.random();
      if (tint > 0.8) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.8; starColors[i * 3 + 2] = 0.7; // Red giant
      } else if (tint > 0.6) {
        starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0; // Blue star
      } else {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;
      }
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);

    // --- 4. 3D EARTH WITH MULTIPLE LAYERS ---
    const earthRadius = 55;
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const earthTextures = generateEarthTextures();

    // 4.1 Surface Body
    const earthGeom = new THREE.SphereGeometry(earthRadius, 64, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTextures.day,
      roughness: 0.65,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeom, earthMat);
    earthMesh.receiveShadow = true;
    earthMesh.castShadow = true;
    earthGroup.add(earthMesh);

    // 4.2 Cloud Layer
    const cloudsGeom = new THREE.SphereGeometry(earthRadius + 0.8, 64, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: earthTextures.clouds,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeom, cloudsMat);
    earthGroup.add(cloudsMesh);

    // 4.3 Atmospheric Fresnel Glow
    const atmosphereGeom = new THREE.SphereGeometry(earthRadius + 6.0, 64, 48);
    const atmosphereMat = createAtmosphereMaterial();
    const atmosphereMesh = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    earthGroup.add(atmosphereMesh);

    // 4.4 Calculate Seoul / Korea Target Vector on Earth Globe
    // Seoul is ~ 37.5° N latitude, 127° E longitude
    // On our UV map setup:
    const targetLat = 37.5 * (Math.PI / 180);
    const targetLon = 127.0 * (Math.PI / 180) - Math.PI * 0.55; // aligned to our texture
    const targetX = earthRadius * Math.cos(targetLat) * Math.sin(targetLon);
    const targetY = earthRadius * Math.sin(targetLat);
    const targetZ = earthRadius * Math.cos(targetLat) * Math.cos(targetLon);
    const impactPoint = new THREE.Vector3(targetX, targetY, targetZ);

    // Target Beacon Ring & holographic beam
    const beaconGroup = new THREE.Group();
    beaconGroup.position.copy(impactPoint);
    beaconGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), impactPoint.clone().normalize());

    const ringGeom = new THREE.RingGeometry(1.5, 2.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff2200,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const beaconRing = new THREE.Mesh(ringGeom, ringMat);
    beaconRing.rotation.x = Math.PI / 2;
    beaconGroup.add(beaconRing);

    // Vertical holographic scanner beam
    const beamGeom = new THREE.CylinderGeometry(0.2, 1.8, 25, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff3b00,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const beaconBeam = new THREE.Mesh(beamGeom, beamMat);
    beaconBeam.position.y = 12.5;
    beaconGroup.add(beaconBeam);

    earthGroup.add(beaconGroup);

    // 4.5 Moon
    const moonGeom = new THREE.SphereGeometry(12, 32, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xb0b5b8,
      roughness: 0.9,
      metalness: 0.05,
    });
    const moonMesh = new THREE.Mesh(moonGeom, moonMat);
    moonMesh.position.set(-280, 70, -220);
    scene.add(moonMesh);

    // --- 5. 3D TEXT METEOR CREATION ---
    let meteorObject: MeteorMeshResult = createTextMeteor(config.text, config.style);
    scene.add(meteorObject.group);

    // --- 6. DEFENSE GRID SATELLITES & LASER BEAMS ---
    const satelliteGroup = new THREE.Group();
    scene.add(satelliteGroup);

    const satellites: { mesh: THREE.Group; orbitAngle: number; speed: number; radius: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const sat = new THREE.Group();
      const satBody = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 })
      );
      sat.add(satBody);

      // Solar Panels
      const panelGeom = new THREE.BoxGeometry(4.5, 0.1, 1.4);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x1133aa, roughness: 0.3 });
      const leftPanel = new THREE.Mesh(panelGeom, panelMat);
      leftPanel.position.x = -3.2;
      const rightPanel = new THREE.Mesh(panelGeom, panelMat);
      rightPanel.position.x = 3.2;
      sat.add(leftPanel);
      sat.add(rightPanel);

      const orbitRadius = earthRadius + 18 + i * 8;
      satellites.push({
        mesh: sat,
        orbitAngle: (i * Math.PI) / 2,
        speed: 0.2 + i * 0.08,
        radius: orbitRadius,
      });
      satelliteGroup.add(sat);
    }

    // Laser Beam Lines (when lasers are active)
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      linewidth: 3,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const laserGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const laserLine = new THREE.Line(laserGeom, laserMat);
    scene.add(laserLine);

    // --- 7. PARTICLE ENGINE: FIERY TAIL & SMOKE ---
    const tailParticleCount = 1800;
    const tailGeom = new THREE.BufferGeometry();
    const tailPositions = new Float32Array(tailParticleCount * 3);
    const tailColors = new Float32Array(tailParticleCount * 3);
    const tailSizes = new Float32Array(tailParticleCount);
    const tailVelocities: THREE.Vector3[] = [];

    for (let i = 0; i < tailParticleCount; i++) {
      tailPositions[i * 3] = 0;
      tailPositions[i * 3 + 1] = 0;
      tailPositions[i * 3 + 2] = 0;

      tailColors[i * 3] = 1.0;
      tailColors[i * 3 + 1] = 0.4 + Math.random() * 0.5;
      tailColors[i * 3 + 2] = 0.05;

      tailSizes[i] = Math.random() * 8.0 + 2.0;
      tailVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        )
      );
    }

    tailGeom.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeom.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
    tailGeom.setAttribute('size', new THREE.BufferAttribute(tailSizes, 1));

    const tailMaterial = new THREE.PointsMaterial({
      size: 5.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tailParticles = new THREE.Points(tailGeom, tailMaterial);
    scene.add(tailParticles);

    // --- 8. IMPACT CRATER & EXPLOSION SHOCKWAVE MESHES ---
    const shockwaveRingGeom = new THREE.RingGeometry(0.1, 4.0, 64);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shockwaveRing = new THREE.Mesh(shockwaveRingGeom, shockwaveMat);
    shockwaveRing.position.copy(impactPoint);
    shockwaveRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), impactPoint.clone().normalize());
    scene.add(shockwaveRing);

    // Nuclear blast flash fireball sphere
    const flashGeom = new THREE.SphereGeometry(1, 32, 24);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const flashMesh = new THREE.Mesh(flashGeom, flashMat);
    flashMesh.position.copy(impactPoint);
    scene.add(flashMesh);

    // Molten Korean Text Crater Decal
    const craterCanvas = document.createElement('canvas');
    craterCanvas.width = 512;
    craterCanvas.height = 512;
    const cCtx = craterCanvas.getContext('2d')!;
    cCtx.fillStyle = '#ff2200';
    cCtx.beginPath();
    cCtx.arc(256, 256, 240, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.font = '900 64px "Black Han Sans", sans-serif';
    cCtx.fillStyle = '#ffffff';
    cCtx.textAlign = 'center';
    cCtx.textBaseline = 'middle';
    cCtx.fillText('뒷공부 봉인', 256, 256);

    const craterTex = new THREE.CanvasTexture(craterCanvas);
    const craterGeom = new THREE.PlaneGeometry(16, 16);
    const craterMat = new THREE.MeshBasicMaterial({
      map: craterTex,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const craterMesh = new THREE.Mesh(craterGeom, craterMat);
    craterMesh.position.copy(impactPoint).multiplyScalar(1.01);
    craterMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), impactPoint.clone().normalize());
    scene.add(craterMesh);

    // --- 9. TRAJECTORY PATH CALCULATION ---
    // Start deep space position far above Earth
    const meteorStartPos = new THREE.Vector3(260, 200, 280);
    // Trajectory control point for curved atmospheric reentry
    const meteorControlPos = new THREE.Vector3(120, 110, 140);
    const meteorEndPos = impactPoint.clone();

    const trajectoryCurve = new THREE.QuadraticBezierCurve3(
      meteorStartPos,
      meteorControlPos,
      meteorEndPos
    );

    // Trajectory Guide Curve (dotted line)
    const points = trajectoryCurve.getPoints(50);
    const trajectoryLineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const trajectoryLineMat = new THREE.LineDashedMaterial({
      color: 0xff3b30,
      dashSize: 4,
      gapSize: 2,
      opacity: 0.35,
      transparent: true,
    });
    const trajectoryLine = new THREE.Line(trajectoryLineGeom, trajectoryLineMat);
    trajectoryLine.computeLineDistances();
    scene.add(trajectoryLine);

    // --- 10. MOUSE / TOUCH INTERACTION FOR FREE ORBIT ---
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      stateRef.current.isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      stateRef.current.prevPointer = { x: clientX, y: clientY };
      soundManager.startAmbiance();
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!stateRef.current.isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - stateRef.current.prevPointer.x;
      const dy = clientY - stateRef.current.prevPointer.y;

      stateRef.current.cameraAngle.azimuth -= dx * 0.006;
      stateRef.current.cameraAngle.elevation = Math.max(
        -Math.PI * 0.45,
        Math.min(Math.PI * 0.45, stateRef.current.cameraAngle.elevation + dy * 0.006)
      );

      stateRef.current.prevPointer = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      stateRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      stateRef.current.cameraAngle.distance = Math.max(
        70,
        Math.min(700, stateRef.current.cameraAngle.distance + e.deltaY * 0.4)
      );
    };

    container.addEventListener('mousedown', handlePointerDown);
    container.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('touchstart', handlePointerDown);
    container.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
    container.addEventListener('wheel', handleWheel, { passive: true });

    // --- 11. MAIN ANIMATION RENDER LOOP ---
    let animationFrameId: number;
    let lastTime = performance.now();
    let tailIndex = 0;
    let cinematicCamTimer = 0;
    let currentCinematicShot = 0;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const timeSec = currentTime * 0.001;

      // Update simulation progress
      if (!stateRef.current.isPaused) {
        const speed = 0.045 * stateRef.current.config.speedMultiplier;
        stateRef.current.progress += delta * speed;

        if (stateRef.current.progress >= 1.0) {
          stateRef.current.progress = 1.0;
          if (!stateRef.current.hasImpactTriggered) {
            stateRef.current.hasImpactTriggered = true;
            stateRef.current.impactTime = currentTime;
            soundManager.playImpactExplosion();
            onImpactTriggered();
          }
        }
      }

      const p = Math.max(0, Math.min(1, stateRef.current.progress));

      // Calculate meteor position on trajectory curve
      const meteorPos = trajectoryCurve.getPoint(p);
      meteorObject.group.position.copy(meteorPos);

      // Point meteor along tangent towards Earth target
      const tangent = trajectoryCurve.getTangent(p).normalize();
      meteorObject.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), tangent);

      // Meteor self-tumble and shaders
      meteorObject.update(timeSec, stateRef.current.config.speedMultiplier, p);

      // Atmospheric roar audio based on proximity to Earth
      const distToEarthCenter = meteorPos.length();
      const distToSurface = Math.max(0, distToEarthCenter - earthRadius);
      const roarIntensity = THREE.MathUtils.clamp((100 - distToSurface) / 100, 0, 1);
      soundManager.updateAtmosphereRoar(roarIntensity * (p > 0.4 ? 1.0 : 0.2));

      // Sirens when nearing impact
      if (p > 0.75 && p < 1.0) {
        soundManager.playAlarmSound(true);
      } else {
        soundManager.playAlarmSound(false);
      }

      // Rotate clouds and earth slowly
      cloudsMesh.rotation.y += 0.0004;
      earthMesh.rotation.y += 0.00015;

      // Pulse beacon ring
      beaconRing.scale.setScalar(1 + Math.sin(timeSec * 6) * 0.25);
      beaconBeam.scale.y = 1 + Math.sin(timeSec * 8) * 0.2;

      // --- SATELLITES & LASER INTERCEPTION ---
      satellites.forEach((sat) => {
        sat.orbitAngle += delta * sat.speed * 0.5;
        sat.mesh.position.set(
          Math.cos(sat.orbitAngle) * sat.radius,
          Math.sin(sat.orbitAngle * 1.3) * (sat.radius * 0.4),
          Math.sin(sat.orbitAngle) * sat.radius
        );
        sat.mesh.lookAt(earthGroup.position);
      });

      if (stateRef.current.config.enableLasers && p > 0.2 && p < 0.98) {
        // Find closest satellite to meteor
        let nearestSat = satellites[0];
        let minDist = 99999;
        satellites.forEach((sat) => {
          const d = sat.mesh.position.distanceTo(meteorPos);
          if (d < minDist) {
            minDist = d;
            nearestSat = sat;
          }
        });

        // Fire laser pulses
        const laserPosAttr = laserLine.geometry.attributes.position as THREE.BufferAttribute;
        laserPosAttr.setXYZ(0, nearestSat.mesh.position.x, nearestSat.mesh.position.y, nearestSat.mesh.position.z);
        laserPosAttr.setXYZ(1, meteorPos.x, meteorPos.y, meteorPos.z);
        laserPosAttr.needsUpdate = true;

        const pulse = (Math.sin(timeSec * 25) + 1) * 0.5;
        laserMat.opacity = pulse > 0.4 ? 0.9 : 0.0;
        if (pulse > 0.85 && Math.random() < 0.1) {
          soundManager.playLaserSound();
        }
      } else {
        laserMat.opacity = 0;
      }

      // --- UPDATE FIERY METEOR TAIL PARTICLES ---
      if (p < 0.98) {
        const emitCount = Math.floor(15 + p * 30);
        const posAttr = tailParticles.geometry.attributes.position as THREE.BufferAttribute;
        const colAttr = tailParticles.geometry.attributes.color as THREE.BufferAttribute;

        for (let k = 0; k < emitCount; k++) {
          const idx = (tailIndex + k) % tailParticleCount;
          // Spawn near meteor core
          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 8
          );
          const spawnPos = meteorPos.clone().add(offset);
          posAttr.setXYZ(idx, spawnPos.x, spawnPos.y, spawnPos.z);

          // Ejection velocity backwards along trajectory
          const ejection = tangent.clone().multiplyScalar(-18 - Math.random() * 25).add(
            new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8)
          );
          tailVelocities[idx].copy(ejection);

          // Heat color (Yellow core -> Orange -> Red-hot plasma)
          if (stateRef.current.config.style === 'ice') {
            colAttr.setXYZ(idx, 0.4, 0.8 + Math.random() * 0.2, 1.0);
          } else if (stateRef.current.config.style === 'cyber_neon') {
            colAttr.setXYZ(idx, 0.0, 1.0, 0.8 + Math.random() * 0.2);
          } else {
            colAttr.setXYZ(idx, 1.0, 0.4 + Math.random() * 0.5, 0.05);
          }
        }
        tailIndex = (tailIndex + emitCount) % tailParticleCount;

        // Move existing particles
        for (let i = 0; i < tailParticleCount; i++) {
          const px = posAttr.getX(i) + tailVelocities[i].x * delta;
          const py = posAttr.getY(i) + tailVelocities[i].y * delta;
          const pz = posAttr.getZ(i) + tailVelocities[i].z * delta;
          posAttr.setXYZ(i, px, py, pz);
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }

      // --- IMPACT EXPLOSION & CRATER ANIMATION ---
      if (p >= 0.98) {
        const timeSinceImpact = (currentTime - stateRef.current.impactTime) * 0.001;

        // Hide meteor mesh on impact
        meteorObject.group.visible = false;

        // Flash expansion
        const flashRadius = Math.min(65, 1 + timeSinceImpact * 45);
        flashMesh.scale.setScalar(flashRadius);
        flashMat.opacity = Math.max(0, 1.0 - timeSinceImpact * 0.5);

        // Shockwave ring expansion along surface
        const ringRadius = 1 + timeSinceImpact * 35;
        shockwaveRing.scale.setScalar(ringRadius);
        shockwaveMat.opacity = Math.max(0, 0.95 - timeSinceImpact * 0.28);

        // Glowing text crater fades in
        craterMat.opacity = Math.min(1.0, timeSinceImpact * 0.8);
        craterMesh.scale.setScalar(1 + Math.sin(timeSec * 4) * 0.05);
      } else {
        meteorObject.group.visible = true;
        flashMat.opacity = 0;
        shockwaveMat.opacity = 0;
        craterMat.opacity = 0;
      }

      // --- CAMERA MODES & DIRECTOR CONTROLS ---
      const activeCamMode = stateRef.current.cameraMode;

      if (activeCamMode === 'cinematic') {
        cinematicCamTimer += delta;
        if (cinematicCamTimer > 7.0) {
          cinematicCamTimer = 0;
          currentCinematicShot = (currentCinematicShot + 1) % 4;
        }

        if (p >= 0.98) {
          // Post impact dramatic overhead rotation
          const angle = timeSec * 0.3;
          camera.position.set(
            impactPoint.x + Math.sin(angle) * 75,
            impactPoint.y + 45,
            impactPoint.z + Math.cos(angle) * 75
          );
          camera.lookAt(impactPoint);
        } else if (currentCinematicShot === 0) {
          // Dynamic Meteor Chase
          const behind = tangent.clone().multiplyScalar(-35);
          const camTarget = meteorPos.clone().add(behind).add(new THREE.Vector3(0, 10, 0));
          camera.position.lerp(camTarget, 0.08);
          camera.lookAt(meteorPos.clone().add(tangent.clone().multiplyScalar(40)));
        } else if (currentCinematicShot === 1) {
          // Earth Seoul Observatory looking up
          const obsPos = impactPoint.clone().multiplyScalar(1.03);
          camera.position.lerp(obsPos, 0.08);
          camera.lookAt(meteorPos);
        } else if (currentCinematicShot === 2) {
          // Wide Earth Silhouette View
          const camWide = new THREE.Vector3(180, 90, 160);
          camera.position.lerp(camWide, 0.05);
          camera.lookAt(meteorPos);
        } else {
          // Meteor Close POV
          const povPos = meteorPos.clone().add(tangent.clone().multiplyScalar(12)).add(new THREE.Vector3(4, 3, 0));
          camera.position.lerp(povPos, 0.08);
          camera.lookAt(impactPoint);
        }
      } else if (activeCamMode === 'meteor_chase') {
        const behind = tangent.clone().multiplyScalar(-40);
        const camTarget = meteorPos.clone().add(behind).add(new THREE.Vector3(0, 12, 0));
        camera.position.lerp(camTarget, 0.1);
        camera.lookAt(meteorPos.clone().add(tangent.clone().multiplyScalar(30)));
      } else if (activeCamMode === 'meteor_pov') {
        const povPos = meteorPos.clone().add(tangent.clone().multiplyScalar(10)).add(new THREE.Vector3(0, 2, 0));
        camera.position.lerp(povPos, 0.15);
        camera.lookAt(impactPoint);
      } else if (activeCamMode === 'earth_view') {
        // Ground view from Korea
        const groundPos = impactPoint.clone().multiplyScalar(1.02);
        camera.position.lerp(groundPos, 0.1);
        camera.lookAt(meteorPos);
      } else if (activeCamMode === 'iss_orbit') {
        const issPos = new THREE.Vector3(0, 120, 130);
        camera.position.lerp(issPos, 0.08);
        camera.lookAt(earthGroup.position);
      } else if (activeCamMode === 'top_down') {
        camera.position.lerp(new THREE.Vector3(0, 320, 0), 0.08);
        camera.lookAt(earthGroup.position);
      } else {
        // 'orbit' Free Orbit mode
        const { azimuth, elevation, distance } = stateRef.current.cameraAngle;
        const cx = distance * Math.cos(elevation) * Math.sin(azimuth);
        const cy = distance * Math.sin(elevation);
        const cz = distance * Math.cos(elevation) * Math.cos(azimuth);
        camera.position.set(cx, cy, cz);
        camera.lookAt(0, 0, 0);
      }

      // Supersonic camera shake near impact
      if (p > 0.82 && p < 0.99) {
        const shake = (p - 0.82) * 2.5;
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        camera.position.z += (Math.random() - 0.5) * shake;
      }

      // Telemetry Data Calculation
      const distKm = Math.floor((1 - p) * 128000);
      const velocity = Number((28.4 + p * 42.8).toFixed(1));
      const temp = Math.floor(800 + p * 6800);
      const studyLevel = Math.max(0, Math.floor((1 - p) * 9999));
      const timeToImpact = Math.max(0, Number(((1 - p) * 25 / stateRef.current.config.speedMultiplier).toFixed(1)));

      let phase: TelemetryData['phase'] = 'deep_space';
      if (p >= 1.0) phase = 'post_impact';
      else if (p > 0.95) phase = 'impact';
      else if (p > 0.7) phase = 'terminal';
      else if (p > 0.35) phase = 'reentry';

      onProgressUpdate({
        distanceToEarth: distKm,
        velocity,
        temperature: temp,
        studyPowerLevel: studyLevel,
        timeToImpact,
        phase,
        progress: p,
      });

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // --- 12. WINDOW RESIZE HANDLER ---
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handlePointerDown);
      container.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('touchstart', handlePointerDown);
      container.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      container.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [config.text, config.style]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden bg-[#02040b]"
    />
  );
};
