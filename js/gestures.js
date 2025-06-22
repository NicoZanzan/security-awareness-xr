// gestures.js - Hand gesture detection for WebXR and Landing Page

import * as THREE from 'three';

// Gesture types
const GESTURES = {
  WAVE: 'wave',
  PINCH: 'pinch',
  POINT: 'point',
  OPEN: 'open',
  CLOSED: 'closed'
};

// Joint enum mapping for convenience
const JOINTS = {
  WRIST: 'wrist',
  THUMB_METACARPAL: 'thumb-metacarpal',
  THUMB_PHALANX_PROXIMAL: 'thumb-phalanx-proximal',
  THUMB_PHALANX_DISTAL: 'thumb-phalanx-distal',
  THUMB_TIP: 'thumb-tip',
  INDEX_METACARPAL: 'index-metacarpal',
  INDEX_PHALANX_PROXIMAL: 'index-phalanx-proximal',
  INDEX_PHALANX_INTERMEDIATE: 'index-phalanx-intermediate',
  INDEX_PHALANX_DISTAL: 'index-phalanx-distal',
  INDEX_TIP: 'index-tip',
  MIDDLE_METACARPAL: 'middle-metacarpal',
  MIDDLE_PHALANX_PROXIMAL: 'middle-phalanx-proximal',
  MIDDLE_PHALANX_INTERMEDIATE: 'middle-phalanx-intermediate',
  MIDDLE_PHALANX_DISTAL: 'middle-phalanx-distal',
  MIDDLE_TIP: 'middle-tip',
  RING_METACARPAL: 'ring-metacarpal',
  RING_PHALANX_PROXIMAL: 'ring-phalanx-proximal',
  RING_PHALANX_INTERMEDIATE: 'ring-phalanx-intermediate',
  RING_PHALANX_DISTAL: 'ring-phalanx-distal',
  RING_TIP: 'ring-tip',
  PINKY_METACARPAL: 'pinky-metacarpal',
  PINKY_PHALANX_PROXIMAL: 'pinky-phalanx-proximal',
  PINKY_PHALANX_INTERMEDIATE: 'pinky-phalanx-intermediate',
  PINKY_PHALANX_DISTAL: 'pinky-phalanx-distal',
  PINKY_TIP: 'pinky-tip'
};

// Configuration constants
const CONFIG = {
  WEBXR: {
    DEBOUNCE_TIME: 500,
    MIN_TRACKED_JOINTS: 16,
    WAVE_THRESHOLD: 3,
    WAVE_UPDATE_INTERVAL: 100,
    WAVE_MOVEMENT_THRESHOLD: 0.05,
    PINCH_DISTANCE: 0.03,
    FINGER_EXTENSION_DISTANCE: 0.08,
    CLOSED_FIST_DISTANCE: 0.1
  },
  LANDING_PAGE: {
    MOVEMENT_HISTORY_DURATION: 2000,
    MIN_MOVEMENTS_FOR_WAVE: 10,
    RAPID_MOVEMENT_THRESHOLD: 8,
    RAPID_MOVEMENT_DECAY: 100,
    WAVE_PATTERN_THRESHOLD: 50,
    WAVE_RESET_DELAY: 5000
  }
};

// ============================================================================
// WEBXR GESTURE DETECTION
// ============================================================================

class WebXRGestureDetector {
  constructor(hand, callback) {
    this.hand = hand;
    this.callback = callback;
    this.lastTime = 0;
    this.lastGesture = null;
    this.waveState = this.initWaveState();
  }
  
  initWaveState() {
    return {
      lastPosition: new THREE.Vector3(),
      movements: [],
      lastUpdateTime: 0
    };
  }
  
  update() {
    if (!this.hand || !this.isHandTracked()) return;
    
    const currentGesture = this.detectGesture();
    this.handleGestureChange(currentGesture);
  }
  
  handleGestureChange(currentGesture) {
    if (currentGesture && this.lastGesture !== currentGesture) {
      const now = Date.now();
      if (now - this.lastTime > CONFIG.WEBXR.DEBOUNCE_TIME) {
        this.lastTime = now;
        this.lastGesture = currentGesture;
        this.callback?.(currentGesture, this.hand);
      }
    } else if (!currentGesture) {
      this.lastGesture = null;
    }
  }
  
  isHandTracked() {
    let trackedJoints = 0;
    this.hand.joints.forEach(joint => {
      if (joint?.visible) trackedJoints++;
    });
    return trackedJoints >= CONFIG.WEBXR.MIN_TRACKED_JOINTS;
  }
  
  detectGesture() {
    const detectors = [
      () => this.detectWaveGesture() && GESTURES.WAVE,
      () => this.detectPinchGesture() && GESTURES.PINCH,
      () => this.detectPointGesture() && GESTURES.POINT,
      () => this.detectOpenHandGesture() && GESTURES.OPEN,
      () => this.detectClosedHandGesture() && GESTURES.CLOSED
    ];
    
    return detectors.find(detector => detector()) || null;
  }
  
  detectWaveGesture() {
    const wrist = this.getJointPosition(JOINTS.WRIST);
    if (!wrist) return false;
    
    const now = Date.now();
    const { waveState } = this;
    
    if (now - waveState.lastUpdateTime < CONFIG.WEBXR.WAVE_UPDATE_INTERVAL) {
      return false;
    }
    
    waveState.lastUpdateTime = now;
    const movement = wrist.x - waveState.lastPosition.x;
    
    if (Math.abs(movement) > CONFIG.WEBXR.WAVE_MOVEMENT_THRESHOLD) {
      this.updateWaveMovements(movement);
    }
    
    waveState.lastPosition.copy(wrist);
    return this.isWaveDetected();
  }
  
  updateWaveMovements(movement) {
    const { movements } = this.waveState;
    
    if (movements.length > 0) {
      const lastMovement = movements[movements.length - 1];
      if ((movement > 0 && lastMovement < 0) || (movement < 0 && lastMovement > 0)) {
        movements.push(movement);
      }
    } else {
      movements.push(movement);
    }
    
    if (movements.length > 5) movements.shift();
  }
  
  isWaveDetected() {
    if (this.waveState.movements.length >= CONFIG.WEBXR.WAVE_THRESHOLD) {
      this.waveState.movements = [];
      return true;
    }
    return false;
  }
  
  detectPinchGesture() {
    const thumbTip = this.getJointPosition(JOINTS.THUMB_TIP);
    const indexTip = this.getJointPosition(JOINTS.INDEX_TIP);
    
    if (!thumbTip || !indexTip) return false;
    return thumbTip.distanceTo(indexTip) < CONFIG.WEBXR.PINCH_DISTANCE;
  }
  
  detectPointGesture() {
    const positions = this.getRequiredJointPositions([
      JOINTS.INDEX_PHALANX_PROXIMAL,
      JOINTS.INDEX_PHALANX_DISTAL,
      JOINTS.MIDDLE_PHALANX_DISTAL,
      JOINTS.RING_PHALANX_DISTAL,
      JOINTS.PINKY_PHALANX_DISTAL
    ]);
    
    if (!positions) return false;
    
    const [indexProximal, indexDistal, middleDistal, ringDistal, pinkyDistal] = positions;
    
    const indexExtended = this.isFingerExtended(indexProximal, indexDistal);
    const othersClosed = 
      !this.isFingerExtended(indexProximal, middleDistal) && 
      !this.isFingerExtended(indexProximal, ringDistal) && 
      !this.isFingerExtended(indexProximal, pinkyDistal);
    
    return indexExtended && othersClosed;
  }
  
  detectOpenHandGesture() {
    const positions = this.getRequiredJointPositions([
      JOINTS.WRIST,
      JOINTS.INDEX_TIP,
      JOINTS.MIDDLE_TIP,
      JOINTS.RING_TIP,
      JOINTS.PINKY_TIP
    ]);
    
    if (!positions) return false;
    
    const [wrist, ...fingerTips] = positions;
    return fingerTips.every(tip => this.isFingerExtended(wrist, tip));
  }
  
  detectClosedHandGesture() {
    const positions = this.getRequiredJointPositions([
      JOINTS.WRIST,
      JOINTS.INDEX_TIP,
      JOINTS.MIDDLE_TIP,
      JOINTS.RING_TIP,
      JOINTS.PINKY_TIP
    ]);
    
    if (!positions) return false;
    
    const [wrist, ...fingerTips] = positions;
    const avgDistance = fingerTips.reduce((sum, tip) => sum + wrist.distanceTo(tip), 0) / fingerTips.length;
    
    return avgDistance < CONFIG.WEBXR.CLOSED_FIST_DISTANCE;
  }
  
  getRequiredJointPositions(jointNames) {
    const positions = jointNames.map(name => this.getJointPosition(name));
    return positions.every(pos => pos) ? positions : null;
  }
  
  getJointPosition(jointName) {
    const joint = this.hand.joints[jointName];
    if (!joint?.visible) return null;
    
    const position = new THREE.Vector3();
    joint.getWorldPosition(position);
    return position;
  }
  
  isFingerExtended(basePosition, tipPosition) {
    return basePosition.distanceTo(tipPosition) > CONFIG.WEBXR.FINGER_EXTENSION_DISTANCE;
  }
}

// Track all active WebXR gesture detectors
const webxrDetectors = new Map();

// ============================================================================
// LANDING PAGE WAVE GESTURE DETECTION (PRIORITY)
// ============================================================================

class LandingPageWaveDetector {
  constructor() {
    this.mouseMovements = [];
    this.isWaving = false;
    this.waveDetected = false;
    this.rapidMovements = 0;
    this.callbacks = new Set();
    this.boundHandlers = {};
    
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse tracking
    this.boundHandlers.mousemove = (e) => this.handleMouseMove(e);
    document.addEventListener('mousemove', this.boundHandlers.mousemove, { passive: true });
    
    // Keyboard shortcuts for testing
    this.boundHandlers.keydown = (e) => this.handleKeyDown(e);
    document.addEventListener('keydown', this.boundHandlers.keydown);
  }

  handleMouseMove(e) {
    this.recordMouseMovement(e);
    this.analyzeMovements();
  }

  recordMouseMovement(e) {
    const now = Date.now();
    this.mouseMovements.push({ 
      x: e.clientX, 
      y: e.clientY, 
      time: now 
    });
    
    // Clean up old movements
    this.cleanupOldMovements(now);
  }

  cleanupOldMovements(currentTime) {
    const cutoff = currentTime - CONFIG.LANDING_PAGE.MOVEMENT_HISTORY_DURATION;
    this.mouseMovements = this.mouseMovements.filter(m => m.time > cutoff);
  }

  analyzeMovements() {
    if (this.isWaving) return;

    // Method 1: Pattern-based detection
    if (this.mouseMovements.length >= CONFIG.LANDING_PAGE.MIN_MOVEMENTS_FOR_WAVE) {
      if (this.detectWavePattern()) {
        this.triggerWaveDetection();
        return;
      }
    }

    // Method 2: Rapid movement detection
    this.handleRapidMovement();
  }

  detectWavePattern() {
    const xMovements = this.mouseMovements.map(m => m.x);
    const variations = [];
    
    for (let i = 1; i < xMovements.length; i++) {
      variations.push(Math.abs(xMovements[i] - xMovements[i - 1]));
    }
    
    if (variations.length === 0) return false;
    
    const avgVariation = variations.reduce((sum, variation) => sum + variation, 0) / variations.length;
    return avgVariation > CONFIG.LANDING_PAGE.WAVE_PATTERN_THRESHOLD;
  }

  handleRapidMovement() {
    this.rapidMovements++;
    
    // Decay rapid movement counter
    setTimeout(() => {
      this.rapidMovements = Math.max(0, this.rapidMovements - 1);
    }, CONFIG.LANDING_PAGE.RAPID_MOVEMENT_DECAY);
    
    if (this.rapidMovements > CONFIG.LANDING_PAGE.RAPID_MOVEMENT_THRESHOLD) {
      this.triggerWaveDetection();
    }
  }

  triggerWaveDetection() {
    if (this.isWaving) return;
    
    this.setWaveState(true);
    this.notifyCallbacks(true);
    
    // Auto-reset after delay
    setTimeout(() => {
      this.resetWaveDetection();
    }, CONFIG.LANDING_PAGE.WAVE_RESET_DELAY);
  }

  resetWaveDetection() {
    this.setWaveState(false);
    this.notifyCallbacks(false);
  }

  setWaveState(isWaving) {
    this.isWaving = isWaving;
    this.waveDetected = isWaving;
    if (!isWaving) {
      this.rapidMovements = 0;
      this.mouseMovements = [];
    }
  }

  notifyCallbacks(isWaving = this.isWaving) {
    this.callbacks.forEach(callback => {
      try {
        callback(isWaving);
      } catch (error) {
        console.warn('Wave gesture callback error:', error);
      }
    });
  }

  handleKeyDown(e) {
    // Testing shortcut - 'w' key triggers wave
    if (e.key.toLowerCase() === 'w' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      this.triggerWaveDetection();
    }
  }

  // Public API
  onWaveDetected(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => this.callbacks.delete(callback);
  }

  // Manual trigger for external use
  triggerWave() {
    this.triggerWaveDetection();
  }

  // Get current state
  getState() {
    return {
      isWaving: this.isWaving,
      waveDetected: this.waveDetected,
      movementCount: this.mouseMovements.length
    };
  }

  // Cleanup
  destroy() {
    Object.entries(this.boundHandlers).forEach(([event, handler]) => {
      document.removeEventListener(event, handler);
    });
    this.callbacks.clear();
  }
}

// ============================================================================
// WEBXR EXPORTS AND SETUP
// ============================================================================

export function setupGestureDetection(hand, callback) {
  const detector = new WebXRGestureDetector(hand, callback);
  const handId = hand.id || hand.userData.index;
  webxrDetectors.set(handId, detector);
  
  hand.addEventListener('update', () => detector.update());
  return detector;
}

export function getGestureDetector(hand) {
  const handId = hand.id || hand.userData.index;
  return webxrDetectors.get(handId);
}

export function removeGestureDetector(hand) {
  const handId = hand.id || hand.userData.index;
  webxrDetectors.delete(handId);
}

// ============================================================================
// LANDING PAGE WAVE DETECTOR - SINGLETON INSTANCE
// ============================================================================

// Create singleton instance
const landingPageWaveDetector = new LandingPageWaveDetector();

// Global exports for backward compatibility
if (typeof window !== 'undefined') {
  window.WaveGestureDetector = LandingPageWaveDetector;
  window.waveDetector = landingPageWaveDetector;
}

// Modern exports
export { 
  GESTURES, 
  JOINTS, 
  CONFIG,
  WebXRGestureDetector,
  LandingPageWaveDetector,
  landingPageWaveDetector as waveDetector 
};