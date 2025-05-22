import { child, get, getDatabase, ref, set, update } from "firebase/database";
import type { Dispatch, SetStateAction } from "react";
import type {
  ExcelDataType,
  FinalDataType,
  ProductType,
  SizeKey,
  UpdatedDataType,
} from "../types";
import "./firebaseConfig";

const db = getDatabase();
const dbRef = ref(db);

function saveExcelData(excelDataList: ExcelDataType[]): void {
  const mergedDataList = mergeExcelData(excelDataList);
  // console.log(excelDataList);
  // console.log(mergeExcelData(excelDataList));
  mergedDataList.forEach((excelData) => {
    console.log(excelData);
  });
  mergedDataList.forEach((product) => {
    set(ref(db, "product/" + product.상품코드), {
      상품코드: product.상품코드,
      상품명: product.상품명,
      재고: product.재고, // 칼라별 사이즈 재고 구조
    });
  });
  // mergedDataList.forEach((excelData) => {
  //   set(ref(db, "product/" + excelData.상품코드), {
  //     상품코드: excelData.상품코드,
  //     상품명: excelData.상품명,
  //     칼라: excelData.칼라,
  //     수량: excelData.수량,
  //     재고: {
  //       "00": excelData["00"],
  //       "01": excelData["01"],
  //       "02": excelData["02"],
  //       "03": excelData["03"],
  //       "04": excelData["04"],
  //       "05": excelData["05"],
  //       "06": excelData["06"],
  //       "07": excelData["07"],
  //       "08": excelData["08"],
  //       "09": excelData["09"],
  //       10: excelData["10"],
  //       11: excelData["11"],
  //       12: excelData["12"],
  //       13: excelData["13"],
  //       14: excelData["14"],
  //       15: excelData["15"],
  //       16: excelData["16"],
  //       17: excelData["17"],
  //       18: excelData["18"],
  //       19: excelData["19"],
  //     },
  //   });
  // });
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
  // Write the new post's data simultaneously in the posts list and the user's post list.
  const updates: UpdatedDataType = {
    //[업데이트할 DB 경로] : 업데이트 할 값,
  };
  updates["/product/" + updatedProduct.상품코드] = updatedProduct;

  update(ref(db), updates);
}

function mergeExcelData(excelRows: ExcelDataType[]): FinalDataType[] {
  const productMap = new Map<string, FinalDataType>();

  excelRows.forEach((row) => {
    const { 상품코드, 상품명, 칼라, 수량, ...sizes } = row;

    // 상품코드로 기존 데이터가 있는지 확인
    if (!productMap.has(상품코드)) {
      productMap.set(상품코드, {
        상품코드,
        상품명,
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

export { saveExcelData, readData, updateData };
