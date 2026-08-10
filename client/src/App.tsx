import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Legacy widget-style dashboard, kept reachable at /dashboard. */}
        <Route path="/dashboard">
          <Dashboard />
        </Route>
        {/* Main chat interface (adaptive scene background + settings). */}
        <Route path="*">
          <Chat />
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}

export default App;
