import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Publishing Engine',
  robots: 'noindex, nofollow',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <nav className="flex items-center gap-6 text-sm">
            <a href="/admin" className="font-semibold">
              Publishing Engine
            </a>
            <a href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              Content
            </a>
            <a href="/admin/import" className="text-muted-foreground hover:text-foreground transition-colors">
              Import
            </a>
            <a href="/admin/settings" className="text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </a>
          </nav>
        </div>
      </header>
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}
