import { parseCommand } from '../commandParser';

describe('commandParser', () => {
  it('should parse "my name is" command', async () => {
    const command = 'my name is John Doe';
    const parsed = await parseCommand(command);
    expect(parsed.service).toBe('profile');
    expect(parsed.action).toBe('update');
    expect(parsed.entities.name).toBe('John Doe');
  });

  it('should parse "i like" command', async () => {
    const command = 'i like AI';
    const parsed = await parseCommand(command);
    expect(parsed.service).toBe('profile');
    expect(parsed.action).toBe('update');
    expect(parsed.entities.interest).toBe('AI');
  });
});
