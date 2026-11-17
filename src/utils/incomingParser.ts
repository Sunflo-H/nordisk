import * as XLSX from "xlsx";
import type { IncomingQuantities, SizeKey } from "../types";
import { isValidProductCode } from "./excelParser";

// 금일 입고 엑셀(ExcelExport_WPIOAA010_...) → 상품코드·칼라·사이즈별 입고 수량
// 규칙은 spec.md "금일 입고 제외"를 따른다. 출고일자·출고전표는 쓰지 않고, 같은 칸은 더한다.

const sizeKeys = Array.from({ length: 20 }, (_, i) =>
  i.toString().padStart(2, "0")
) as SizeKey[];

// 반드시 있어야 하는 열 (재고 파일·판매내역·전국 배분 파일(WPSTAA020)은 여기서 막힌다)
const requiredColumns = ["출고일자", "출고전표", "상품코드", "칼라", "수량", ...sizeKeys];

export type ParseIncomingResult =
  | {
      ok: true;
      quantities: IncomingQuantities;
      lineCount: number; // 읽은 입고 줄 수 (빈 줄·합계 줄 제외)
      cellCount: number; // 상품코드·칼라·사이즈 칸 수 (더한 뒤)
      productCount: number; // 상품코드 수
      totalQuantity: number; // 전체 수량
    }
  | { ok: false; reason: string };

// 엑셀 파일 내용을 읽어 검사한 뒤 입고 수량으로 바꾼다
export function parseIncomingExcel(data: ArrayBuffer): ParseIncomingResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array" });
  } catch {
    return { ok: false, reason: "엑셀 파일을 읽을 수 없습니다." };
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { ok: false, reason: "엑셀 파일에 시트가 없습니다." };
  return parseIncomingRows(sheet);
}

// 시트 하나를 입고 수량으로 바꾼다 (파일 읽기와 분리해 예시 데이터로 확인할 수 있게 한다)
export function parseIncomingRows(sheet: XLSX.WorkSheet): ParseIncomingResult {
  const headerRow = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })[0] ?? [];
  const headers = headerRow.map((cell) => String(cell ?? "").trim());
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column));
  if (missingColumns.length > 0) {
    return {
      ok: false,
      reason: `금일 입고 파일에 필요한 열이 없습니다: ${missingColumns.join(", ")}\n(입고 내역 파일 ExcelExport_WPIOAA010_...을 올려 주세요)`,
    };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const quantities: IncomingQuantities = {};
  const problems: string[] = [];
  let lineCount = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // 엑셀 줄 번호 (1번 줄은 열 이름)
    const code = String(row["상품코드"] ?? "").trim();
    // 상품코드가 빈 줄은 빈 줄(둘째 줄)이나 합계 줄이라 뺀다
    if (code === "") return;
    lineCount += 1;

    const color = String(row["칼라"] ?? "").trim();
    if (!isValidProductCode(code) || !isValidProductCode(color)) {
      problems.push(`${rowNumber}번 줄: 상품코드·칼라가 비었거나 잘못되었습니다 ("${code}", "${color}")`);
      return;
    }
    const total = toQuantity(row["수량"]);
    const sizes: Partial<Record<SizeKey, number>> = {};
    let sizeSum = 0;
    for (const size of sizeKeys) {
      const quantity = toQuantity(row[size]);
      if (quantity === null) {
        problems.push(`${rowNumber}번 줄: ${size} 사이즈 수량이 숫자가 아니거나 음수입니다`);
        return;
      }
      if (quantity > 0) sizes[size] = quantity;
      sizeSum += quantity;
    }
    // 사이즈별 합이 수량과 다르면 파일이 예상과 다른 것이라 막는다
    if (total === null || total !== sizeSum) {
      problems.push(`${rowNumber}번 줄: 사이즈별 합(${sizeSum})이 수량(${String(row["수량"])})과 다릅니다`);
      return;
    }

    // 전표 상관없이 같은 상품·칼라·사이즈는 더한다
    const colors = (quantities[code] ??= {});
    const target: Partial<Record<SizeKey, number>> = (colors[color] ??= {});
    for (const [size, quantity] of Object.entries(sizes) as [SizeKey, number][]) {
      target[size] = (target[size] ?? 0) + quantity;
    }
    if (Object.keys(target).length === 0) delete colors[color];
    if (Object.keys(colors).length === 0) delete quantities[code];
  });

  if (problems.length > 0) {
    const examples = problems.slice(0, 5).join("\n");
    return { ok: false, reason: `확인이 필요한 줄이 ${problems.length}개 있습니다.\n${examples}` };
  }
  if (lineCount === 0) return { ok: false, reason: "엑셀 파일에서 읽은 입고 줄이 없습니다." };

  let cellCount = 0;
  let totalQuantity = 0;
  for (const colors of Object.values(quantities)) {
    for (const sizes of Object.values(colors)) {
      for (const quantity of Object.values(sizes)) {
        cellCount += 1;
        totalQuantity += quantity ?? 0;
      }
    }
  }
  if (totalQuantity === 0) return { ok: false, reason: "입고 수량이 모두 0입니다." };

  return {
    ok: true,
    quantities,
    lineCount,
    cellCount,
    productCount: Object.keys(quantities).length,
    totalQuantity,
  };
}

// 칸 값 → 0 이상의 정수. 빈 칸은 0. 숫자가 아니거나 음수·소수면 null.
function toQuantity(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return 0;
  const quantity = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(quantity) || quantity < 0) return null;
  return quantity;
}
