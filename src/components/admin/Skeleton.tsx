export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/5 rounded ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-white/10 bg-white/5 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Customer</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-400 hidden md:table-cell">Service</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-400 hidden sm:table-cell">Date & Time</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Status</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </td>
              <td className="px-6 py-4 hidden md:table-cell">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </td>
              <td className="px-6 py-4 hidden sm:table-cell">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-24" />
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-6 w-20" />
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-white/10 bg-white/5 p-4">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}