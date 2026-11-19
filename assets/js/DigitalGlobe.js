/**
 * DigitalGlobe.js - Core Digital Earth Component & Point Cloud Generator
 * Part of the 3D Holographic Digital Globe for Gaurav Shivakumar Portfolio
 */

(function(window) {
  'use strict';

  function DigitalGlobe(containerId) {
    this.containerId = containerId || 'globeCanvasContainer';
    this.radius = 100;
    this.init();
  }

  DigitalGlobe.prototype.init = function() {
    // 1. Initialize Scene & Viewport
    this.sceneManager = new GlobeScene(this.containerId);
    if (!this.sceneManager || !this.sceneManager.scene) return;

    var scene = this.sceneManager.scene;
    var globeGroup = this.sceneManager.globeGroup;

    // 2. Generate Accurate Continental Landmass Mask on Offscreen Canvas
    var landData = this.createLandMaskCanvas();

    // 3. Generate 3D Spherical Continental Point Cloud
    this.createPointCloud(globeGroup, landData);

    // 4. Initialize Globe Effects (Atmosphere, Arcs, Photons, Rings)
    this.effects = new GlobeEffects(scene, globeGroup, this.radius);

    // 5. Connect Hover Events between Scene and Effects
    var self = this;
    this.sceneManager.onHoverChange = function(isHovered) {
      if (self.effects) self.effects.setHoverState(isHovered);
    };

    // 6. Start 60 FPS Animation Loop
    this.startLoop();
  };

  // Creates a 360x180 vector land-sea mask in memory
  DigitalGlobe.prototype.createLandMaskCanvas = function() {
    var canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 180;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000'; // Ocean
    ctx.fillRect(0, 0, 360, 180);

    ctx.fillStyle = '#FFFFFF'; // Land

    function toXY(lon, lat) {
      var x = lon + 180;
      var y = 90 - lat;
      return [x, y];
    }

    function drawPoly(pts) {
      if (pts.length < 3) return;
      ctx.beginPath();
      var p0 = toXY(pts[0][0], pts[0][1]);
      ctx.moveTo(p0[0], p0[1]);
      for (var i = 1; i < pts.length; i++) {
        var pt = toXY(pts[i][0], pts[i][1]);
        ctx.lineTo(pt[0], pt[1]);
      }
      ctx.closePath();
      ctx.fill();
    }

    // High-fidelity continental vector coordinates
    // North America
    drawPoly([
      [-168, 65], [-165, 60], [-160, 55], [-150, 60], [-140, 60], [-135, 54], [-125, 50],
      [-124, 38], [-117, 32], [-110, 23], [-105, 20], [-90, 15], [-83, 9], [-77, 8],
      [-80, 10], [-85, 16], [-88, 21], [-97, 26], [-97, 30], [-81, 25], [-80, 32],
      [-75, 35], [-70, 42], [-65, 45], [-60, 47], [-65, 58], [-75, 62], [-85, 68],
      [-95, 72], [-115, 70], [-130, 70], [-150, 71], [-165, 70]
    ]);

    // South America
    drawPoly([
      [-80, 9], [-77, 8], [-73, 11], [-60, 10], [-50, 0], [-35, -5], [-37, -12],
      [-40, -22], [-50, -30], [-58, -38], [-65, -45], [-68, -54], [-75, -50],
      [-73, -40], [-71, -30], [-76, -15], [-81, -5], [-80, 2], [-80, 9]
    ]);

    // Eurasia (Europe + Asia + India)
    drawPoly([
      [-9, 36], [-9, 43], [-1, 44], [-5, 48], [2, 51], [5, 58], [5, 62], [18, 70],
      [28, 71], [40, 68], [60, 73], [75, 73], [105, 77], [130, 72], [160, 70],
      [170, 66], [170, 60], [160, 55], [145, 50], [135, 43], [130, 38], [122, 38],
      [122, 30], [118, 22], [108, 14], [104, 10], [100, 15], [96, 20], [90, 22],
      [80, 13], [77, 8], [73, 15], [70, 22], [68, 25], [60, 25], [55, 25],
      [45, 13], [43, 12], [35, 30], [36, 36], [30, 32], [25, 35], [20, 37],
      [15, 40], [10, 44], [3, 43], [0, 38], [-5, 36], [-9, 36]
    ]);

    // India Detailed Subcontinent
    drawPoly([[68, 24], [73, 22], [73, 15], [77, 8], [80, 10], [80, 16], [88, 22], [80, 28], [72, 28], [68, 24]]);

    // Scandinavia
    drawPoly([[5, 58], [10, 58], [12, 56], [18, 59], [25, 65], [28, 71], [18, 71], [10, 64], [5, 58]]);

    // British Isles
    drawPoly([[-5, 50], [-1, 51], [2, 53], [0, 58], [-4, 58], [-6, 55], [-5, 50]]);

    // Africa
    drawPoly([
      [-17, 15], [-17, 21], [-12, 28], [-5, 36], [10, 37], [25, 32], [32, 31],
      [35, 27], [43, 12], [51, 12], [45, 2], [40, -5], [35, -20], [32, -28],
      [27, -33], [18, -34], [17, -25], [12, -15], [9, 4], [0, 6], [-15, 10], [-17, 15]
    ]);

    // Australia
    drawPoly([
      [114, -22], [120, -15], [130, -12], [138, -12], [142, -10], [145, -15],
      [153, -28], [150, -35], [140, -38], [135, -35], [120, -35], [115, -34], [114, -22]
    ]);

    // Japan & East Asia Islands
    drawPoly([[130, 32], [135, 34], [140, 36], [142, 43], [140, 45], [138, 38], [130, 32]]);

    // Greenland
    drawPoly([[-50, 60], [-40, 60], [-25, 70], [-20, 80], [-40, 83], [-60, 80], [-55, 70], [-50, 60]]);

    return ctx.getImageData(0, 0, 360, 180).data;
  };

  // Generates 10,000+ points across Fibonacci spherical surface
  DigitalGlobe.prototype.createPointCloud = function(globeGroup, landData) {
    var samples = 11000;
    var positions = [];
    var colors = [];

    var cCyan = new THREE.Color(0x6FE0F2);
    var cBlue = new THREE.Color(0x5C8DFF);
    var cOcean = new THREE.Color(0x1F2B47);

    // Golden Ratio Spiral algorithm on sphere
    var phiOffset = (1 + Math.sqrt(5)) / 2;

    for (var i = 0; i < samples; i++) {
      var y = 1 - (i / (samples - 1)) * 2; // y goes from 1 to -1
      var radiusAtY = Math.sqrt(1 - y * y);
      var theta = (2 * Math.PI * i) / phiOffset;

      var x = Math.cos(theta) * radiusAtY;
      var z = Math.sin(theta) * radiusAtY;

      // Calculate Latitude and Longitude in degrees
      var lat = Math.asin(y) * (180 / Math.PI);
      var lon = Math.atan2(z, -x) * (180 / Math.PI);

      var imgX = Math.floor(lon + 180);
      var imgY = Math.floor(90 - lat);
      imgX = Math.max(0, Math.min(359, imgX));
      imgY = Math.max(0, Math.min(179, imgY));

      var pixelIndex = (imgY * 360 + imgX) * 4;
      var isLand = landData[pixelIndex] > 100;

      // Render all land points + sparse ocean points for subtle holographic sphere depth
      if (isLand || (i % 7 === 0)) {
        positions.push(x * this.radius, y * this.radius, z * this.radius);

        if (isLand) {
          var dotColor = (i % 3 === 0) ? cCyan : cBlue;
          colors.push(dotColor.r, dotColor.g, dotColor.b);
        } else {
          // Ocean faint point
          colors.push(cOcean.r * 0.35, cOcean.g * 0.35, cOcean.b * 0.35);
        }
      }
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Particle Material
    var mat = new THREE.PointsMaterial({
      size: 1.65,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pointsMesh = new THREE.Points(geom, mat);
    globeGroup.add(this.pointsMesh);
  };

  DigitalGlobe.prototype.startLoop = function() {
    var self = this;
    var lastTime = performance.now();

    function animate(now) {
      requestAnimationFrame(animate);
      var delta = (now - lastTime) * 0.001;
      lastTime = now;

      if (self.sceneManager) {
        self.sceneManager.update(delta);
        if (self.effects) self.effects.update(delta);
        self.sceneManager.render();
      }
    }

    requestAnimationFrame(animate);
  };

  window.DigitalGlobe = DigitalGlobe;

  // Auto-initialize when DOM is ready
  window.addEventListener('DOMContentLoaded', function() {
    if (typeof THREE !== 'undefined' && document.getElementById('globeCanvasContainer')) {
      new DigitalGlobe('globeCanvasContainer');
    }
  });

})(window);
