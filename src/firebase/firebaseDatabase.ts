import {
  child,
  get,
  getDatabase,
  ref,
  runTransaction,
  set,
  update,
} from "firebase/database";
import type { Dispatch, SetStateAction } from "react";
import type { SalesUploadPlan } from "../utils/restockPlan";
import type {
  DailySales,
  EventCategory,
  EventCategoryMap,
  ProductType,
  RestockItem,
  RestockReason,
  RestockReturn,
  RestockStatus,
  SalesDateInfo,
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

// 챙길 목록 화면에서 쓰는 /restock 데이터 (sales는 입고 알림 계산용)
export type RestockLists = {
  items: Record<string, RestockItem>;
  returns: Record<string, RestockReturn>;
  salesDates: Record<string, SalesDateInfo>;
  sales: Record<string, DailySales>;
};

// 챙길 목록·반품 확인 목록·올린 판매일자·판매 기록을 읽는다. 비어 있는 경로는 빈 객체.
async function readRestockLists(): Promise<RestockLists> {
  const [items, returns, salesDates, sales] = await Promise.all(
    ["items", "returns", "salesDates", "sales"].map((name) =>
      get(child(dbRef, `${RESTOCK_PATH}/${name}`))
    )
  );
  return {
    items: (items.val() ?? {}) as Record<string, RestockItem>,
    returns: (returns.val() ?? {}) as Record<string, RestockReturn>,
    salesDates: (salesDates.val() ?? {}) as Record<string, SalesDateInfo>,
    sales: (sales.val() ?? {}) as Record<string, DailySales>,
  };
}

// 챙길 목록 상태 바꾸기: 챙길 것으로 되돌림 / 챙김 / 못 챙김(사유)
export type RestockStatusChange =
  | { 상태: "pending" }
  | { 상태: "packed" }
  | { 상태: "notPacked"; 사유: RestockReason };

// 화면에 보이던 상태와 DB의 지금 상태가 다를 때 (다른 기기에서 먼저 바꾼 경우).
// current는 DB의 지금 항목이라 화면을 이것으로 바꾸면 된다.
class StaleRestockItemError extends Error {
  readonly current: RestockItem;
  constructor(current: RestockItem) {
    super("다른 기기에서 먼저 바뀐 항목입니다.");
    this.name = "StaleRestockItemError";
    this.current = current;
  }
}

// 챙길 목록 항목 하나의 상태를 바꾸고, 저장된 항목을 돌려준다.
// expectedStatus는 화면에 보이던 상태다. DB의 지금 상태가 다르면 쓰지 않고 StaleRestockItemError를 던진다
// (예: 폰 화면에는 챙김인데 PC에서 못 챙김으로 바꾼 항목을 되돌려 기준재고가 경고 없이 지워지는 것을 막는다).
// 못 챙김으로 바꿀 때 그 칼라·사이즈의 지금 재고(/product)와 재고 날짜(/meta/productUploadedAt)를
// 기준재고·기준일로 함께 저장한다. 이미 못 챙김인 항목의 사유만 바꿀 때는 기준을 그대로 둔다
// (기준을 새로 잡으면 그 사이 들어온 입고를 놓치게 되므로).
// 확인과 쓰기 사이에 다른 곳에서 항목을 지워도 반쪽 항목이 생기지 않도록 트랜잭션으로 쓴다.
async function changeRestockItemStatus(
  id: string,
  change: RestockStatusChange,
  expectedStatus: RestockStatus
): Promise<RestockItem> {
  const itemRef = ref(db, `${RESTOCK_PATH}/items/${toSafeKey(id)}`);
  const snapshot = await get(itemRef);
  if (!isRestockLine(snapshot.val())) throw new Error("챙길 목록에 없는 항목입니다.");
  const current = snapshot.val() as RestockItem;
  if (current.상태 !== expectedStatus) throw new StaleRestockItemError(current);
  // 못 챙김으로 바꿀 때 쓸 새 기준 (트랜잭션 함수는 동기라 미리 읽어 둔다)
  const baseline =
    change.상태 === "notPacked" ? await readStockBaseline(current) : null;

  let isMissing = false;
  // 콜백 안에서만 바뀌므로 null로 좁혀지지 않게 단언으로 선언한다
  let staleItem = null as RestockItem | null;
  const result = await runTransaction(itemRef, (value: unknown) => {
    // 처음에는 로컬 캐시 값(null)으로 불릴 수 있다. null을 돌려주면 서버 값과 다를 때 다시 불린다.
    if (value === null) return null;
    if (!isRestockLine(value)) {
      isMissing = true;
      return undefined; // 형식이 다른 값은 건드리지 않고 중단
    }
    const item = value as RestockItem;
    // 읽은 뒤 쓰기 전 사이에 다른 기기에서 상태를 바꿨으면 중단
    if (item.상태 !== expectedStatus) {
      staleItem = item;
      return undefined;
    }
    const next: RestockItem = { ...item, 상태: change.상태 };
    delete next.사유;
    delete next.기준재고;
    delete next.기준일;
    if (change.상태 === "notPacked" && baseline) {
      next.사유 = change.사유;
      const keepBaseline =
        item.상태 === "notPacked" &&
        typeof item.기준재고 === "number" &&
        typeof item.기준일 === "string";
      next.기준재고 = keepBaseline ? item.기준재고 : baseline.기준재고;
      next.기준일 = keepBaseline ? item.기준일 : baseline.기준일;
    }
    return next;
  });
  if (staleItem) throw new StaleRestockItemError(staleItem);
  const saved: unknown = result.snapshot.val();
  if (isMissing || !result.committed || !isRestockLine(saved))
    throw new Error("챙길 목록에 없는 항목입니다. 새로고침해 주세요.");
  return saved as RestockItem;
}

// DB 값이 판매일자·상품코드·칼라·사이즈를 가진 항목인지 (반쪽 항목·삭제된 항목 구분용)
function isRestockLine(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return ["판매일자", "상품코드", "칼라", "사이즈"].every(
    (key) => typeof line[key] === "string"
  );
}

// 항목의 칼라·사이즈 지금 재고와 재고 날짜를 DB에서 새로 읽는다.
// 재고 엑셀에 그 상품·칼라·사이즈가 없으면 재고 0으로 본다. 값의 형식이 다르면 막는다.
// 재고 날짜가 없으면 입고 계산을 할 수 없으므로 막는다.
async function readStockBaseline(
  item: Pick<RestockItem, "상품코드" | "칼라" | "사이즈">
): Promise<{ 기준재고: number; 기준일: string }> {
  const stockPath = `product/${toSafeKey(item.상품코드)}/재고/${toSafeKey(item.칼라)}/${toSafeKey(item.사이즈)}`;
  const [stockSnapshot, 기준일] = await Promise.all([
    get(child(dbRef, stockPath)),
    readProductUploadedAt(),
  ]);
  if (!기준일)
    throw new Error("재고 기준일이 없습니다. 재고 엑셀을 먼저 올려 주세요.");
  const stock: unknown = stockSnapshot.val();
  if (stock === null) return { 기준재고: 0, 기준일 };
  if (typeof stock !== "number" || !Number.isFinite(stock))
    throw new Error(`재고 값의 형식이 맞지 않습니다: ${String(stock)}`);
  return { 기준재고: stock, 기준일 };
}

// 반품·교환 확인 목록의 "확인함"을 바꾼다 (없는 항목에 반쪽 항목이 생기지 않도록 트랜잭션)
async function setRestockReturnChecked(id: string, checked: boolean): Promise<void> {
  const returnRef = ref(db, `${RESTOCK_PATH}/returns/${toSafeKey(id)}`);
  let isMissing = false;
  const result = await runTransaction(returnRef, (value: unknown) => {
    if (value === null) return null;
    if (!isRestockLine(value)) {
      isMissing = true;
      return undefined;
    }
    return { ...(value as RestockReturn), 확인함: checked };
  });
  if (isMissing || !result.committed || !isRestockLine(result.snapshot.val()))
    throw new Error("반품 확인 목록에 없는 항목입니다. 새로고침해 주세요.");
}

// 챙길 목록에서 항목 하나를 지운다 (반품·교환을 확인한 뒤 사용자가 직접 고른 항목).
// 판매 기록(/restock/sales)은 그대로 두어 입고 계산에는 영향이 없다.
async function deleteRestockItem(id: string): Promise<void> {
  await set(ref(db, `${RESTOCK_PATH}/items/${toSafeKey(id)}`), null);
}

export {
  SalesDateConflictError,
  StaleRestockItemError,
  readSalesDates,
  saveSalesUpload,
  readRestockLists,
  changeRestockItemStatus,
  setRestockReturnChecked,
  deleteRestockItem,
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
