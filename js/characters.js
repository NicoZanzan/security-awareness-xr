// characters.js - Character management and positioning

import * as THREE from 'three';

// Character placement settings
const CHARACTER_SETTINGS = {
  wendy: {
    scale: 1.0,
    position: { x: 0, y: 0, z: -2 }, // In front of user
    animations: {
      idle: 'Idle',
      talking: 'Talking',
      greeting: 'Greeting'
    }
  },
  mendy: {
    scale: 1.0,
    position: { x: 0, y: 0, z: 2 }, // Behind user
    animations: {
      idle: 'Idle',
      talking: 'Talking',
      greeting: 'Greeting'
    }
  }
};

// Load and prepare character models
export async function loadCharacters(modelAssets, mixers) {
  const characters = {};
  
  // Process wendy character
  if (modelAssets.wendy) {
    characters.wendy = await prepareCharacter(
      modelAssets.wendy, 
      CHARACTER_SETTINGS.wendy,
      mixers
    );
  }
  
  // Process mendy character
  if (modelAssets.mendy) {
    characters.mendy = await prepareCharacter(
      modelAssets.mendy, 
      CHARACTER_SETTINGS.mendy,
      mixers
    );
  }
  
  return characters;
}

// Prepare a character model and its animations
async function prepareCharacter(gltfAsset, settings, mixers) {
  // Clone the model scene
  const model = gltfAsset.scene.clone();
  
  // Apply scale
  model.scale.setScalar(settings.scale);
  
  // Position the model
  model.position.set(
    settings.position.x,
    settings.position.y,
    settings.position.z
  );
  
  // Set initially hidden
  model.visible = false;
  
  // Setup animations
  model.userData.animations = {};
  
  if (gltfAsset.animations && gltfAsset.animations.length > 0) {
    // Create animation mixer
    const mixer = new THREE.AnimationMixer(model);
    mixers.push(mixer);
    
    // Store mixer reference
    model.userData.mixer = mixer;
    
    // Process animations
    const animationMap = settings.animations || {};
    
    // Find and setup each requested animation
    Object.keys(animationMap).forEach(key => {
      const animName = animationMap[key];
      const anim = gltfAsset.animations.find(a => a.name === animName);
      
      if (anim) {
        const action = mixer.clipAction(anim);
        model.userData.animations[key] = action;
        
        // Auto-play idle animation
        if (key === 'idle') {
          action.play();
        }
      }
    });
  }
  
  return model;
}

// Setup characters in the scene
export function setupCharacters(characterModels, scene) {
  // Add all characters to the scene
  Object.values(characterModels).forEach(model => {
    scene.add(model);
  });
  
  return characterModels;
}

// Update character positions relative to the camera
export function updateCharacterPositions(characters, camera) {
  if (!characters || !camera) return;
  
  const camPos = new THREE.Vector3();
  camera.getWorldPosition(camPos);
  
  const camDir = new THREE.Vector3(0, 0, -1);
  camDir.applyQuaternion(camera.quaternion);
  
  // Position wendy in front of the user
  if (characters.wendy) {
    const wendyPos = camPos.clone().add(camDir.clone().multiplyScalar(2));
    wendyPos.y = camPos.y - 0.2; // Slightly below eye level
    
    characters.wendy.position.copy(wendyPos);
    characters.wendy.lookAt(camPos);
  }
  
  // Position mendy behind the user
  if (characters.mendy) {
    const backDir = camDir.clone().multiplyScalar(-1); // Behind user
    const mendyPos = camPos.clone().add(backDir.multiplyScalar(2));
    mendyPos.y = camPos.y - 0.2; // Slightly below eye level
    
    characters.mendy.position.copy(mendyPos);
    characters.mendy.lookAt(camPos);
  }
}