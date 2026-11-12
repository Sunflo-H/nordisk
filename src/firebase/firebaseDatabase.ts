import { child, get, getDatabase, ref, set, update } from "firebase/database";
import type { Dispatch, SetStateAction } from "react";
import type { ProductType, UpdatedDataType } from "../types";
import "./firebaseConfig";

const db = getDatabase();
const dbRef = ref(db);

function saveToFirebase(productDataList: ProductType[]): void {
  productDataList.forEach((product) => {
    const productRef = ref(db, "product/" + product.상품코드);
    set(productRef, product);
  });
}

// firebase에서 데이터를 가져와 productsData 상태를 업데이트하는 함수
// 이 함수는 컴포넌트가 마운트될 때 호출되어야 합니다
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
  const productsRef = ref(db, "product");

  set(productsRef, null)
    .then(() => {
      console.log("모든 product가 성공적으로 삭제되었습니다.");
    })
    .catch((error) => {
      console.error("삭제 중 오류 발생:", error);
    });
}

// ===== 행사장(/event) 관련 함수 =====
// 저장 구조: /event/products/{상품코드}: true (상품코드만 저장, 재고는 /product에서 읽는다)
const EVENT_PRODUCTS_PATH = "event/products";

// 행사장에 등록된 상품코드 목록을 읽는다. 비어 있으면 빈 배열을 돌려준다.
async function readEventProductCodes(): Promise<string[]> {
  const snapshot = await get(child(dbRef, EVENT_PRODUCTS_PATH));
  if (!snapshot.exists()) return [];
  const value = snapshot.val() as Record<string, boolean>;
  return Object.keys(value);
}

// 상품코드를 다듬어 돌려준다. 비어 있거나 Firebase 키로 쓸 수 없는 문자가 있으면 null.
// (빈 값이 경로에 들어가면 event/products 전체를 가리키게 되므로 반드시 막는다)
function toSafeProductCode(productCode: string): string | null {
  const code = productCode?.trim();
  if (!code || /[.#$[\]/]/.test(code)) return null;
  return code;
}

// 행사장 목록을 받은 상품코드 목록으로 통째로 바꾼다. 빈 배열이면 목록을 비운다.
// async로 두어 Firebase의 동기 예외도 Promise 거부로 전달되게 한다.
async function saveEventProductCodes(productCodes: string[]): Promise<void> {
  const products: Record<string, true> = {};
  for (const productCode of productCodes) {
    const code = toSafeProductCode(productCode);
    if (!code) throw new Error(`잘못된 상품코드가 있습니다: "${productCode}"`);
    products[code] = true;
  }
  const value = Object.keys(products).length > 0 ? products : null;
  await set(ref(db, EVENT_PRODUCTS_PATH), value);
}

// 행사장 목록에서 상품 하나를 뺀다. 원본 /product는 건드리지 않는다.
async function removeEventProductCode(productCode: string): Promise<void> {
  const code = toSafeProductCode(productCode);
  if (!code) throw new Error("상품코드가 비어 있거나 잘못되었습니다.");
  await set(ref(db, `${EVENT_PRODUCTS_PATH}/${code}`), null);
}

// 행사장 목록을 전부 비운다. 원본 /product는 건드리지 않는다.
function clearEventProductCodes(): Promise<void> {
  return set(ref(db, EVENT_PRODUCTS_PATH), null);
}

export {
  saveToFirebase,
  readData,
  updateData,
  deleteData,
  readEventProductCodes,
  saveEventProductCodes,
  removeEventProductCode,
  clearEventProductCodes,
};
