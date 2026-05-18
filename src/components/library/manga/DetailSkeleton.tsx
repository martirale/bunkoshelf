type DetailSkeletonKind = "series" | "volume";

interface DetailSkeletonProps {
  kind: DetailSkeletonKind;
}

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-sand/75 ${className}`} />;
}

function Chip({ className }: { className: string }) {
  return <Pulse className={`h-9 rounded-md ${className}`} />;
}

function MetaRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-row items-baseline max-w-3xl">
          <Pulse className="h-4 w-20" />
          <Pulse
            className={`ml-6 h-5 ${
              index % 3 === 0
                ? "w-40 md:w-56"
                : index % 3 === 1
                  ? "w-48"
                  : "w-32"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-5 2xl:grid-cols-7">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={
            index > 3 ? "hidden 2xl:block" : index > 1 ? "hidden md:block" : ""
          }
        >
          <Pulse className="aspect-[3/5] w-full rounded-lg" />
          <Pulse className="mt-3 h-5 w-4/5" />
          <Pulse className="mt-2 h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

function VolumeTabsSkeleton() {
  return (
    <div className="mt-8">
      <div className="mb-6 flex gap-4 border-b border-neutral-700">
        <Pulse className="mb-2 h-4 w-20" />
        <Pulse className="mb-2 h-4 w-36" />
      </div>
      <MetaRows count={6} />
      <div className="mt-8 flex flex-wrap gap-2">
        <Chip className="w-28" />
        <Chip className="w-20" />
        <Chip className="w-32" />
      </div>
    </div>
  );
}

export default function DetailSkeleton({ kind }: DetailSkeletonProps) {
  const isVolume = kind === "volume";

  return (
    <div className="p-4">
      <section className="flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 2xl:w-1/3">
          <div className="mb-8 px-16 md:mb-0 md:mr-4 md:px-0 md:sticky md:top-4 md:self-start">
            <Pulse className="aspect-[3/5] w-full rounded-lg" />
          </div>
        </div>

        <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
          <Pulse className="h-12 w-3/4 md:h-14 md:w-2/3" />

          {isVolume && <Pulse className="mt-4 h-7 w-44 md:w-56" />}

          <div className="mt-4 flex flex-wrap gap-2">
            <Pulse
              className={
                isVolume
                  ? "h-14 w-40 rounded-lg md:w-44"
                  : "h-14 w-32 rounded-lg md:w-36"
              }
            />
            <Pulse className="h-14 w-14 rounded-lg" />
            {isVolume && <Pulse className="h-14 w-14 rounded-lg" />}
            <Pulse className="h-14 w-14 rounded-lg" />
          </div>

          <Pulse className="mt-8 h-12 w-28 md:w-32" />

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip className="w-16" />
            <Chip className="w-16" />
            <Chip className="w-36 md:w-48" />
          </div>

          <Pulse className="mt-4 h-8 w-40 md:w-52" />

          <div className="mt-8">
            <Pulse className="mb-3 h-5 w-36 md:w-44" />
            <div className="space-y-3">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-11/12" />
              <Pulse className="h-4 w-2/3" />
            </div>
            <Pulse className="mt-4 h-5 w-28" />
          </div>

          {isVolume ? (
            <VolumeTabsSkeleton />
          ) : (
            <>
              <div className="my-8 h-px w-full bg-neutral-700" />
              <MetaRows count={6} />
              <div className="mt-8 flex flex-wrap gap-2">
                <Chip className="w-28" />
                <Chip className="w-20" />
                <Chip className="w-32" />
                <Chip className="w-24" />
              </div>
            </>
          )}
        </div>
      </section>

      {!isVolume && (
        <section>
          <div className="my-8 h-px w-full bg-neutral-700" />
          <Pulse className="h-8 w-40" />
          <CardGridSkeleton />
        </section>
      )}
    </div>
  );
}
