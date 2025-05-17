import { child, get, getDatabase, ref, set } from "firebase/database";
import type { Dispatch, SetStateAction } from "react";
import type { ProductType } from "../types";

const db = getDatabase();
const dbRef = ref(db);

function writeExcelData(excelData): void {
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

function readData(setProductsData: Dispatch<SetStateAction<ProductType[]>>) {
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

export { writeExcelData, readData };
