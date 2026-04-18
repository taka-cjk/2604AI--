import { Sidebar } from "@/components/layout/Sidebar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
