import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import RayneShell from '@/rayne-shell/RayneShell';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Immersive 3D Rayne Shell is now the main default landing UI! */}
        <Route path="/">
          <RayneShell />
        </Route>
        {/* Legacy widget-style dashboard, kept reachable at /dashboard. */}
        <Route path="/dashboard">
          <Dashboard />
        </Route>
        {/* Main chat interface, kept reachable at /chat. */}
        <Route path="/chat">
          <Chat />
        </Route>
        {/* All other routes fallback to the immersive 3D Rayne Shell. */}
        <Route path="*">
          <RayneShell />
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}

export default App;
