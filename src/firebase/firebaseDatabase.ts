import { child, get, getDatabase, ref, set, update } from "firebase/database";
import type { Dispatch, SetStateAction } from "react";
import type {
  MergedExcelDataType,
  ProductType,
  UpdatedDataType,
} from "../types";
import "./firebaseConfig";

const db = getDatabase();
const dbRef = ref(db);

function saveToFirebase(productDataList: ProductType[]): void {
  productDataList.forEach((product) => {
    const productRef = ref(db, "product/" + product.상품코드);
    // const { 상품코드, 상품명, 연도, 카테고리, 성별, 재고 } = product;
    set(productRef, product);
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

export { saveToFirebase, readData, updateData, deleteData };
