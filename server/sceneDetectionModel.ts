import * as tf from '@tensorflow/tfjs';
import { SmartHomeSensorData } from './smartHomeService';
import { ProjectedState } from './sceneDetectionService';
import path from 'path';
import fs from 'fs';

// Define the states we want to classify
export const STATES: ProjectedState[] = [
  'sleeping',
  'cooking',
  'exercising',
  'active',
  'working',
  'relaxing',
  'away',
  'unknown',
];

// Define known locations for one-hot encoding
export const LOCATIONS = [
  'living_room',
  'bedroom',
  'kitchen',
  'bathroom',
  'workspace',
  'outdoor',
  'dining_room',
  'front_door',
  'car',
  'guest_room',
  'unknown',
];

export interface TrainingData {
  input: SmartHomeSensorData;
  label: ProjectedState;
}

export class SceneDetectionModel {
  private model: tf.Sequential;
  private isTrained: boolean = false;
  private readonly NUM_LOCATIONS = LOCATIONS.length;
  // Features:
  // 1. Hour (normalized 0-1)
  // 2. IsNight (0 or 1)
  // 3. Motion Detected (0 or 1)
  // 4. Motion Level (0-1)
  // 5. Presence (0 or 1)
  // 6..N. Location (One-hot encoded)
  private readonly INPUT_SHAPE = 5 + this.NUM_LOCATIONS;

  constructor() {
    this.model = this.createModel();
  }

  private createModel(): tf.Sequential {
    const model = tf.sequential();

    model.add(
      tf.layers.dense({
        units: 32,
        activation: 'relu',
        inputShape: [this.INPUT_SHAPE],
      })
    );

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(
      tf.layers.dense({
        units: 16,
        activation: 'relu',
      })
    );

    model.add(
      tf.layers.dense({
        units: STATES.length,
        activation: 'softmax',
      })
    );

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Preprocesses a single sensor data point into a tensor-ready array
   */
  private preprocess(data: SmartHomeSensorData): number[] {
    const date = new Date(data.timestamp);
    const hour = date.getHours();
    const normalizedHour = hour / 24;
    const isNight = hour >= 22 || hour < 6 ? 1 : 0;

    // One-hot encode location
    const locationIndex = LOCATIONS.indexOf(data.location as string);
    const locationVector = new Array(this.NUM_LOCATIONS).fill(0);
    if (locationIndex !== -1) {
      locationVector[locationIndex] = 1;
    } else {
      // If unknown location, mark the 'unknown' slot (last one usually) or just leave all 0 if truly unknown/unexpected
      const unknownIndex = LOCATIONS.indexOf('unknown');
      if (unknownIndex !== -1) locationVector[unknownIndex] = 1;
    }

    return [
      normalizedHour,
      isNight,
      data.motion.detected ? 1 : 0,
      data.motion.level,
      data.presence ? 1 : 0,
      ...locationVector,
    ];
  }

  /**
   * Train the model with provided data
   */
  async train(data: TrainingData[], epochs: number = 50): Promise<tf.History> {
    console.log(
      `[SceneModel] Starting training with ${data.length} samples...`
    );

    const xs = tf.tensor2d(data.map((d) => this.preprocess(d.input)));

    const ys = tf.tensor2d(
      data.map((d) => {
        const index = STATES.indexOf(d.label);
        const vector = new Array(STATES.length).fill(0);
        if (index !== -1) vector[index] = 1;
        return vector;
      })
    );

    const history = await this.model.fit(xs, ys, {
      epochs,
      shuffle: true,
      validationSplit: 0.1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(
              `[SceneModel] Epoch ${epoch}: loss=${logs?.loss.toFixed(4)}, acc=${logs?.acc.toFixed(4)}`
            );
          }
        },
      },
    });

    xs.dispose();
    ys.dispose();

    this.isTrained = true;
    console.log('[SceneModel] Training complete.');
    return history;
  }

  /**
   * Predict state from sensor data
   */
  predict(sensorData: SmartHomeSensorData): {
    state: ProjectedState;
    confidence: number;
  } {
    if (!this.isTrained) {
      console.warn('[SceneModel] Model not trained, returning unknown.');
      return { state: 'unknown', confidence: 0 };
    }

    return tf.tidy(() => {
      const input = tf.tensor2d([this.preprocess(sensorData)]);
      const prediction = this.model.predict(input) as tf.Tensor;
      const values = prediction.dataSync();

      let maxProb = -1;
      let maxIndex = -1;

      for (let i = 0; i < values.length; i++) {
        if (values[i] > maxProb) {
          maxProb = values[i];
          maxIndex = i;
        }
      }

      return {
        state: STATES[maxIndex],
        confidence: maxProb,
      };
    });
  }

  /**
   * Save model to file system (Custom IO Handler for Node.js without tfjs-node)
   */
  async save(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      await this.model.save(
        tf.io.withSaveHandler(async (artifacts) => {
          const modelJson = {
            modelTopology: artifacts.modelTopology,
            format: artifacts.format,
            generatedBy: artifacts.generatedBy,
            convertedBy: artifacts.convertedBy,
            weightsManifest: [
              {
                paths: ['./weights.bin'],
                weights: artifacts.weightSpecs,
              },
            ],
          };

          fs.writeFileSync(
            path.join(dirPath, 'model.json'),
            JSON.stringify(modelJson, null, 2)
          );

          if (artifacts.weightData) {
            // Fix: Handle WeightData type (ArrayBuffer | ArrayBuffer[])
            let buffer: Buffer;
            let byteLength: number = 0;

            if (Array.isArray(artifacts.weightData)) {
              // If it's an array of ArrayBuffers, concatenate them
              buffer = Buffer.concat(
                artifacts.weightData.map((ab) => Buffer.from(ab))
              );
              byteLength = artifacts.weightData.reduce(
                (acc, b) => acc + b.byteLength,
                0
              );
            } else {
              buffer = Buffer.from(artifacts.weightData);
              byteLength = artifacts.weightData.byteLength;
            }

            fs.writeFileSync(path.join(dirPath, 'weights.bin'), buffer);

            return {
              modelArtifactsInfo: {
                dateSaved: new Date(),
                modelTopologyType: 'JSON',
                weightDataBytes: byteLength,
              },
            };
          }

          return {
            modelArtifactsInfo: {
              dateSaved: new Date(),
              modelTopologyType: 'JSON',
              weightDataBytes: 0,
            },
          };
        })
      );
      console.log(`[SceneModel] Model saved to ${dirPath}`);
    } catch (error) {
      console.error('[SceneModel] Failed to save model:', error);
      throw error;
    }
  }

  /**
   * Load model from file system (Custom IO Handler for Node.js without tfjs-node)
   */
  async load(dirPath: string): Promise<boolean> {
    const modelJsonPath = path.resolve(dirPath, 'model.json');
    const weightsPath = path.resolve(dirPath, 'weights.bin');

    if (!fs.existsSync(modelJsonPath) || !fs.existsSync(weightsPath)) {
      return false;
    }

    try {
      const handler: tf.io.IOHandler = {
        load: async () => {
          const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
          const weightsBuffer = fs.readFileSync(weightsPath);
          // Convert Buffer to ArrayBuffer
          const weightData = weightsBuffer.buffer.slice(
            weightsBuffer.byteOffset,
            weightsBuffer.byteOffset + weightsBuffer.byteLength
          ) as ArrayBuffer;

          return {
            modelTopology: modelJson.modelTopology,
            weightSpecs: modelJson.weightsManifest[0].weights,
            weightData: weightData,
          };
        },
      };

      // Fix: Cast Loaded Model to Sequential (since we saved a Sequential one)
      this.model = (await tf.loadLayersModel(handler)) as tf.Sequential;

      // Recompile needed after loading
      this.model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
      });

      this.isTrained = true;
      console.log(`[SceneModel] Model loaded from ${dirPath}`);
      return true;
    } catch (error) {
      console.error('[SceneModel] Failed to load model:', error);
      return false;
    }
  }
}
