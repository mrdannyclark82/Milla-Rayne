import React, { useState } from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import { ChatView } from './ChatView.js';
import { SandboxView } from './SandboxView.js';
import { TerminalView } from './TerminalView.js';
import { VoiceControl } from './VoiceControl.js';

export type Tab = 'chat' | 'sandbox' | 'terminal';

export const Layout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatView />;
      case 'sandbox':
        return <SandboxView />;
      case 'terminal':
        return <TerminalView />;
      default:
        return <ChatView />;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box flexDirection="column" paddingX={1} borderStyle="single" borderColor="magenta">
        <Gradient name="pastel">
          <BigText text="Milla Rayne" font="simple" />
        </Gradient>
        <Box justifyContent="space-between">
            <Box>
                <TabButton isActive={activeTab === 'chat'} label="Chat (1)" onPress={() => setActiveTab('chat')} />
                <TabButton isActive={activeTab === 'sandbox'} label="Sandbox (2)" onPress={() => setActiveTab('sandbox')} />
                <TabButton isActive={activeTab === 'terminal'} label="Terminal (3)" onPress={() => setActiveTab('terminal')} />
            </Box>
            <VoiceControl />
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box flexGrow={1} borderStyle="round" borderColor="gray" padding={1}>
        {renderContent()}
      </Box>

      {/* Footer / Status Bar */}
      <Box paddingX={1}>
        <Text color="gray">Press 'Ctrl+C' to exit | Use numbers 1-3 to switch tabs</Text>
      </Box>

      {/* Global Input Handler for Tabs */}
      <GlobalInputHandler setActiveTab={setActiveTab} />
    </Box>
  );
};

const TabButton: React.FC<{ isActive: boolean; label: string; onPress: () => void }> = ({ isActive, label }) => {
  return (
    <Box marginRight={2}>
      <Text color={isActive ? 'magenta' : 'white'} bold={isActive} underline={isActive}>
        {label}
      </Text>
    </Box>
  );
};

import { useInput } from 'ink';

const GlobalInputHandler: React.FC<{ setActiveTab: (tab: Tab) => void }> = ({ setActiveTab }) => {
  useInput((input, key) => {
    if (input === '1') setActiveTab('chat');
    if (input === '2') setActiveTab('sandbox');
    if (input === '3') setActiveTab('terminal');
  });
  return null;
};
