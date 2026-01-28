import React from 'react';

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell - A wrapper component that preserves existing routes and functionality
 * while providing a consistent shell for the application.
 * This component is intentionally minimal to avoid breaking existing navigation.
 */
const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="app-shell">
      {children}
    </div>
  );
};

AppShell.displayName = 'AppShell';

export default AppShell;
