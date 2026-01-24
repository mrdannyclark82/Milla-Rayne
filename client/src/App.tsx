import { lazy, Suspense } from 'react';

// Lazy load components for better performance
const Chat = lazy(() => import('@/pages/Chat'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading Milla AI...</p>
    </div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Chat />
    </Suspense>
  );
}

export default App;
