import { useRef, useState } from "react";
import * as XLSX from "xlsx";
// import "./firebase/firebaseConfig";
import { deleteData, saveExcelData } from "./firebase/firebaseDatabase";
import type { ExcelDataType } from "./types";

// const columnOrder = [
//   "상품코드",
//   "상품명",
//   "칼라",
//   "수량",
//   "00",
//   "01",
//   "02",
//   "03",
//   "04",
//   "05",
//   "06",
//   "07",
//   "08",
//   "09",
//   "10",
//   "11",
//   "12",
//   "13",
//   "14",
//   "15",
//   "16",
//   "17",
//   "18",
//   "19",
// ];

// 엑셀 파일을 선택함과 동시에 데이터를 파이어베이스에 저장 ->
const ExcelManager = () => {
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
      const excelDataList = XLSX.utils
        .sheet_to_json(sheet)
        .splice(1) as ExcelDataType[];
      console.log(excelDataList[0]);
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
