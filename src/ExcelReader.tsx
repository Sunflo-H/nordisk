import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import fs_config_app from "./firebase/firebaseConfig";
import { child, get, getDatabase, ref, set } from "firebase/database";

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

function writeExcelData(excelData) {
  excelData.forEach((data) => {
    set(ref(db, "product/" + data.상품코드), {
      상품코드: data.상품코드,
      상품명: data.상품명,
      칼라: data.칼라,
      수량: data.수량,
      재고: {
        "00": data["00"],
        "01": data["01"],
        "02": data["02"],
        "03": data["03"],
        "04": data["04"],
        "05": data["05"],
        "06": data["06"],
        "07": data["07"],
        "08": data["08"],
        "09": data["09"],
        10: data["10"],
        11: data["11"],
        12: data["12"],
        13: data["13"],
        14: data["14"],
        15: data["15"],
        16: data["16"],
        17: data["17"],
        18: data["18"],
        19: data["19"],
      },
    });
  });
}

const dbRef = ref(db);

// 엑셀 파일을 선택함과 동시에 데이터를 파이어베이스에 저장
const ExcelReader = () => {
  const [productsData, setProductsData] = useState([]);
  const [blinkedRow, setBlinkedRow] = useState(null);

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

  // const handleRowClick = (index) => {
  //   setBlinkedRow(index);
  //   setTimeout(() => setBlinkedRow(null), 60000); // 0.6초 뒤 초기화
  // };

  function readData() {
    get(child(dbRef, `product`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          console.log(snapshot.val());
          const productsData = Object.entries(snapshot.val()).map(
            ([상품코드, item]) => ({
              상품코드,
              ...item,
            })
          );
          setProductsData(productsData);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  useEffect(() => {
    readData();
  }, []);

  return (
    <div>
      {/* <h1 class="text-3xl font-bold underline">Hello world!</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <table border="1">
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

      <div onClick={() => writeExcelData()}>데이터 덮어쓰기</div>
      {/* <div onClick={readData}>읽기</div> */}
    </div>
  );
};

export default ExcelReader;
