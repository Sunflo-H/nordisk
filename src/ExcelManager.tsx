import { useRef } from "react";
import * as XLSX from "xlsx";
import { deleteData, saveExcelData } from "./firebase/firebaseDatabase";
import type { ExcelDataType } from "./types";

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

      // 첫번째 행을 splice하는 이유는 첫번째 행은 상품명, 가격 등의 속성 데이터이기 때문이다.
      const excelDataList = XLSX.utils
        .sheet_to_json(sheet)
        .splice(1) as ExcelDataType[];
      console.log(excelDataList);
      // saveExcelData(excelDataList);
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

export default ExcelManager;
