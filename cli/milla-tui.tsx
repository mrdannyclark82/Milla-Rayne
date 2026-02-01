#!/usr/bin/env node
/**
 * Milla TUI - Terminal User Interface for Milla Rayne
 *
 * A rich interactive terminal interface built with React and Ink.
 */

import React from 'react';
import { render } from 'ink';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Layout } from './tui/components/Layout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

const MillaTUI = () => {
    return <Layout />;
};

// Clear screen on start for a clean look
console.clear();

const { waitUntilExit } = render(<MillaTUI />);

waitUntilExit().catch((err) => {
    console.error('Error running Milla TUI:', err);
    process.exit(1);
});
