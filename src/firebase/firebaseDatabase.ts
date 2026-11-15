import { child, get, getDatabase, ref, set, update } from "firebase/database";
import type { Dispatch, SetStateAction } from "react";
import type { SalesUploadPlan } from "../utils/restockPlan";
import type {
  EventCategory,
  EventCategoryMap,
  ProductType,
  UpdatedDataType,
} from "../types";
import "./firebaseConfig";

const db = getDatabase();
const dbRef = ref(db);

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

// /product 전체를 읽어 상품 배열로 돌려준다. 비어 있으면 빈 배열.
// (엑셀 업로드 전 요약 계산용. 실패하면 Promise가 거부된다)
async function readAllProducts(): Promise<ProductType[]> {
  const snapshot = await get(child(dbRef, "product"));
  if (!snapshot.exists()) return [];
  const value = snapshot.val() as Record<string, Omit<ProductType, "상품코드">>;
  return Object.entries(value).map(([상품코드, item]) => ({
    상품코드,
    ...item,
  }));
}

// 재고 엑셀을 올린 날짜를 저장하는 경로 ("YYYY-MM-DD")
const PRODUCT_UPLOADED_AT_PATH = "meta/productUploadedAt";

// /product를 받은 상품 목록으로 통째로 바꾸고, /meta/productUploadedAt에 올린 날짜를 함께 저장한다.
// 새 목록에 없는 상품은 지워진다. 두 경로를 쓰기 한 번(update)으로 묶어 전부 성공하거나 전부 실패한다.
// 빈 목록·잘못된 상품코드·중복 상품코드·잘못된 날짜는 쓰기 전에 막는다 (빈 값으로 /product를 날리지 않도록).
async function replaceAllProducts(
  products: ProductType[],
  uploadedAt: string
): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(uploadedAt))
    throw new Error(`잘못된 업로드 날짜입니다: "${uploadedAt}"`);
  if (products.length === 0) throw new Error("저장할 상품이 없습니다.");
  const productMap: Record<string, ProductType> = {};
  for (const product of products) {
    const code = toSafeProductCode(product.상품코드);
    if (!code || code !== product.상품코드)
      throw new Error(`잘못된 상품코드가 있습니다: "${product.상품코드}"`);
    if (productMap[code])
      throw new Error(`중복된 상품코드가 있습니다: "${code}"`);
    productMap[code] = product;
  }
  // 다중 경로 update에서 각 경로 값은 통째로 바뀐다 (/product 전체 교체와 같다)
  await update(ref(db), {
    product: productMap,
    [PRODUCT_UPLOADED_AT_PATH]: uploadedAt,
  });
}

// 재고 엑셀을 올린 날짜를 읽는다. 아직 저장된 적이 없거나 형식이 다르면 null.
async function readProductUploadedAt(): Promise<string | null> {
  const snapshot = await get(child(dbRef, PRODUCT_UPLOADED_AT_PATH));
  const value: unknown = snapshot.val();
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : null;
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
// 저장 구조: /event/products/{상품코드}: "event_only" | "both" | true
// (상품코드와 분류만 저장, 재고는 /product에서 읽는다. 예전 값 true는 "미분류"로 읽는다)
const EVENT_PRODUCTS_PATH = "event/products";

// DB 값 → 분류. 예전 값 true나 알 수 없는 값은 미분류로 본다.
function toEventCategory(value: unknown): EventCategory {
  return value === "event_only" || value === "both" ? value : "unclassified";
}

// 분류 → DB 값. 미분류는 예전과 같은 true로 저장한다.
function toEventProductValue(category: EventCategory): "event_only" | "both" | true {
  return category === "unclassified" ? true : category;
}

// 행사장에 등록된 상품코드와 분류를 읽는다. 비어 있으면 빈 객체를 돌려준다.
async function readEventCategories(): Promise<EventCategoryMap> {
  const snapshot = await get(child(dbRef, EVENT_PRODUCTS_PATH));
  if (!snapshot.exists()) return {};
  const value = snapshot.val() as Record<string, unknown>;
  const categories: EventCategoryMap = {};
  for (const [code, raw] of Object.entries(value)) {
    categories[code] = toEventCategory(raw);
  }
  return categories;
}

// 상품코드를 다듬어 돌려준다. 비어 있거나 Firebase 키로 쓸 수 없는 문자가 있으면 null.
// (빈 값이 경로에 들어가면 event/products 전체를 가리키게 되므로 반드시 막는다)
function toSafeProductCode(productCode: string): string | null {
  const code = productCode?.trim();
  if (!code || /[.#$[\]/]/.test(code)) return null;
  return code;
}

// 행사장 목록을 받은 상품코드·분류로 통째로 바꾼다. 빈 객체면 목록을 비운다.
// async로 두어 Firebase의 동기 예외도 Promise 거부로 전달되게 한다.
async function saveEventCategories(categories: EventCategoryMap): Promise<void> {
  const products: Record<string, "event_only" | "both" | true> = {};
  for (const [productCode, category] of Object.entries(categories)) {
    const code = toSafeProductCode(productCode);
    if (!code) throw new Error(`잘못된 상품코드가 있습니다: "${productCode}"`);
    products[code] = toEventProductValue(category);
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

// ===== 행사장 보충(/restock) 관련 함수 =====
// 저장 구조는 spec.md "DB 저장 구조". 고객명은 어디에도 저장하지 않는다.
const RESTOCK_PATH = "restock";

// 저장 직전에 다른 곳에서 같은 판매일자를 먼저 저장한 것을 발견했을 때의 오류
class SalesDateConflictError extends Error {
  readonly dates: string[];
  constructor(dates: string[]) {
    super(`이미 저장된 판매일자가 있습니다: ${dates.join(", ")}`);
    this.name = "SalesDateConflictError";
    this.dates = dates;
  }
}

// 이미 올린 판매일자 목록을 읽는다. 비어 있으면 빈 집합.
async function readSalesDates(): Promise<Set<string>> {
  const snapshot = await get(child(dbRef, `${RESTOCK_PATH}/salesDates`));
  if (!snapshot.exists()) return new Set();
  return new Set(Object.keys(snapshot.val() as Record<string, unknown>));
}

// 판매내역 업로드 계획을 쓰기 한 번(update)으로 저장한다 (전부 성공하거나 전부 실패).
// 날짜·항목 단위 경로에 써서 이미 저장된 다른 날짜·항목은 건드리지 않는다.
async function saveSalesUpload(plan: SalesUploadPlan): Promise<void> {
  const dates = Object.keys(plan.salesDates);
  if (dates.length === 0) throw new Error("새로 저장할 판매일자가 없습니다.");

  // 미리보기를 보는 사이 다른 PC·탭에서 같은 날짜를 먼저 저장했을 수 있다.
  // 그대로 쓰면 챙김 상태 등을 "챙길 것"으로 덮어쓰므로, 저장 직전에 다시 읽어 막는다.
  const latestDates = await readSalesDates();
  const conflictDates = dates.filter((date) => latestDates.has(date));
  if (conflictDates.length > 0) throw new SalesDateConflictError(conflictDates);

  const updates: Record<string, unknown> = {};
  for (const date of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new Error(`잘못된 판매일자입니다: "${date}"`);
    updates[`${RESTOCK_PATH}/salesDates/${date}`] = plan.salesDates[date];
    if (plan.sales[date]) updates[`${RESTOCK_PATH}/sales/${date}`] = plan.sales[date];
  }
  for (const [id, item] of Object.entries(plan.items)) {
    updates[`${RESTOCK_PATH}/items/${toSafeKey(id)}`] = item;
  }
  for (const [id, item] of Object.entries(plan.returns)) {
    updates[`${RESTOCK_PATH}/returns/${toSafeKey(id)}`] = item;
  }
  await update(ref(db), updates);
}

// 경로 키로 쓸 수 없는 값이면 쓰기 전에 막는다 (빈 값이면 상위 경로 전체를 덮어쓰게 된다)
function toSafeKey(key: string): string {
  if (!key || /[.#$[\]/]/.test(key)) throw new Error(`잘못된 키입니다: "${key}"`);
  return key;
}

export {
  SalesDateConflictError,
  readSalesDates,
  saveSalesUpload,
  readData,
  readAllProducts,
  replaceAllProducts,
  readProductUploadedAt,
  updateData,
  deleteData,
  readEventCategories,
  saveEventCategories,
  removeEventProductCode,
  clearEventProductCodes,
};
