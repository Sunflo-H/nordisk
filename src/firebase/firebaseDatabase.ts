import { child, get, getDatabase, ref, set, update } from "firebase/database";
import type { Dispatch, SetStateAction } from "react";
import type { ExcelDataType, ProductType, UpdatedDataType } from "../types";
import "./firebaseConfig";

const db = getDatabase();
const dbRef = ref(db);

function writeExcelData(excelData: ExcelDataType[]): void {
  console.log(excelData);
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
        const snapshotVal = snapshot.val() as Record<
          string,
          Omit<ProductType, "상품코드">
        >;
        const productsData: ProductType[] = Object.entries(snapshotVal).map(
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

function updateData(updatedProduct: ProductType): void {
  // Get a key for a new Post.
  // const newPostKey = push(child(ref(db), "product")).key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  const updates: UpdatedDataType = {
    //[업데이트할 DB 경로] : 업데이트 할 값,
  };
  updates["/product/" + updatedProduct.상품코드] = updatedProduct;

  update(ref(db), updates);
}

export { writeExcelData, readData, updateData };
