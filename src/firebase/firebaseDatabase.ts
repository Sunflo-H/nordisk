import {
  child,
  get,
  getDatabase,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
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

  mergedDataList.forEach((product) => {
    const productRef = ref(db, "product/" + product.상품코드);
    get(productRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.log("기존 데이터 있음. 덮어씌움.");
      } else {
        console.log("신규 상품. 새로 등록.");
      }
      set(productRef, product);
    });
    set(ref(db, "product/" + product.상품코드), {
      상품코드: product.상품코드,
      상품명: product.상품명,
      재고: product.재고, // 칼라별 사이즈 재고 구조
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

function deleteData() {
  const productsRef = ref(db, "products");

  set(productsRef, null)
    .then(() => {
      console.log("모든 product가 성공적으로 삭제되었습니다.");
    })
    .catch((error) => {
      console.error("삭제 중 오류 발생:", error);
    });
}

export { saveExcelData, readData, updateData, deleteData };
