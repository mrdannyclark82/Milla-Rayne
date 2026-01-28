export type SceneLocation = 'living room' | 'kitchen' | 'bedroom' | 'office' | 'outside' | 'unknown';

class SceneService {
  private location: SceneLocation = 'living room';
  private mood: string = 'calm';
  private updatedAt: number = Date.now();

  getSceneContext() {
    return {
      location: this.location,
      mood: this.mood,
      updatedAt: this.updatedAt,
    };
  }

  updateScene(location: SceneLocation, mood: string) {
    this.location = location;
    this.mood = mood;
    this.updatedAt = Date.now();
  }

  getLocation() {
    return this.location;
  }

  getMood() {
    return this.mood;
  }
}

export const sceneService = new SceneService();
