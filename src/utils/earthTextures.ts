import * as THREE from 'three';

/**
 * Procedurally generates high-resolution textures for Earth
 */
export function generateEarthTextures() {
  const width = 2048;
  const height = 1024;

  // 1. DAY DIFFUSE MAP
  const dayCanvas = document.createElement('canvas');
  dayCanvas.width = width;
  dayCanvas.height = height;
  const dayCtx = dayCanvas.getContext('2d')!;

  // Ocean base gradient
  const oceanGrad = dayCtx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0a2342');
  oceanGrad.addColorStop(0.2, '#0f3860');
  oceanGrad.addColorStop(0.5, '#124578');
  oceanGrad.addColorStop(0.8, '#0f3860');
  oceanGrad.addColorStop(1, '#0a2342');
  dayCtx.fillStyle = oceanGrad;
  dayCtx.fillRect(0, 0, width, height);

  // Ocean shelf / shallow water highlights around coastlines
  dayCtx.fillStyle = '#1c629e';

  // Draw continents procedurally with recognizable shapes
  // Eurasia & East Asia
  drawLandmass(dayCtx, [
    [0.45 * width, 0.25 * height],
    [0.72 * width, 0.22 * height], // Russia / Siberia
    [0.82 * width, 0.28 * height], // East Siberia
    [0.80 * width, 0.40 * height], // Far East
    [0.76 * width, 0.42 * height], // Korean Peninsula Area
    [0.72 * width, 0.50 * height], // China Coast
    [0.68 * width, 0.60 * height], // SE Asia
    [0.62 * width, 0.55 * height], // India
    [0.55 * width, 0.48 * height], // Middle East
    [0.48 * width, 0.45 * height], // Mediterranean
    [0.42 * width, 0.35 * height], // Western Europe
    [0.46 * width, 0.26 * height], // Scandinavia
  ], '#2e5d32', '#4b7d38');

  // Prominent Korean Peninsula Detail
  drawKoreanPeninsula(dayCtx, width, height);

  // Africa
  drawLandmass(dayCtx, [
    [0.47 * width, 0.46 * height],
    [0.56 * width, 0.48 * height], // Horn
    [0.55 * width, 0.72 * height], // South Africa
    [0.46 * width, 0.65 * height], // West Africa Coast
    [0.43 * width, 0.50 * height], // NW Africa
  ], '#7a7042', '#3e5c2e');

  // North America
  drawLandmass(dayCtx, [
    [0.12 * width, 0.22 * height], // Alaska
    [0.28 * width, 0.24 * height], // Canada
    [0.26 * width, 0.38 * height], // East Coast US
    [0.22 * width, 0.46 * height], // Florida / Gulf
    [0.17 * width, 0.50 * height], // Mexico
    [0.15 * width, 0.36 * height], // West Coast US
  ], '#3b6133', '#686a3e');

  // South America
  drawLandmass(dayCtx, [
    [0.23 * width, 0.52 * height], // Panama / Colombia
    [0.32 * width, 0.60 * height], // Brazil
    [0.27 * width, 0.82 * height], // Patagonia
    [0.22 * width, 0.70 * height], // Chile / Peru
  ], '#27582b', '#486835');

  // Australia
  drawLandmass(dayCtx, [
    [0.78 * width, 0.68 * height],
    [0.86 * width, 0.67 * height],
    [0.85 * width, 0.80 * height],
    [0.76 * width, 0.78 * height],
  ], '#8d683a', '#a67c47');

  // Polar ice caps (North & South)
  dayCtx.fillStyle = '#f0f8ff';
  dayCtx.beginPath();
  dayCtx.ellipse(width * 0.5, 0, width * 0.5, height * 0.08, 0, 0, Math.PI * 2);
  dayCtx.fill();

  dayCtx.beginPath();
  dayCtx.ellipse(width * 0.5, height, width * 0.5, height * 0.12, 0, 0, Math.PI * 2);
  dayCtx.fill();

  // Highlight Seoul / Korea target zone with high-contrast tactical beacon spot
  drawTargetSpot(dayCtx, width * 0.755, height * 0.41);

  // Add terrain noise & mountain ranges (Himalayas, Rockies, Alps)
  addTerrainNoise(dayCtx, width, height);

  const dayTexture = new THREE.CanvasTexture(dayCanvas);
  dayTexture.colorSpace = THREE.SRGBColorSpace;

  // 2. NIGHT LIGHTS MAP
  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = width;
  nightCanvas.height = height;
  const nightCtx = nightCanvas.getContext('2d')!;

  nightCtx.fillStyle = '#02040a';
  nightCtx.fillRect(0, 0, width, height);

  // Add glowing city lights clusters (Asia, Europe, Americas)
  drawCityLights(nightCtx, width, height);

  const nightTexture = new THREE.CanvasTexture(nightCanvas);
  nightTexture.colorSpace = THREE.SRGBColorSpace;

  // 3. CLOUDS MAP
  const cloudsCanvas = document.createElement('canvas');
  cloudsCanvas.width = width;
  cloudsCanvas.height = height;
  const cloudsCtx = cloudsCanvas.getContext('2d')!;
  cloudsCtx.fillStyle = '#000000';
  cloudsCtx.fillRect(0, 0, width, height);

  drawProceduralClouds(cloudsCtx, width, height);

  const cloudsTexture = new THREE.CanvasTexture(cloudsCanvas);
  cloudsTexture.colorSpace = THREE.SRGBColorSpace;

  // 4. SPECULAR MAP (Oceans reflective, land matte)
  const specCanvas = document.createElement('canvas');
  specCanvas.width = width / 2;
  specCanvas.height = height / 2;
  const specCtx = specCanvas.getContext('2d')!;
  specCtx.fillStyle = '#ffffff'; // ocean is shiny
  specCtx.fillRect(0, 0, specCanvas.width, specCanvas.height);
  
  // draw land as dark (non-reflective)
  specCtx.drawImage(dayCanvas, 0, 0, specCanvas.width, specCanvas.height);
  const specImgData = specCtx.getImageData(0, 0, specCanvas.width, specCanvas.height);
  for (let i = 0; i < specImgData.data.length; i += 4) {
    const r = specImgData.data[i];
    const g = specImgData.data[i + 1];
    const b = specImgData.data[i + 2];
    // If it's blue (ocean), make it bright white specular; if green/brown, make it dark
    if (b > r + 15 && b > g - 10) {
      specImgData.data[i] = 220;
      specImgData.data[i + 1] = 220;
      specImgData.data[i + 2] = 220;
    } else {
      specImgData.data[i] = 20;
      specImgData.data[i + 1] = 20;
      specImgData.data[i + 2] = 20;
    }
  }
  specCtx.putImageData(specImgData, 0, 0);

  const specTexture = new THREE.CanvasTexture(specCanvas);

  return {
    day: dayTexture,
    night: nightTexture,
    clouds: cloudsTexture,
    specular: specTexture,
  };
}

function drawLandmass(ctx: CanvasRenderingContext2D, points: number[][], fillCol: string, borderCol: string) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i][0] + points[(i + 1) % points.length][0]) / 2;
    const yc = (points[i][1] + points[(i + 1) % points.length][1]) / 2;
    ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
  }
  ctx.closePath();
  ctx.fillStyle = fillCol;
  ctx.fill();
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.restore();
}

function drawKoreanPeninsula(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  const kx = w * 0.755;
  const ky = h * 0.40;

  // Korean peninsula shape
  ctx.fillStyle = '#346633';
  ctx.strokeStyle = '#4e8547';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(kx - 12, ky - 20);
  ctx.lineTo(kx + 16, ky - 18); // North
  ctx.lineTo(kx + 22, ky + 10); // East Sea Coast
  ctx.lineTo(kx + 10, ky + 25); // Busan / South Coast
  ctx.lineTo(kx - 8, ky + 20);  // Mokpo / SW Coast
  ctx.lineTo(kx - 14, ky);      // West Coast
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Jeju island
  ctx.beginPath();
  ctx.arc(kx, ky + 34, 3, 0, Math.PI * 2);
  ctx.fill();

  // Dokdo & Ulleungdo
  ctx.beginPath();
  ctx.arc(kx + 28, ky + 4, 2, 0, Math.PI * 2);
  ctx.fill();

  // Japan Archipelago nearby
  ctx.beginPath();
  ctx.ellipse(kx + 45, ky + 18, 8, 30, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTargetSpot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  // Target ring marker for Jae-deok's Secret Bunker
  const grad = ctx.createRadialGradient(x, y, 0, x, y, 24);
  grad.addColorStop(0, 'rgba(255, 60, 0, 0.9)');
  grad.addColorStop(0.3, 'rgba(255, 180, 0, 0.6)');
  grad.addColorStop(0.7, 'rgba(255, 50, 0, 0.2)');
  grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();

  // Pulsing crosshair
  ctx.strokeStyle = '#ff3b30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x + 14, y);
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x, y + 14);
  ctx.stroke();

  ctx.restore();
}

function addTerrainNoise(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  // Add subtle mountain ridgelines and noise spots
  ctx.fillStyle = 'rgba(120, 100, 60, 0.15)';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * w;
    const ry = (0.2 + Math.random() * 0.6) * h;
    const size = 5 + Math.random() * 25;
    ctx.beginPath();
    ctx.arc(rx, ry, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCityLights(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  const clusters = [
    { x: w * 0.755, y: h * 0.40, count: 60, spread: 12, col: '#ffea75' }, // Seoul & Korea (Super bright!)
    { x: w * 0.79, y: h * 0.42, count: 80, spread: 20, col: '#ffde59' },  // Tokyo / Japan
    { x: w * 0.72, y: h * 0.45, count: 120, spread: 35, col: '#ffd166' }, // Shanghai / East China
    { x: w * 0.46, y: h * 0.32, count: 140, spread: 40, col: '#ffea75' }, // Western Europe
    { x: w * 0.25, y: h * 0.35, count: 130, spread: 35, col: '#ffe66d' }, // US East
    { x: w * 0.16, y: h * 0.36, count: 70, spread: 25, col: '#ffea75' },  // US West
    { x: w * 0.62, y: h * 0.52, count: 90, spread: 30, col: '#ffd166' },  // India
  ];

  clusters.forEach((c) => {
    for (let i = 0; i < c.count; i++) {
      const px = c.x + (Math.random() - 0.5) * c.spread * 2;
      const py = c.y + (Math.random() - 0.5) * c.spread * 1.5;
      const size = Math.random() * 2.2 + 0.8;
      const alpha = Math.random() * 0.8 + 0.2;

      ctx.fillStyle = c.col;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow for key mega cities
      if (Math.random() < 0.2) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.arc(px, py, size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  ctx.restore();
}

function drawProceduralClouds(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  // Draw organic swirling cloud bands (realistic cyclone and trade wind bands)
  for (let band = 0; band < 18; band++) {
    const cy = (0.15 + (band / 18) * 0.7) * h;
    for (let x = 0; x < w; x += 15) {
      const noise = Math.sin(x * 0.008 + band) * Math.cos(x * 0.003 + band * 2);
      if (noise > -0.2) {
        const radius = Math.abs(noise) * 45 + 15;
        const alpha = Math.min(0.85, (noise + 0.2) * 0.7);
        const grad = ctx.createRadialGradient(x, cy + noise * 30, 0, x, cy + noise * 30, radius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.6, `rgba(240, 248, 255, ${alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, cy + noise * 30, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Add a hurricane spiral near East Asia
  const hx = w * 0.78;
  const hy = h * 0.35;
  for (let a = 0; a < Math.PI * 6; a += 0.2) {
    const r = a * 7;
    const px = hx + Math.cos(a) * r;
    const py = hy + Math.sin(a) * r * 0.6;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 15);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Custom Atmosphere Scatter Shader Material
 */
export function createAtmosphereMaterial() {
  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPositionNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPositionNormal;
    uniform vec3 uColor;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
      gl_FragColor = vec4(uColor, 1.0) * intensity * 1.5;
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(0x3a92ff) }, // Rayleigh blue glow
    },
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
}
