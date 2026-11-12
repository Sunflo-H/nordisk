import * as XLSX from "xlsx";
import type {
  ExcelDataType,
  MergedExcelDataType,
  ProductType,
  SizeKey,
} from "../types";

// 엑셀 재고 파일 → 상품 데이터 변환
// 규칙은 spec.md "엑셀 데이터 관리 > 데이터 규칙"을 따른다.

// 사이즈 코드 "00" ~ "19"
const sizeKeys = Array.from({ length: 20 }, (_, i) =>
  i.toString().padStart(2, "0")
) as SizeKey[];

// 반드시 있어야 하는 열 (없으면 재고 파일이 아니라고 보고 저장하지 않는다)
const requiredColumns = ["상품코드", "상품명", "칼라", "판매가", ...sizeKeys];

// 변환 결과: 성공하면 상품 목록, 실패하면 사용자에게 보여 줄 이유
export type ParseExcelResult =
  | { ok: true; products: ProductType[] }
  | { ok: false; reason: string };

// 비어 있거나, 앞뒤 공백이 있거나, Firebase 키로 쓸 수 없는 문자가 있으면 잘못된 상품코드로 본다
// (DB 저장 함수 replaceAllProducts와 같은 기준이라 저장 단계에서 뒤늦게 실패하지 않는다)
export function isValidProductCode(code: unknown): code is string {
  return (
    typeof code === "string" &&
    code !== "" &&
    code === code.trim() &&
    !/[.#$[\]/]/.test(code)
  );
}

// 엑셀 파일 내용(ArrayBuffer)을 읽어 검사한 뒤 상품 데이터로 바꾼다
export function parseInventoryExcel(data: ArrayBuffer): ParseExcelResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array" });
  } catch {
    return { ok: false, reason: "엑셀 파일을 읽을 수 없습니다." };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { ok: false, reason: "엑셀 파일에 시트가 없습니다." };

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
      reason: `재고 파일에 필요한 열이 없습니다: ${missingColumns.join(", ")}`,
    };
  }

  // 첫 번째 행(속성 행)과 마지막 행(합계)은 상품이 아니므로 뺀다
  const excelRows = XLSX.utils
    .sheet_to_json<ExcelDataType>(sheet)
    .slice(1, -1);

  const invalidCodes = excelRows
    .map((row) => row.상품코드)
    .filter((code) => !isValidProductCode(code));
  if (invalidCodes.length > 0) {
    const examples = invalidCodes
      .slice(0, 5)
      .map((code) => `"${String(code ?? "")}"`)
      .join(", ");
    return {
      ok: false,
      reason: `잘못되었거나 비어 있는 상품코드가 ${invalidCodes.length}개 있습니다: ${examples}`,
    };
  }

  const products = transformExcelData(mergeExcelData(excelRows));
  if (products.length === 0) {
    return { ok: false, reason: "엑셀 파일에서 읽은 상품이 없습니다." };
  }
  return { ok: true, products };
}

/** 상품코드가 같은 엑셀 행을 합쳐 칼라별 재고 데이터로 만드는 함수 */
function mergeExcelData(excelRows: ExcelDataType[]): MergedExcelDataType[] {
  const productMap = new Map<string, MergedExcelDataType>();

  excelRows.forEach((row) => {
    const { 상품코드, 상품명, 칼라, 판매가 } = row;
    // 상품코드로 기존 데이터가 있는지 확인
    let product = productMap.get(상품코드);
    if (!product) {
      product = { 상품코드, 상품명, 칼라: [], 판매가, 재고: {} };
      productMap.set(상품코드, product);
    }

    // 해당 상품의 재고에 칼라 추가 + 사이즈별 수량 추가
    // (빈 칸은 엑셀에서 읽히지 않으므로 값이 있는 사이즈만 넣는다)
    const stock = {} as Record<SizeKey, number>;
    sizeKeys.forEach((size) => {
      if (row[size] !== undefined) stock[size] = row[size];
    });
    product.재고[칼라] = stock;
  });

  return Array.from(productMap.values());
}

// 상품코드로 성별·연도·카테고리를 계산해 상품 데이터로 바꾸는 함수
function transformExcelData(
  mergedExcelDataList: MergedExcelDataType[]
): ProductType[] {
  return mergedExcelDataList.map((data) => {
    const 상품코드 = data.상품코드;
    const 성별코드 = 상품코드.charAt(1);
    const 연도코드 = 상품코드.slice(3, 5);
    const 카테고리코드 = 상품코드.charAt(5);

    const 성별: string =
      { M: "남성", W: "여성", U: "공용", X: "키즈" }[성별코드] || "기타";
    const 연도: number = parseInt(연도코드, 10);
    const 카테고리: string =
      {
        "1": "자켓",
        "2": "티셔츠",
        "3": "바지",
        "4": "셔츠",
        "5": "패딩",
        "6": "베스트",
        "7": "고어텍스",
        // "M":"반팔티셔츠",
        "9": "용품",
        K: "스웨터",
        W: "원피스",
        Q: "큐롯",
        "8": "속옷",
        G: "등산화",
        N: "일반 신발",
        C: "모자",
        V: "장갑",
        S: "양말",
        B: "가방",
        A: "캠핑용품",
      }[카테고리코드] || "악세사리";
    return {
      상품코드,
      상품명: data.상품명,
      연도,
      카테고리,
      성별,
      칼라: Object.keys(data.재고),
      판매가: data.판매가,
      재고: data.재고,
    };
  });
}
