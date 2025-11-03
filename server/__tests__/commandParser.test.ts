import { parseCommand } from '../commandParser';

describe('commandParser', () => {
  it('should parse "my name is" command', () => {
    const command = 'my name is John Doe';
    const parsed = parseCommand(command);
    expect(parsed.service).toBe('profile');
    expect(parsed.action).toBe('update');
    expect(parsed.entities.name).toBe('John Doe');
  });

  it('should parse "i like" command', () => {
    const command = 'i like AI';
    const parsed = parseCommand(command);
    expect(parsed.service).toBe('profile');
    expect(parsed.action).toBe('update');
    expect(parsed.entities.interest).toBe('AI');
  });
});
