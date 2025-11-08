export interface Agent {
  name: string;
  description: string;
  execute(task: string): Promise<string>;
}
