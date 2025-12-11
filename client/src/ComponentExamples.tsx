/**
 * Example: Using the New Cyber-Romantic UI Components
 * 
 * This file demonstrates how to use the newly added components
 * in the Milla-Rayne application.
 */

import React from 'react';
import AppShell from './AppShell';
import Header from './components/Header';
import Hero from './components/Hero';
import GlowButton from './components/GlowButton';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/Card';
import { Input, Textarea, Label, Checkbox, Select } from './components/FormControls';
import Landing from './pages/Landing';

/**
 * Example 1: Using AppShell
 * The AppShell is a minimal wrapper that preserves existing routes
 */
export function AppShellExample() {
  return (
    <AppShell>
      {/* Your existing app content goes here */}
      <div>Your content</div>
    </AppShell>
  );
}

/**
 * Example 2: Using the Landing Page
 * The Landing page is a complete, responsive landing experience
 */
export function LandingExample() {
  return <Landing />;
}

/**
 * Example 3: Using GlowButton
 * GlowButton provides cyber-romantic styled buttons with glow effects
 */
export function GlowButtonExample() {
  return (
    <div className="space-y-4 p-8 bg-cyber-dark">
      {/* Pink variant (default) */}
      <GlowButton variant="pink" size="lg">
        Get Started
      </GlowButton>

      {/* Blue variant */}
      <GlowButton variant="blue" size="md">
        Learn More
      </GlowButton>

      {/* Purple variant */}
      <GlowButton variant="purple" size="sm">
        Contact Us
      </GlowButton>

      {/* Without glow effect */}
      <GlowButton variant="pink" glow={false}>
        No Glow
      </GlowButton>
    </div>
  );
}

/**
 * Example 4: Using Card Components
 * Card components provide themed containers with optional glow effects
 */
export function CardExample() {
  return (
    <div className="p-8 bg-cyber-darker">
      {/* Basic card with glow */}
      <Card glow className="mb-4">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>A description of this card</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300">
            This is the main content of the card. It can contain any React elements.
          </p>
        </CardContent>
        <CardFooter>
          <GlowButton variant="pink" size="sm">
            Action
          </GlowButton>
        </CardFooter>
      </Card>

      {/* Animated card */}
      <Card animated>
        <CardContent>
          <p className="text-slate-300">
            This card has an animated background glow effect.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Example 5: Using Form Controls
 * Form controls with focus-visible states and glow effects
 */
export function FormControlsExample() {
  return (
    <div className="p-8 bg-cyber-darker max-w-md">
      <form className="space-y-6">
        {/* Input with glow */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="mt-2"
          />
        </div>

        {/* Textarea */}
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Your message..."
            className="mt-2"
            rows={4}
          />
        </div>

        {/* Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms">I agree to the terms</Label>
        </div>

        {/* Select */}
        <div>
          <Label htmlFor="option">Choose an option</Label>
          <Select id="option" className="mt-2">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
          </Select>
        </div>

        {/* Submit button */}
        <GlowButton type="submit" variant="pink" size="lg" className="w-full">
          Submit
        </GlowButton>
      </form>
    </div>
  );
}

/**
 * Example 6: Using Header
 * The Header component provides navigation and branding
 */
export function HeaderExample() {
  return <Header />;
}

/**
 * Example 7: Using Hero
 * The Hero component is a full-screen landing section
 */
export function HeroExample() {
  return <Hero />;
}

/**
 * Example 8: Custom Styling with Tailwind Classes
 * All components accept additional className props for customization
 */
export function CustomStylingExample() {
  return (
    <div className="p-8 bg-cyber-darker">
      <Card glow className="max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="text-neon-blue">Custom Styled Card</CardTitle>
          <CardDescription className="text-slate-400">
            With custom colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Custom input"
            className="border-neon-blue focus:ring-neon-blue"
          />
        </CardContent>
        <CardFooter>
          <GlowButton variant="blue" className="w-full">
            Custom Button
          </GlowButton>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Example 9: Using CSS Classes from glow.css
 * The glow.css file provides utility classes for glow effects
 */
export function GlowCSSExample() {
  return (
    <div className="p-8 bg-cyber-darker space-y-6">
      {/* Text glow */}
      <h1 className="glow-text text-cyber-pink text-4xl">
        Glowing Text
      </h1>

      {/* Button with custom glow */}
      <button className="btn-glow-pink px-6 py-3 rounded-lg text-white font-medium">
        Custom Glow Button
      </button>

      {/* Card with glow */}
      <div className="card-glow p-6 rounded-lg">
        <h3 className="text-high-contrast text-xl mb-2">Glow Card</h3>
        <p className="text-slate-300">Using CSS utility classes</p>
      </div>

      {/* Input with glow */}
      <input
        type="text"
        className="input-glow w-full px-4 py-2 rounded-lg text-white"
        placeholder="Input with glow"
      />

      {/* Animated glow */}
      <div className="glow-pulse p-6 rounded-lg bg-cyber-dark/80">
        <p className="text-high-contrast">This element has a pulsing glow</p>
      </div>
    </div>
  );
}

/**
 * Example 10: Responsive Layout
 * All components are responsive and work well on mobile
 */
export function ResponsiveExample() {
  return (
    <div className="min-h-screen bg-cyber-darker">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Grid that collapses on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card glow>
            <CardHeader>
              <CardTitle>Responsive Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                This grid collapses to single column on mobile
              </p>
            </CardContent>
          </Card>

          <Card glow>
            <CardHeader>
              <CardTitle>Responsive Card 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Two columns on tablet
              </p>
            </CardContent>
          </Card>

          <Card glow>
            <CardHeader>
              <CardTitle>Responsive Card 3</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Three columns on desktop
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default {
  AppShellExample,
  LandingExample,
  GlowButtonExample,
  CardExample,
  FormControlsExample,
  HeaderExample,
  HeroExample,
  CustomStylingExample,
  GlowCSSExample,
  ResponsiveExample,
};
