/**
 * GlobeScene.js - Scene, Camera, Renderer, and Interactive Drag Controls
 * Part of the 3D Holographic Digital Globe for Gaurav Shivakumar Portfolio
 */

(function(window) {
  'use strict';

  function GlobeScene(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.width = this.container.clientWidth || 480;
    this.height = this.container.clientHeight || 480;
    this.isHovered = false;
    this.isDragging = false;
    this.pointerX = 0;
    this.pointerY = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.autoRotateSpeed = 0.0018; // ~45s per revolution
    this.isTabActive = true;
    this.isVisible = true;

    // Check prefers-reduced-motion
    this.prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  GlobeScene.prototype.init = function() {
    // 1. Three.js Scene
    this.scene = new THREE.Scene();

    // 2. Perspective Camera with full-globe framing
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 2000);
    this.updateCameraDistance();

    // 3. WebGL Renderer with Alpha
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0); // Transparent canvas

    this.container.appendChild(this.renderer.domElement);

    // 4. Root Globe Pivot Group (rotates with drag and auto-spin)
    this.globeGroup = new THREE.Group();
    // Tilt forward ~14 degrees so south polar ripple contours and continents face camera (matches reference)
    this.globeGroup.rotation.x = -0.24;
    this.scene.add(this.globeGroup);

    // 5. Events & Controls
    this.setupEvents();
    this.setupVisibilityObserver();
  };

  GlobeScene.prototype.setupEvents = function() {
    var self = this;
    var dom = this.renderer.domElement;

    // Pointer Drag Controls
    dom.addEventListener('pointerdown', function(e) {
      self.isDragging = true;
      self.pointerX = e.clientX;
      self.pointerY = e.clientY;
      self.velocityX = 0;
      self.velocityY = 0;
      dom.style.cursor = 'grabbing';
      if (dom.setPointerCapture) dom.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', function(e) {
      if (!self.isDragging) return;
      var dx = e.clientX - self.pointerX;
      var dy = e.clientY - self.pointerY;
      self.pointerX = e.clientX;
      self.pointerY = e.clientY;

      // Sensitivity tuning
      var factor = 0.005;
      self.globeGroup.rotation.y += dx * factor;
      self.globeGroup.rotation.x += dy * factor;

      // Clamp vertical tilt to prevent gimbal flipping
      self.globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, self.globeGroup.rotation.x));

      self.velocityX = dx * factor;
      self.velocityY = dy * factor;
    });

    window.addEventListener('pointerup', function(e) {
      if (!self.isDragging) return;
      self.isDragging = false;
      dom.style.cursor = 'grab';
    });

    window.addEventListener('pointercancel', function() {
      self.isDragging = false;
      dom.style.cursor = 'grab';
    });

    // Hover Interaction
    dom.addEventListener('pointerenter', function() {
      self.isHovered = true;
      if (self.onHoverChange) self.onHoverChange(true);
    });

    dom.addEventListener('pointerleave', function() {
      self.isHovered = false;
      if (self.onHoverChange) self.onHoverChange(false);
    });

    // Resize
    window.addEventListener('resize', function() {
      self.onResize();
    }, { passive: true });
  };

  GlobeScene.prototype.updateCameraDistance = function() {
    if (!this.camera || !this.width || !this.height) return;
    var aspect = this.width / this.height;
    // Base distance of 470 units guarantees that the full Earth (radius 100) and all orbital rings (radius 144)
    // are completely visible with comfortable breathing room on all sides.
    var baseDistance = 470;
    if (aspect < 1.0) {
      // Zoom out on narrow or mobile viewports so neither the globe nor outer orbital rings clip
      this.camera.position.z = Math.min(820, baseDistance / Math.max(0.48, aspect));
    } else {
      this.camera.position.z = baseDistance;
    }
  };

  GlobeScene.prototype.onResize = function() {
    if (!this.container) return;
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    if (this.width === 0 || this.height === 0) return;

    this.camera.aspect = this.width / this.height;
    this.updateCameraDistance();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  };

  GlobeScene.prototype.setupVisibilityObserver = function() {
    var self = this;

    // Pause rendering loop if page is in background tab
    document.addEventListener('visibilitychange', function() {
      self.isTabActive = !document.hidden;
    });

    // Pause rendering loop if user scrolls past hero section
    var heroSection = document.getElementById('home');
    if (heroSection && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          self.isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }
  };

  GlobeScene.prototype.update = function(delta) {
    if (this.prefersReducedMotion) return;

    if (this.isDragging) {
      // During drag, rotation is driven directly by pointer movements
    } else {
      // Apply momentum & inertial damping
      if (Math.abs(this.velocityX) > 0.0001 || Math.abs(this.velocityY) > 0.0001) {
        this.globeGroup.rotation.y += this.velocityX;
        this.globeGroup.rotation.x += this.velocityY;
        this.globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, this.globeGroup.rotation.x));

        this.velocityX *= 0.94;
        this.velocityY *= 0.94;
      } else {
        // Continuous, peaceful automatic rotation
        this.globeGroup.rotation.y += this.autoRotateSpeed;
      }
    }
  };

  GlobeScene.prototype.render = function() {
    if (!this.isTabActive || !this.isVisible) return;
    this.renderer.render(this.scene, this.camera);
  };

  window.GlobeScene = GlobeScene;

})(window);
