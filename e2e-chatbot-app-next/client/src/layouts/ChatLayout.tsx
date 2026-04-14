import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useSession } from '@/contexts/SessionContext';
import { DatabricksLogo } from '@/components/DatabricksLogo';
import { DbIcon } from '@/components/ui/db-icon';
import { UserKeyIconIcon } from '@/components/icons';

export default function ChatLayout() {
  const { session, loading } = useSession();
  const isCollapsed = localStorage.getItem('sidebar:state') !== 'true';

  // Wait for session to load
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // No guest mode - redirect if no session
  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary">
        <div className="flex flex-col items-center gap-6">
          <DatabricksLogo height={20} />
          <div className="second-brain-panel flex w-80 flex-col items-center gap-4 rounded-[24px] p-10">
            <DbIcon icon={UserKeyIconIcon} size={32} color="muted" />
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h3>Unlock Second Brain</h3>
              <p className="text-muted-foreground">
                Authenticate with Databricks to open your research workspace.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get preferred username from session (if available from headers)
  const preferredUsername = session.user.preferredUsername ?? null;

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session.user} preferredUsername={preferredUsername} />
      <SidebarInset className="h-svh overflow-hidden bg-background">
        <div className="flex flex-1 flex-col overflow-hidden bg-background md:mr-4 md:mt-3 md:rounded-[28px] second-brain-surface">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
