/**
 * GlobeEffects.js - Atmospheric Fresnel Glow, 3D Connection Arcs, Photons & Rings
 * Part of the 3D Holographic Digital Globe for Gaurav Shivakumar Portfolio
 */

(function(window) {
  'use strict';

  function GlobeEffects(scene, globeGroup, radius) {
    this.scene = scene;
    this.globeGroup = globeGroup;
    this.radius = radius || 100;
    this.arcs = [];
    this.photons = [];
    this.hubs = [];
    this.time = 0;

    this.init();
  }

  // Convert lat/long degrees to 3D Cartesian coordinates on sphere
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
    this.createGridLines();
    this.createFloatingCosmicDust();
    this.createGlobalHubsAndArcs();
  };

  // 1. Inner dark sphere occluding back-facing dots for volumetric realism
  GlobeEffects.prototype.createDarkCore = function() {
    var coreGeom = new THREE.SphereGeometry(this.radius * 0.985, 48, 48);
    var coreMat = new THREE.MeshBasicMaterial({
      color: 0x070c18,
      transparent: true,
      opacity: 0.92
    });
    this.darkCore = new THREE.Mesh(coreGeom, coreMat);
    this.globeGroup.add(this.darkCore);
  };

  // 2. Atmospheric Fresnel Holographic Glow Shader
  GlobeEffects.prototype.createAtmosphereGlow = function() {
    var atmosGeom = new THREE.SphereGeometry(this.radius * 1.12, 48, 48);
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
        '  float intensity = pow(0.68 - dot(vNormal, viewDir), 2.8) * intensityModifier;',
        '  intensity = clamp(intensity, 0.0, 1.0);',
        '  gl_FragColor = vec4(glowColor, intensity * 0.72);',
        '}'
      ].join('\n'),
      uniforms: {
        glowColor: { value: new THREE.Color(0x5C8DFF) },
        intensityModifier: { value: 1.0 }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    this.atmosphereMesh = new THREE.Mesh(atmosGeom, this.atmosMat);
    this.scene.add(this.atmosphereMesh); // Pinned to scene so atmosphere faces camera view
  };

  // 3. Subtle Latitude & Longitude Coordinate Lines
  GlobeEffects.prototype.createGridLines = function() {
    var gridMat = new THREE.LineBasicMaterial({
      color: 0x1F2B47,
      transparent: true,
      opacity: 0.28
    });

    // Latitude rings: Equator and Tropics
    [-45, -23.5, 0, 23.5, 45].forEach(function(lat) {
      var rRing = this.radius * Math.cos(lat * Math.PI / 180);
      var yRing = this.radius * Math.sin(lat * Math.PI / 180);
      var ringGeom = new THREE.BufferGeometry();
      var pts = [];
      for (var a = 0; a <= 64; a++) {
        var angle = (a / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(rRing * Math.cos(angle), yRing, rRing * Math.sin(angle)));
      }
      ringGeom.setFromPoints(pts);
      this.globeGroup.add(new THREE.Line(ringGeom, gridMat));
    }, this);

    // Subtle polar meridian rings
    for (var m = 0; m < 4; m++) {
      var merGeom = new THREE.BufferGeometry();
      var mPts = [];
      var mAngle = (m / 4) * Math.PI;
      for (var b = 0; b <= 64; b++) {
        var phi = (b / 64) * Math.PI * 2;
        var mx = this.radius * Math.cos(phi) * Math.cos(mAngle);
        var my = this.radius * Math.sin(phi);
        var mz = this.radius * Math.cos(phi) * Math.sin(mAngle);
        mPts.push(new THREE.Vector3(mx, my, mz));
      }
      merGeom.setFromPoints(mPts);
      this.globeGroup.add(new THREE.Line(merGeom, gridMat));
    }
  };

  // 4. Floating Cosmic Dust Particles around the globe
  GlobeEffects.prototype.createFloatingCosmicDust = function() {
    var count = 140;
    var geom = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);

    var cA = new THREE.Color(0x5C8DFF);
    var cB = new THREE.Color(0x6FE0F2);

    for (var i = 0; i < count; i++) {
      var dist = this.radius * (1.18 + Math.random() * 0.7);
      var u = Math.random();
      var v = Math.random();
      var theta = u * 2.0 * Math.PI;
      var phi = Math.acos(2.0 * v - 1.0);
      var sinPhi = Math.sin(phi);

      positions[i * 3] = dist * sinPhi * Math.cos(theta);
      positions[i * 3 + 1] = dist * Math.cos(phi);
      positions[i * 3 + 2] = dist * sinPhi * Math.sin(theta);

      var mix = (i % 2 === 0) ? cA : cB;
      colors[i * 3] = mix.r;
      colors[i * 3 + 1] = mix.g;
      colors[i * 3 + 2] = mix.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.cosmicDust = new THREE.Points(geom, mat);
    this.globeGroup.add(this.cosmicDust);
  };

  // 5. Global Tech Hubs, Ripple Rings and 3D Bézier Connection Arcs
  GlobeEffects.prototype.createGlobalHubsAndArcs = function() {
    var self = this;

    // Major Global Tech & Aerospace Hubs
    var hubLocations = [
      { name: 'Bengaluru', lat: 12.97, lon: 77.59, isHome: true },
      { name: 'San Francisco', lat: 37.77, lon: -122.41 },
      { name: 'Tokyo', lat: 35.68, lon: 139.69 },
      { name: 'London', lat: 51.50, lon: -0.12 },
      { name: 'Singapore', lat: 1.35, lon: 103.82 },
      { name: 'Zurich', lat: 47.37, lon: 8.54 },
      { name: 'Sydney', lat: -33.86, lon: 151.20 },
      { name: 'New York', lat: 40.71, lon: -74.00 }
    ];

    // Hub Pin Points & Pulsing Rings
    var ringGeom = new THREE.RingGeometry(1.2, 1.8, 24);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0x6FE0F2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    hubLocations.forEach(function(hub) {
      var pos = GlobeEffects.latLonToVector3(hub.lat, hub.lon, self.radius * 1.006);

      // Core anchor pin dot
      var dotGeom = new THREE.SphereGeometry(hub.isHome ? 2.4 : 1.6, 16, 16);
      var dotMat = new THREE.MeshBasicMaterial({
        color: hub.isHome ? 0x6FE0F2 : 0x5C8DFF
      });
      var dotMesh = new THREE.Mesh(dotGeom, dotMat);
      dotMesh.position.copy(pos);
      self.globeGroup.add(dotMesh);

      // Surface ripple ring
      var ringMesh = new THREE.Mesh(ringGeom, ringMat.clone());
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      self.globeGroup.add(ringMesh);

      self.hubs.push({
        mesh: ringMesh,
        scale: 1.0,
        opacity: 0.9,
        speed: hub.isHome ? 0.024 : 0.016
      });
    });

    // Flight & Telemetry Connection Pairs
    var connections = [
      ['Bengaluru', 'San Francisco'],
      ['Bengaluru', 'London'],
      ['Bengaluru', 'Tokyo'],
      ['Bengaluru', 'Singapore'],
      ['Bengaluru', 'Zurich'],
      ['London', 'New York'],
      ['San Francisco', 'Tokyo'],
      ['Singapore', 'Sydney']
    ];

    var hubMap = {};
    hubLocations.forEach(function(h) { hubMap[h.name] = h; });

    connections.forEach(function(pair, idx) {
      var hA = hubMap[pair[0]];
      var hB = hubMap[pair[1]];
      if (!hA || !hB) return;

      var pA = GlobeEffects.latLonToVector3(hA.lat, hA.lon, self.radius * 1.005);
      var pB = GlobeEffects.latLonToVector3(hB.lat, hB.lon, self.radius * 1.005);

      // Parabolic 3D Arch Midpoint
      var distance = pA.distanceTo(pB);
      var mid = pA.clone().add(pB).multiplyScalar(0.5);
      var midLength = mid.length();
      // Altitude increases with distance
      var altFactor = self.radius * (1.15 + (distance / (self.radius * 2)) * 0.38);
      mid.normalize().multiplyScalar(altFactor);

      // Quadratic Bézier Curve
      var curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      var curvePoints = curve.getPoints(45);
      var curveGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);

      var arcMat = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? 0x6FE0F2 : 0x5C8DFF,
        transparent: true,
        opacity: 0.52,
        blending: THREE.AdditiveBlending
      });

      var arcLine = new THREE.Line(curveGeom, arcMat);
      self.globeGroup.add(arcLine);

      // Traveling Photon Particle along the Arc
      var photonGeom = new THREE.SphereGeometry(1.4, 12, 12);
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
        progress: (idx * 0.14) % 1.0,
        speed: 0.0055 + (idx % 3) * 0.0018
      });
    });
  };

  GlobeEffects.prototype.setHoverState = function(isHovered) {
    if (this.atmosMat) {
      this.atmosMat.uniforms.intensityModifier.value = isHovered ? 1.4 : 1.0;
    }
  };

  GlobeEffects.prototype.update = function(delta) {
    this.time += delta || 0.016;

    // 1. Animate traveling photons along connection arcs
    for (var p = 0; p < this.photons.length; p++) {
      var item = this.photons[p];
      item.progress += item.speed;
      if (item.progress > 1.0) item.progress = 0.0;
      var pos = item.curve.getPoint(item.progress);
      item.mesh.position.copy(pos);
    }

    // 2. Animate pulsing hub rings
    for (var h = 0; h < this.hubs.length; h++) {
      var hub = this.hubs[h];
      hub.scale += hub.speed;
      hub.opacity -= hub.speed * 0.8;
      if (hub.scale > 2.4 || hub.opacity <= 0.05) {
        hub.scale = 1.0;
        hub.opacity = 0.85;
      }
      hub.mesh.scale.set(hub.scale, hub.scale, 1);
      hub.mesh.material.opacity = hub.opacity;
    }

    // 3. Subtle cosmic dust slow independent spin
    if (this.cosmicDust) {
      this.cosmicDust.rotation.y += 0.0006;
    }
  };

  window.GlobeEffects = GlobeEffects;

})(window);
