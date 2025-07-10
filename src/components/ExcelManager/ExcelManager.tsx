import { useRef } from "react";
import * as XLSX from "xlsx";
import type {
  ExcelDataType,
  MergedExcelDataType,
  ProductType,
  SizeKey,
} from "../../types";
import { deleteData, saveToFirebase } from "../../firebase/firebaseDatabase";

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
      // 엑셀데이터에 아직 엑셀에 있는 불필요한 데이터들이 있다. 그걸 없앤 데이터
      const filteredDataList = excelDataList.map((data) => {
        return Object.fromEntries(
          Object.entries(data).filter(([key]) => allowedKeys.includes(key))
        );
      }) as ExcelDataType[];
      const mergedDataList = mergeExcelData(filteredDataList);
      // console.log("mergedDataList", mergedDataList);
      const productDataList = transformExcelData(mergedDataList);
      // console.log("productDataList", productDataList);
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
    <div className="hidden sm:flex justify-around mb-10 gap-4 ">
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

export default ExcelManager;

const allowedKeys = [
  ...Array.from({ length: 20 }, (_, i) => i.toString().padStart(2, "0")), // "00" ~ "19"
  "상품명",
  "상품코드",
  "칼라",
  "판매가",
  "재고",
];

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
        칼라: [],
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

// mergedExcelData를 상품 데이터(연도, 카테고리, 성별 등)로 변환하는 함수
function transformExcelData(
  mergedExcelDataList: MergedExcelDataType[]
): ProductType[] {
  const transformedDataList: ProductType[] = mergedExcelDataList.map((data) => {
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
    const 판매가 = data.판매가;
    const 칼라 = Object.keys(data.재고);
    return {
      상품코드,
      상품명: data.상품명,
      연도,
      카테고리,
      성별,
      칼라,
      판매가,
      재고: data.재고,
    };
  });
  return transformedDataList;
}
