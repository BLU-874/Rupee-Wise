
export default function WorkspaceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading workspace">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-[#E8E5F0] shadow-sm flex items-center gap-4 min-h-[96px]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F0EEFA]" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-[#E8E5F0] rounded" />
              <div className="h-6 w-24 bg-[#E8E5F0] rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E8E5F0] shadow-sm min-h-[340px]">
          <div className="h-4 w-32 bg-[#E8E5F0] rounded mb-4" />
          <div className="h-64 bg-[#F8F7FD] rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#E8E5F0] shadow-sm min-h-[340px] space-y-4">
          <div className="h-4 w-28 bg-[#E8E5F0] rounded mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#F8F7FD] rounded-xl" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading workspace content...</span>
    </div>
  );
}
