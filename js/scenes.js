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
    this.nextButtonModel.position.set(0, -0.8, -1.5);
    this.nextButtonModel.rotation.set(0, 0, 0);
    this.nextButtonModel.scale.set(1, 1, 1);
    this.nextButtonModel.visible = true;
    this.nextButtonModel.updateMatrixWorld(true);
    
    this.scene.add(this.nextButtonModel);
    this.nextButtonModel.name = 'nextButtonModel';
    
    this.createTextPlate('Click NEXT to proceed to the next scene', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: -0.29
    });
    
    this.makeModelClickable(this.nextButtonModel, () => {
        this.goToScene(targetScene);
    });
};

// ============== INDIVIDUAL SCENES ==============

ARExperience.prototype.scene1 = function() {
    console.log('🎭 Starting Scene 1 - Welcome');
    
    // Initial text plate creation
    this.createTextPlate('Welcome! Use START to begin', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: -0.29  // Slightly below center
    });    
    
    this.playAudio('audioIntroMsg');

    // Start button creation and placement
    this.startButtonModel.position.set(0, -0.8, -1.5); 
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
    console.log('🎪 Starting Scene 2 - Interactive Demo');

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
    
    this.createTextPlate('Welcome to Scene 2!', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: -0.29  // Slightly below center
    });    
    
    // Start animations and audio
    this.playback3D(this.scene2ModelAnimations, this.scene2AudioTracks, 10);

    // NC: Use estimated duration instead of problematic audioLength
    const estimatedDuration = 35000; // 35 seconds
    setTimeout(() => {
        this.showNextButton('scene3'); // NC: Show next button instead of direct transition
    }, estimatedDuration);
    //}, 1000);  
};


ARExperience.prototype.scene3 = function() {
    console.log('🎨 Starting Scene 3 - Interaction Demo');   
    
    // 1. Wendy appears (clickable), 2. when clicked, Docs appear, wendy disappears, 
    // 3. only when the right doc is clicked, congrat msg appears along with NEXT button, otherwise, error msg appears       
    
    
    this.createTextPlate('Welcome to the Quiz!', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: -0.29  // Slightly below center
    }); 

    this.playAudio('audioQuizIntro');
    
    this.addModelsToScene([
        { name: 'wendyNTModel', x: -10, y: -10, z: -7, rotation: -Math.PI / 2 }, 
        { name: 'tabletModel', x: 10, y: 10, z: -7 },
        { name: 'laptopModel', x: 10, y: 10, z: 7},
        
    ]);     
    
    this.wendyNTModel.visible = true; 
    this.moveModel("wendyNTModel", 
        {x: 0, y: 0, z: -7},  
        5                   
    );

    setTimeout(() => {       

        this.laptopModel.visible = true; 
        this.moveModel("laptopModel", 
            {x: 5, y: 0, z: -7},  
            5                   
        ); 
        
        this.tabletModel.visible = true; 
        this.moveModel("tabletModel", 
            {x: -5, y: 0, z: -7},  
            5                   
        );  
    
    }, 2000);  

    
    this.makeModelClickable(this.laptopModel, () => {
        console.log('💻 Laptop clicked!');
        this.createTextPlate('You clicked the laptop!', {
            backgroundColor: 0x3366cc,
            width: 0.5,
            height: 0.2,
            yOffset: -0.29
        });
    });  
    
    
    setTimeout(() => {
        this.showNextButton('scene4'); 
    }, 6000);  
};


ARExperience.prototype.scene4 = function() {
    console.log('🎬 Starting Scene 4 - Finale');
    
    this.createTextPlate('Thank you for experiencing our AR story!', {
        backgroundColor: 0x336633,
        width: 0.6,
        height: 0.2,
        yOffset: 0.2
    });

    this.createTextPlate('Click QUIT to finish the experience', {
        backgroundColor: 0x663333,
        width: 0.5,
        height: 0.15,
        yOffset: -0.29
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

    if (this.camera?.children) {
        [...this.camera.children].forEach(child => {
            hideSafely(child);
        });
    }        
   
    if (this.uiGroup && this.camera && this.uiGroup.parent === this.camera) {
        this.camera.remove(this.uiGroup);
        this.uiGroup.visible = false; // Just hide instead of dispose
        this.uiGroup = null; 
        this.textPlate = null; 
    }
   
    this.modelInteractions?.clear();
    if (this._animationCallbacks) this._animationCallbacks = [];        
   
    this.mixers?.forEach(mixer => {
        try { mixer.stopAllAction(); mixer.uncacheRoot?.(mixer.getRoot()); } 
        catch(e) {}
    });
    this.mixers = [];
    console.log('✅ Scene cleared (models hidden, not disposed)');
};
