import { useRef } from "react";
import * as XLSX from "xlsx";
import { deleteData, saveToFirebase } from "./firebase/firebaseDatabase";
import type {
  ExcelDataType,
  MergedExcelDataType,
  ProductType,
  SizeKey,
} from "./types";

// 엑셀 파일을 선택함과 동시에 데이터를 파이어베이스에 저장 ->
const ExcelManager = () => {
  // 엑셀 파일을 읽고 데이터를 변환 후 파이어베이스에 저장한다.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt: ProgressEvent<FileReader>) => {
      const binaryStr = evt.target?.result;
      if (typeof binaryStr !== "string") return;

      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // 첫번째 행과 마지막행을 splice하는 이유 : 첫번째 행은 상품명, 가격 등의 속성 데이터이고, 마지막 행은 총합이기 때문
      const excelDataList = XLSX.utils
        .sheet_to_json(sheet)
        .slice(1, -1) as ExcelDataType[];
      const mergedDataList = mergeExcelData(excelDataList);

      const productDataList = transformExcelData(mergedDataList);
      saveToFirebase(productDataList);
    };

    reader.readAsBinaryString(file);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInput = () => {
    fileInputRef.current?.click(); // input 클릭 트리거
  };

  const handleDeleteAllProducts = () => {
    deleteData();
  };

  return (
    <div className="flex justify-around">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        ref={fileInputRef}
        className="hidden"
      />
      <div
        onClick={handleFileInput}
        className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
      >
        엑셀 파일 업로드
      </div>
      <div
        className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
        onClick={handleDeleteAllProducts}
      >
        데이터 삭제
      </div>
    </div>
  );
};

function transformExcelData(dataList: MergedExcelDataType[]): ProductType[] {
  const transformedDataList: ProductType[] = dataList.map((data) => {
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
        N: "신발",
        C: "모자",
      }[카테고리코드] || "악세사리";

    return {
      상품코드,
      상품명: data.상품명,
      연도,
      카테고리,
      성별,
      재고: data.재고,
    };
  });
  return transformedDataList;
}

/** 상품코드가 동일한 엑셀 데이터를 합쳐 칼라별 재고 데이터로 만드는 함수*/
function mergeExcelData(excelRows: ExcelDataType[]): MergedExcelDataType[] {
  const productMap = new Map<string, MergedExcelDataType>();

  excelRows.forEach((row) => {
    const { 상품코드, 상품명, 칼라, 재고, 판매가, ...sizes } = row;

    // 상품코드로 기존 데이터가 있는지 확인
    if (!productMap.has(상품코드)) {
      productMap.set(상품코드, {
        상품코드,
        상품명,
        칼라,
        판매가,
        재고: {},
      });
    }
    const product = productMap.get(상품코드)!;

    // 해당 상품의 재고에 칼라 추가
    product.재고[칼라] = {} as Record<SizeKey, number>;

    // 사이즈별 수량 추가
    (Object.keys(sizes) as SizeKey[]).forEach((size) => {
      product.재고[칼라][size] = sizes[size];
    });
  });

  const result = Array.from(productMap.values());
  return result;
}

export default ExcelManager;
