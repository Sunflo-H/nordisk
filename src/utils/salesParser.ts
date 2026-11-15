import * as XLSX from "xlsx";
import type { SalesLine, SizeKey } from "../types";
import { isValidProductCode } from "./excelParser";

// 판매내역 엑셀(금일상품별판매내역) → 판매 줄 목록 변환
// 규칙은 spec.md "행사장 보충 > 업로드 파일"을 따른다.
// 고객명은 매장 판매인지 판별하는 데만 쓰고, 결과에는 남기지 않는다 (개인정보).

// 반드시 있어야 하는 열 (재고 파일·영수증별 판매 파일은 여기서 막힌다)
const requiredColumns = [
  "판매일자",
  "판매번호",
  "상품코드",
  "상품명",
  "칼라",
  "사이즈",
  "사이즈명",
  "판매수량",
  "고객명",
];

export type ParseSalesResult =
  | { ok: true; lines: SalesLine[] }
  | { ok: false; reason: string };

// 엑셀 한 줄의 원래 값 (형식이 제각각일 수 있어 unknown으로 받는다)
type RawSalesRow = Record<string, unknown>;

// 엑셀 파일 내용을 읽어 검사한 뒤 판매 줄 목록으로 바꾼다.
// storeSaleName: 매장 판매 표시 이름 (앞뒤 공백은 무시하고 비교한다)
export function parseSalesExcel(
  data: ArrayBuffer,
  storeSaleName: string
): ParseSalesResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array" });
  } catch {
    return { ok: false, reason: "엑셀 파일을 읽을 수 없습니다." };
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { ok: false, reason: "엑셀 파일에 시트가 없습니다." };
  return parseSalesRows(sheet, storeSaleName);
}

// 시트 하나를 판매 줄 목록으로 바꾼다 (파일 읽기와 분리해 예시 데이터로 확인할 수 있게 한다)
export function parseSalesRows(
  sheet: XLSX.WorkSheet,
  storeSaleName: string
): ParseSalesResult {
  const storeName = storeSaleName.trim();
  if (!storeName) {
    return { ok: false, reason: "매장 판매 표시 이름을 먼저 입력해 주세요." };
  }

  // 첫 행(열 이름)으로 필수 열이 있는지 검사한다
  const headerRow =
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })[0] ?? [];
  const headers = headerRow.map((cell) => String(cell ?? "").trim());
  const missingColumns = requiredColumns.filter(
    (column) => !headers.includes(column)
  );
  if (missingColumns.length > 0) {
    return {
      ok: false,
      reason: `판매내역(금일상품별판매내역) 파일에 필요한 열이 없습니다: ${missingColumns.join(", ")}`,
    };
  }

  const rows = XLSX.utils.sheet_to_json<RawSalesRow>(sheet);
  const lines: SalesLine[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    // 엑셀 행 번호 (1행은 열 이름)
    const rowNumber = index + 2;
    const rawCode = row["상품코드"];
    // 상품코드가 빈 행은 합계 행이라 뺀다
    if (rawCode === undefined || String(rawCode).trim() === "") return;

    const line = toSalesLine(row, storeName);
    if (typeof line === "string") errors.push(`${rowNumber}행: ${line}`);
    else lines.push(line);
  });

  if (errors.length > 0) {
    const examples = errors.slice(0, 5).join("\n");
    const more = errors.length > 5 ? `\n외 ${errors.length - 5}줄` : "";
    return {
      ok: false,
      reason: `읽을 수 없는 줄이 ${errors.length}개 있습니다.\n${examples}${more}`,
    };
  }
  if (lines.length === 0) {
    return { ok: false, reason: "엑셀 파일에서 읽은 판매 줄이 없습니다." };
  }
  return { ok: true, lines };
}

// 엑셀 한 줄 → 판매 줄. 잘못된 값이 있으면 이유(문자열)를 돌려준다.
function toSalesLine(row: RawSalesRow, storeName: string): SalesLine | string {
  const 판매일자 = toDateString(row["판매일자"]);
  if (!판매일자) return `판매일자를 읽을 수 없습니다 ("${String(row["판매일자"] ?? "")}")`;

  const 상품코드 = String(row["상품코드"]);
  if (!isValidProductCode(상품코드)) return `잘못된 상품코드입니다 ("${상품코드}")`;

  // 칼라는 DB 경로 키로 쓰므로 상품코드와 같은 기준으로 검사한다
  const 칼라 = String(row["칼라"] ?? "");
  if (!isValidProductCode(칼라)) return `잘못된 칼라입니다 ("${칼라}")`;

  const 사이즈 = toSizeKey(row["사이즈"]);
  if (!사이즈) return `잘못된 사이즈입니다 ("${String(row["사이즈"] ?? "")}")`;

  const 판매수량 = Number(row["판매수량"]);
  if (!Number.isInteger(판매수량) || 판매수량 === 0)
    return `잘못된 판매수량입니다 ("${String(row["판매수량"] ?? "")}")`;

  // 고객명은 비교에만 쓰고 결과에 담지 않는다
  const isStoreSale = String(row["고객명"] ?? "").trim() === storeName;

  return {
    판매일자,
    상품코드,
    상품명: String(row["상품명"] ?? "").trim(),
    칼라,
    사이즈,
    사이즈명: String(row["사이즈명"] ?? "").trim(),
    판매수량,
    isStoreSale,
  };
}

// 판매일자 → "YYYY-MM-DD". 엑셀 날짜 숫자와 "2026-11-14"·"20261114"·"2026.11.14"·"2026/11/14" 글자를 읽는다.
function toDateString(value: unknown): string | null {
  let year: number;
  let month: number;
  let day: number;
  if (typeof value === "number") {
    // 엑셀 날짜 숫자는 1899-12-30부터 센 날 수다 (1900-03-01 이후 날짜 기준).
    // XLSX.SSF는 불러오는 방식에 따라 없을 수 있어 직접 계산한다.
    // 시각이 붙은 값(소수)은 날짜 부분만 쓴다.
    if (!Number.isFinite(value) || value < 61) return null;
    const date = new Date(
      Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000
    );
    [year, month, day] = [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    ];
  } else if (typeof value === "string") {
    // 구분자는 한 종류만 쓰고, 구분자가 없으면 8자리만 받는다 ("2026114"처럼 애매한 값은 막는다)
    const text = value.trim();
    const match =
      text.match(/^(\d{4})([-./])(\d{1,2})\2(\d{1,2})$/)?.filter((_, i) => i !== 2) ??
      text.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!match) return null;
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    return null;
  }
  // 없는 날짜(2월 30일 등)를 막는다
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// 사이즈 → "00"~"19". 숫자로 읽힌 값(5)도 "05"로 바꾼다.
function toSizeKey(value: unknown): SizeKey | null {
  const text = String(value ?? "").trim();
  if (!/^\d{1,2}$/.test(text)) return null;
  const size = text.padStart(2, "0");
  return Number(size) <= 19 ? (size as SizeKey) : null;
}
