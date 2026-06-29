interface JsonPreviewProps {
  data: unknown;
  empty?: string;
}

export function JsonPreview({ data, empty = "Not present in imported profile." }: JsonPreviewProps) {
  if (data === undefined || data === null) {
    return <p className="text-sm text-slate-600">{empty}</p>;
  }

  return (
    <pre className="max-h-80 overflow-auto rounded border border-line bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

