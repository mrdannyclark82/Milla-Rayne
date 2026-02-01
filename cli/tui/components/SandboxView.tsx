import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, Newline } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

export const SandboxView: React.FC = () => {
  const [mode, setMode] = useState<'list' | 'details' | 'create' | 'feature_action'>('list');
  const [sandboxes, setSandboxes] = useState<any[]>([]);
  const [selectedSandbox, setSelectedSandbox] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [formStep, setFormStep] = useState(0);

  useEffect(() => {
    fetchSandboxes();
  }, []);

  const fetchSandboxes = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/sandboxes`);
      if (res.data.success) {
        setSandboxes(res.data.sandboxes);
      }
    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSandboxSelect = (item: any) => {
    if (item.value === 'create_new') {
        setMode('create');
        setFormStep(0);
        setNewName('');
        setNewDesc('');
    } else {
        setSelectedSandbox(item.original);
        setMode('details');
        setActionOutput(null);
    }
  };

  const handleFeatureSelect = (item: any) => {
    setSelectedFeature(item.original);
    setMode('feature_action');
    setActionOutput(null);
  };

  const handleActionSelect = async (item: any) => {
      const action = item.value;

      if (action === 'back') {
          setMode('details');
          return;
      }

      setIsLoading(true);
      setActionOutput(null);

      try {
          if (action === 'test') {
              const res = await axios.post(`${API_BASE_URL}/api/sandboxes/${selectedSandbox.id}/features/${selectedFeature.id}/test`, {
                  testType: 'unit'
              });
              const result = res.data;
              setActionOutput(
                  `Test Result: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n` +
                  `Duration: ${result.duration.toFixed(2)}ms\n` +
                  `Details: ${result.details}`
              );
              // Refresh sandbox data to show updated stats
              await fetchSandboxes();
              // Update local selected sandbox reference
              const updated = sandboxes.find(s => s.id === selectedSandbox.id);
              if (updated) setSelectedSandbox(updated);
          }
          else if (action === 'approve') {
              const res = await axios.post(`${API_BASE_URL}/api/sandboxes/${selectedSandbox.id}/features/${selectedFeature.id}/approve`);
              if (res.data.success) {
                  setActionOutput('✅ Feature approved successfully!');
                   // Refresh
                  await fetchSandboxes();
                  const updated = sandboxes.find(s => s.id === selectedSandbox.id);
                  if (updated) setSelectedSandbox(updated);
              }
          }
      } catch (e: any) {
          setActionOutput(`❌ Error: ${e.message}`);
      } finally {
          setIsLoading(false);
      }
  };

  const handleCreateSubmit = async () => {
    if (formStep === 0) {
        setFormStep(1);
        return;
    }

    setIsLoading(true);
    try {
        const res = await axios.post(`${API_BASE_URL}/api/sandboxes`, {
            name: newName,
            description: newDesc,
            createdBy: 'user'
        });
        if (res.data.success) {
            await fetchSandboxes();
            setMode('list');
        }
    } catch (e: any) {
        setError(e.message);
        setMode('list');
    } finally {
        setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (mode === 'details' && (key.escape || input === 'b')) {
        setMode('list');
    }
    if (mode === 'create' && key.escape) {
        setMode('list');
    }
    if (mode === 'feature_action' && (key.escape || input === 'b')) {
        setMode('details');
    }
  });

  if (isLoading && mode === 'list') {
      return <Text><Spinner type="dots" /> Loading sandboxes...</Text>;
  }

  // --- CREATE MODE ---
  if (mode === 'create') {
      return (
          <Box flexDirection="column" padding={1} borderStyle="single">
              <Text bold>Create New Sandbox</Text>
              <Box marginY={1}>
                  <Text>Name: </Text>
                  {formStep === 0 ? (
                    <TextInput value={newName} onChange={setNewName} onSubmit={handleCreateSubmit} />
                  ) : (
                    <Text color="green">{newName}</Text>
                  )}
              </Box>
              {formStep === 1 && (
                  <Box>
                    <Text>Description: </Text>
                    <TextInput value={newDesc} onChange={setNewDesc} onSubmit={handleCreateSubmit} />
                  </Box>
              )}
              <Text color="gray" marginTop={1}>Press Enter to confirm, Esc to cancel</Text>
          </Box>
      );
  }

  // --- DETAILS MODE (Feature List) ---
  if (mode === 'details' && selectedSandbox) {
      const featureItems = selectedSandbox.features.map((f: any) => ({
          label: `${f.status === 'approved' ? '✅' : f.status === 'testing' ? '🚧' : '📝'} ${f.name}`,
          value: f.id,
          original: f
      }));

      if (featureItems.length === 0) {
          featureItems.push({ label: '(No features yet)', value: 'none', original: null });
      }

      return (
          <Box flexDirection="column" padding={1}>
              <Text bold color="magenta">{selectedSandbox.name}</Text>
              <Text italic>{selectedSandbox.description}</Text>
              <Box marginY={1} borderStyle="single" paddingX={1}>
                  <Text>Status: {selectedSandbox.status} | Branch: {selectedSandbox.branchName}</Text>
              </Box>

              <Text underline marginBottom={1}>Features (Select to manage):</Text>
              <SelectInput items={featureItems} onSelect={handleFeatureSelect} />

              <Text color="gray" marginTop={2}>Press 'b' or Esc to go back</Text>
          </Box>
      );
  }

  // --- FEATURE ACTION MODE ---
  if (mode === 'feature_action' && selectedFeature) {
      if (isLoading) {
          return <Text><Spinner type="dots" /> Processing...</Text>;
      }

      const actions = [
          { label: '🧪 Run Tests', value: 'test' },
          { label: '✅ Approve Feature', value: 'approve' },
          { label: '⬅️ Back to Sandbox', value: 'back' }
      ];

      return (
          <Box flexDirection="column" padding={1}>
              <Text bold color="cyan">Feature: {selectedFeature.name}</Text>
              <Text>{selectedFeature.description}</Text>
              <Box marginY={1}>
                  <Text>Status: {selectedFeature.status}</Text>
                  <Text> | Tests Passed: {selectedFeature.testsPassed || 0}</Text>
                  <Text> | Tests Failed: {selectedFeature.testsFailed || 0}</Text>
              </Box>

              <Box borderStyle="round" padding={1} marginY={1}>
                <SelectInput items={actions} onSelect={handleActionSelect} />
              </Box>

              {actionOutput && (
                  <Box borderStyle="single" borderColor="green" padding={1} flexDirection="column">
                      <Text>{actionOutput}</Text>
                  </Box>
              )}
          </Box>
      );
  }

  // --- LIST MODE ---
  const items = sandboxes.map(s => ({
      label: s.name + (s.createdBy === 'milla' ? ' (AI)' : ''),
      value: s.id,
      original: s
  }));

  items.unshift({ label: '+ Create New Sandbox', value: 'create_new', original: null });

  return (
    <Box flexDirection="column">
        <Text bold underline marginBottom={1}>Active Sandboxes</Text>
        <SelectInput items={items} onSelect={handleSandboxSelect} />
        {error && <Text color="red">{error}</Text>}
    </Box>
  );
};
