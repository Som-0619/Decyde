'use client';

export default function RoomSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 sm:py-8 flex flex-col justify-between animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-card rounded-3xl p-5 sm:p-6 border border-border shadow-sm mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 bg-muted rounded-lg" />
            <div className="h-6 w-14 bg-muted rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted" />
            <div className="w-8 h-8 rounded-xl bg-muted" />
          </div>
        </div>

        {/* Question skeleton */}
        <div className="h-7 w-4/5 bg-muted rounded-xl mb-2" />
        <div className="h-5 w-2/3 bg-muted rounded-lg" />

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div className="h-7 w-28 bg-muted rounded-xl" />
          <div className="h-4 w-20 bg-muted rounded-md" />
        </div>
      </div>

      {/* Card Stack Skeleton */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[1/1.15] max-h-[440px] my-auto">
        <div className="w-full h-full rounded-3xl p-8 bg-card border border-border shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-12 bg-muted rounded-md" />
            <div className="h-4 w-24 bg-muted rounded-md" />
          </div>

          <div className="my-auto flex flex-col items-center">
            <div className="w-24 h-24 rounded-3xl bg-muted mb-5" />
            <div className="h-8 w-3/4 bg-muted rounded-xl mb-2" />
            <div className="h-5 w-1/2 bg-muted rounded-lg" />
          </div>

          <div className="h-4 w-full bg-secondary rounded-md" />
        </div>
      </div>

      {/* Buttons Skeleton */}
      <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 px-2">
        <div className="flex-1 h-12 rounded-2xl bg-muted" />
        <div className="flex-1 h-12 rounded-2xl bg-muted" />
        <div className="flex-1 h-12 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
