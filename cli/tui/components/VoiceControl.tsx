import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export const VoiceControl: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  useInput((input, key) => {
    if (input === 'v') {
      setEnabled(!enabled);
    }
  });

  return (
    <Box>
      <Text color={enabled ? 'green' : 'gray'}>
        {enabled ? '🎙 ON' : '🎙 OFF'} (Press 'v')
      </Text>
    </Box>
  );
};
