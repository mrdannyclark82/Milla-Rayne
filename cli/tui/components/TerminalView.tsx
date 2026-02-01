import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { spawn } from 'child_process';

interface TerminalLine {
    type: 'command' | 'stdout' | 'stderr' | 'info';
    content: string;
}

export const TerminalView: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
      { type: 'info', content: 'Milla Terminal Wrapper v1.0' },
      { type: 'info', content: 'Type a command and press Enter.' }
  ]);
  const [cwd, setCwd] = useState(process.cwd());
  const [isRunning, setIsRunning] = useState(false);

  const handleCommand = () => {
    if (!input.trim() || isRunning) return;

    const cmdString = input.trim();
    setHistory(prev => [...prev, { type: 'command', content: `${cwd} $ ${cmdString}` }]);
    setInput('');

    // Handle 'cd' manually because it affects the process environment for future commands
    if (cmdString.startsWith('cd ')) {
        const target = cmdString.substring(3).trim();
        try {
            process.chdir(target);
            setCwd(process.cwd());
        } catch (err: any) {
            setHistory(prev => [...prev, { type: 'stderr', content: err.message }]);
        }
        return;
    }

    setIsRunning(true);

    // Pass the full command string to spawn with shell: true
    // This allows the shell to handle argument parsing (quotes, spaces, etc.)
    try {
        const child = spawn(cmdString, [], { cwd, shell: true });

        child.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            setHistory(prev => [
                ...prev,
                ...lines.filter((l: string) => l).map((l: string) => ({ type: 'stdout', content: l } as TerminalLine))
            ]);
        });

        child.stderr.on('data', (data) => {
            const lines = data.toString().split('\n');
            setHistory(prev => [
                ...prev,
                ...lines.filter((l: string) => l).map((l: string) => ({ type: 'stderr', content: l } as TerminalLine))
            ]);
        });

        child.on('close', (code) => {
            setIsRunning(false);
            if (code !== 0) {
                 setHistory(prev => [...prev, { type: 'info', content: `Process exited with code ${code}` }]);
            }
        });

        child.on('error', (err) => {
             setIsRunning(false);
             setHistory(prev => [...prev, { type: 'stderr', content: `Failed to start process: ${err.message}` }]);
        });

    } catch (e: any) {
        setIsRunning(false);
        setHistory(prev => [...prev, { type: 'stderr', content: `Error: ${e.message}` }]);
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box flexGrow={1} flexDirection="column" justifyContent="flex-end" overflow="hidden">
        {history.slice(-20).map((line, i) => (
            <Box key={i}>
                <Text
                    color={
                        line.type === 'command' ? 'yellow' :
                        line.type === 'stderr' ? 'red' :
                        line.type === 'info' ? 'blue' : 'white'
                    }
                >
                    {line.content}
                </Text>
            </Box>
        ))}
      </Box>

      <Box borderStyle="single" borderColor={isRunning ? 'red' : 'yellow'} paddingX={1}>
        <Text color={isRunning ? 'red' : 'yellow'}>$ </Text>
        {isRunning ? (
             <Text color="gray">Running...</Text>
        ) : (
            <TextInput value={input} onChange={setInput} onSubmit={handleCommand} />
        )}
      </Box>
    </Box>
  );
};
