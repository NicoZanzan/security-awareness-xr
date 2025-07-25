todo:

- replace model.name by model in moveModel() and placeModel()
- load all models at once
- create animations array
- load nextScene(scene)
- placement of models in AR/fallback mode
 
- Quiz: pls choose an object that might be dangerous 
- anchor buttons in ar mode (and create HUD)
- position subtitles/info textplate
- include fuchi's start image
- Models: loading upfront, invoking placing, making interactive in the respective scenes




------------------------------------

    startScene() {  

        // Initial text plate creation
        this.createTextPlate('Welcome! Use START to begin', {
            backgroundColor: 0x3366cc,
            width: 0.5,
            height: 0.2,
            yOffset: -0.29  // Slightly below center
        });    
        
        // Start button
        this.startButtonModel.position.set(0, 0, -2); 
        this.scaleModel(this.startButtonModel, 1);// 1m in front
        this.scene.add(this.startButtonModel);  
        
        // Start button
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
                this.nextButtonModel.visible = true;
                this.nextButtonModel.position.set(0, 0, -2); // 2m in front
                this.scene.add(this.nextButtonModel);
                this.nextButtonModel.name = 'nextButton';
                }, 2000);
        });        
        
        this.makeModelClickable(this.nextButtonModel, () => {
            this.scene1();
        });    
        
        console.log('Scene ready - should be visible');
    }    
    
    firstScene() {      

        this.nextButtonModel.visible = false;

        // 1. Create/get the object
        // 2. Set its properties (position, scale, name, etc.)
        // 3. Add to scene
        // 4. Make visible
        // 5. Set up interactions

        // Wendy model
        this.wendy.name = 'wendy';                   
        this.wendy.position.set(0.5, 2.6, 1.5);    
        this.scaleModel(this.wendy, 0.5);          
        this.wendy.visible = true;               
        this.scene.add(this.wendy); 
        
        this.tableModel.visible = true;
        this.tableModel.position.set(0.5, 1.6, -1.5); // 2m in front
        this.scene.add(this.tableModel);
        this.tableModel.name = 'table';         
        this.playModelAnimation('table', 'CafeAction.001', true);      

        // Mendy model
        this.mendy.visible = false;
        this.mendy.position.set(0.5, 1.6, -1.5); // 1m behind
        this.scene.add(this.mendy);
        
        // Pause button
       
        this.pauseButtonModel.position.set(0.5, 1.6, -1.5);
        this.scaleModel(this.pauseButtonModel, 0.15);
        this.pauseButtonModel.visible = false;
        this.scene.add(this.pauseButtonModel);
        
        // Next button - fix variable name from nextModel to nextButtonModel
        this.quitButtonModel.visible = false;
        this.quitButtonModel.position.set(0.5, 1.6, -1.5); 
        this.scaleModel(this.quitButtonModel, 0.15);// Center-bottom, 1m in front
        this.scene.add(this.quitButtonModel);
                    
        // Hide start button
        this.startButtonModel.visible = false;       
        
        // Show Wendy and pause button
       
        this.wendy.rotation.y = -Math.PI/1.5;   
             
        //Indruction text plate
        if (this.textPlate) {
            this.textPlate.updateText('Wendy has lost her glasses ... press Pause to pause the audio');
        }
       
        //Wendy does not want to betickled when clicked and moves away
        this.makeModelClickable(this.wendy, (model) => {            
            this.wendyAudio_2.play();
            const movement = this.moveModel("wendy", 
                {x: 1, y: 0, z: -3},  
                0.7                   
            );            
            
            if (this.textPlate) {
                this.textPlate.updateText("Wendy says: Hey, this tickles!!");               
            }            
        });

        //Mendy is annoyed, when you click her
        this.makeModelClickable(this.mendy, (model) => {
                      
            if (this.textPlate) {
                this.textPlate.updateText("Mendy says: Leave me alone ...");
            }     
        });

        // NEXT Button to finish scene
        this.makeModelClickable(this.quitButtonModel, () => {
            
            // Hide all models
            this.wendy.visible = false;
            this.mendy.visible = false;
            this.nextButtonModel.visible = false;
                        
            if (this.textPlate) {
                this.textPlate.updateText('Cybersecurity experience complete! Thank you for staying aware.');
                }
            
            //Go to end page after 3sec
            setTimeout(() => {
                this.finishAR();
            }, 3000);
        });
        
        
        this.wendyAudio_1.play().then(() => {          
            this.pauseButtonModel.visible = true;
            this.scaleModel(this.pauseButtonModel, 0.15);
            
            this.isPaused = false;       
           
            this.wendyAudio_1.addEventListener('ended', () => {
                
                this.pauseButtonModel.visible = false;
                           
                if (this.textPlate) {
                    this.textPlate.updateText('Turn around! Someone has been watching... use QUIT to quit the scene');
                }                
                
                this.mendy.visible = true;                
               
                this.quitButtonModel.visible = true;
            });       
        });

        //Pause button
        this.pauseButtonModel.visible = true;
        this.makeModelClickable(this.pauseButtonModel, () => {
            this.togglePause(this.wendyAudio_1);
        });
    }