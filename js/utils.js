// /**
//  * utils.js - Utility functions for Three.js project and Landing Page
//  * Contains helper functions for common tasks in 3D applications and landing page management
//  */

// // ============================================================================
// // LANDING PAGE SYSTEM (PRIORITY - NEW CODE)
// // ============================================================================

// // Configuration for landing page behavior
// const LANDING_CONFIG = {
//   WAVE_AUTO_PROCEED_DELAY: 3000,
//   NAVIGATION_DELAY: 1000,
//   ANIMATION_DELAY_INCREMENT: 0.1,
//   DEVICE_PATTERNS: /OculusBrowser|Meta Quest/i
// };

// // Device detection and capability management
// class DeviceManager {
//   constructor() {
//     this.isVRDevice = false;
//     this.userAgent = navigator.userAgent;
//     this.capabilities = this.detectCapabilities();
//   }

//   detectCapabilities() {
//     const isVR = LANDING_CONFIG.DEVICE_PATTERNS.test(this.userAgent);
//     this.isVRDevice = isVR;
    
//     return {
//       isVRDevice: isVR,
//       isTouch: 'ontouchstart' in window,
//       isWebXRSupported: 'xr' in navigator,
//       supportsWebGL: this.checkWebGLSupport()
//     };
//   }

//   checkWebGLSupport() {
//     try {
//       const canvas = document.createElement('canvas');
//       return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
//     } catch (e) {
//       return false;
//     }
//   }

//   updateCompatibilityDisplay() {
//     const compatibility = document.querySelector('.compatibility');
//     if (!compatibility) return;

//     if (this.isVRDevice) {
//       compatibility.innerHTML = `
//         <div class="vr-optimized">
//           <p>✨ Optimized for your Meta Quest device</p>
//           <p><strong>Story Preview:</strong> Meet Wendy, learn about security threats, then discover Mendy lurking behind you!</p>
//         </div>
//       `;
//     } else if (this.capabilities.isWebXRSupported) {
//       compatibility.innerHTML = `
//         <div class="webxr-ready">
//           <p>🥽 WebXR Ready - Connect your VR device for full experience</p>
//         </div>
//       `;
//     } else {
//       compatibility.innerHTML = `
//         <div class="desktop-mode">
//           <p>🖥️ Desktop Mode - Full experience available</p>
//         </div>
//       `;
//     }
//   }
// }

// // Enhanced button interaction manager
// class InteractiveButtonManager {
//   constructor(button, indicator, waveDetector) {
//     this.button = button;
//     this.indicator = indicator;
//     this.waveDetector = waveDetector;
//     this.autoProceedTimeout = null;
//     this.isProcessing = false;
    
//     this.init();
//   }

//   init() {
//     this.setupWaveDetection();
//     this.setupClickHandler();
//     this.setupHoverEffects();
//   }

//   setupWaveDetection() {
//     this.waveDetector.onWaveDetected((detected) => {
//       if (this.isProcessing) return;
      
//       if (detected) {
//         this.activateWaveState();
//         this.scheduleAutoProceed();
//       } else {
//         this.deactivateWaveState();
//         this.cancelAutoProceed();
//       }
//     });
//   }

//   setupClickHandler() {
//     this.button.addEventListener('click', (e) => {
//       e.preventDefault();
//       if (!this.isProcessing) {
//         this.proceedToExperience();
//       }
//     });
//   }

//   setupHoverEffects() {
//     this.button.addEventListener('mouseenter', () => {
//       if (!this.isProcessing) {
//         this.button.classList.add('hover-active');
//       }
//     });

//     this.button.addEventListener('mouseleave', () => {
//       this.button.classList.remove('hover-active');
//       // Only remove wave-detected if not actively waving
//       if (!this.waveDetector.getState().isWaving) {
//         this.deactivateWaveState();
//       }
//     });
//   }

//   activateWaveState() {
//     this.button.classList.add('wave-detected');
//     this.indicator.classList.add('active');
    
//     // Add ripple effect
//     this.addRippleEffect();
//   }

//   deactivateWaveState() {
//     if (!this.button.matches(':hover')) {
//       this.button.classList.remove('wave-detected');
//       this.indicator.classList.remove('active');
//     }
//   }

//   addRippleEffect() {
//     const ripple = document.createElement('div');
//     ripple.className = 'wave-ripple';
//     this.button.appendChild(ripple);
    
//     setTimeout(() => {
//       if (ripple.parentNode) {
//         ripple.parentNode.removeChild(ripple);
//       }
//     }, 1000);
//   }

//   scheduleAutoProceed() {
//     this.cancelAutoProceed();
    
//     this.autoProceedTimeout = setTimeout(() => {
//       if (this.button.classList.contains('wave-detected') && !this.isProcessing) {
//         this.proceedToExperience();
//       }
//     }, LANDING_CONFIG.WAVE_AUTO_PROCEED_DELAY);
//   }

//   cancelAutoProceed() {
//     if (this.autoProceedTimeout) {
//       clearTimeout(this.autoProceedTimeout);
//       this.autoProceedTimeout = null;
//     }
//   }

//   proceedToExperience() {
//     if (this.isProcessing) return;
    
//     this.isProcessing = true;
//     this.cancelAutoProceed();
    
//     // Update button state
//     this.button.textContent = '🚀 Loading Security Experience...';
//     this.button.classList.add('loading');
//     this.button.disabled = true;
    
//     // Add loading animation
//     this.addLoadingAnimation();
    
//     // Navigate with delay for UX
//     setTimeout(() => {
//       this.navigateToApp();
//     }, LANDING_CONFIG.NAVIGATION_DELAY);
//   }

//   addLoadingAnimation() {
//     const loader = document.createElement('div');
//     loader.className = 'loading-spinner';
//     this.button.appendChild(loader);
//   }

//   navigateToApp() {
//     try {
//       window.location.href = 'app.html';
//     } catch (error) {
//       console.error('Navigation failed:', error);
//       this.handleNavigationError();
//     }
//   }

//   handleNavigationError() {
//     this.isProcessing = false;
//     this.button.textContent = 'Try Again';
//     this.button.classList.remove('loading');
//     this.button.disabled = false;
    
//     // Show error message
//     const errorMsg = document.createElement('div');
//     errorMsg.className = 'navigation-error';
//     errorMsg.textContent = 'Navigation failed. Please try again.';
//     this.button.parentNode.insertBefore(errorMsg, this.button.nextSibling);
    
//     setTimeout(() => {
//       if (errorMsg.parentNode) {
//         errorMsg.parentNode.removeChild(errorMsg);
//       }
//     }, 3000);
//   }
// }

// // Enhanced page animation system
// class PageAnimationManager {
//   constructor() {
//     this.animatedElements = new Set();
//     this.observers = new Map();
//   }

//   animatePageElements() {
//     const elements = document.querySelectorAll('.landing-content > *');
    
//     elements.forEach((el, index) => {
//       this.animateElement(el, index);
//     });
    
//     // Setup intersection observer for scroll-triggered animations
//     this.setupScrollAnimations();
//   }

//   animateElement(element, index) {
//     if (this.animatedElements.has(element)) return;
    
//     element.style.animationDelay = `${index * LANDING_CONFIG.ANIMATION_DELAY_INCREMENT}s`;
//     element.classList.add('fade-in');
    
//     this.animatedElements.add(element);
    
//     // Add completion callback
//     element.addEventListener('animationend', () => {
//       element.classList.add('animation-complete');
//     }, { once: true });
//   }

//   setupScrollAnimations() {
//     const observerOptions = {
//       threshold: 0.1,
//       rootMargin: '50px'
//     };

//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           entry.target.classList.add('scroll-visible');
//         }
//       });
//     }, observerOptions);

//     // Observe elements that should animate on scroll
//     document.querySelectorAll('.scroll-animate').forEach(el => {
//       observer.observe(el);
//     });

//     this.observers.set('scroll', observer);
//   }

//   // Enhanced smooth scroll with easing
//   smoothScrollTo(element, options = {}) {
//     const defaults = {
//       behavior: 'smooth',
//       block: 'center',
//       inline: 'nearest'
//     };

//     const config = { ...defaults, ...options };
    
//     if (element && typeof element.scrollIntoView === 'function') {
//       element.scrollIntoView(config);
//     } else {
//       console.warn('Invalid element for smooth scroll:', element);
//     }
//   }

//   cleanup() {
//     this.observers.forEach(observer => observer.disconnect());
//     this.observers.clear();
//     this.animatedElements.clear();
//   }
// }

// // Main landing page controller
// class LandingPageController {
//   constructor() {
//     this.deviceManager = new DeviceManager();
//     this.animationManager = new PageAnimationManager();
//     this.buttonManager = null;
//     this.isInitialized = false;
//   }

//   async initialize() {
//     if (this.isInitialized) {
//       console.warn('Landing page already initialized');
//       return;
//     }

//     try {
//       // Initialize wave detection
//       if (typeof waveDetector !== 'undefined') {
//         waveDetector.init();
//       } else {
//         console.warn('Wave detector not available');
//       }

//       // Get required DOM elements
//       const elements = this.getDOMElements();
//       if (!elements) return;

//       // Setup components
//       this.setupComponents(elements);
      
//       // Setup device-specific features
//       this.deviceManager.updateCompatibilityDisplay();
      
//       // Setup page animations
//       this.animationManager.animatePageElements();
      
//       this.isInitialized = true;
//       console.log('Landing page initialized successfully');
      
//     } catch (error) {
//       console.error('Failed to initialize landing page:', error);
//     }
//   }

//   getDOMElements() {
//     const startBtn = document.getElementById('startBtn');
//     const waveIndicator = document.getElementById('waveIndicator');
    
//     if (!startBtn || !waveIndicator) {
//       console.error('Required DOM elements not found:', {
//         startBtn: !!startBtn,
//         waveIndicator: !!waveIndicator
//       });
//       return null;
//     }
    
//     return { startBtn, waveIndicator };
//   }

//   setupComponents({ startBtn, waveIndicator }) {
//     // Setup interactive button with wave detection
//     if (typeof waveDetector !== 'undefined') {
//       this.buttonManager = new InteractiveButtonManager(
//         startBtn, 
//         waveIndicator, 
//         waveDetector
//       );
//     } else {
//       // Fallback without wave detection
//       this.setupBasicButton(startBtn);
//     }
//   }

//   setupBasicButton(button) {
//     button.addEventListener('click', () => {
//       button.textContent = '🚀 Loading...';
//       button.disabled = true;
      
//       setTimeout(() => {
//         window.location.href = 'app.html';
//       }, LANDING_CONFIG.NAVIGATION_DELAY);
//     });
//   }

//   // Public API methods
//   getDeviceInfo() {
//     return this.deviceManager.capabilities;
//   }

//   triggerManualProceed() {
//     if (this.buttonManager) {
//       this.buttonManager.proceedToExperience();
//     }
//   }

//   cleanup() {
//     this.animationManager.cleanup();
//     this.isInitialized = false;
//   }
// }

// // Create singleton instance
// const landingPageController = new LandingPageController();

// // ============================================================================
// // LEGACY THREE.JS UTILITIES (MAINTAINED FOR COMPATIBILITY)
// // ============================================================================

// // Loader utilities for Three.js resources
// const LoaderUtils = {
//   loadModel: function(path, onProgress) {
//     return new Promise((resolve, reject) => {
//       const loader = new THREE.GLTFLoader();
      
//       loader.load(
//         path,
//         (gltf) => resolve(gltf),
//         (xhr) => {
//           if (onProgress) {
//             onProgress(xhr.loaded / xhr.total * 100);
//           }
//         },
//         (error) => {
//           console.error('Error loading model:', error);
//           reject(error);
//         }
//       );
//     });
//   },
  
//   loadTexture: function(path) {
//     return new Promise((resolve, reject) => {
//       const loader = new THREE.TextureLoader();
      
//       loader.load(
//         path,
//         (texture) => resolve(texture),
//         undefined,
//         (error) => {
//           console.error('Error loading texture:', error);
//           reject(error);
//         }
//       );
//     });
//   },
  
//   loadAudio: function(path) {
//     return new Promise((resolve, reject) => {
//       const listener = new THREE.AudioListener();
//       const sound = new THREE.Audio(listener);
//       const loader = new THREE.AudioLoader();
      
//       loader.load(
//         path,
//         (buffer) => {
//           sound.setBuffer(buffer);
//           resolve(sound);
//         },
//         undefined,
//         (error) => {
//           console.error('Error loading audio:', error);
//           reject(error);
//         }
//       );
//     });
//   }
// };

// // Math and Vector utilities
// const MathUtils = {
//   lerp: (a, b, t) => a + (b - a) * t,
//   clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
//   map: (value, inMin, inMax, outMin, outMax) => 
//     outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin)),
//   random: (min, max) => Math.random() * (max - min) + min,
//   randomInt: (min, max) => {
//     min = Math.ceil(min);
//     max = Math.floor(max);
//     return Math.floor(Math.random() * (max - min + 1)) + min;
//   }
// };

// // DOM and Event utilities
// const DOMUtils = {
//   addEvent: (element, event, handler, options = {}) => {
//     element.addEventListener(event, handler, options);
//   },
  
//   removeEvent: (element, event, handler) => {
//     element.removeEventListener(event, handler);
//   },
  
//   createElement: (tag, attributes = {}) => {
//     const element = document.createElement(tag);
    
//     for (const key in attributes) {
//       if (key === 'text') {
//         element.textContent = attributes[key];
//       } else if (key === 'html') {
//         element.innerHTML = attributes[key];
//       } else {
//         element.setAttribute(key, attributes[key]);
//       }
//     }
    
//     return element;
//   },
  
//   querySelector: (selector, parent = document) => {
//     const element = parent.querySelector(selector);
//     if (!element) {
//       console.warn(`Element not found: ${selector}`);
//     }
//     return element;
//   }
// };

// // Animation and timing utilities
// const AnimationUtils = {
//   animate: function(callback) {
//     let animationId = null;
//     let running = false;
    
//     return {
//       start() {
//         if (running) return this;
//         running = true;
        
//         const loop = (timestamp) => {
//           if (!running) return;
//           callback(timestamp);
//           animationId = requestAnimationFrame(loop);
//         };
        
//         animationId = requestAnimationFrame(loop);
//         return this;
//       },
      
//       stop() {
//         if (!running) return this;
//         cancelAnimationFrame(animationId);
//         running = false;
//         return this;
//       },
      
//       isRunning: () => running
//     };
//   },
  
//   delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
//   debounce: (func, wait) => {
//     let timeout;
//     return function(...args) {
//       clearTimeout(timeout);
//       timeout = setTimeout(() => func.apply(this, args), wait);
//     };
//   },
  
//   throttle: (func, limit) => {
//     let inThrottle;
//     return function(...args) {
//       if (!inThrottle) {
//         func.apply(this, args);
//         inThrottle = true;
//         setTimeout(() => inThrottle = false, limit);
//       }
//     };
//   }
// };

// // Three.js scene utilities (condensed for space)
// const SceneUtils = {
//   createScene: function(options = {}) {
//     const defaults = {
//       antialias: true,
//       alpha: false,
//       clearColor: 0x000000,
//       clearAlpha: 1.0,
//       fov: 75,
//       near: 0.1,
//       far: 1000,
//       cameraPosition: [0, 0, 5]
//     };
    
//     const config = { ...defaults, ...options };
//     const scene = new THREE.Scene();
//     const aspect = window.innerWidth / window.innerHeight;
//     const camera = new THREE.PerspectiveCamera(config.fov, aspect, config.near, config.far);
//     camera.position.set(...config.cameraPosition);
    
//     const renderer = new THREE.WebGLRenderer({
//       antialias: config.antialias,
//       alpha: config.alpha
//     });
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     renderer.setClearColor(config.clearColor, config.clearAlpha);
    
//     window.addEventListener('resize', () => {
//       camera.aspect = window.innerWidth / window.innerHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(window.innerWidth, window.innerHeight);
//     });
    
//     return { scene, camera, renderer };
//   }
// };

// // Model utilities (condensed)
// const ModelUtils = {
//   centerModel: (model) => {
//     const box = new THREE.Box3().setFromObject(model);
//     const center = box.getCenter(new THREE.Vector3());
//     model.position.sub(center);
//     return model;
//   },
  
//   scaleModel: (model, size = 1) => {
//     const box = new THREE.Box3().setFromObject(model);
//     const maxDim = Math.max(
//       box.max.x - box.min.x,
//       box.max.y - box.min.y,
//       box.max.z - box.min.z
//     );
//     model.scale.multiplyScalar(size / maxDim);
//     return model;
//   }
// };

// // ============================================================================
// // EXPORTS AND GLOBAL SETUP
// // ============================================================================

// // Legacy function exports for backward compatibility
// function initializeLandingPage() {
//   return landingPageController.initialize();
// }

// function proceedToExperience(button) {
//   if (landingPageController.buttonManager) {
//     landingPageController.buttonManager.proceedToExperience();
//   }
// }

// function detectDevice() {
//   return landingPageController.deviceManager.updateCompatibilityDisplay();
// }

// function animatePageElements() {
//   return landingPageController.animationManager.animatePageElements();
// }

// function smoothScrollTo(element, options) {
//   return landingPageController.animationManager.smoothScrollTo(element, options);
// }

// // Global exports for backward compatibility
// if (typeof window !== 'undefined') {
//   window.initializeLandingPage = initializeLandingPage;
//   window.proceedToExperience = proceedToExperience;
//   window.detectDevice = detectDevice;
//   window.animatePageElements = animatePageElements;
//   window.smoothScrollTo = smoothScrollTo;
  
//   // Expose controller for advanced usage
//   window.landingPageController = landingPageController;
// }

// // Modern ES6 exports
// export {
//   // Priority landing page system
//   LandingPageController,
//   DeviceManager,
//   InteractiveButtonManager,
//   PageAnimationManager,
//   landingPageController,
  
//   // Legacy functions
//   initializeLandingPage,
//   proceedToExperience,
//   detectDevice,
//   animatePageElements,
//   smoothScrollTo,
  
//   // Three.js utilities
//   LoaderUtils,
//   MathUtils,
//   DOMUtils,
//   AnimationUtils,
//   SceneUtils,
//   ModelUtils,
  
//   // Configuration
//   LANDING_CONFIG
// };