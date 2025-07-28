// utilities.js - Helper functions and cleanup
console.log('utilities.js loading...');

ARExperience.prototype.scaleModel = function(model, targetSize) {
    // Auto-scale models to reasonable size
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    if (maxDimension > 0) {
        const scale = targetSize / maxDimension;
        model.scale.setScalar(scale);
    }       
};

ARExperience.prototype.disposeObject = function(object) {
    if (!object) return;
    
    // Recursively dispose of all children
    if (object.children) {
        while (object.children.length > 0) {
            this.disposeObject(object.children[0]);
            object.remove(object.children[0]);
        }
    }
    
    // Dispose of geometries
    if (object.geometry) object.geometry.dispose();
    
    // Dispose of materials
    if (object.material) {
        const disposeMaterial = (material) => {
            // Dispose of material's textures
            Object.keys(material).forEach(prop => {
                if (!material[prop]) return;
                if (material[prop].isTexture) {
                    material[prop].dispose();
                }
            });
            
            // Dispose of the material itself
            material.dispose();
        };
        
        if (Array.isArray(object.material)) {
            object.material.forEach(disposeMaterial);
        } else {
            disposeMaterial(object.material);
        }
    }
};

ARExperience.prototype.finishAR = function() {
    console.log('Resetting scenes - clearing everything');

    // Clean up interactions
    if (this.modelInteractions) {
        this.modelInteractions.clear();
    }

    // Remove interaction handlers
    if (this.interactionHandlers) {
        document.removeEventListener('pointerdown', this.interactionHandlers.pointerDown);
        document.removeEventListener('pointermove', this.interactionHandlers.pointerMove);
        document.removeEventListener('pointerup', this.interactionHandlers.pointerUp);
        
        if (this.controller && this.interactionHandlers.xrSelect) {
            console.log("Removing XR controller event listener");
            this.controller.removeEventListener('select', this.interactionHandlers.xrSelect);
        }
        
        this.interactionHandlers = null;
        this.modelInteractionHandlerActive = false;
    }
    
    // Stop any audio that might be playing
    if (this.wendyAudio_1) {
        this.wendyAudio_1.pause();
        this.wendyAudio_1.currentTime = 0;
    }
    
    if (this.wendyAudio_2) {
        this.wendyAudio_2.pause();
        this.wendyAudio_2.currentTime = 0;
    }
    
    // Remove text plate from camera or scene before clearing everything
    if (this.textPlate) {
        if (this.uiGroup && this.textPlate.parent === this.uiGroup) {
            this.uiGroup.remove(this.textPlate);
        } else if (this.scene) {
            this.scene.remove(this.textPlate);
        }
        
        // Dispose text plate resources
        if (this.textPlate.material && this.textPlate.material.map) {
            this.textPlate.material.map.dispose();
        }
        this.disposeObject(this.textPlate);
    }
    
    // Remove UI group from camera if it exists
    if (this.uiGroup && this.camera) {
        this.camera.remove(this.uiGroup);
    }
    
    // Clear UI references to ensure they're recreated
    this.textPlate = null;
    this.uiGroup = null;
    
    // Remove all models from scene
    if (this.scene) {
        // Remove all objects from the scene
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            this.scene.remove(object);
        }
    }
    
    // Dispose of all resources to prevent memory leaks
    if (this.startButtonModel) this.disposeObject(this.startButtonModel);
    if (this.pauseButtonModel) this.disposeObject(this.pauseButtonModel);
    if (this.nextButtonModel) this.disposeObject(this.nextButtonModel);
    if (this.wendy) this.disposeObject(this.wendy);
    if (this.mendy) this.disposeObject(this.mendy);
    if (this.tableModel) this.disposeObject(this.tableModel);
    
    // Clear all models
    this.startButtonModel = null;
    this.pauseButtonModel = null;
    this.nextButtonModel = null;
    this.tableModel = null;
    this.wendy = null;
    this.mendy = null;
    
    // End WebXR session if active
    if (this.session) {
        this.session.end().catch(error => console.error('Error ending XR session:', error));
        this.session = null;
    }
    
    // Stop animation loop
    if (this.renderer) {
        this.renderer.setAnimationLoop(null);
    }
    
    // Reset state
    this.experienceStarted = false;
    this.isPaused = false;
    this.isXRActive = false;
    
    // Reset UI
    document.getElementById('arView').style.display = 'none';
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('endPage').style.display = 'block';
    
    // Set up restart button
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        // Remove any existing event listeners to avoid duplicates
        const newButton = restartButton.cloneNode(true);
        restartButton.parentNode.replaceChild(newButton, restartButton);
        
        // Add fresh event listener
        newButton.addEventListener('click', () => {
            // Clear display
            document.getElementById('endPage').style.display = 'none';
            document.getElementById('landingPage').style.display = 'block';
            
            // Start fresh
            this.init();
        });
    }
    
    // Remove window resize listener
    window.removeEventListener('resize', this.onWindowResize);
};