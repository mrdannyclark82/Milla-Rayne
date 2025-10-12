import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getRecentEmails,
  getEmailContent,
  sendEmail,
} from '@/services/googleGmailService';

export function GmailClient() {
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchEmails = async () => {
    setIsLoading(true);
    const result = await getRecentEmails();
    if (result.success) {
      setEmails(result.data);
    }
    setIsLoading(false);
  };

  const handleFetchEmailContent = async (messageId: string) => {
    setIsLoading(true);
    const result = await getEmailContent(messageId);
    if (result.success) {
      setSelectedEmail(result.data);
    }
    setIsLoading(false);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <i className="fas fa-envelope mr-2 text-red-400"></i>
          Gmail
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleFetchEmails} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Fetch Recent Emails'}
        </Button>
        <div className="space-y-2">
          {emails.map((email) => (
            <div
              key={email.id}
              className="p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out bg-white/5 hover:bg-white/10 border-transparent border-l-4"
              onClick={() => handleFetchEmailContent(email.id)}
            >
              <div className="text-sm font-medium text-white">
                {email.snippet}
              </div>
            </div>
          ))}
        </div>
        {selectedEmail && (
          <div className="p-4 bg-black/20 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">
              {
                selectedEmail.payload.headers.find(
                  (h: any) => h.name === 'Subject'
                )?.value
              }
            </h3>
            <p className="text-sm text-white/80">{selectedEmail.snippet}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
