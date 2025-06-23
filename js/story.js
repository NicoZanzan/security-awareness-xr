// story.js - Story management and sequencing

// import { showSubtitle, hideSubtitle, setStatus } from './utils.js';

// Story sequence definition
const STORY_SEQUENCES = {
  intro: {
    actions: [
      { type: 'subtitle', text: 'Welcome to the AR Storytelling Experience' },
      { type: 'wait', duration: 2 },
      { type: 'subtitle', text: 'Wave your hand to begin' },
      { type: 'wait', duration: 1 }
    ],
    next: null  // Stay in intro state until interaction
  },
  
  main: {
    actions: [
      { type: 'audio', name: 'story' },
      { type: 'show', character: 'wendy' },
      { type: 'animation', character: 'wendy', animation: 'talking' },
      { type: 'subtitle', text: 'Hello! I have a story to tell you...' },
      { type: 'wait', duration: 3 },
      { type: 'subtitle', text: 'It all began on a day just like today...' },
      { type: 'wait', duration: 3 },
      { type: 'subtitle', text: 'Something unexpected happened that changed everything...' },
      { type: 'wait', duration: 3 },
      { type: 'subtitle', text: 'But the most surprising part is yet to come...' },
      { type: 'wait', duration: 2 },
      { type: 'subtitle', text: 'Look behind you!' },
      { type: 'wait', duration: 2 }
    ],
    next: 'reveal'
  },
  
  reveal: {
    actions: [
      { type: 'audio', name: 'reveal' },
      { type: 'show', character: 'mendy' },
      { type: 'animation', character: 'mendy', animation: 'greeting' },
      { type: 'subtitle', text: 'Surprise! I was here all along!' },
      { type: 'wait', duration: 3 },
      { type: 'subtitle', text: 'What did you think of our little surprise?' },
      { type: 'wait', duration: 3 }
    ],
    next: 'end'
  },
  
  end: {
    actions: [
      { type: 'subtitle', text: 'Thanks for experiencing our AR story!' },
      { type: 'wait', duration: 3 },
      { type: 'hide', character: 'wendy' },
      { type: 'hide', character: 'mendy' },
      { type: 'subtitle', text: 'Wave your hand to try again.' },
      { type: 'wait', duration: 2 }
    ],
    next: 'intro'
  }
};

// Story controller class
class StoryController {
  constructor(characters, audio) {
    this.characters = characters;
    this.audio = audio;
    this.currentState = 'intro';
    this.actionIndex = 0;
    this.timers = [];
    this.subtitleActive = false;
    this.waitTimer = 0;
    this.isPlaying = false;
  }
  
  start(state = 'intro') {
    // Clear any existing timers
    this.clearTimers();
    
    // Set initial state
    this.currentState = state;
    this.actionIndex = 0;
    this.isPlaying = true;
    
    // Start processing actions
    this.processNextAction();
  }
  
  processNextAction() {
    if (!this.isPlaying) return;
    
    const sequence = STORY_SEQUENCES[this.currentState];
    if (!sequence) return;
    
    // Check if we've reached the end of the sequence
    if (this.actionIndex >= sequence.actions.length) {
      // Move to next sequence if available
      if (sequence.next) {
        this.currentState = sequence.next;
        this.actionIndex = 0;
        this.processNextAction();
      } else {
        // End of story
        this.isPlaying = false;
      }
      return;
    }
    
    // Get the current action
    const action = sequence.actions[this.actionIndex];
    
    // Process the action based on type
    switch (action.type) {
      case 'subtitle':
        showSubtitle(action.text);
        this.subtitleActive = true;
        this.actionIndex++;
        this.processNextAction();
        break;
        
      case 'wait':
        this.waitTimer = action.duration;
        // Process next action after timer
        const timerId = setTimeout(() => {
          this.actionIndex++;
          this.processNextAction();
          
          // Clear subtitle if it was active
          if (this.subtitleActive) {
            hideSubtitle();
            this.subtitleActive = false;
          }
        }, action.duration * 1000);
        
        this.timers.push(timerId);
        break;
        
      case 'audio':
        if (this.audio[action.name]) {
          // Stop any playing audio
          Object.values(this.audio).forEach(sound => {
            if (sound.isPlaying) sound.stop();
          });
          
          // Play the requested audio
          this.audio[action.name].play();
        }
        this.actionIndex++;
        this.processNextAction();
        break;
        
      case 'show':
        if (this.characters[action.character]) {
          this.characters[action.character].visible = true;
          
          // Position the character - for reveal, place behind user
          if (this.currentState === 'reveal' && action.character === 'mendy') {
            // This is handled in the updateCharacterPositions function in characters.js
          }
        }
        this.actionIndex++;
        this.processNextAction();
        break;
        
      case 'hide':
        if (this.characters[action.character]) {
          this.characters[action.character].visible = false;
        }
        this.actionIndex++;
        this.processNextAction();
        break;
        
      case 'animation':
        if (this.characters[action.character] && 
            this.characters[action.character].userData.animations) {
          const animations = this.characters[action.character].userData.animations;
          if (animations[action.animation]) {
            // Stop any current animations
            Object.values(animations).forEach(anim => {
              if (anim.isRunning()) anim.stop();
            });
            
            // Play the requested animation
            animations[action.animation].play();
          }
        }
        this.actionIndex++;
        this.processNextAction();
        break;
        
      default:
        console.warn('Unknown action type:', action.type);
        this.actionIndex++;
        this.processNextAction();
    }
  }
  
  update(deltaTime) {
    // Update wait timer for visualization
    if (this.waitTimer > 0) {
      this.waitTimer -= deltaTime;
    }
  }
  
  clearTimers() {
    // Clear all active timers
    this.timers.forEach(id => clearTimeout(id));
    this.timers = [];
  }
  
  reset() {
    // Reset state
    this.clearTimers();
    hideSubtitle();
    this.isPlaying = false;
    this.currentState = 'intro';
    this.actionIndex = 0;
    this.subtitleActive = false;
    
    // Stop all audio
    if (this.audio) {
      Object.values(this.audio).forEach(sound => {
        if (sound.isPlaying) sound.stop();
      });
    }
    
    // Hide all characters
    if (this.characters) {
      Object.values(this.characters).forEach(character => {
        character.visible = false;
      });
    }
  }
}

// Function to set up the story
export function setupStory(characters, audio) {
  return new StoryController(characters, audio);
}

// Function to advance the story
export function advanceStory(storyController, state = null) {
  storyController.start(state || storyController.currentState);
  return storyController;
}