import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { randomUUID } from "crypto";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
      "text/plain",
    ];
    const ext = file.originalname.toLowerCase().split(".").pop();
    if (allowed.includes(file.mimetype) || ext === "xlsx" || ext === "csv") {
      cb(null, true);
    } else {
      cb(new Error("Only XLSX and CSV files are allowed"));
    }
  },
});

interface FileStore {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  createdAt: number;
}

const fileStore = new Map<string, FileStore>();

setInterval(() => {
  const now = Date.now();
  for (const [id, file] of fileStore.entries()) {
    if (now - file.createdAt > 30 * 60 * 1000) {
      fileStore.delete(id);
    }
  }
}, 5 * 60 * 1000);

function parseFile(buffer: Buffer, filename: string): XLSX.WorkBook {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "csv") {
    const workbook = XLSX.read(buffer, { type: "buffer", raw: false });
    return workbook;
  }
  return XLSX.read(buffer, { type: "buffer" });
}

function getRows(workbook: XLSX.WorkBook): Record<string, unknown>[] {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return rows;
}

function getHeaders(workbook: XLSX.WorkBook): string[] {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];
  if (rows.length === 0) return [];
  return (rows[0] as string[]).map(String);
}

function storeFile(buffer: Buffer, filename: string, mimetype: string): string {
  const id = randomUUID();
  fileStore.set(id, { buffer, filename, mimetype, createdAt: Date.now() });
  return id;
}

function rowToArray(row: Record<string, unknown>, headers: string[]): unknown[] {
  return headers.map((h) => row[h] ?? "");
}

function serializeWorkbook(wb: XLSX.WorkBook, ext: "xlsx" | "csv"): Buffer {
  if (ext === "csv") {
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return Buffer.from(csv, "utf-8");
  }
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function buildWorkbook(
  headers: string[],
  rows: Record<string, unknown>[],
): XLSX.WorkBook {
  const data = [headers, ...rows.map((r) => rowToArray(r, headers))];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
  return wb;
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function looksLikeDate(val: string): boolean {
  if (!val) return false;
  return /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/.test(val.trim());
}

function normalizeDate(val: string): string {
  const cleaned = val.trim();
  const m = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return cleaned;
}

function isEmptyRow(row: Record<string, unknown>): boolean {
  return Object.values(row).every(
    (v) => v === "" || v === null || v === undefined,
  );
}

function inferColumnType(values: string[]): string {
  const nonEmpty = values.filter((v) => v !== "" && v !== null);
  if (nonEmpty.length === 0) return "empty";
  const numericCount = nonEmpty.filter((v) => !isNaN(Number(v))).length;
  if (numericCount / nonEmpty.length > 0.8) return "number";
  const dateCount = nonEmpty.filter((v) => looksLikeDate(String(v))).length;
  if (dateCount / nonEmpty.length > 0.5) return "date";
  return "string";
}

router.post("/clean", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const wb = parseFile(req.file.buffer, req.file.originalname);
    const originalRows = getRows(wb);
    const originalHeaders = getHeaders(wb);

    if (originalRows.length === 0) {
      res.status(400).json({ error: "File is empty or has no data rows" });
      return;
    }

    let rows = [...originalRows];
    let duplicatesRemoved = 0;
    let emptyRowsRemoved = 0;
    let spacesNormalized = 0;
    let datesNormalized = 0;

    const emptyBefore = rows.filter(isEmptyRow).length;
    rows = rows.filter((r) => !isEmptyRow(r));
    emptyRowsRemoved = emptyBefore - rows.filter(isEmptyRow).length;

    const seen = new Set<string>();
    const deduped: Record<string, unknown>[] = [];
    for (const row of rows) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(row);
      } else {
        duplicatesRemoved++;
      }
    }
    rows = deduped;

    const normalizedHeaders = originalHeaders.map(normalizeHeader);
    const headerChanged =
      normalizedHeaders.join(",") !== originalHeaders.join(",");

    rows = rows.map((row) => {
      const newRow: Record<string, unknown> = {};
      for (let i = 0; i < originalHeaders.length; i++) {
        const orig = originalHeaders[i];
        const norm = normalizedHeaders[i];
        let val = String(row[orig] ?? "");
        if (val !== val.trim()) spacesNormalized++;
        val = val.trim();
        if (looksLikeDate(val)) {
          const normalized = normalizeDate(val);
          if (normalized !== val) datesNormalized++;
          val = normalized;
        }
        newRow[norm] = val;
      }
      return newRow;
    });

    const wb2 = buildWorkbook(normalizedHeaders, rows);
    const ext = req.file.originalname.toLowerCase().endsWith(".csv")
      ? "csv"
      : "xlsx";
    const buf = serializeWorkbook(wb2, ext);
    const outName = req.file.originalname.replace(
      /\.(xlsx|csv)$/i,
      `_cleaned.${ext}`,
    );
    const fileId = storeFile(
      buf,
      outName,
      ext === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.json({
      fileId,
      fileName: outName,
      totalRows: rows.length,
      totalColumns: normalizedHeaders.length,
      duplicatesRemoved,
      emptyRowsRemoved,
      spacesNormalized,
      headersNormalized: headerChanged,
      datesNormalized,
      summary: `Processed ${originalRows.length} rows: removed ${duplicatesRemoved} duplicates, ${emptyRowsRemoved} empty rows, normalized ${spacesNormalized} cell values and ${datesNormalized} dates.`,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "clean error");
    const message = err instanceof Error ? err.message : "Processing failed";
    res.status(400).json({ error: message });
  }
});

router.post("/organize", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const wb = parseFile(req.file.buffer, req.file.originalname);
    const originalRows = getRows(wb);
    const originalHeaders = getHeaders(wb);

    if (originalRows.length === 0) {
      res.status(400).json({ error: "File is empty or has no data rows" });
      return;
    }

    const sortColumn = req.body?.sortColumn as string | undefined;
    const sortDirection = (req.body?.sortDirection as string) || "asc";

    let rows = [...originalRows];

    const nonEmptyRows = rows.filter((r) => !isEmptyRow(r));
    const emptyRows = rows.filter((r) => isEmptyRow(r));
    const emptyRowsMovedToBottom = emptyRows.length;

    if (sortColumn && originalHeaders.includes(sortColumn)) {
      nonEmptyRows.sort((a, b) => {
        const av = String(a[sortColumn] ?? "");
        const bv = String(b[sortColumn] ?? "");
        const an = Number(av);
        const bn = Number(bv);
        let cmp: number;
        if (!isNaN(an) && !isNaN(bn)) {
          cmp = an - bn;
        } else {
          cmp = av.localeCompare(bv);
        }
        return sortDirection === "desc" ? -cmp : cmp;
      });
    }

    rows = [...nonEmptyRows, ...emptyRows];

    const idCols = originalHeaders.filter((h) =>
      /^(id|key|code|ref|uuid|num|number)$/i.test(h),
    );
    const nameCols = originalHeaders.filter((h) =>
      /^(name|title|label|description|desc)$/i.test(h),
    );
    const dateCols = originalHeaders.filter((h) =>
      /^(date|created|updated|time|at)$/i.test(h),
    );
    const statusCols = originalHeaders.filter((h) =>
      /^(status|state|type|category|tag)$/i.test(h),
    );
    const otherCols = originalHeaders.filter(
      (h) =>
        !idCols.includes(h) &&
        !nameCols.includes(h) &&
        !dateCols.includes(h) &&
        !statusCols.includes(h),
    );
    const columnOrder = [
      ...idCols,
      ...nameCols,
      ...statusCols,
      ...dateCols,
      ...otherCols,
    ];
    const columnsReordered =
      columnOrder.join(",") !== originalHeaders.join(",");

    const reorderedRows = rows.map((row) => {
      const newRow: Record<string, unknown> = {};
      for (const col of columnOrder) {
        newRow[col] = row[col] ?? "";
      }
      return newRow;
    });

    const wb2 = buildWorkbook(columnOrder, reorderedRows);
    const ext = req.file.originalname.toLowerCase().endsWith(".csv")
      ? "csv"
      : "xlsx";
    const buf = serializeWorkbook(wb2, ext);
    const outName = req.file.originalname.replace(
      /\.(xlsx|csv)$/i,
      `_organized.${ext}`,
    );
    const fileId = storeFile(
      buf,
      outName,
      ext === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const sortedByVal = sortColumn && originalHeaders.includes(sortColumn) ? sortColumn : null;

    res.json({
      fileId,
      fileName: outName,
      totalRows: nonEmptyRows.length,
      totalColumns: columnOrder.length,
      sortedBy: sortedByVal,
      sortDirection: sortedByVal ? sortDirection : null,
      emptyRowsMovedToBottom,
      columnsReordered,
      columnOrder,
      summary: `Organized ${rows.length} rows${sortedByVal ? `, sorted by "${sortedByVal}" (${sortDirection})` : ""}. ${emptyRowsMovedToBottom > 0 ? `${emptyRowsMovedToBottom} empty rows moved to bottom.` : ""} ${columnsReordered ? "Columns reordered logically." : ""}`.trim(),
    });
  } catch (err: unknown) {
    req.log.error({ err }, "organize error");
    const message = err instanceof Error ? err.message : "Processing failed";
    res.status(400).json({ error: message });
  }
});

router.post("/summary", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const wb = parseFile(req.file.buffer, req.file.originalname);
    const rows = getRows(wb);
    const headers = getHeaders(wb);

    if (rows.length === 0) {
      res.status(400).json({ error: "File is empty or has no data rows" });
      return;
    }

    let totalMissing = 0;
    const columnStats = headers.map((col) => {
      const values = rows.map((r) => String(r[col] ?? ""));
      const missingCount = values.filter((v) => v === "" || v === "null" || v === "undefined").length;
      totalMissing += missingCount;
      const type = inferColumnType(values);
      const uniqueValues = new Set(values.filter((v) => v !== "")).size;
      return {
        name: col,
        missingCount,
        missingPct: rows.length > 0 ? Math.round((missingCount / rows.length) * 100 * 10) / 10 : 0,
        type,
        uniqueValues,
      };
    });

    const missingValuePct =
      rows.length * headers.length > 0
        ? Math.round(
            (totalMissing / (rows.length * headers.length)) * 100 * 10,
          ) / 10
        : 0;

    const keyInsights: string[] = [];
    keyInsights.push(`Dataset has ${rows.length} rows and ${headers.length} columns`);

    const highMissingCols = columnStats.filter((c) => c.missingPct > 20);
    if (highMissingCols.length > 0) {
      keyInsights.push(
        `${highMissingCols.length} column(s) have more than 20% missing values: ${highMissingCols.map((c) => c.name).join(", ")}`,
      );
    }

    const numericCols = columnStats.filter((c) => c.type === "number");
    if (numericCols.length > 0) {
      keyInsights.push(`${numericCols.length} numeric column(s): ${numericCols.map((c) => c.name).join(", ")}`);
    }

    const dateCols = columnStats.filter((c) => c.type === "date");
    if (dateCols.length > 0) {
      keyInsights.push(`${dateCols.length} date column(s): ${dateCols.map((c) => c.name).join(", ")}`);
    }

    const lowCardinalityCols = columnStats.filter(
      (c) => c.uniqueValues < 10 && c.type === "string" && rows.length > 10,
    );
    if (lowCardinalityCols.length > 0) {
      keyInsights.push(
        `${lowCardinalityCols.length} column(s) may be categorical (few unique values): ${lowCardinalityCols.map((c) => c.name).join(", ")}`,
      );
    }

    if (totalMissing === 0) {
      keyInsights.push("No missing values found — dataset is complete");
    }

    const summaryText = [
      `# Summary Report: ${req.file.originalname}`,
      ``,
      `**Total Rows:** ${rows.length}`,
      `**Total Columns:** ${headers.length}`,
      `**Missing Values:** ${totalMissing} (${missingValuePct}%)`,
      ``,
      `## Columns`,
      ...columnStats.map(
        (c) =>
          `- ${c.name}: ${c.type}, ${c.uniqueValues} unique values, ${c.missingCount} missing (${c.missingPct}%)`,
      ),
      ``,
      `## Key Insights`,
      ...keyInsights.map((i) => `- ${i}`),
    ].join("\n");

    const fileId = storeFile(
      Buffer.from(summaryText, "utf-8"),
      req.file.originalname.replace(/\.(xlsx|csv)$/i, "_summary.txt"),
      "text/plain",
    );

    res.json({
      totalRows: rows.length,
      totalColumns: headers.length,
      totalMissingValues: totalMissing,
      missingValuePct,
      columnNames: headers,
      columnStats,
      keyInsights,
      overview: `${req.file.originalname} — ${rows.length} rows × ${headers.length} columns, ${missingValuePct}% missing values`,
      fileId,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "summary error");
    const message = err instanceof Error ? err.message : "Processing failed";
    res.status(400).json({ error: message });
  }
});

router.post("/convert", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const ext = req.file.originalname.toLowerCase().split(".").pop();
    if (ext !== "xlsx" && ext !== "csv") {
      res.status(400).json({ error: "Only XLSX and CSV files are supported" });
      return;
    }

    const wb = parseFile(req.file.buffer, req.file.originalname);
    const rows = getRows(wb);
    const headers = getHeaders(wb);

    if (rows.length === 0) {
      res.status(400).json({ error: "File is empty or has no data rows" });
      return;
    }

    const targetExt = ext === "csv" ? "xlsx" : "csv";
    const buf = serializeWorkbook(wb, targetExt as "xlsx" | "csv");
    const outName = req.file.originalname.replace(
      /\.(xlsx|csv)$/i,
      `_converted.${targetExt}`,
    );
    const fileId = storeFile(
      buf,
      outName,
      targetExt === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.json({
      fileId,
      fileName: outName,
      originalFormat: ext.toUpperCase(),
      convertedFormat: targetExt.toUpperCase(),
      totalRows: rows.length,
      totalColumns: headers.length,
      summary: `Converted ${req.file.originalname} (${ext.toUpperCase()}) to ${targetExt.toUpperCase()}. ${rows.length} rows and ${headers.length} columns preserved.`,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "convert error");
    const message = err instanceof Error ? err.message : "Processing failed";
    res.status(400).json({ error: message });
  }
});

router.get("/download/:fileId", (req, res) => {
  const file = fileStore.get(req.params.fileId);
  if (!file) {
    res.status(404).json({ error: "File not found or expired" });
    return;
  }
  res.setHeader("Content-Type", file.mimetype);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(file.filename)}"`,
  );
  res.send(file.buffer);
});

router.post("/columns", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const wb = parseFile(req.file.buffer, req.file.originalname);
    const headers = getHeaders(wb);
    res.json({ columns: headers });
  } catch (err: unknown) {
    req.log.error({ err }, "columns error");
    const message = err instanceof Error ? err.message : "Processing failed";
    res.status(400).json({ error: message });
  }
});

export default router;
