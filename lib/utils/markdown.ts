// 簡易 markdown 轉 HTML（MVP 用）
// 未來可替換為 react-markdown

export function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3 class='font-semibold mt-4 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='font-semibold text-lg mt-4 mb-2'>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^---$/gm, "<hr class='my-4 border-gray-200'>")
    .replace(/^- (.+)$/gm, "<li class='ml-4'>$1</li>")
    .replace(/\n\n/g, "</p><p class='mb-2'>")
    .replace(/\n/g, "<br>");

  if (html.includes("|")) {
    const lines = md.split("\n");
    let tableHtml = "<table class='w-full text-sm border-collapse my-3'>";
    let inTable = false;
    let rowIndex = 0;

    for (const line of lines) {
      if (line.trim().startsWith("|")) {
        if (line.trim().match(/^\|[-\s|]+\|$/)) continue;
        inTable = true;
        const cells = line.split("|").filter((c) => c.trim() !== "");
        const tag = rowIndex === 0 ? "th" : "td";
        const cellClass =
          rowIndex === 0
            ? "border border-gray-200 px-3 py-1 bg-gray-50 font-medium"
            : "border border-gray-200 px-3 py-1";
        tableHtml += "<tr>";
        for (const cell of cells) {
          tableHtml += `<${tag} class="${cellClass}">${cell.trim()}</${tag}>`;
        }
        tableHtml += "</tr>";
        rowIndex++;
      } else {
        if (inTable) {
          tableHtml += "</table>";
          inTable = false;
        }
      }
    }
    if (inTable) tableHtml += "</table>";

    const beforeTable = md.substring(0, md.indexOf("|")).trim();
    const afterTableMatch = md.match(/\n(?!\|)(.+)$/s);
    const afterTable = afterTableMatch ? afterTableMatch[1].trim() : "";

    html = markdownToHtml(beforeTable) + tableHtml;
    if (afterTable) html += markdownToHtml(afterTable);
  }

  return html;
}
