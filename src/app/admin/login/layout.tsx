export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4">
      {children}
    </div>
  )
}