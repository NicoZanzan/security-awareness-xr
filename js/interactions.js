// interactions.js - User interaction handling
console.log('interactions.js loading...');

ARExperience.prototype.makeModelClickable = function(model, callback, once = false) {
    if (!model || typeof callback !== 'function') {
        console.error('makeModelClickable requires a valid model and callback function');
        return null;
    }
    
    // Ensure the model interactions map exists
    if (!this.modelInteractions) {
        this.modelInteractions = new Map();
    }
    
    // Register the model with its callback
    this.modelInteractions.set(model, {
        callback,
        once,
        active: true,
        triggered: false
    }); 
    
    // Return methods to control this interactive model
    return {
        disable: () => {
            if (this.modelInteractions.has(model)) {
                const data = this.modelInteractions.get(model);
                data.active = false;
            }
        },
        enable: () => {
            if (this.modelInteractions.has(model)) {
                const data = this.modelInteractions.get(model);
                data.active = true;
            }
        },
        remove: () => {
            if (this.modelInteractions) {
                this.modelInteractions.delete(model);
            }
        }
    };
};

ARExperience.prototype.checkInteractions = function(raycaster) {
    if (!this.modelInteractions || this.modelInteractions.size === 0) return;
    
    // Get all active, visible interactive models
    const interactiveModels = Array.from(this.modelInteractions.keys())
        .filter(model => {
            const data = this.modelInteractions.get(model);
            return data.active && model.visible && (!data.once || !data.triggered);
        });
    
    if (interactiveModels.length === 0) return;
    
    // Check for intersections
    const intersects = raycaster.intersectObjects(interactiveModels, true);
    
    if (intersects.length > 0) {
        const intersect = intersects[0];
        let currentObj = intersect.object;
        
        while (currentObj) {
            if (this.modelInteractions.has(currentObj)) {
                const data = this.modelInteractions.get(currentObj);
                if (data.active && (!data.once || !data.triggered)) {
                    console.log(`Model clicked: ${currentObj.name || 'unnamed'}`);
                    data.callback(currentObj, intersect);
                    
                    if (data.once) {
                        data.triggered = true;
                    }
                }
                break;
            }
            currentObj = currentObj.parent;
        }
    }
};

ARExperience.prototype.createRaycasterRay = function() {
    // Create a simple line geometry
    const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -this.rayLength)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create material - default red
    const material = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        linewidth: 2
    });
    
    // Create line and add to controller
    this.raycasterLine = new THREE.Line(geometry, material);
    this.controller.add(this.raycasterLine);
};

ARExperience.prototype.updateRaycastRay = function() {
    if (!this.controller || !this.raycasterLine) return;
    
    // Set up raycaster from controller position/direction
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(this.controller.matrixWorld);
    
    const controllerRaycaster = new THREE.Raycaster();
    controllerRaycaster.ray.origin.setFromMatrixPosition(this.controller.matrixWorld);
    controllerRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    // Get interactive objects
    const interactiveModels = Array.from(this.modelInteractions.keys())
        .filter(model => {
            const data = this.modelInteractions.get(model);
            return data.active && model.visible;
        });
    
    // Check for intersection
    if (interactiveModels.length > 0) {
        const intersects = controllerRaycaster.intersectObjects(interactiveModels, true);
        
        // Change color based on intersection
        if (intersects.length > 0) {
            // Green when pointing at interactive object
            this.raycasterLine.material.color.set(0x00ff00);
            
            // Optionally update ray length to match hit distance
            if (this.raycasterLine.geometry.attributes.position) {
                const positions = this.raycasterLine.geometry.attributes.position.array;
                positions[5] = -Math.min(intersects[0].distance, this.rayLength);
                this.raycasterLine.geometry.attributes.position.needsUpdate = true;
            }
        } else {
            // Red when not pointing at anything interactive
            this.raycasterLine.material.color.set(0xff0000);
            
            // Reset ray length
            if (this.raycasterLine.geometry.attributes.position) {
                const positions = this.raycasterLine.geometry.attributes.position.array;
                positions[5] = -this.rayLength;
                this.raycasterLine.geometry.attributes.position.needsUpdate = true;
            }
        }
    }
};