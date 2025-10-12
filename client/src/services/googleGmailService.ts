export async function getRecentEmails(maxResults: number = 5) {
  const response = await fetch(`/api/gmail/recent?maxResults=${maxResults}`);
  return response.json();
}

export async function getEmailContent(messageId: string) {
  const response = await fetch(`/api/gmail/content?messageId=${messageId}`);
  return response.json();
}

export async function sendEmail(to: string, subject: string, body: string) {
  const response = await fetch('/api/gmail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, subject, body }),
  });
  return response.json();
}
