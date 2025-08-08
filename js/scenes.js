// scenes.js - Scene management and story flow

// ============== NEW SCENE MANAGEMENT SYSTEM ==============

ARExperience.prototype.startExperience = function() {
    console.log('🎬 Starting AR Experience...');
    this.currentScene = 'scene1';
    this.scene1();
};

ARExperience.prototype.goToScene = function(sceneName) {
    console.log(`🔄 Transitioning to ${sceneName}`);
    this.clearScene();
    this.currentScene = sceneName;
    
    if (typeof this[sceneName] === 'function') {
        setTimeout(() => {
            this[sceneName]();
        }, 300);
    } else {
        console.error(`❌ Scene ${sceneName} not found`);
    }
};

ARExperience.prototype.addModelsToScene = function(modelConfigs) {
    modelConfigs.forEach(config => {
        const model = this[config.name];
        if (model) {
            model.position.set(config.x || 0, config.y || 0, config.z || -7);
            if (config.rotation) model.rotation.y = config.rotation;
            this.scene.add(model);
            model.name = config.name;
        } else {
            console.warn(`⚠️ Model ${config.name} not found`);
        }
    });
};

ARExperience.prototype.showNextButton = function(targetScene) {
    if (!this.nextButtonModel) {
        console.error("nextButtonModel not found. Please ensure it is loaded.");
        return;
    }

    // Reset and position next button
    this.nextButtonModel.position.set(0, 0, -1.5);
    this.nextButtonModel.rotation.set(0, 0, 0);
    this.nextButtonModel.scale.set(0.5, 0.5, 0.5); // Scale to 0.5m 
    this.nextButtonModel.visible = true;
    this.nextButtonModel.updateMatrixWorld(true);
    
    this.scene.add(this.nextButtonModel);
    this.nextButtonModel.name = 'nextButtonModel';
    
    // this.createTextPlate('Click NEXT to proceed to the next scene', {
    //     backgroundColor: 0x3366cc,
    //     width: 0.5,
    //     height: 0.2,
    //     yOffset: -0.29
    // });
    
    this.makeModelClickable(this.nextButtonModel, () => {
        this.goToScene(targetScene);
    });
};

// ============== INDIVIDUAL SCENES ==============

ARExperience.prototype.scene1 = function() {

     this.createXRStatusCube();
        
    // Initial text plate creation
    this.createTextPlate('Welcome - use START below to begin', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    });    
    
    this.playAudio('audioIntroMsg');

  
    this.startButtonModel.position.set(0, 0, 0);  // Reset first
    this.startButtonModel.rotation.set(0, 0, 0);
    this.startButtonModel.scale.set(1, 1, 1);
    this.startButtonModel.position.set(0, 0, -1.5);  // Then position

    this.scaleModel(this.startButtonModel, 1);// 1m in front
    this.scene.add(this.startButtonModel);  
    
    // Wendy NT model creation and placement
    this.wendyNTModel.position.set(0, 0, -7); 
    this.wendyNTModel.rotation.y = -Math.PI / 2; // 90 degrees clockwise
    this.scene.add(this.wendyNTModel);     
    this.wendyNTModel.name = "wendyNTModel";

    this.playModelAnimation('wendyNTModel', 'humping');
        
    this.makeModelClickable(this.startButtonModel, () => {
        this.moveModel("wendyNTModel", 
            {x: 1, y: 10, z: -5.5},  
            7                   
        );  

        setTimeout(() => {
            this.wendyNTModel.visible = false;
            this.startButtonModel.visible = false;
            this.goToScene('scene2'); // NC: Use scene manager
        }, 2000);
    });         
};

ARExperience.prototype.scene2 = function() {
     this.createXRStatusCube();

    this.createTextPlate('Chapter 1: 3D Video', {
       backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    });    

    // NC: Use helper function to add multiple models
    this.addModelsToScene([
        { name: 'cafeModelS3' },
        { name: 'doc1Model' },
        { name: 'doc2Model' },
        { name: 'wendyModel' },
        { name: 'mendyModel', z: -3 },
        { name: 'word1Model' },
        { name: 'word2Model' },
        { name: 'word3Model' },
        { name: 'sunglassesModel' },
        { name: 'wendyGlassesModelS3' }
    ]);      
    
    // Start animations and audio
    //this.playback3D(this.scene2ModelAnimations, this.scene2AudioTracks, 10);

    // NC: Use estimated duration instead of problematic audioLength
    const estimatedDuration = 35000; // 35 seconds
    setTimeout(() => {
         this.goToScene('scene3');
        //this.showNextButton('scene3'); // NC: Show next button instead of direct transition
    //}, estimatedDuration);
    }, 1000);  
};


ARExperience.prototype.scene3 = function() {
     this.createXRStatusCube(); 
      
    this.createTextPlate('Welcome to the Quiz!', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    }); 

    this.playAudio('audioQuizIntro');
    
    this.addModelsToScene([
        { name: 'wendyNTModel', x: -10, y: -10, z: -7, rotation: -Math.PI / 2 }, 
        { name: 'tabletModel', x: 10, y: 10, z: -7 },
        { name: 'laptopModel', x: 10, y: 10, z: 7},
        { name: 'tableModel', x: 10, y: 10, z: -7 },
        { name: 'flatTableModel', x: 10, y: 10, z: -7 },
        { name: 'notebookModel', x: 10, y: 10, z: -7 },        
    ]);     
    
    this.wendyNTModel.visible = true; 
    this.moveModel("wendyNTModel", 
        {x: 0, y: 0, z: -7},  
        8                   
    );  


    this.startButtonModel.visible = true; 
    this.moveModel("startButtonModel", 
        {x: 6.06, y: 0, z: -3.5},  
        5                   
    ); 
    
    this.tabletModel.visible = true; 
    this.moveModel("tabletModel", 
        {x: 6.06, y: 0, z: 3.5},  
        5                   
    );  

    this.tableModel.visible = true; 
    this.moveModel("tableModel", 
        {x: 0, y: 0, z: 7},  
        5                   
    );  

    this.laptopModel.visible = true; 
     this.moveModel("laptopModel", 
         {x: 0, y: 0, z: 7},  
         5                   
    );  

    this.flatTableModel.visible = true; 
    this.moveModel("flatTableModel", 
        {x: 6.06, y: 0, z: 3.57},  
        5                   
    );  

    this.notebookModel.visible = true; 
    this.moveModel("notebookModel", 
        {x: -6.06, y: 0, z: -3.5},  
        5                   
    );        
        
    this.makeModelClickable(this.laptopModel, () => {
        console.log('💻 Laptop clicked!');
        this.playAudio('audioCorrectAnswer'); 
        this.playModelAnimation('wendyNTModel', 'humping');
        this.showNextButton('scene4');
    });   

    this.makeModelClickable(this.notebookModel, () => {
        console.log('📓 Notebook clicked!');
        this.playAudio('audioWrongAnswer');       
    });  

    this.makeModelClickable(this.tableModel, () => {
        console.log('🪑 Table clicked!');
        this.playAudio('audioWrongAnswer');       
    });  

    this.makeModelClickable(this.flatTableModel, () => {
        console.log('📋 Flat Table clicked!');
        this.playAudio('audioWrongAnswer');       
    }); 
    
    this.makeModelClickable(this.tabletModel, () => {
        console.log('📱 Tablet clicked!');
        this.playAudio('audioWrongAnswer');       
    });    
   
};


ARExperience.prototype.scene4 = function() {
    this.createXRStatusCube();
    
    this.createTextPlate('Thanks for looking around - use QUIT below to finish', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    });   

    this.quitButtonModel.position.set(0, 0, -1.5); 
    this.scaleModel(this.quitButtonModel, 0.3);      
    this.scene.add(this.quitButtonModel);  

    this.makeModelClickable(this.quitButtonModel, () => {
        console.log('🎬 Experience completed!');
        this.finishAR();
    });

    // Optional: Add farewell animation
    if (this.wendyModel) {
        this.wendyModel.position.set(-2, 0, -5);
        this.scene.add(this.wendyModel);
        // Uncomment if you have a goodbye animation:
        // this.playModelAnimation('wendyModel', 'WaveGoodbye');
    }
};

// ============== LEGACY METHODS (IMPROVED) ==============

ARExperience.prototype.nextScene = function(sceneName) {
    // NC: Simplified - just show the next button
    this.showNextButton(sceneName);
};

ARExperience.prototype.clearScene = function() {
    console.log('🧹 Clearing scene - hiding all assets');

    // Helper function for hiding objects instead of disposing
    const hideSafely = (obj) => {
        if (!obj) return;
        
        // Simply make the object invisible and remove from parent
        obj.visible = false;
        if (obj.parent) { 
            obj.parent.remove(obj); 
        }
        
        console.log(`Hidden: ${obj.name || obj.type}`);
    };

    if (this.scene) {
        [...this.scene.children].forEach(object => {                
            if (object.type.includes('Light') || object.type === 'PerspectiveCamera') return;              
            hideSafely(object);
        });
    }

    // ✅ Smart interaction cleanup - don't destroy all interactions
    if (this.modelInteractions) {
        const modelsToRemove = [];
        this.modelInteractions.forEach((data, model) => {
            // Remove interactions for models that are no longer in the scene or are hidden
            if (!model.parent || !model.visible) {
                modelsToRemove.push(model);
            }
        });
        modelsToRemove.forEach(model => {
            this.modelInteractions.delete(model);
        });
        console.log(`🧹 Cleaned up ${modelsToRemove.length} stale interactions, ${this.modelInteractions.size} remaining`);
    }

    if (this._animationCallbacks) this._animationCallbacks = [];        
   
    this.mixers?.forEach(mixer => {
        try { mixer.stopAllAction(); mixer.uncacheRoot?.(mixer.getRoot()); } 
        catch(e) {}
    });
    this.mixers = [];
    console.log('✅ Scene cleared (interactions preserved)');
};

ARExperience.prototype.createXRStatusCube = function() {
    // Remove existing status cube if it exists
    if (this.xrStatusCube) {
        this.scene.remove(this.xrStatusCube);
        if (this.xrStatusCube.material) this.xrStatusCube.material.dispose();
        if (this.xrStatusCube.geometry) this.xrStatusCube.geometry.dispose();
        this.xrStatusCube = null;
    }
    
    // Check XR controller and raycasting status
    const controllerExists = !!this.controller;
    const controllerInScene = controllerExists && this.scene.children.includes(this.controller);
    const rayExists = !!this.raycasterLine;
    const rayInController = rayExists && controllerExists && this.controller.children.includes(this.raycasterLine);
    const interactionsReady = !!this.modelInteractions && this.modelInteractions.size > 0;
    
    // Overall XR readiness
    const xrReady = controllerExists && controllerInScene && rayExists && rayInController && interactionsReady;
    
    // Create cube geometry and material
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); // 10cm cube
    const material = new THREE.MeshBasicMaterial({ 
        color: xrReady ? 0x00ff00 : 0xff0000, // Green if ready, red if not
        transparent: true,
        opacity: 0.8
    });
    
    this.xrStatusCube = new THREE.Mesh(geometry, material);
    
    // Position cube in front of camera/user
    if (this.isXRActive && this.camera) {
        // In AR mode, position relative to camera
        this.xrStatusCube.position.set(0, 0.2, -0.5); // Slightly above center, 50cm away
    } else {
        // In desktop mode, position in front of camera
        this.xrStatusCube.position.set(0, 0.2, -1.5); // Further away for desktop viewing
    }
    
    // Make cube always face the camera
    this.xrStatusCube.lookAt(this.camera.position);
    
    // Add to scene
    this.scene.add(this.xrStatusCube);
    this.xrStatusCube.name = 'xrStatusCube';
    
    // Log status
    console.log(`📦 XR Status Cube Created: ${xrReady ? '🟢 GREEN (Ready)' : '🔴 RED (Not Ready)'}`);
    console.log('📦 Status Details:');
    console.log(`   - Controller Exists: ${controllerExists ? '✅' : '❌'}`);
    console.log(`   - Controller In Scene: ${controllerInScene ? '✅' : '❌'}`);
    console.log(`   - Ray Exists: ${rayExists ? '✅' : '❌'}`);
    console.log(`   - Ray In Controller: ${rayInController ? '✅' : '❌'}`);
    console.log(`   - Interactions Ready: ${interactionsReady ? '✅' : '❌'}`);
    
    return this.xrStatusCube;
};

// Function to update the cube color without recreating it
ARExperience.prototype.updateXRStatusCube = function() {
    if (!this.xrStatusCube) {
        this.createXRStatusCube();
        return;
    }
    
    // Check current status
    const controllerExists = !!this.controller;
    const controllerInScene = controllerExists && this.scene.children.includes(this.controller);
    const rayExists = !!this.raycasterLine;
    const rayInController = rayExists && controllerExists && this.controller.children.includes(this.raycasterLine);
    const interactionsReady = !!this.modelInteractions && this.modelInteractions.size > 0;
    
    const xrReady = controllerExists && controllerInScene && rayExists && rayInController && interactionsReady;
    
    // Update color
    this.xrStatusCube.material.color.set(xrReady ? 0x00ff00 : 0xff0000);
    
    console.log(`📦 XR Status Cube Updated: ${xrReady ? '🟢 GREEN (Ready)' : '🔴 RED (Not Ready)'}`);
};

// Function to remove the status cube
ARExperience.prototype.removeXRStatusCube = function() {
    if (this.xrStatusCube) {
        this.scene.remove(this.xrStatusCube);
        if (this.xrStatusCube.material) this.xrStatusCube.material.dispose();
        if (this.xrStatusCube.geometry) this.xrStatusCube.geometry.dispose();
        this.xrStatusCube = null;
        console.log('📦 XR Status Cube Removed');
    }
};


