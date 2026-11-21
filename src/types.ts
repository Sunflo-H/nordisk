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

// 행사장 상품 삭제 방법: 빼기 / 전체 비우기
export type EventDeletionMethod = "remove" | "clear";

// /event/deletionLog/{id} 한 건. 상품은 지운 상품코드 → 지우기 전 분류
export type EventDeletionLogEntry = {
  id: string;
  삭제일시: string;
  방법: EventDeletionMethod;
  상품: EventCategoryMap;
};

// /event/deletionChecks: 지운 상품 중 재고를 확인한 상품코드 → 확인일시
export type EventDeletionChecks = Record<string, string>;

// 상품 카드에 보여 줄 재고 위치 (행사장 목록에 없으면 store_only)
export type StockLocation = EventCategory | "store_only";

// ===== 행사장 보충(/restock) =====

// 판매내역 엑셀 한 줄을 다듬은 값. 고객명은 담지 않고, 매장 판매인지 여부만 남긴다.
export type SalesLine = {
  판매일자: string; // "YYYY-MM-DD"
  상품코드: string;
  상품명: string;
  칼라: string;
  사이즈: SizeKey;
  사이즈명: string;
  판매수량: number; // 반품은 음수
  isStoreSale: boolean; // 고객명이 매장 판매 표시 이름이면 true
};

// 챙길 목록 상태: 챙길 것 / 챙김 / 못 챙김
export type RestockStatus = "pending" | "packed" | "notPacked";

// 못 챙김 사유: 매장 보관 / 품절
export type RestockReason = "keepInStore" | "soldOut";

// /restock/items/{id}
export type RestockItem = {
  판매일자: string;
  상품코드: string;
  상품명: string;
  칼라: string;
  사이즈: SizeKey;
  사이즈명: string;
  수량: number;
  상태: RestockStatus;
  사유?: RestockReason;
  기준재고?: number;
  기준일?: string;
};

// /restock/returns/{id} (수량은 음수 그대로)
export type RestockReturn = {
  판매일자: string;
  상품코드: string;
  상품명: string;
  칼라: string;
  사이즈: SizeKey;
  사이즈명: string;
  수량: number;
  확인함: boolean;
};

// /restock/presales/{id} 선판매 목록 (재고 음수 칸의 행사장 판매, id는 items와 같은 규칙)
// 등록완료: "등록 완료"를 누르면 true. 지우지 않고 표시만 해 화면에서 숨긴다 (잘못 눌러도 되살릴 수 있게)
export type RestockPresale = {
  판매일자: string;
  상품코드: string;
  상품명: string;
  칼라: string;
  사이즈: SizeKey;
  사이즈명: string;
  수량: number;
  등록완료: boolean;
};

// /restock/salesDates/{판매일자}
export type SalesDateInfo = {
  uploadedAt: string; // 올린 날짜 "YYYY-MM-DD"
  rowCount: number; // 그 날짜의 판매내역 줄 수
};

// /restock/sales/{판매일자}/{상품코드}/{칼라}/{사이즈}: 순판매 수량 (반품을 뺀 값)
export type DailySales = Record<string, Record<string, Partial<Record<SizeKey, number>>>>;

// 금일 입고: 상품코드 → 칼라 → 사이즈 → 수량 (전표 상관없이 같은 칸은 더한 값)
export type IncomingQuantities = Record<string, Record<string, Partial<Record<SizeKey, number>>>>;

// /restock/incoming 금일 입고 (하루치 하나, 다시 올리면 통째로 덮어쓴다)
// 재고일이 지금 재고 날짜(/meta/productUploadedAt)와 같을 때만 전산재고에서 뺀다
export type RestockIncoming = {
  재고일: string; // 올릴 때의 재고 날짜 "YYYY-MM-DD"
  uploadedAt: string; // 올린 날짜 "YYYY-MM-DD"
  수량: IncomingQuantities;
};
