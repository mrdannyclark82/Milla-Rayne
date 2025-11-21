import { BaseAgent } from './base';
import { glob } from 'glob';
import fs from 'fs/promises';

class EnhancementSearchAgent extends BaseAgent {
  constructor() {
    super(
      'enhancement',
      'An agent that searches for potential enhancements for the Milla Rayne project.'
    );
  }

  protected async executeInternal(task: string): Promise<string> {
    this.log(`EnhancementSearchAgent received task: ${task}`);
    const keywords = task.split(' ');
    const files = await glob('**/*.md', { ignore: 'node_modules/**' });
    const results: string[] = [];

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          results.push(`Found keyword '${keyword}' in file: ${file}`);
        }
      }
    }

    return results.length > 0 ? results.join('\n') : 'No enhancements found.';
  }
}

export const enhancementSearchAgent = new EnhancementSearchAgent();
