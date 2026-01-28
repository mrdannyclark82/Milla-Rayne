import { GmailClient } from './GmailClient';
import { PersonalTasksPanel } from './PersonalTasksPanel';

export function GmailTasksView() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_350px] h-[600px]">
      <GmailClient />
      <PersonalTasksPanel />
    </div>
  );
}
