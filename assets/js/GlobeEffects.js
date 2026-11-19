/**
 * GlobeEffects.js - Advanced Cyber Holographic Earth Effects
 * Features:
 * - Glowing Hexagonal Data Node Clusters
 * - Multiple 3D Tilted Orbital Satellite Rings
 * - Radial Outward Telemetry Spikes (Radar / Uplink Beams)
 * - Warm Amber / Golden Orbiting Satellite Particle Field
 * - Atmospheric Fresnel Rim Glow Shader
 * - 3D Bézier Connection Arcs with Traveling Photons
 */

(function(window) {
  'use strict';

  function GlobeEffects(scene, globeGroup, radius) {
    this.scene = scene;
    this.globeGroup = globeGroup;
    this.radius = radius || 100;
    this.arcs = [];
    this.photons = [];
    this.hexagons = [];
    this.orbitRings = [];
    this.time = 0;

    this.init();
  }

  // Convert lat/lon in degrees to 3D Cartesian coordinates on sphere of radius r
  GlobeEffects.latLonToVector3 = function(lat, lon, r) {
    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);
    var x = -(r * Math.sin(phi) * Math.cos(theta));
    var z = (r * Math.sin(phi) * Math.sin(theta));
    var y = (r * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
  };

  GlobeEffects.prototype.init = function() {
    this.createDarkCore();
    this.createAtmosphereGlow();
    this.createHexagonalNodes();
    this.createOrbitalTrajectoryRings();
    this.createRadialTelemetrySpikes();
    this.createGoldenAmberSatellites();
    this.createConnectionArcs();
  };

  // 1. Inner dark sphere occluding back-side dots for crisp 3D volume
  GlobeEffects.prototype.createDarkCore = function() {
    var coreGeom = new THREE.SphereGeometry(this.radius * 0.985, 48, 48);
    var coreMat = new THREE.MeshBasicMaterial({
      color: 0x050914,
      transparent: true,
      opacity: 0.92
    });
    this.darkCore = new THREE.Mesh(coreGeom, coreMat);
    this.globeGroup.add(this.darkCore);
  };

  // 2. Intense Cyber Cyan Atmospheric Fresnel Rim Glow
  GlobeEffects.prototype.createAtmosphereGlow = function() {
    var atmosGeom = new THREE.SphereGeometry(this.radius * 1.14, 48, 48);
    this.atmosMat = new THREE.ShaderMaterial({
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec3 vPosition;',
        'void main() {',
        '  vNormal = normalize(normalMatrix * normal);',
        '  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'varying vec3 vPosition;',
        'uniform vec3 glowColor;',
        'uniform float intensityModifier;',
        'void main() {',
        '  vec3 viewDir = normalize(-vPosition);',
        '  float intensity = pow(0.72 - dot(vNormal, viewDir), 2.5) * intensityModifier;',
        '  intensity = clamp(intensity, 0.0, 1.0);',
        '  gl_FragColor = vec4(glowColor, intensity * 0.85);',
        '}'
      ].join('\n'),
      uniforms: {
        glowColor: { value: new THREE.Color(0x00E5FF) }, // Brilliant Cyber Cyan
        intensityModifier: { value: 1.0 }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    this.atmosphereMesh = new THREE.Mesh(atmosGeom, this.atmosMat);
    this.scene.add(this.atmosphereMesh);
  };

  // 3. Glowing Hexagonal Data Node Clusters on Globe Surface
  GlobeEffects.prototype.createHexagonalNodes = function() {
    var self = this;
    var nodeLocations = [
      { name: 'Bengaluru', lat: 12.97, lon: 77.59, size: 4.8, isHome: true },
      { name: 'San Francisco', lat: 37.77, lon: -122.41, size: 4.2 },
      { name: 'Tokyo', lat: 35.68, lon: 139.69, size: 4.2 },
      { name: 'London', lat: 51.50, lon: -0.12, size: 4.0 },
      { name: 'Zurich', lat: 47.37, lon: 8.54, size: 3.8 },
      { name: 'Singapore', lat: 1.35, lon: 103.82, size: 3.8 },
      { name: 'Sydney', lat: -33.86, lon: 151.20, size: 3.8 },
      { name: 'New York', lat: 40.71, lon: -74.00, size: 4.0 },
      { name: 'Dubai', lat: 25.20, lon: 55.27, size: 3.6 },
      { name: 'Seoul', lat: 37.56, lon: 126.97, size: 3.6 },
      { name: 'Sao Paulo', lat: -23.55, lon: -46.63, size: 3.8 },
      { name: 'Nairobi', lat: -1.29, lon: 36.82, size: 3.5 }
    ];

    nodeLocations.forEach(function(loc, idx) {
      var pos = GlobeEffects.latLonToVector3(loc.lat, loc.lon, self.radius * 1.008);
      var normal = pos.clone().normalize();

      // Create a 6-sided hexagon loop
      var hexPoints = [];
      var hexSize = loc.size;
      for (var i = 0; i < 6; i++) {
        var angle = (i / 6) * Math.PI * 2;
        hexPoints.push(new THREE.Vector3(Math.cos(angle) * hexSize, Math.sin(angle) * hexSize, 0));
      }
      var hexGeom = new THREE.BufferGeometry().setFromPoints(hexPoints);
      var hexMat = new THREE.LineBasicMaterial({
        color: loc.isHome ? 0x00F0FF : (idx % 2 === 0 ? 0x00E5FF : 0x38BDF8),
        transparent: true,
        opacity: 0.9,
        linewidth: 2,
        blending: THREE.AdditiveBlending
      });

      var hexMesh = new THREE.LineLoop(hexGeom, hexMat);
      hexMesh.position.copy(pos);
      // Align hexagon perpendicular to surface normal
      hexMesh.lookAt(pos.clone().add(normal));
      self.globeGroup.add(hexMesh);

      // Inner glowing center core dot
      var coreDotGeom = new THREE.SphereGeometry(loc.isHome ? 1.6 : 1.1, 12, 12);
      var coreDotMat = new THREE.MeshBasicMaterial({
        color: loc.isHome ? 0xFFFFFF : 0x00F0FF,
        transparent: true,
        opacity: 0.95
      });
      var coreDot = new THREE.Mesh(coreDotGeom, coreDotMat);
      coreDot.position.copy(pos);
      self.globeGroup.add(coreDot);

      self.hexagons.push({
        mesh: hexMesh,
        baseScale: 1.0,
        pulseSpeed: 0.025 + (idx % 4) * 0.008,
        pulsePhase: idx * 0.7
      });
    });

    // Inter-hexagonal surface network lines
    var interLines = [
      [nodeLocations[0], nodeLocations[5]], // Bengaluru -> Singapore
      [nodeLocations[0], nodeLocations[8]], // Bengaluru -> Dubai
      [nodeLocations[8], nodeLocations[4]], // Dubai -> Zurich
      [nodeLocations[4], nodeLocations[3]], // Zurich -> London
      [nodeLocations[3], nodeLocations[7]], // London -> New York
      [nodeLocations[7], nodeLocations[1]], // New York -> SF
      [nodeLocations[1], nodeLocations[2]], // SF -> Tokyo
      [nodeLocations[2], nodeLocations[9]], // Tokyo -> Seoul
      [nodeLocations[5], nodeLocations[6]]  // Singapore -> Sydney
    ];

    var netMat = new THREE.LineBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    interLines.forEach(function(pair) {
      var pA = GlobeEffects.latLonToVector3(pair[0].lat, pair[0].lon, self.radius * 1.006);
      var pB = GlobeEffects.latLonToVector3(pair[1].lat, pair[1].lon, self.radius * 1.006);
      var geom = new THREE.BufferGeometry().setFromPoints([pA, pB]);
      self.globeGroup.add(new THREE.Line(geom, netMat));
    });
  };

  // 4. Multiple 3D Tilted Orbital Trajectory Rings Surrounding Earth
  GlobeEffects.prototype.createOrbitalTrajectoryRings = function() {
    var self = this;
    var ringConfigs = [
      // Ring 1: Framing outer circular orbital ring
      { radius: this.radius * 1.44, rotX: 0.15, rotY: 0.1, rotZ: 0.0, opacity: 0.65, color: 0x00E5FF },
      // Ring 2: Tilted polar orbital plane (GPS / Constellation shell)
      { radius: this.radius * 1.36, rotX: 1.15, rotY: 0.35, rotZ: 0.25, opacity: 0.58, color: 0x38BDF8 },
      // Ring 3: Tilted retrograde orbital plane
      { radius: this.radius * 1.30, rotX: -0.85, rotY: -0.45, rotZ: 0.35, opacity: 0.55, color: 0x00E5FF },
      // Ring 4: Low inclination equatorial trajectory
      { radius: this.radius * 1.25, rotX: 0.45, rotY: 0.85, rotZ: -0.3, opacity: 0.52, color: 0x5C8DFF }
    ];

    ringConfigs.forEach(function(cfg, idx) {
      var segments = 120;
      var points = [];
      for (var i = 0; i <= segments; i++) {
        var theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * cfg.radius, 0, Math.sin(theta) * cfg.radius));
      }

      var geom = new THREE.BufferGeometry().setFromPoints(points);
      var mat = new THREE.LineBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: cfg.opacity,
        blending: THREE.AdditiveBlending
      });

      var ringLine = new THREE.Line(geom, mat);
      ringLine.rotation.set(cfg.rotX, cfg.rotY, cfg.rotZ);
      self.globeGroup.add(ringLine);

      self.orbitRings.push({
        mesh: ringLine,
        rotSpeed: (idx % 2 === 0 ? 0.0004 : -0.0003) * (idx + 1)
      });
    });
  };

  // 5. Radial Outward Telemetry Spikes (Radar Rays & Uplink Beams)
  GlobeEffects.prototype.createRadialTelemetrySpikes = function() {
    var spikeCount = 110;
    var linePositions = [];
    var lineColors = [];

    var cCyan = new THREE.Color(0x00E5FF);
    var cBlue = new THREE.Color(0x5C8DFF);
    var cWhite = new THREE.Color(0xFFFFFF);

    for (var i = 0; i < spikeCount; i++) {
      // Sample points uniformly around the sphere
      var u = Math.random();
      var v = Math.random();
      var theta = u * 2.0 * Math.PI;
      var phi = Math.acos(2.0 * v - 1.0);
      var sinPhi = Math.sin(phi);

      var nx = sinPhi * Math.cos(theta);
      var ny = Math.cos(phi);
      var nz = sinPhi * Math.sin(theta);

      // Start right above surface
      var rStart = this.radius * (1.008 + Math.random() * 0.02);
      // Spike length extends outward between 6 and 24 units
      var spikeLen = 6 + Math.pow(Math.random(), 1.8) * 20;
      var rEnd = rStart + spikeLen;

      // Start point
      linePositions.push(nx * rStart, ny * rStart, nz * rStart);
      // End point
      linePositions.push(nx * rEnd, ny * rEnd, nz * rEnd);

      var col = (i % 3 === 0) ? cWhite : ((i % 2 === 0) ? cCyan : cBlue);
      lineColors.push(col.r, col.g, col.b);
      lineColors.push(col.r * 0.4, col.g * 0.4, col.b * 0.4); // Fades toward tip
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    var mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.telemetrySpikes = new THREE.LineSegments(geom, mat);
    this.globeGroup.add(this.telemetrySpikes);
  };

  // 6. Warm Amber / Golden Orbiting Satellites (Crucial Color Accent from Reference Image)
  GlobeEffects.prototype.createGoldenAmberSatellites = function() {
    var satCount = 42;
    var positions = new Float32Array(satCount * 3);
    var colors = new Float32Array(satCount * 3);

    var cGoldA = new THREE.Color(0xFFD166); // Warm Golden Amber
    var cGoldB = new THREE.Color(0xF59E0B); // Radiant Gold
    var cGoldC = new THREE.Color(0xFEF08A); // Bright Yellow White

    this.goldenSatsData = [];

    for (var i = 0; i < satCount; i++) {
      var dist = this.radius * (1.18 + Math.random() * 0.38);
      var theta = Math.random() * Math.PI * 2;
      var phi = (Math.random() - 0.5) * Math.PI * 0.85;

      var x = dist * Math.cos(phi) * Math.cos(theta);
      var y = dist * Math.sin(phi);
      var z = dist * Math.cos(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      var col = (i % 3 === 0) ? cGoldC : ((i % 2 === 0) ? cGoldA : cGoldB);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      this.goldenSatsData.push({
        dist: dist,
        theta: theta,
        phi: phi,
        speed: (Math.random() * 0.003 + 0.002) * (i % 2 === 0 ? 1 : -1)
      });
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var mat = new THREE.PointsMaterial({
      size: 3.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    this.goldenSatsMesh = new THREE.Points(geom, mat);
    this.globeGroup.add(this.goldenSatsMesh);
  };

  // 7. 3D Parabolic Bézier Connection Arcs with Traveling Photons
  GlobeEffects.prototype.createConnectionArcs = function() {
    var self = this;

    var connections = [
      { from: [12.97, 77.59], to: [37.77, -122.41] }, // Bengaluru -> SF
      { from: [12.97, 77.59], to: [51.50, -0.12] },   // Bengaluru -> London
      { from: [12.97, 77.59], to: [35.68, 139.69] },  // Bengaluru -> Tokyo
      { from: [12.97, 77.59], to: [1.35, 103.82] },   // Bengaluru -> Singapore
      { from: [51.50, -0.12], to: [40.71, -74.00] },  // London -> NY
      { from: [37.77, -122.41], to: [35.68, 139.69] },// SF -> Tokyo
      { from: [1.35, 103.82], to: [-33.86, 151.20] }  // Singapore -> Sydney
    ];

    connections.forEach(function(conn, idx) {
      var pA = GlobeEffects.latLonToVector3(conn.from[0], conn.from[1], self.radius * 1.008);
      var pB = GlobeEffects.latLonToVector3(conn.to[0], conn.to[1], self.radius * 1.008);

      var distance = pA.distanceTo(pB);
      var mid = pA.clone().add(pB).multiplyScalar(0.5);
      var altFactor = self.radius * (1.16 + (distance / (self.radius * 2)) * 0.36);
      mid.normalize().multiplyScalar(altFactor);

      var curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      var curvePoints = curve.getPoints(45);
      var curveGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);

      var arcMat = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? 0x00E5FF : 0x38BDF8,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      var arcLine = new THREE.Line(curveGeom, arcMat);
      self.globeGroup.add(arcLine);

      // High-speed photon particle
      var photonGeom = new THREE.SphereGeometry(1.6, 12, 12);
      var photonMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.95
      });
      var photonMesh = new THREE.Mesh(photonGeom, photonMat);
      self.globeGroup.add(photonMesh);

      self.photons.push({
        curve: curve,
        mesh: photonMesh,
        progress: (idx * 0.15) % 1.0,
        speed: 0.006 + (idx % 3) * 0.002
      });
    });
  };

  GlobeEffects.prototype.setHoverState = function(isHovered) {
    if (this.atmosMat) {
      this.atmosMat.uniforms.intensityModifier.value = isHovered ? 1.45 : 1.0;
    }
  };

  GlobeEffects.prototype.update = function(delta) {
    this.time += delta || 0.016;

    // 1. Animate traveling photons
    for (var p = 0; p < this.photons.length; p++) {
      var item = this.photons[p];
      item.progress += item.speed;
      if (item.progress > 1.0) item.progress = 0.0;
      var pos = item.curve.getPoint(item.progress);
      item.mesh.position.copy(pos);
    }

    // 2. Pulse hexagonal data nodes
    for (var h = 0; h < this.hexagons.length; h++) {
      var hex = this.hexagons[h];
      var scale = hex.baseScale + Math.sin(this.time * 3 + hex.pulsePhase) * 0.15;
      hex.mesh.scale.set(scale, scale, 1);
    }

    // 3. Slowly rotate orbital trajectory rings
    for (var r = 0; r < this.orbitRings.length; r++) {
      this.orbitRings[r].mesh.rotation.z += this.orbitRings[r].rotSpeed;
    }

    // 4. Orbit golden amber satellites
    if (this.goldenSatsMesh && this.goldenSatsData) {
      var posAttr = this.goldenSatsMesh.geometry.attributes.position;
      var arr = posAttr.array;
      for (var s = 0; s < this.goldenSatsData.length; s++) {
        var sat = this.goldenSatsData[s];
        sat.theta += sat.speed;
        arr[s * 3] = sat.dist * Math.cos(sat.phi) * Math.cos(sat.theta);
        arr[s * 3 + 2] = sat.dist * Math.cos(sat.phi) * Math.sin(sat.theta);
      }
      posAttr.needsUpdate = true;
    }

    // 5. Subtle pulsation on telemetry spikes
    if (this.telemetrySpikes) {
      var sPulse = 1.0 + Math.sin(this.time * 2.5) * 0.04;
      this.telemetrySpikes.scale.set(sPulse, sPulse, sPulse);
    }
  };

  window.GlobeEffects = GlobeEffects;

})(window);
