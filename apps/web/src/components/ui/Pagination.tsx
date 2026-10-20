import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}

function buildHref(basePath: string, page: number, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set('page', String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({ page, totalPages, basePath, params = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="分页" className="mt-12 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={buildHref(basePath, page - 1, params)}
          className="btn btn-ghost !min-h-10 !px-4"
          rel="prev"
        >
          上一页
        </Link>
      ) : (
        <span className="btn btn-ghost !min-h-10 !px-4 pointer-events-none opacity-40">上一页</span>
      )}

      <span className="px-2 text-sm tabular-nums text-[var(--text-muted)]">
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={buildHref(basePath, page + 1, params)}
          className="btn btn-ghost !min-h-10 !px-4"
          rel="next"
        >
          下一页
        </Link>
      ) : (
        <span className="btn btn-ghost !min-h-10 !px-4 pointer-events-none opacity-40">下一页</span>
      )}
    </nav>
  );
}
