export type SizeKey =
  | "00"
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19";

// 파이어베이스 DB에 저장된 상품 데이터의 타입
export type ProductType = {
  상품코드: string;
  상품명: string;
  연도: number;
  카테고리: string;
  성별: string;
  판매가: number;
  칼라: string[];
  재고: {
    [칼라: string]: {
      [key in SizeKey]: number;
    };
  };
};

// 엑셀 한줄한줄의 데이터의 타입
// ! 아직 어떠한 데이터 가공도 이루어지지 않았다.
export type ExcelDataType = {
  상품코드: string;
  상품명: string;
  칼라: string;
  재고: number;
  판매가: number;
} & {
  [key in SizeKey]: number;
};

export type UpdatedDataType = {
  [updatePaths: string]: ProductType;
};

export type MergedExcelDataType = {
  상품코드: string;
  상품명: string;
  판매가: number;
  칼라: string[];
  재고: {
    [칼라: string]: {
      [key in SizeKey]: number;
    };
  };
};

export type FilterOptionsType = {
  year: string[];
  gender: string[];
  category: string[];
};

// 행사장 상품 분류 (DB /event/products 값)
// event_only: 행사장에만 있음, both: 행사장·매장 둘 다, unclassified: 아직 분류 안 함(예전 값 true)
export type EventCategory = "event_only" | "both" | "unclassified";

// 상품코드 → 행사장 분류
export type EventCategoryMap = Record<string, EventCategory>;

// 상품 카드에 보여 줄 재고 위치 (행사장 목록에 없으면 store_only)
export type StockLocation = EventCategory | "store_only";
