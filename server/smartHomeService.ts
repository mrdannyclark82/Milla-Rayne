import { config } from './config';
import { SceneLocation, TimeOfDay } from '../shared/sceneTypes';

export interface SmartHomeSensorData {
  lightLevel: 'dark' | 'dim' | 'normal' | 'bright';
  temperature: number; // in Celsius
  motionDetected: boolean;
  // Add more sensor data as needed
}

/**
 * Fetches mock smart home sensor data.
 * In a real implementation, this would connect to a smart home API.
 */
export async function getSmartHomeSensorData(): Promise<SmartHomeSensorData | null> {
  if (!config.smartHome.enableIntegration) {
    return null;
  }

  // For now, return mock data
  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;

  return {
    lightLevel: isNight ? 'dark' : 'normal',
    temperature: 22, // degrees Celsius
    motionDetected: Math.random() > 0.5, // Random motion detection
  };
}

/**
 * Maps smart home sensor data to Milla's SceneContext.
 */
export function mapSensorDataToSceneContext(sensorData: SmartHomeSensorData): {
  location?: SceneLocation;
  timeOfDay?: TimeOfDay;
} {
  const mappedContext: { location?: SceneLocation; timeOfDay?: TimeOfDay } = {};

  // Map light level to time of day
  if (sensorData.lightLevel === 'dark') {
    mappedContext.timeOfDay = 'night';
  } else if (sensorData.lightLevel === 'dim') {
    mappedContext.timeOfDay = 'dusk';
  } else if (sensorData.lightLevel === 'bright') {
    mappedContext.timeOfDay = 'day';
  }

  // Example: Map motion detection to a potential location change (simplified)
  if (sensorData.motionDetected) {
    // In a real scenario, this would be more sophisticated, e.g., motion in kitchen -> kitchen scene
    // For now, we'll just log it.
    console.log(
      'Motion detected in smart home, potentially indicating scene change.'
    );
  }

  return mappedContext;
}
