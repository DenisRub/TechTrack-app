import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportToExcel(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Оборудование');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `${filename}.xlsx`);
}

export function exportToWord(data: any[], headers: string[], filename: string) {
  let html = `<html><head><meta charset="UTF-8"><title>${filename}</title></head><body>`;
  html += `<h1>${filename}</h1><table border="1" cellpadding="5">`;
  html += `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
  for (const row of data) {
    html += `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`;
  }
  html += `</tbody></table></body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  saveAs(blob, `${filename}.doc`);
}