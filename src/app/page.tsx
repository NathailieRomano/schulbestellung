export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">📦 Schulbestellung</h1>
        <h2 className="text-lg text-gray-600 mb-6">Oberstufenschule Steffisburg</h2>
        <p className="text-gray-500 mb-6">
          Sammelbestellung 2026 bei ingold-biwa
        </p>
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Lehrpersonen: Verwende den Link, den du vom Administrator erhalten hast.
          </p>
          <a
            href="/admin"
            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
          >
            🔒 Admin-Bereich
          </a>
        </div>
      </div>
    </div>
  )
}
