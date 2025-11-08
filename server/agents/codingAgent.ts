import { Agent } from './base';

class CodingAgent implements Agent {
  name = 'coding';
  description = 'An agent that can write and understand code.';

  async execute(task: string): Promise<string> {
    console.log(`CodingAgent received task: ${task}`);
    // In the future, this could be a call to a code generation model
    return `I have received the coding task: '${task}'. I will work on it.`;
  }
}

export const codingAgent = new CodingAgent();
