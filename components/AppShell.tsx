'use client';

import {useQuery} from '@tanstack/react-query';
import {api} from '../app/lib/api';

function ApiStatus() {
    const {data, isError} = useQuery({
        queryKey: ['health'],
        queryFn: async () => {
            const res = await api.get('/health');
            return res.data as {status: string; timestamp: string};
        },
    });

    return (
        <div className="flex items-center gap-2 text-sm">
            {data?.status === 'ok' ? (
                <span className = "text-green-600 font-medium">API connected</span>
            ) : isError ? (
                <span className = "text-red-500 font-medium">API unreachable</span>
                ) :(
                <span className = "text-gray-400 font-medium">API connecting...</span>
                ) }
        </div>
    );
}


function Sidebar() {
  return (
    <aside className="w-60 h-screen bg-gray-50 border-r border-gray-200
                      flex flex-col px-4 py-6 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">☁</span>
        <span className="font-bold text-gray-800 text-lg">Cloud Drive</span>
      </div>

      {/* Nav items — static for now, wired up Day 4+ */}
      <nav className="flex flex-col gap-1 flex-1">
        {[
          { icon: '🗂️', label: 'My Drive' },
          { icon: '🔗', label: 'Shared with me' },
          { icon: '⭐', label: 'Starred' },
          { icon: '🕐', label: 'Recent' },
          { icon: '🗑️', label: 'Trash' },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-3 px-3 py-2 rounded-lg
                       text-gray-600 hover:bg-gray-200 transition-colors
                       text-sm font-medium text-left"
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Storage indicator — static for now */}
      <div className="mt-auto text-xs text-gray-400 px-2">
        <div className="mb-1">Storage</div>
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div className="h-1.5 bg-blue-500 rounded-full w-1/4" />
        </div>
        <div className="mt-1">0 GB of 1 GB used</div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="h-14 border-b border-gray-200 flex items-center
                       justify-between px-6 bg-white shrink-0">
      {/* Search — wired up Day 6 */}
      <div className="flex-1 max-w-xl">
        <input
          type="text"
          placeholder="Search files..."
          className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm
                     outline-none focus:ring-2 focus:ring-blue-500
                     focus:bg-white transition-all"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-4">
        <ApiStatus />
        {/* User avatar — wired up Day 2 */}
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center
                        justify-center text-white text-sm font-bold">
          ?
        </div>
      </div>
    </header>
  );
}

function MainArea() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 p-6 overflow-auto bg-white">
        {/* Breadcrumb — wired up Day 4 */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span className="font-medium text-gray-800">My Drive</span>
        </div>

        {/* Empty state — replaced with FileGrid on Day 3 */}
        <div className="flex flex-col items-center justify-center
                        h-64 text-gray-400">
          <div className="text-5xl mb-4">📁</div>
          <div className="text-lg font-medium text-gray-500">
            No files yet
          </div>
          <div className="text-sm mt-1">
            Upload a file to get started
          </div>
        </div>
      </div>
    </main>
  );
}

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <MainArea />
    </div>
  );
}