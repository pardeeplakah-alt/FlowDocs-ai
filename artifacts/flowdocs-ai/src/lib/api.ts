const API_BASE = "https://flowdocs-ai.onrender.com";

export async function processFile(
  action: "clean" | "organize" | "summary" | "convert",
  file: File,
  extra?: Record<string, string>
) {
  const fd = new FormData();
  fd.append("file", file);

  if (extra) {
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
  }

  const res = await fetch(${API_BASE}/api/spreadsheet/${action}, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({
      error: "Unknown error occurred",
    }));
    throw new Error(e.error || "Failed to process file");
  }

  return res.json();
}

export async function getColumns(file: File): Promise<string[]> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(${API_BASE}/api/spreadsheet/columns, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    throw new Error("Failed to get columns");
  }

  const data = await res.json();
  return data.columns;
}

export function downloadFile(fileId: string, fileName: string) {
  const link = document.createElement("a");
  link.href = ${API_BASE}/api/spreadsheet/download/${fileId};
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}