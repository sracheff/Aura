import Sidebar from '@/components/sidebar'
import TrialBanner from '@/components/trial-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-luma-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TrialBanner />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
