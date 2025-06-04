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

export type ProductType = {
  상품코드: string;
  상품명: string;
  칼라: string;
  수량: number;
  // 재고: {
  //   [key in SizeKey]: number;
  // };
  재고: {
    [칼라: string]: {
      [key in SizeKey]: number;
    };
  };
};

export type ExcelDataType = {
  상품코드: string;
  상품명: string;
  칼라: string;
  수량: number;
  year: string;
  category: string;
  판매가: number;
} & {
  [key in SizeKey]: number;
};

// export type StockType = {
//   [key in SizeKey]: number;
// };

export type UpdatedDataType = {
  [updatePaths: string]: ProductType;
};

export type ExcelDataType2 = {
  상품코드: string;
  상품명: string;
  수량: number;
  칼라: string;
  재고: {
    칼라: {
      [key in SizeKey]: number;
    };
  };
};

export type FinalDataType = {
  상품코드: string;
  상품명: string;
  재고: {
    [칼라: string]: {
      [key in SizeKey]: number;
    };
  };
};
