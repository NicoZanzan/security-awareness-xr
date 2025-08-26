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

    // UPDATED: Device-aware positioning
    const buttonPos = this.adjustPositionForDevice(0, 1.7, -2.5);
    this.nextButtonModel.position.set(buttonPos.x, buttonPos.y, buttonPos.z);
    this.nextButtonModel.rotation.set(0, 0, 0);
    this.nextButtonModel.scale.set(0.5, 0.5, 0.5); // Scale to 0.5m 
    this.nextButtonModel.visible = true;
    this.nextButtonModel.updateMatrixWorld(true);
    
    this.scene.add(this.nextButtonModel);
    this.nextButtonModel.name = 'nextButtonModel';   
    
    this.makeModelClickable(this.nextButtonModel, () => {
        this.goToScene(targetScene);
    });
};

// ============== INDIVIDUAL SCENES ==============

ARExperience.prototype.scene1 = function() {    
        
    // Initial text plate creation
    this.createTextPlate('Welcome!', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    });    
    
    this.playAudio('audioIntroMsg');
    
    // IMPORTANT: Reset button parent and ensure it's in world space
    if (this.startButtonModel.parent) {
        this.startButtonModel.parent.remove(this.startButtonModel);
    }
    
    // UPDATED: Device-aware positioning
    const startPos = this.adjustPositionForDevice(0, 0, -2.5);
    const wendyPos = this.adjustPositionForDevice(0, 0.7, -7);
    
    this.startButtonModel.scale.set(1, 1, 1);
    this.startButtonModel.position.set(startPos.x, startPos.y, startPos.z);
    this.startButtonModel.rotation.set(0, 0, 0); // Reset rotation
    this.startButtonModel.updateMatrixWorld(true); // Force update

    this.scaleModel(this.startButtonModel, 1);// 1m in front
    this.scene.add(this.startButtonModel);  
    this.startButtonModel.name = "startButtonModel"; // Ensure name is set
    
    // Wendy Jump model creation and placement
    this.wendyJump.position.set(wendyPos.x, wendyPos.y, wendyPos.z); 
    this.wendyJump.rotation.y = 0;
    this.scene.add(this.wendyJump);     
    this.wendyJump.name = "wendyJump"; 

    // Play both animations on wendyJump
    this.playModelAnimation('wendyJump', 'jump in');
    setTimeout(() => {
        this.playModelAnimation('wendyJump', 'hover');
    }, 1500); // 1.5s delay just about for the jump
        
    this.makeModelClickable(this.startButtonModel, () => {
        // UPDATED: Device-aware movement target
        const targetPos = this.adjustPositionForDevice(1, 10, -6.5);
        this.moveModel("wendyJump", targetPos, 7);  

        setTimeout(() => {
            this.wendyJump.visible = false;
            this.startButtonModel.visible = false;
            this.goToScene('scene2'); // NC: Use scene manager
        }, 2000);
    });         
};

ARExperience.prototype.scene2 = function() {     

    this.createTextPlate('3D Video', {
       backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    });    

    // UPDATED: Device-aware positioning
    const multiplier = this.getDistanceMultiplier();
    const baseZ = -7;
    const adjustedZ = baseZ * multiplier;
    const mendyZ = 1 * multiplier;

    // NC: Use helper function to add multiple models
    this.addModelsToScene([
        { name: 'cafeModelS3', y:1, z: adjustedZ },
        { name: 'doc1Model', y:1, z: adjustedZ },
        { name: 'wendyModel', y:1, z: adjustedZ },
        { name: 'mendyModel', y:1, z: mendyZ },
        { name: 'word1Model', y:1, z: adjustedZ },
        { name: 'word2Model', y:1, z: adjustedZ },
        { name: 'word3Model', y:1, z: adjustedZ },
        { name: 'sunglassesModel', y:1, z: adjustedZ },
        { name: 'wendyGlassesModelS3', y:1, z: adjustedZ},
    ]);       
    
    this.playback3D(this.scene2ModelAnimations, this.scene2AudioTracks, 0);

    const estimatedDuration = 35000; // 35 seconds
    setTimeout(() => {       
        this.showNextButton('scene3');        
    }, estimatedDuration);
    //}, 1000);  
};

ARExperience.prototype.scene3 = function() {    
      
    this.createTextPlate('Quiz', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  
    }); 

    this.playAudio('audioQuizIntro');
    
    // UPDATED: Device-aware positioning
    const multiplier = this.getDistanceMultiplier();
    
    this.addModelsToScene([
        { name: 'wendySuccessSpin', x: -10, y: -10, z: -5 * multiplier, rotation: 0}, 
        { name: 'A_bird', x: 10, y: 10, z: -5 * multiplier, rotation: -Math.PI / 2 + Math.PI / 9 - Math.PI / 18 - Math.PI / 18 + Math.PI / 4 },
        { name: 'C_sofa', x: 10, y: 10, z: 5 * multiplier, rotation: -3 * Math.PI / 4 - (140 * Math.PI / 180) - (10 * Math.PI / 180) + Math.PI / 4 },
        { name: 'D_park', x: 10, y: 10, z: -5 * multiplier, rotation: -Math.PI + (35 * Math.PI / 180) - (45 * Math.PI / 180) - (30 * Math.PI / 180) - (20 * Math.PI / 180) - (10 * Math.PI / 180) - Math.PI / 4 },
        { name: 'B_laptop', x: 10, y: 10, z: -5 * multiplier, rotation: Math.PI / 2 + (135 * Math.PI / 180)},
        { name: 'Quiz_text1', x: 10, y: 10, z: -5 * multiplier}   
    ]);    
    
    this.wendySuccessSpin.visible = true; 
    this.moveModel("wendySuccessSpin", {x: 0, y: 0.7, z: -5 * multiplier}, 8);

    // UPDATED: Slightly adjusted positioning for mobile readability
    const lateralSpread = this.isMobileDevice() ? 3.8 : 3.3;
    const depthNear = -1 * multiplier;
    const depthFar = 2.8 * multiplier;

    this.A_bird.visible = true; 
    this.moveModel("A_bird", {x: lateralSpread, y: 0.7, z: depthNear}, 5);

    this.C_sofa.visible = true; 
    this.moveModel("C_sofa", {x: -2, y: 0.7, z: depthFar}, 5);

    this.D_park.visible = true; 
    this.moveModel("D_park", {x: -lateralSpread, y: 0.7, z: depthNear}, 5);

    this.B_laptop.visible = true; 
    this.moveModel("B_laptop", {x: 2, y: 0.7, z: depthFar}, 5);
    
    this.Quiz_text1.visible = true;
    this.moveModel("Quiz_text1", {x: 0, y: 1.5, z: -5 * multiplier}, 5);
    this.Quiz_text1.scale.set(1.2, 1.2, 1.2);    

    this.makeModelClickable(this.B_laptop, () => {       
        this.playAudio('audioCorrectAnswer'); 
        this.playModelAnimation('B_laptop' , 'sb_check_b_Action');
        this.playModelAnimation('wendySuccessSpin', 'success-spinAction');
        this.showNextButton('scene4');
    });    

    this.makeModelClickable(this.A_bird, () => {       
        this.playAudio('audioWrongAnswer'); 
        this.playModelAnimation('A_bird' , 'sb_xAction');
    });  

    this.makeModelClickable(this.C_sofa, () => {       
        this.playAudio('audioWrongAnswer');  
        this.playModelAnimation('C_sofa' , 'sb_sofa_xAction');
    });  

    this.makeModelClickable(this.D_park, () => {       
        this.playAudio('audioWrongAnswer');    
        this.playModelAnimation('D_park' , 'sb_slide_xAction');
    });  
};

ARExperience.prototype.scene4 = function() {
   
    this.createTextPlate('Goodbye!', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    });   
    
    this.scene.add(this.wendyJump);  // Changed from wendyNTModel to wendyJump
    
    this.wendyJump.visible = true;   // Changed from wendyNTModel to wendyJump

    // UPDATED: Device-aware positioning
    const wendyPos = this.adjustPositionForDevice(0, 0.7, -7);
    const quitPos = this.adjustPositionForDevice(0, 0, -4);
    
    this.wendyJump.position.set(wendyPos.x, wendyPos.y, wendyPos.z);

    // Play farewell animation
    this.playModelAnimation('wendyJump', 'jump in');  // Changed model and animation
    this.playAudio('audioFarewell');   
    setTimeout(() => {
        this.playModelAnimation('wendyJump', 'hover');
    }, 2000); // 2s delay just about for the jump

    // Fix quit button setup to match working buttons
    this.quitButtonModel.position.set(quitPos.x, quitPos.y, quitPos.z); 
    this.quitButtonModel.scale.set(1, 1, 1); // Same scale as start button
    // this.scaleModel(this.quitButtonModel, 1); // Same scaleModel call as start button
    this.quitButtonModel.visible = true; // Ensure it's visible   
    this.scene.add(this.quitButtonModel);    

    // Make sure it's clickable
    this.makeModelClickable(this.quitButtonModel, () => {
        console.log('Quit button clicked!'); // Add debug log        
        this.finishAR();
    });   
};

// ============== LEGACY METHODS (IMPROVED) ==============

ARExperience.prototype.clearScene = function() {
    console.log('🧹 Clearing scene - hiding all assets');

    const hideSafely = (obj) => {
        if (!obj) return;
        
        obj.visible = false;
        if (obj.parent) { 
            obj.parent.remove(obj); 
        }
        console.log(`Hidden: ${obj.name || obj.type}`);
    };

    if (this.scene) {
        [...this.scene.children].forEach(object => {                
            // PRESERVE XR COMPONENTS DURING SCENE TRANSITIONS
            if (object.type.includes('Light') || 
                object.type === 'PerspectiveCamera' ||
                object === this.controller ||           // Don't remove XR controller!
                object === this.raycasterLine ||        // Don't remove ray!
                (this.uiGroup && object === this.uiGroup)) {  // Don't remove UI
                return;
            }
            
            hideSafely(object);
        });
    }

    // Don't clear interaction map completely - preserve XR controller interactions
    if (this.modelInteractions) {
        const modelsToRemove = [];
        this.modelInteractions.forEach((data, model) => {
            // Only remove interactions for models that are actually being cleaned up
            if (!model.parent || (!model.visible && 
                model.name !== 'nextButtonModel' && 
                model.name !== 'startButtonModel')) {
                modelsToRemove.push(model);
            }
        });
        modelsToRemove.forEach(model => {
            this.modelInteractions.delete(model);
        });
        console.log(`🧹 Cleaned up ${modelsToRemove.length} stale interactions, ${this.modelInteractions.size} remaining`);
    }    

    // Don't reset animation callbacks in XR mode (they might be needed for controller updates)
    if (!this.isXRActive && this._animationCallbacks) {
        this._animationCallbacks = [];        
    }
   
    this.mixers?.forEach(mixer => {
        try { mixer.stopAllAction(); mixer.uncacheRoot?.(mixer.getRoot()); } 
        catch(e) {}
    });
    this.mixers = [];
    
    console.log('✅ Scene cleared (XR components preserved)');
};