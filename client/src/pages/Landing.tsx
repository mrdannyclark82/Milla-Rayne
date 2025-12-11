import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import GlowButton from '../components/GlowButton';
import { Input, Textarea, Label } from '../components/FormControls';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-nebula-indigo via-cyber-dark to-nebula-violet">
      <Header />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-nebula-indigo/30 backdrop-blur-sm relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-pink/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-5xl md:text-6xl font-extrabold text-center mb-16 text-white glow-text tracking-tight">
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
                <p className="text-slate-300 leading-relaxed">
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
                <p className="text-slate-300 leading-relaxed">
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
                <p className="text-slate-300 leading-relaxed">
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
                <p className="text-slate-300 leading-relaxed">
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
                <p className="text-slate-300 leading-relaxed">
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
                <p className="text-slate-300 leading-relaxed">
                  Contribute, extend, and customize with full access to the codebase.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-cyber-dark/50 relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-cyber-purple/10 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-extrabold text-center mb-16 text-white glow-text tracking-tight">
              About Milla-Rayne
            </h2>
            
            <Card animated className="mb-8">
              <CardContent>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
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
      <section id="contact" className="py-24 bg-nebula-indigo/30 backdrop-blur-sm relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-extrabold text-center mb-16 text-white glow-text tracking-tight">
              Get In Touch
            </h2>
            
            <Card glow>
              <CardContent>
                <form className="space-y-8">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      className="mt-3"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="mt-3"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us what you think..."
                      className="mt-3"
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
      <footer className="py-8 bg-nebula-indigo/60 backdrop-blur-xl border-t border-cyber-pink/20">
        <div className="container mx-auto px-6">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 Milla-Rayne. Built with ❤️ and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
