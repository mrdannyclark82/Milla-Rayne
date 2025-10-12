import React from 'react';
import { render, screen } from '@testing-library/react';
import { SceneProvider } from '@/components/scene/SceneProvider';
import { useSceneContext } from '@/contexts/SceneContext';

// Mock the layers to avoid complex rendering logic
vi.mock('@/components/scene/BackgroundLayer', () => ({ BackgroundLayer: () => <div data-testid="background-layer" /> }));
vi.mock('@/components/scene/AmbientGradientLayer', () => ({ AmbientGradientLayer: () => <div data-testid="gradient-layer" /> }));
vi.mock('@/components/scene/ParallaxLayer', () => ({ ParallaxLayer: () => <div data-testid="parallax-layer" /> }));
vi.mock('@/components/scene/WeatherLayer', () => ({ WeatherLayer: () => <div data-testid="weather-layer" /> }));

const TestComponent = () => {
  const context = useSceneContext();
  return <div data-testid="context-dump">{JSON.stringify(context)}</div>;
};

describe('Visual Enhancements Integration', () => {
  it('SceneProvider should render all layers', () => {
    render(
      <SceneProvider location="living_room" weatherEffect="rain">
        <div />
      </SceneProvider>
    );

    expect(screen.getByTestId('background-layer')).toBeInTheDocument();
    expect(screen.getByTestId('gradient-layer')).toBeInTheDocument();
    expect(screen.getByTestId('parallax-layer')).toBeInTheDocument();
    expect(screen.getByTestId('weather-layer')).toBeInTheDocument();
  });

  it('SceneProvider should provide the correct context', () => {
    render(
      <SceneProvider location="kitchen" weatherEffect="snow" appState="speaking" performanceMode="performance">
        <TestComponent />
      </SceneProvider>
    );

    const contextDump = screen.getByTestId('context-dump').textContent;
    const context = JSON.parse(contextDump || '{}');

    expect(context.location).toBe('kitchen');
    expect(context.weatherEffect).toBe('snow');
    expect(context.appState).toBe('speaking');
    expect(context.performanceMode).toBe('performance');
  });
});
