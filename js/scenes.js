// scenes.js - Scene management and story flow
console.log('scenes.js loading...');

ARExperience.prototype.scene1 = function() {
    
    // Initial text plate creation
    this.createTextPlate('Welcome! Use START to begin', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: -0.29  // Slightly below center
    });    
    
    // Start button creation and placement
    this.startButtonModel.position.set(0, -0.8, -1.5); 
    this.scaleModel(this.startButtonModel, 1);// 1m in front
    this.scene.add(this.startButtonModel);  
    
    // Flat table creation and placement
    this.flatTableModel.position.set(0.5, 2.6, -5.5); // 1m in front
    this.scene.add(this.flatTableModel);
    this.flatTableModel.name = "flatTable"; 
        
    this.makeModelClickable(this.startButtonModel, () => {
        this.moveModel("flatTable", 
            {x: 1, y: 10, z: -5.5},  
            7                   
        );  

        setTimeout(() => {
            //this.firstScene();
            this.flatTableModel.visible = false;
            this.startButtonModel.visible = false;
            this.nextScene('scene2');
        }, 2000);
    });         
};

ARExperience.prototype.scene2 = function() {
   
    console.log('Starting scene 2 - interactive demo');

    this.cafeModelS3.position.set(0, 0, -7); 
    this.scene.add(this.cafeModelS3);     
    this.cafeModelS3.name = "cafeModelS3";

    this.doc1Model.position.set(0, 0, -7); 
    this.scene.add(this.doc1Model);     
    this.doc1Model.name = "doc1Model";

    this.doc2Model.position.set(0, 0, -7); 
    this.scene.add(this.doc2Model);     
    this.doc2Model.name = "doc2Model";

    this.wendyModel.position.set(0, 0, -7); 
    this.scene.add(this.wendyModel);     
    this.wendyModel.name = "wendyModel";

    this.mendyModel.position.set(0, -5, -7); 
    this.scene.add(this.mendyModel);     
    this.mendyModel.name = "mendyModel";

    this.word1Model.position.set(0, 0, -7); 
    this.scene.add(this.word1Model);     
    this.word1Model.name = "word1Model";

    this.word2Model.position.set(0, 0, -7); 
    this.scene.add(this.word2Model);     
    this.word2Model.name = "word2Model";

    this.word3Model.position.set(0, 0, -7); 
    this.scene.add(this.word3Model);     
    this.word3Model.name = "word3Model";

    this.sunglassesModel.position.set(0, 0, -7); 
    this.scene.add(this.sunglassesModel);     
    this.sunglassesModel.name = "sunglassesModel";

    this.wendyGlassesModelS3.position.set(0, 0, -7); 
    this.scene.add(this.wendyGlassesModelS3);     
    this.wendyGlassesModelS3.name = "wendyGlassesModelS3";    
    
    this.createTextPlate('Welcome to Scene 2!', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: -0.29  // Slightly below center
    });    
    
    const playback3D = this.playback3D(this.scene2ModelAnimations, this.scene2AudioTracks, 10);

    // Access the audioLength property
    const audioLength = playback3D.audioLength;
    console.log(`Audio will play for ${audioLength}ms`);

    setTimeout(() => {
        this.nextScene('scene3');
    }, audioLength);  
};

ARExperience.prototype.scene3 = function() {
   
    console.log('Starting scene 3 - interactive demo');   
    
    this.createTextPlate('Welcome to Scene 3!', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: -0.29  // Slightly below center
        });    
   

    setTimeout(() => {
        this.nextScene('scene4');
    }, 5000);  
};

ARExperience.prototype.scene4 = function() {
    console.log('Starting scene 3 - interactive demo');
    
    this.createTextPlate('Click QUIT to finish the experience', {
        backgroundColor: 0x336633,
        width: 0.5,
        height: 0.2,
        yOffset: -0.29
    });

    this.quitButtonModel.position.set(0, 0, -1.5); 
    this.scaleModel(this.quitButtonModel, 0.3);      
    this.scene.add(this.quitButtonModel);  

    this.makeModelClickable(this.quitButtonModel, () => {
        this.finishAR();
    });      
};

ARExperience.prototype.nextScene = function(sceneName) {
    // Sicherstellen, dass das nextButtonModel geladen ist
    if (!this.nextButtonModel) {
        console.error("nextButtonModel not found. Please ensure it is loaded.");
        return;
    }

    // 1. WICHTIG: Den Next Button aus der Szene entfernen, falls er bereits existiert.
    // Dies stellt sicher, dass er immer "frisch" hinzugefügt wird.
    if (this.nextButtonModel.parent === this.scene) {
        this.scene.remove(this.nextButtonModel);
        console.log("Next Button explizit aus der Szene entfernt vor dem erneuten Hinzufügen.");
    }
   
    this.nextButtonModel.position.set(0, 0, 0);   
    this.nextButtonModel.rotation.set(0, 0, 0);   
    this.nextButtonModel.scale.set(1, 1, 1);     
    this.nextButtonModel.updateMatrixWorld(true);
    
    this.scene.add(this.nextButtonModel);
    this.nextButtonModel.name = 'nextButtonModel'; 
    
   
    this.nextButtonModel.position.set(0, -0.8, -1.5); 
    this.scaleModel(this.nextButtonModel, 1); 
    this.nextButtonModel.visible = true;
    console.log(`Next Button sichtbar gemacht und positioniert bei (0, -0.3, -1.5) für: ${sceneName}`);
       
    this.createTextPlate('Click NEXT to proceed to the next scene', {
        backgroundColor: 0x3366cc,
        width: 0.5,
        height: 0.2,
        yOffset: -0.29
    });
    
   
    this.makeModelClickable(this.nextButtonModel, () => {        
        if (this.nextButtonModel && this.nextButtonModel.parent === this.scene) {
            this.scene.remove(this.nextButtonModel);
        }
        
        this.clearScene();         
        
        if (typeof this[sceneName] === 'function') {
            setTimeout(() => {
                this[sceneName]();
            }, 300);
        } else {
            console.log(`Szene ${sceneName} nicht gefunden`);
        }
    });
};

ARExperience.prototype.clearScene = function() {
    console.log('Clearing scene - disposing all assets');

    // Helper function for disposing objects that skips reusable buttons.
    const disposeSafely = (obj) => {
       
        if (obj === this.nextButtonModel || obj === this.quitButtonModel) {
            console.log(`Skipping full disposal for reusable button: ${obj.name || obj.uuid}. Setting to invisible and removing from parent.`);
            obj.visible = false; // Make the button invisible when not needed
           
            if (obj.parent) { 
                obj.parent.remove(obj); 
            }
            return; 
        }

        if (!obj) return;
        
        // Recursively dispose children first
        // Create a copy of the children list as it is modified during iteration
        [...(obj.children || [])].forEach(child => {
            disposeSafely(child); // Recursive call
            // Ensure the child is removed from the parent after disposal
            if (obj.isObject3D) obj.remove(child);
        });
        
        // Dispose geometry
        obj.geometry?.dispose();
        
        // Dispose materials (even if there are multiple materials)
        if (obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach(mat => {
                Object.values(mat).forEach(prop => prop?.isTexture && prop.dispose());
                mat.dispose?.();
            });
        }
        // console.log(`Disposed: ${obj.name || obj.uuid}`); // For debugging
    };

   
    if (this.scene) {
       
        [...this.scene.children].forEach(object => {                
            if (object.type.includes('Light') || object.type === 'PerspectiveCamera') return;              
            disposeSafely(object);
        });
    }

    
    if (this.camera?.children) {
        // Eine Kopie des Arrays erstellen
        [...this.camera.children].forEach(child => {
            disposeSafely(child); // Sichere Entsorgungsfunktion aufrufen
        });
    }        
   
    if (this.uiGroup && this.camera && this.uiGroup.parent === this.camera) {
        this.camera.remove(this.uiGroup);
        disposeSafely(this.uiGroup);
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
    console.log('Scene cleared');
};