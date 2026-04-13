// 簡易 markdown 轉 HTML
// 設計原則：呼吸感、舒適閱讀、關鍵字突出、案例區分

export function markdownToHtml(md: string): string {
  // 先處理 table（避免被其他 replace 干擾）
  if (md.includes("|")) {
    return processWithTable(md);
  }

  let html = md
    // headings — 大間距，清楚分段
    .replace(
      /^### (.+)$/gm,
      "<h3 class='font-semibold text-gray-800 mt-8 mb-3 text-base'>$1</h3>"
    )
    .replace(
      /^## (.+)$/gm,
      "<h2 class='font-semibold text-gray-900 text-lg mt-8 mb-3'>$1</h2>"
    )
    // bold — 關鍵字用深棕色粗體
    .replace(
      /\*\*(.+?)\*\*/g,
      "<strong class='text-amber-900 font-semibold'>$1</strong>"
    )
    // 引用區塊 — 案例/故事用暖色左邊條
    .replace(
      /^> (.+)$/gm,
      "<blockquote class='border-l-3 border-amber-300 bg-amber-50 pl-4 py-2 my-4 text-amber-900 text-sm rounded-r'>$1</blockquote>"
    )
    // horizontal rule
    .replace(/^---$/gm, "<hr class='my-8 border-gray-100'>")
    // 列表 — 有間距的列表
    .replace(
      /^- (.+)$/gm,
      "<li class='ml-5 mb-2 text-gray-700'>$1</li>"
    )
    // 數字列表
    .replace(
      /^(\d+)\. (.+)$/gm,
      "<li class='ml-5 mb-2 text-gray-700'><span class='text-amber-700 font-medium mr-1'>$1.</span>$2</li>"
    )
    // 段落間距 — 雙換行變大間距段落
    .replace(/\n\n/g, "</p><p class='mb-5 leading-relaxed'>")
    // 單換行 — 換行但不要太擠
    .replace(/\n/g, "<br class='mb-1'>");

  // 包裹在段落裡
  html = "<p class='mb-5 leading-relaxed'>" + html + "</p>";

  // 清理空段落
  html = html.replace(/<p class='mb-5 leading-relaxed'>\s*<\/p>/g, "");

  return html;
}

function processWithTable(md: string): string {
  const lines = md.split("\n");
  let tableHtml = "<table class='w-full text-sm border-collapse my-6 rounded overflow-hidden'>";
  let inTable = false;
  let rowIndex = 0;
  const beforeLines: string[] = [];
  const afterLines: string[] = [];
  let pastTable = false;

  for (const line of lines) {
    if (line.trim().startsWith("|")) {
      if (line.trim().match(/^\|[-\s|]+\|$/)) continue;
      inTable = true;
      const cells = line.split("|").filter((c) => c.trim() !== "");
      const tag = rowIndex === 0 ? "th" : "td";
      const cellClass =
        rowIndex === 0
          ? "border border-gray-200 px-4 py-2 bg-gray-50 font-medium text-gray-700"
          : "border border-gray-200 px-4 py-2.5 text-gray-600";
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
        pastTable = true;
      }
      if (pastTable) {
        afterLines.push(line);
      } else {
        beforeLines.push(line);
      }
    }
  }
  if (inTable) tableHtml += "</table>";

  let result = "";
  if (beforeLines.length > 0) {
    result += markdownToHtml(beforeLines.join("\n"));
  }
  result += tableHtml;
  if (afterLines.length > 0) {
    result += markdownToHtml(afterLines.join("\n"));
  }

  return result;
}
