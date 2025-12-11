import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import GlowButton from '../components/GlowButton';
import { Input, Textarea, Label } from '../components/FormControls';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-cyber-darker">
      <Header />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-20 bg-cyber-dark/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-high-contrast glow-text text-cyber-pink">
            Powerful Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card glow>
              <CardHeader>
                <CardTitle>Multi-Platform</CardTitle>
                <CardDescription>
                  Access from web, mobile, or command line
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Seamlessly switch between devices with synchronized conversations and context.
                </p>
              </CardContent>
            </Card>

            <Card glow>
              <CardHeader>
                <CardTitle>Context-Aware</CardTitle>
                <CardDescription>
                  Remembers your preferences and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Deep understanding of your needs through continuous learning and adaptation.
                </p>
              </CardContent>
            </Card>

            <Card glow>
              <CardHeader>
                <CardTitle>Voice Enabled</CardTitle>
                <CardDescription>
                  Natural voice interaction with TTS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Talk naturally with high-quality voice synthesis and recognition.
                </p>
              </CardContent>
            </Card>

            <Card glow>
              <CardHeader>
                <CardTitle>Rich Media</CardTitle>
                <CardDescription>
                  Images, videos, and interactive content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Share and explore multimedia content together in an immersive experience.
                </p>
              </CardContent>
            </Card>

            <Card glow>
              <CardHeader>
                <CardTitle>Customizable</CardTitle>
                <CardDescription>
                  Tailor the experience to your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Choose from multiple AI models, voices, and appearance settings.
                </p>
              </CardContent>
            </Card>

            <Card glow>
              <CardHeader>
                <CardTitle>Open Source</CardTitle>
                <CardDescription>
                  Built with transparency and community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Contribute, extend, and customize with full access to the codebase.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-cyber-darker">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-high-contrast glow-text text-cyber-pink">
              About Milla-Rayne
            </h2>
            
            <Card animated className="mb-8">
              <CardContent>
                <p className="text-slate-300 text-lg leading-relaxed mb-4">
                  Milla-Rayne is a sophisticated, context-aware AI assistant designed for rich, 
                  personal interaction. Built as a full-stack monorepo with a clear separation 
                  between client, server, and shared components, it offers multiple ways to 
                  connect and engage.
                </p>
                <p className="text-slate-300 text-lg leading-relaxed">
                  With support for multiple AI providers, voice interaction, and immersive 
                  scenes, Milla-Rayne creates a unique companionship experience that adapts 
                  to your needs and preferences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-cyber-dark/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-high-contrast glow-text text-cyber-pink">
              Get In Touch
            </h2>
            
            <Card glow>
              <CardContent>
                <form className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us what you think..."
                      className="mt-2"
                      rows={5}
                    />
                  </div>

                  <div className="flex justify-end">
                    <GlowButton type="submit" variant="pink" size="lg">
                      Send Message
                    </GlowButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-cyber-darker border-t border-cyber-pink/20">
        <div className="container mx-auto px-4">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 Milla-Rayne. Built with ❤️ and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
