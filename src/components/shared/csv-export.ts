// Generic CSV export utility
// Usage: exportToCsv("contacts.csv", contacts, columnMap)

export interface CsvColumnMap<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export function generateCsv<T>(
  data: T[],
  columns: CsvColumnMap<T>[]
): string {
  const headers = columns.map((col) => escapeCsvField(col.header));
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = col.accessor(row);
        return escapeCsvField(value != null ? String(value) : "");
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCsv<T>(
  filename: string,
  data: T[],
  columns: CsvColumnMap<T>[]
): void {
  const csv = generateCsv(data, columns);
  downloadCsv(filename, csv);
}
