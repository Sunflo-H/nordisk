import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import fs_config_app from "./firebase/firebaseConfig";
import { readData, writeExcelData } from "./firebase/firebaseDatabase";

// Initialize Firebase
const app = fs_config_app;

const columnOrder = [
  "상품코드",
  "상품명",
  "칼라",
  "수량",
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
];

// 엑셀 파일을 선택함과 동시에 데이터를 파이어베이스에 저장 ->
const ExcelReader = () => {
  const [productsData, setProductsData] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setProductsData(jsonData);
      writeExcelData(jsonData);
    };

    reader.readAsBinaryString(file);
  };

  // useEffect(() => {
  //   readData();
  // }, []);
  const fileInputRef = useRef(null);
  const handleFileInput = () => {
    fileInputRef.current?.click(); // input 클릭 트리거
  };
  return (
    <div>
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
      {/* <table border="1">
        <thead>
          <tr>
            {columnOrder.map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {productsData.map((productData, i) => (
            <tr
              key={i}
              // onClick={() => handleRowClick(i)}
              className={blinkedRow === i ? "blink-row" : ""}
              style={{ cursor: "pointer" }}
            >
              {columnOrder.map((key) => (
                <td key={key}>{productData.재고[key] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table> */}

      {/* <div className="cursor-pointer" onClick={() => writeExcelData()}>
        데이터 업데이트
      </div> */}
      {/* <div onClick={readData}>읽기</div> */}
    </div>
  );
};

export default ExcelReader;
