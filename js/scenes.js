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
    this.nextButtonModel.position.set(0, 1.7, -1.5);
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
    this.createTextPlate('Welcome - use START below to begin', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    });    
    
    this.playAudio('audioIntroMsg');

  
    //this.startButtonModel.position.set(0, 0, 0);  // Reset first
    this.startButtonModel.scale.set(1, 1, 1);
    this.startButtonModel.position.set(0, 0, -1.5);  // Then position

    this.scaleModel(this.startButtonModel, 1);// 1m in front
    this.scene.add(this.startButtonModel);  
    
    // Wendy NT model creation and placement
    this.wendyNTModel.position.set(0, 1.5, -7); 
    this.wendyNTModel.rotation.y = -Math.PI / 2; // 90 degrees clockwise
    this.scene.add(this.wendyNTModel);     
    this.wendyNTModel.name = "wendyNTModel";

    this.playModelAnimation('wendyNTModel', 'Jumping'); // Play initial animation
        
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

    this.createTextPlate('Chapter 1: 3D Video', {
       backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    });    

    // NC: Use helper function to add multiple models
    this.addModelsToScene([
        { name: 'cafeModelS3', y:1 },
        { name: 'doc1Model', y:1 },
        { name: 'wendyModel', y:1 },
        { name: 'mendyModel', y:1, z: -3 },
        { name: 'word1Model', y:1 },
        { name: 'word2Model', y:1 },
        { name: 'word3Model', y:1 },
        { name: 'sunglassesModel', y:1 },
        { name: 'wendyGlassesModelS3', y:1},
    ]);       
    
    //this.playback3D(this.scene2ModelAnimations, this.scene2AudioTracks, 10);
    
    const estimatedDuration = 35000; // 35 seconds
    setTimeout(() => {       
         this.showNextButton('scene3');        
    //}, estimatedDuration);
    }, 1000);  
};


ARExperience.prototype.scene3 = function() {    
      
    this.createTextPlate('Welcome to the Quiz!', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    }); 

    this.playAudio('audioQuizIntro');
    
    this.addModelsToScene([
        { name: 'wendyNTModel', x: -10, y: -10, z: -7, rotation: -Math.PI / 2 }, 
        { name: 'Bird', x: 10, y: 10, z: -7 },
        { name: 'Sofa', x: 10, y: 10, z: 7},
        { name: 'Park', x: 10, y: 10, z: -7 },
        { name: 'Laptop', x: 10, y: 10, z: -7 },             
    ]);     
    
    // Wendy stays at the same position (0° - front)
    this.wendyNTModel.visible = true; 
    this.moveModel("wendyNTModel", 
        {x: 0, y: 1.7, z: -7},  // 0° - North (front) - UNCHANGED
        8                   
    );

    // Bird at 72° (northeast) - closer to Wendy
    this.Bird.visible = true; 
    this.moveModel("Bird", 
        {x: 4.66, y: 1.7, z: -1.44},  // 72° - Northeast (radius 4.9)
        5                   
    );  

    // Sofa at 144° (southeast) - closer to Wendy
    this.Sofa.visible = true; 
    this.moveModel("Sofa", 
        {x: 2.88, y: 1.7, z: 3.97},  // 144° - Southeast (radius 4.9)
        5                   
    );  

    // Park at 216° (southwest) - closer to Wendy
    this.Park.visible = true; 
    this.moveModel("Park", 
        {x: -2.88, y: 1.7, z: 3.97},  // 216° - Southwest (radius 4.9)
        5                   
    );  

    // Laptop at 288° (northwest) - closer to Wendy
    this.Laptop.visible = true; 
    this.moveModel("Laptop", 
        {x: -4.66, y: 1.7, z: -1.44},  // 288° - Northwest (radius 4.9)
        5                   
    );

        
    this.makeModelClickable(this.Laptop, () => {       
        this.playAudio('audioCorrectAnswer'); 
        this.playModelAnimation('wendyNTModel', 'Jumping');
        this.showNextButton('scene4');
    });   

    this.makeModelClickable(this.Bird, () => {       
        this.playAudio('audioWrongAnswer');       
    });  

    this.makeModelClickable(this.Sofa, () => {       
        this.playAudio('audioWrongAnswer');       
    });  

    this.makeModelClickable(this.Park, () => {       
        this.playAudio('audioWrongAnswer');       
    });  
   
};


ARExperience.prototype.scene4 = function() {
   
    this.createTextPlate('Thanks for looking around - use QUIT below to finish', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: 0.29  // Slightly below center
    });   

    this.addModelsToScene([       
        { name: 'wendyModel', y:1 },       
    ]); 
    
    this.wendyModel.visible = true;

    this.quitButtonModel.position.set(0, 1, -1.5); 
    this.scaleModel(this.quitButtonModel, 0.3);      
    this.scene.add(this.quitButtonModel);  

    this.makeModelClickable(this.quitButtonModel, () => {
        
        this.finishAR();
    });

    // Optional: Add farewell animation
    if (this.wendyModel) {
        this.wendyModel.position.set(-2, 1.7, -5);
        this.scene.add(this.wendyModel);
        // Uncomment if you have a goodbye animation:
        this.playModelAnimation('wendyNTModel', 'humping');
    }
};

// ============== LEGACY METHODS (IMPROVED) ==============

// ARExperience.prototype.nextScene = function(sceneName) {
//     // NC: Simplified - just show the next button
//     this.showNextButton(sceneName);
// };

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

