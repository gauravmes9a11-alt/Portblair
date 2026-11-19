/**
 * DigitalGlobe.js - Core Digital Earth Component & Contour Point Cloud Generator
 * Recreates the cyber-holographic aesthetic from the reference image:
 * - High-density latitude contour dot matrix
 * - South polar (Antarctica) concentric topographic ripple waves
 * - Dual-tone luminous cyan and electric blue landmass points
 * - Integrated with GlobeScene and GlobeEffects
 */

(function(window) {
  'use strict';

  function DigitalGlobe(containerId) {
    this.containerId = containerId || 'globeCanvasContainer';
    this.radius = 100;
    this.init();
  }

  DigitalGlobe.prototype.init = function() {
    // 1. Initialize Viewport, Scene & Camera
    this.sceneManager = new GlobeScene(this.containerId);
    if (!this.sceneManager || !this.sceneManager.scene) return;

    var scene = this.sceneManager.scene;
    var globeGroup = this.sceneManager.globeGroup;

    // 2. Generate Accurate Continental Land-Sea Mask in Memory
    var landData = this.createLandMaskCanvas();

    // 3. Generate High-Density Contour Point Cloud
    this.createContourPointCloud(globeGroup, landData);

    // 4. Generate South Polar Topographic Ripple Rings (Signature feature from reference image)
    this.createPolarContourRings(globeGroup);

    // 5. Initialize Cyber Effects (Hexagons, Orbital Rings, Telemetry Spikes, Amber Satellites, Arcs)
    this.effects = new GlobeEffects(scene, globeGroup, this.radius);

    // 6. Connect Hover State
    var self = this;
    this.sceneManager.onHoverChange = function(isHovered) {
      if (self.effects) self.effects.setHoverState(isHovered);
    };

    // 7. Start 60 FPS Render Loop
    this.startLoop();
  };

  // Creates a 360x180 vector land-sea mask
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

    // Accurate continental outlines
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

    // India Subcontinent
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

    // Japan & East Asia
    drawPoly([[130, 32], [135, 34], [140, 36], [142, 43], [140, 45], [138, 38], [130, 32]]);

    // Greenland
    drawPoly([[-50, 60], [-40, 60], [-25, 70], [-20, 80], [-40, 83], [-60, 80], [-55, 70], [-50, 60]]);

    // Antarctica Continental Cap
    drawPoly([
      [-180, -68], [180, -68], [180, -90], [-180, -90]
    ]);

    return ctx.getImageData(0, 0, 360, 180).data;
  };

  // Generates contour point clouds along parallel latitude lines
  DigitalGlobe.prototype.createContourPointCloud = function(globeGroup, landData) {
    var positions = [];
    var colors = [];

    var cCyan = new THREE.Color(0x00E5FF);      // Vibrant Electric Cyan
    var cLightBlue = new THREE.Color(0x38BDF8);  // Luminescent Light Blue
    var cWhite = new THREE.Color(0xFFFFFF);      // High-reflectance crests
    var cOcean = new THREE.Color(0x132347);      // Faint ocean coordinate dot

    // Sample across latitude contours from -85 to +85 degrees
    var latStep = 1.35; // Fine horizontal latitude ring lines
    for (var lat = -84; lat <= 84; lat += latStep) {
      var phi = (90 - lat) * (Math.PI / 180);
      var radiusAtLat = Math.sin(phi);
      // Adjust longitude density based on latitude circumference
      var numPoints = Math.max(12, Math.floor(280 * radiusAtLat));
      var lonStep = 360 / numPoints;

      for (var p = 0; p < numPoints; p++) {
        var lon = -180 + p * lonStep;
        var theta = (lon + 180) * (Math.PI / 180);

        var imgX = Math.floor(lon + 180);
        var imgY = Math.floor(90 - lat);
        imgX = Math.max(0, Math.min(359, imgX));
        imgY = Math.max(0, Math.min(179, imgY));

        var pixelIndex = (imgY * 360 + imgX) * 4;
        var isLand = landData[pixelIndex] > 90;

        // Elevation bump for land contours
        var elevation = isLand ? (1.006 + Math.sin(lat * 0.15 + lon * 0.15) * 0.012) : 1.0;
        var r = this.radius * elevation;

        var x = -(r * Math.sin(phi) * Math.cos(theta));
        var z = (r * Math.sin(phi) * Math.sin(theta));
        var y = (r * Math.cos(phi));

        if (isLand) {
          positions.push(x, y, z);
          // Dual-tone cyan/blue with occasional bright white nodes
          var col = (p % 11 === 0) ? cWhite : ((p % 2 === 0) ? cCyan : cLightBlue);
          colors.push(col.r, col.g, col.b);
        } else if (p % 4 === 0) {
          // Sparse ocean dots defining spherical surface volume
          positions.push(x, y, z);
          colors.push(cOcean.r * 0.45, cOcean.g * 0.45, cOcean.b * 0.45);
        }
      }
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    var mat = new THREE.PointsMaterial({
      size: 2.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pointsMesh = new THREE.Points(geom, mat);
    globeGroup.add(this.pointsMesh);
  };

  // 4. South Polar (Antarctica) Concentric Topographic Ripple Rings
  // (Signature visual from bottom of reference image)
  DigitalGlobe.prototype.createPolarContourRings = function(globeGroup) {
    var ringMat = new THREE.LineBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    // Generate 6 concentric topographic ring ripples around the south pole
    var polarLatitudes = [-70, -73, -76, -79, -82, -85];
    polarLatitudes.forEach(function(pLat, idx) {
      var rGeom = new THREE.BufferGeometry();
      var pts = [];
      var segs = 72;
      var phi = (90 - pLat) * (Math.PI / 180);
      var baseR = this.radius * (1.018 + idx * 0.004);
      var ringRadius = baseR * Math.sin(phi);
      var ringY = baseR * Math.cos(phi);

      for (var s = 0; s <= segs; s++) {
        var angle = (s / segs) * Math.PI * 2;
        // Subtle wavy undulating contour
        var wave = 1.0 + Math.sin(angle * 6) * 0.04;
        pts.push(new THREE.Vector3(
          ringRadius * Math.cos(angle) * wave,
          ringY,
          ringRadius * Math.sin(angle) * wave
        ));
      }
      rGeom.setFromPoints(pts);
      var rLine = new THREE.Line(rGeom, ringMat);
      globeGroup.add(rLine);
    }, this);
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
