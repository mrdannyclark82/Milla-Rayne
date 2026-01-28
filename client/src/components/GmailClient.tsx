import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Mail, Search, Star, Inbox, Send, Trash2, Archive, RefreshCw } from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
}

export function GmailClient() {
  const [emails, setEmails] = useState<Email[]>([
    {
      id: '1',
      from: 'GitHub',
      subject: '[GitHub] A new vulnerability was found in your repository',
      preview: 'Dependabot found a new vulnerability in your package-lock.json...',
      date: '10:30 AM',
      isRead: false,
      isStarred: true,
    },
    {
      id: '2',
      from: 'Vercel',
      subject: 'Deployment Succeeded: milla-rayne-app',
      preview: 'The latest deployment to production was successful. View details...',
      date: 'Yesterday',
      isRead: true,
      isStarred: false,
    },
    {
      id: '3',
      from: 'OpenAI',
      subject: 'Updates to our usage policies',
      preview: 'We have updated our usage policies to better reflect our...',
      date: 'Jan 24',
      isRead: true,
      isStarred: false,
    },
  ]);

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'trash'>('inbox');

  return (
    <Card className="bg-black/40 backdrop-blur-lg border border-white/10 h-full flex flex-col">
      <CardHeader className="border-b border-white/10 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-400" />
            Gmail
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input 
            placeholder="Search mail..." 
            className="bg-white/5 border-white/10 pl-9 text-sm text-white placeholder:text-white/30 h-9"
          />
        </div>
      </CardHeader>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-white/10 p-2 space-y-1 hidden md:block">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm ${activeTab === 'inbox' ? 'bg-red-500/10 text-red-300' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('inbox')}
          >
            <Inbox className="w-4 h-4 mr-2" />
            Inbox
            <span className="ml-auto text-xs opacity-60">2</span>
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm ${activeTab === 'sent' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('sent')}
          >
            <Send className="w-4 h-4 mr-2" />
            Sent
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sm text-white/60 hover:text-white hover:bg-white/5">
            <Star className="w-4 h-4 mr-2" />
            Starred
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sm text-white/60 hover:text-white hover:bg-white/5">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sm text-white/60 hover:text-white hover:bg-white/5">
            <Trash2 className="w-4 h-4 mr-2" />
            Trash
          </Button>
        </div>

        {/* Email List */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-white/5">
            {emails.map((email) => (
              <div 
                key={email.id} 
                className={`p-4 hover:bg-white/5 cursor-pointer transition-colors ${!email.isRead ? 'bg-white/[0.02]' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!email.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${!email.isRead ? 'font-semibold text-white' : 'text-white/80'}`}>
                        {email.from}
                      </span>
                      <span className="text-xs text-white/40">{email.date}</span>
                    </div>
                    <h4 className={`text-sm mb-1 ${!email.isRead ? 'font-medium text-white' : 'text-white/70'}`}>
                      {email.subject}
                    </h4>
                    <p className="text-xs text-white/40 line-clamp-1">
                      {email.preview}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-yellow-400 -mt-1">
                    <Star className={`w-4 h-4 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}