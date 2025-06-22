// main.js - Integrated wendyXR with AR Story Experience
// Priority: wendyXR WebXR implementation + your story elements

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Import your modular components (keeping your structure)
import { setupStory, advanceStory } from './story.js';
import { loadCharacters, setupCharacters } from './characters.js';
import { setupGestureDetection } from './gestures.js';
import { setStatus, hideLoader, showError } from './utils.js';

// Global variables (wendyXR style)
let container;
let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let loadedModels = {}; // Changed to object to hold multiple models
let raycaster;
const intersected = [];
let controls, group;
let baseY = 0;
let startTime = Date.now();
let isQuest = /OculusBrowser|Meta Quest/i.test(navigator.userAgent);

// Story and AR specific variables
let clock;
let mixers = [];
let hands = [];
let assets = {
  models: {},
  audio: {}
};
let storyState = {
  initialized: false,
  inAR: false,
  currentState: 'intro', // 'intro', 'main', 'reveal', 'end'
  gestureModeActive: false
};
let story, characters;
let interactiveButton;

// Initialize the scene (wendyXR foundation)
init();

function detectOS() {
  const userAgent = navigator.userAgent;
  const platform = navigator.userAgentData?.platform || navigator.platform;
  
  if (/Win/.test(platform) || /Windows/.test(userAgent)) return "Windows";
  if ((/iPhone|iPad|iPod/.test(platform) || /iPhone|iPad|iPod/.test(userAgent)) || 
      (/Mac/.test(platform) && navigator.maxTouchPoints > 0)) return "iOS";
  if (/Mac/.test(platform) || /Macintosh/.test(userAgent)) return "macOS";
  if (/Android/.test(userAgent)) return "Android";
  if (/Linux/.test(platform) || (/Linux/.test(userAgent) && !/Android/.test(userAgent))) return "Linux";
  if (/CrOS/.test(userAgent)) return "ChromeOS";
  
  return "Unknown OS";
}

console.log("Operating System:", detectOS());

// Main initialization function (wendyXR + your enhancements)
async function init() {
  try {
    // Create DOM container for WebGL canvas
    container = document.createElement('div');
    document.body.appendChild(container);

    // Initialize Three.js components
    initScene();
    initCamera();
    initRenderer();
    initLights();
    initControls();
    
    // Setup XR (wendyXR approach + your hand tracking)
    setupXR();
    
    // Load assets (your approach)
    await loadAssets();
    
    // Setup story components (your approach)
    await setupExperience();
    
    // Create interactive elements (wendyXR style)
    createInteractiveElements();
    
    // Initialize raycaster (wendyXR)
    initRaycaster();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    
    // Start render loop
    renderer.setAnimationLoop(animate);
    
    storyState.initialized = true;
    hideLoader?.();
    setStatus?.('Ready! Enter AR to begin the security awareness experience.');
    
  } catch (error) {
    console.error('Initialization error:', error);
    showError?.('Failed to initialize the experience. ' + error.message);
  }
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);
  
  // Add grid for desktop preview
  if (!isQuest) {
    const grid = new THREE.GridHelper(10, 20, 0xffffff, 0x888888);
    scene.add(grid);
  }
  
  // Group to hold geometry and loaded models
  group = new THREE.Group();
  scene.add(group);
  
  clock = new THREE.Clock();
}

function initCamera() {
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
  camera.position.set(0, 1.6, 3);
  
  // Add audio listener for story audio
  const listener = new THREE.AudioListener();
  camera.add(listener);
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.xr.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
}

function initLights() {
  // Ambient and directional lighting (wendyXR)
  scene.add(new THREE.HemisphereLight(0xbcbcbc, 0xa5a5a5, 3));
  
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(0, 6, 0);
  light.castShadow = true;
  light.shadow.camera.top = 3;
  light.shadow.camera.bottom = -3;
  light.shadow.camera.right = 3;
  light.shadow.camera.left = -3;
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);
}

function initControls() {
  if (!isQuest) {
    controls = new OrbitControls(camera, container);
    controls.target.set(0, 1.6, 0);
    controls.update();
  }
}

function setupXR() {
  // Add WebXR button (wendyXR approach but with AR focus)
  const xrButton = XRButton.createButton(renderer, {
    optionalFeatures: ['hand-tracking', 'hit-test', 'dom-overlay', 'depth-sensing'],
    domOverlay: { root: document.body },
    depthSensing: {
      usagePreference: ['gpu-optimized'],
      dataFormatPreference: []
    }
  });
  document.body.appendChild(xrButton);

  // Setup controllers (wendyXR)
  setupControllers();
  
  // Setup hand tracking (your approach)
  setupHandTracking();
  
  // XR session events
  renderer.xr.addEventListener('sessionstart', onXRSessionStart);
  renderer.xr.addEventListener('sessionend', onXRSessionEnd);
}

function setupControllers() {
  // Create and add XR controllers (wendyXR)
  controller1 = renderer.xr.getController(0);
  controller2 = renderer.xr.getController(1);
  
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  
  scene.add(controller1);
  scene.add(controller2);

  // Add 3D models of controllers
  const controllerModelFactory = new XRControllerModelFactory();
  
  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);
  
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);

  // Add visible ray lines to each controller (wendyXR)
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
  ]);
  const line = new THREE.Line(geometry);
  line.name = 'line';
  line.scale.z = 5;
  
  controller1.add(line.clone());
  controller2.add(line.clone());
}

function setupHandTracking() {
  const handModelFactory = new XRHandModelFactory();
  
  for (let i = 0; i < 2; i++) {
    const hand = renderer.xr.getHand(i);
    hand.userData.index = i;
    scene.add(hand);
    
    const handModel = handModelFactory.createHandModel(hand, 'mesh');
    handModel.visible = true;
    hand.add(handModel);
    
    // Make hand mesh act as occlusion
    handModel.traverse((obj) => {
      if (obj.isMesh) {
        obj.material.transparent = true;
        obj.material.opacity = 0.8;
        obj.material.depthTest = false;
        obj.renderOrder = 999;
      }
    });
    
    hands.push(hand);
    
    // Setup gesture detection (your approach)
    if (typeof setupGestureDetection === 'function') {
      setupGestureDetection(hand, onGestureDetected);
    }
  }
}

async function loadAssets() {
  setStatus?.('Loading assets...');
  
  // Setup loaders
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  
  const audioLoader = new THREE.AudioLoader();
  
  try {
    // Define assets to load (your structure + wendyXR models)
    const modelAssets = [
      { name: 'button', url: './assets/models/button.glb' },
      { name: 'wendy', url: './assets/models/wendy.glb' },
      { name: 'mendy', url: './assets/models/mendy.glb' }
    ];
    
    const audioAssets = [
      { name: 'intro', url: './assets/audio/ElevenLabs_audio.mp3' }
    ];
    
    // Load models
    const modelPromises = modelAssets.map(asset => 
      gltfLoader.loadAsync(asset.url)
        .then(gltf => {
          assets.models[asset.name] = gltf;
          return gltf;
        })
        .catch(error => {
          console.warn(`Could not load ${asset.name}:`, error);
          return null;
        })
    );
    
    // Load audio
    const audioPromises = audioAssets.map(asset =>
      audioLoader.loadAsync(asset.url)
        .then(buffer => {
          const sound = new THREE.Audio(camera.children[0]); // audio listener
          sound.setBuffer(buffer);
          assets.audio[asset.name] = sound;
          return sound;
        })
        .catch(error => {
          console.warn(`Could not load audio ${asset.name}:`, error);
          return null;
        })
    );
    
    // Wait for all assets to load
    await Promise.all([...modelPromises, ...audioPromises]);
    
    setStatus?.('Assets loaded successfully');
  } catch (error) {
    console.error('Error loading assets:', error);
    // Don't throw - continue with what we have
  }
}

async function setupExperience() {
  // Setup characters (your approach)
  if (typeof loadCharacters === 'function' && typeof setupCharacters === 'function') {
    const characterData = await loadCharacters(assets.models, mixers);
    characters = setupCharacters(characterData, scene);
  }
  
  // Setup story (your approach)
  if (typeof setupStory === 'function') {
    story = setupStory(characters, assets.audio);
  }
}

function createInteractiveElements() {
  // Create 3D button (wendyXR approach)
  function createButton(text, name) {
    const canvas = document.createElement('canvas');
    const scaleFactor = 4;
    canvas.width = 256 * scaleFactor;
    canvas.height = 64 * scaleFactor;

    const context = canvas.getContext('2d');
    context.scale(scaleFactor, scaleFactor);
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);
    context.font = 'bold 20px Calibri';
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / (2 * scaleFactor), canvas.height / (2 * scaleFactor));

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
    const geometry = new THREE.PlaneGeometry(0.3, 0.1);
    const buttonMesh = new THREE.Mesh(geometry, material);
    buttonMesh.name = name;
    buttonMesh.userData.interactive = true;
    buttonMesh.userData.type = name;

    return buttonMesh;
  }

  interactiveButton = createButton('🛡️ Start Security Experience', 'startButton');
  scene.add(interactiveButton);
}

function initRaycaster() {
  raycaster = new THREE.Raycaster();
  raycaster.setFromXRController = function (controller) {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  };
}

// Event handlers (wendyXR approach + your story logic)
function onXRSessionStart() {
  storyState.inAR = true;
  
  // Position the button in front of the user
  placeStartButton();
  
  setStatus?.('Wave your hand or tap the button to begin the security experience');
}

function onXRSessionEnd() {
  storyState.inAR = false;
  storyState.currentState = 'intro';
  
  if (story && typeof story.reset === 'function') {
    story.reset();
  }
  
  setStatus?.('Session ended. Enter AR to begin again.');
}

function placeStartButton() {
  if (!interactiveButton) return;
  
  const camera = renderer.xr.getCamera();
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);
  
  interactiveButton.position.copy(camera.position).addScaledVector(forward, 2);
  interactiveButton.position.y = camera.position.y - 0.3;
  interactiveButton.lookAt(camera.position);
}

function onSelectStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const object = intersections[0].object;
    
    // Handle interactive objects
    if (object.userData && object.userData.interactive) {
      handleInteraction(object);
      return;
    }
    
    // Handle other objects (wendyXR logic)
    if (object.material && object.material.emissive) {
      object.material.emissive.b = 1;
    }
    
    controller.attach(object);
    controller.userData.selected = object;
  }

  controller.userData.targetRayMode = event.data.targetRayMode;
}

function onSelectEnd(event) {
  const controller = event.target;
  if (controller.userData.selected) {
    const object = controller.userData.selected;
    
    if (object.material && object.material.emissive) {
      object.material.emissive.b = 0;
    }
    
    group.attach(object);
    controller.userData.selected = undefined;
  }
}

function getIntersections(controller) {
  controller.updateMatrixWorld();
  raycaster.setFromXRController(controller);

  const objectsToTest = [];
  
  group.traverse(child => {
    if (child.isMesh) objectsToTest.push(child);
  });
  
  // Add loaded models
  Object.values(loadedModels).forEach(model => {
    if (model) {
      model.traverse(child => {
        if (child.isMesh) objectsToTest.push(child);
      });
    }
  });
  
  if (interactiveButton) objectsToTest.push(interactiveButton);

  return raycaster.intersectObjects(objectsToTest, false);
}

function onGestureDetected(gesture, hand) {
  if (!storyState.inAR) return;
  
  if (gesture === 'wave') {
    const handPosition = new THREE.Vector3();
    hand.getWorldPosition(handPosition);
    
    // Check if hand is near interactive button
    if (interactiveButton) {
      const distance = handPosition.distanceTo(interactiveButton.position);
      if (distance < 1) { // 1 meter range
        handleInteraction(interactiveButton);
      }
    }
  }
}

function handleInteraction(object) {
  if (!object.userData || !object.userData.type) return;
  
  switch (object.userData.type) {
    case 'startButton':
      startExperience();
      break;
      
    default:
      console.warn('Unknown interactive object type:', object.userData.type);
  }
}

function startExperience() {
  if (storyState.currentState !== 'intro') return;
  
  // Hide the start button
  if (interactiveButton) {
    scene.remove(interactiveButton);
  }
  
  // Begin the story sequence
  storyState.currentState = 'main';
  
  if (story && typeof advanceStory === 'function') {
    advanceStory(story);
  }
  
  setStatus?.('Security awareness experience started - Meet Wendy!');
}

function intersectObjects(controller) {
  if (controller.userData.targetRayMode === 'screen') return;
  if (controller.userData.selected) return;

  const line = controller.getObjectByName('line');
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const object = intersections[0].object;
    if (object.material && object.material.emissive) {
      object.material.emissive.r = 1;
      intersected.push(object);
    }
    line.scale.z = intersections[0].distance;
  } else {
    line.scale.z = 5;
  }
}

function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();
    if (object.material && object.material.emissive) {
      object.material.emissive.r = 0;
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Main render loop (wendyXR + your updates)
function animate() {
  const delta = clock.getDelta();
  
  // Update mixers (your approach)
  mixers.forEach(mixer => mixer.update(delta));
  
  // Update controls for desktop
  if (!storyState.inAR && controls) {
    controls.update();
  }
  
  // Update story elements
  if (story && typeof story.update === 'function') {
    story.update(delta);
  }
  
  // wendyXR interaction highlighting
  cleanIntersected();
  intersectObjects(controller1);
  intersectObjects(controller2);

  // Animate loaded models with bounce effect (wendyXR style)
  Object.values(loadedModels).forEach(model => {
    if (model) {
      const elapsed = (Date.now() - startTime) / 1000;
      const bounce = 0.06 * Math.sin(elapsed);
      model.position.y = baseY + bounce;
    }
  });

  // Position interactive button relative to camera
  if (interactiveButton && storyState.inAR) {
    const ndc = new THREE.Vector3(-0.9, -0.4, 0.5);
    ndc.unproject(camera);

    const dir = ndc.clone().sub(camera.position).normalize();
    const distance = 0.5;
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance));
    targetPos.y += 0.08;

    interactiveButton.position.copy(targetPos);

    // Lock rotation to horizontal
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(camera.quaternion);
    euler.x = 0;
    euler.z = 0;
    interactiveButton.quaternion.setFromEuler(euler);
  }

  renderer.render(scene, camera);
}