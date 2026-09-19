export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            East Asia Alumni Network
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Connecting CAMPUS Asia &amp; BaiXian alumni in Tokyo
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
