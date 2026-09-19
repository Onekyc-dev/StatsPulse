export function DataNotice({ error }: { error: string | null }) {
  return (
    <div className="card px-6 py-10 text-center">
      <h2 className="font-display text-lg font-bold">No matches loaded yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
        The database is empty or not reachable. Run the first data sync, then refresh this page in a minute.
      </p>
      {error && <p className="mx-auto mt-4 max-w-lg break-words text-[11px] leading-relaxed text-white/30">{error}</p>}
    </div>
  );
}
