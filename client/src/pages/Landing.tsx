import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-6">
          Welcome to Milla
        </h1>
        <p className="text-purple-100 mb-8 text-lg">
          Your AI companion with adaptive personality modes
        </p>
        <Button 
          onClick={() => window.location.href = "/api/login"}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          data-testid="button-login"
        >
          Log In to Continue
        </Button>
      </div>
    </div>
  );
}