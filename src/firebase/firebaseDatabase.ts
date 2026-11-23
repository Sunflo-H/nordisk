import {
  child,
  get,
  getDatabase,
  push,
  ref,
  runTransaction,
  set,
  update,
} from "firebase/database";
import type { Dispatch, SetStateAction } from "react";
import type { SalesUploadPlan } from "../utils/restockPlan";
import { toLocalDateString, toLocalDateTimeString } from "../utils/date";
import { parseEventDeletionLog } from "../utils/eventDeletionLog";
import { getPhysicalStock } from "../utils/physicalStock";
import { normalizeRestockItem } from "../utils/restockView";
import type {
  DailySales,
  EventCategory,
  EventCategoryMap,
  EventDeletionChecks,
  EventDeletionLogEntry,
  EventDeletionMethod,
  IncomingQuantities,
  ProductType,
  RestockIncoming,
  RestockItem,
  RestockPresale,
  RestockReason,
  RestockReturn,
  RestockStatus,
  SalesDateInfo,
  SizeKey,
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

// 삭제 기록 경로. 구조는 spec.md "삭제 기록"
const EVENT_DELETION_LOG_PATH = "event/deletionLog";

// 행사장 상품을 지우면서 삭제 기록을 함께 남긴다. 둘을 update 한 번으로 묶어 전부 성공하거나 전부 실패한다.
// deletedProducts: 지울 상품코드 → 지우기 전 DB 값. 비어 있으면 아무것도 쓰지 않는다.
async function deleteEventProductsWithLog(
  deletedProducts: Record<string, unknown>,
  method: EventDeletionMethod,
  removalUpdates: Record<string, null>
): Promise<void> {
  if (Object.keys(deletedProducts).length === 0) return;
  // push는 키만 만들고 아직 쓰지 않는다 (실제 쓰기는 아래 update 한 번)
  const logKey = push(ref(db, EVENT_DELETION_LOG_PATH)).key;
  if (!logKey) throw new Error("삭제 기록 키를 만들지 못했습니다.");
  await update(ref(db), {
    ...removalUpdates,
    [`${EVENT_DELETION_LOG_PATH}/${logKey}`]: {
      삭제일시: toLocalDateTimeString(),
      방법: method,
      상품: deletedProducts,
    },
  });
}

// 행사장 목록에서 상품 하나를 뺀다. 원본 /product는 건드리지 않는다.
// 지우기 직전 DB 값을 다시 읽어 기록에 적는다. 이미 없으면 아무것도 쓰지 않는다.
async function removeEventProductCode(productCode: string): Promise<void> {
  const code = toSafeProductCode(productCode);
  if (!code) throw new Error("상품코드가 비어 있거나 잘못되었습니다.");
  const path = `${EVENT_PRODUCTS_PATH}/${code}`;
  const snapshot = await get(child(dbRef, path));
  if (!snapshot.exists()) return;
  await deleteEventProductsWithLog({ [code]: snapshot.val() }, "remove", {
    [path]: null,
  });
}

// 행사장 목록을 전부 비운다. 원본 /product는 건드리지 않는다.
// 지우기 직전 DB의 목록을 다시 읽어 통째로 기록에 적는다. 이미 비어 있으면 아무것도 쓰지 않는다.
async function clearEventProductCodes(): Promise<void> {
  const snapshot = await get(child(dbRef, EVENT_PRODUCTS_PATH));
  if (!snapshot.exists()) return;
  const value: unknown = snapshot.val();
  // 객체가 아니면(예상 밖 형식) 기록 없이 지우거나 "비웠다"고 잘못 알리지 않도록 막는다
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("행사장 목록 형식이 예상과 다릅니다.");
  await deleteEventProductsWithLog(
    value as Record<string, unknown>,
    "clear",
    { [EVENT_PRODUCTS_PATH]: null }
  );
}

// 지운 상품 재고 확인 체크 경로. 구조는 spec.md "삭제 기록"
const EVENT_DELETION_CHECKS_PATH = "event/deletionChecks";

// 재고를 확인한 상품코드 → 확인일시를 읽는다. 형식이 다른 값은 건너뛴다.
async function readEventDeletionChecks(): Promise<EventDeletionChecks> {
  const snapshot = await get(child(dbRef, EVENT_DELETION_CHECKS_PATH));
  const value: unknown = snapshot.val();
  const checks: EventDeletionChecks = {};
  if (typeof value !== "object" || value === null) return checks;
  for (const [code, raw] of Object.entries(value)) {
    if (typeof raw !== "object" || raw === null) continue;
    const checkedAt: unknown = (raw as Record<string, unknown>).확인일시;
    if (typeof checkedAt === "string") checks[code] = checkedAt;
  }
  return checks;
}

// 상품 하나의 재고 확인 체크를 켜거나 끈다. 켜면 확인일시를 적고, 끄면 그 상품의 체크만 지운다.
// 켰을 때 적은 확인일시를 돌려준다 (끄면 null).
async function setEventDeletionCheck(
  productCode: string,
  checked: boolean
): Promise<string | null> {
  const code = toSafeProductCode(productCode);
  // 빈 상품코드가 경로에 들어가면 체크 전체를 가리키므로 반드시 막는다
  if (!code) throw new Error("상품코드가 비어 있거나 잘못되었습니다.");
  const path = `${EVENT_DELETION_CHECKS_PATH}/${code}`;
  if (!checked) {
    await set(ref(db, path), null);
    return null;
  }
  const checkedAt = toLocalDateTimeString();
  await set(ref(db, path), { 확인일시: checkedAt });
  return checkedAt;
}

// 행사장 상품 삭제 기록을 읽는다. 최근 기록이 앞에 온다. 실패하면 Promise가 거부된다.
async function readEventDeletionLog(): Promise<EventDeletionLogEntry[]> {
  const snapshot = await get(child(dbRef, EVENT_DELETION_LOG_PATH));
  return parseEventDeletionLog(snapshot.val());
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
  for (const [id, item] of Object.entries(plan.presales)) {
    updates[`${RESTOCK_PATH}/presales/${toSafeKey(id)}`] = item;
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

// 챙길 목록 화면에서 쓰는 /restock 데이터 (sales는 입고 알림 계산용, incoming은 실물재고 계산용)
export type RestockLists = {
  items: Record<string, RestockItem>;
  presales: Record<string, RestockPresale>;
  returns: Record<string, RestockReturn>;
  salesDates: Record<string, SalesDateInfo>;
  sales: Record<string, DailySales>;
  incoming: RestockIncoming | null;
};

// 챙길 목록·선판매 목록·반품 확인 목록·올린 판매일자·판매 기록·금일 입고를 읽는다. 비어 있는 경로는 빈 객체.
async function readRestockLists(): Promise<RestockLists> {
  const [items, presales, returns, salesDates, sales] = await Promise.all(
    ["items", "presales", "returns", "salesDates", "sales"].map((name) =>
      get(child(dbRef, `${RESTOCK_PATH}/${name}`))
    )
  );
  const incoming = await readRestockIncoming();
  return {
    // 예전 "매장 보관" 항목은 매장판매로 바꿔 읽는다
    items: Object.fromEntries(
      Object.entries((items.val() ?? {}) as Record<string, RestockItem>).map(([id, item]) => [
        id,
        normalizeRestockItem(item),
      ])
    ),
    presales: (presales.val() ?? {}) as Record<string, RestockPresale>,
    returns: (returns.val() ?? {}) as Record<string, RestockReturn>,
    salesDates: (salesDates.val() ?? {}) as Record<string, SalesDateInfo>,
    sales: (sales.val() ?? {}) as Record<string, DailySales>,
    incoming,
  };
}

// ===== 금일 입고(/restock/incoming) =====
// 하루치 하나만 둔다. 다시 올리면 통째로 덮어쓴다 (2026-11-17 사용자 승인).
const INCOMING_PATH = `${RESTOCK_PATH}/incoming`;

// 금일 입고를 읽는다. 없거나 형식이 다르면 null (실물재고 = 전산재고).
async function readRestockIncoming(): Promise<RestockIncoming | null> {
  const snapshot = await get(child(dbRef, INCOMING_PATH));
  const value: unknown = snapshot.val();
  if (typeof value !== "object" || value === null) return null;
  const incoming = value as Record<string, unknown>;
  if (typeof incoming.재고일 !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(incoming.재고일))
    return null;
  if (typeof incoming.수량 !== "object" || incoming.수량 === null) return null;
  return {
    재고일: incoming.재고일,
    uploadedAt: typeof incoming.uploadedAt === "string" ? incoming.uploadedAt : "",
    수량: incoming.수량 as IncomingQuantities,
  };
}

// 금일 입고를 지금 재고 날짜(/meta/productUploadedAt)에 적용하도록 저장하고, 저장한 값을 돌려준다.
// expectedStockDate는 미리보기에 보여 준 재고 날짜다. 그 사이 재고 엑셀을 새로 올려 날짜가 바뀌었으면 막는다.
async function saveRestockIncoming(
  quantities: IncomingQuantities,
  expectedStockDate: string
): Promise<RestockIncoming> {
  const stockDate = await readProductUploadedAt();
  if (!stockDate) throw new Error("재고 기준일이 없습니다. 재고 엑셀을 먼저 올려 주세요.");
  if (stockDate !== expectedStockDate)
    throw new Error(`재고 날짜가 바뀌었습니다 (${expectedStockDate} → ${stockDate}). 다시 올려 주세요.`);
  const 수량: IncomingQuantities = {};
  for (const [code, colors] of Object.entries(quantities)) {
    for (const [color, sizes] of Object.entries(colors)) {
      for (const [size, quantity] of Object.entries(sizes)) {
        if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0)
          throw new Error(`잘못된 입고 수량입니다: ${code} ${color} ${size} ${String(quantity)}`);
        const colorMap = (수량[toSafeKey(code)] ??= {});
        const sizeMap = (colorMap[toSafeKey(color)] ??= {});
        sizeMap[toSafeKey(size) as SizeKey] = quantity;
      }
    }
  }
  if (Object.keys(수량).length === 0) throw new Error("저장할 입고 수량이 없습니다.");
  const incoming: RestockIncoming = { 재고일: stockDate, uploadedAt: toLocalDateString(), 수량 };
  await set(ref(db, INCOMING_PATH), incoming);
  return incoming;
}

// 챙길 목록 상태 바꾸기: 챙길 것으로 되돌림 / 챙김 / 매장판매 / 못 챙김(사유)
export type RestockStatusChange =
  | { 상태: "pending" }
  | { 상태: "packed" }
  | { 상태: "storeSale" }
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
// DB의 상태는 화면과 같은 규칙(normalizeRestockItem)으로 바꿔 읽은 뒤 비교한다
// (예전 "매장 보관" 항목은 화면에 매장판매로 보이므로).
async function changeRestockItemStatus(
  id: string,
  change: RestockStatusChange,
  expectedStatus: RestockStatus
): Promise<RestockItem> {
  const itemRef = ref(db, `${RESTOCK_PATH}/items/${toSafeKey(id)}`);
  const snapshot = await get(itemRef);
  if (!isRestockLine(snapshot.val())) throw new Error("챙길 목록에 없는 항목입니다.");
  const current = normalizeRestockItem(snapshot.val() as RestockItem);
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
    const item = normalizeRestockItem(value as RestockItem);
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
  return normalizeRestockItem(saved as RestockItem);
}

// DB 값이 판매일자·상품코드·칼라·사이즈를 가진 항목인지 (반쪽 항목·삭제된 항목 구분용)
function isRestockLine(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return ["판매일자", "상품코드", "칼라", "사이즈"].every(
    (key) => typeof line[key] === "string"
  );
}

// 항목의 칼라·사이즈 지금 실물재고(전산재고 − 금일 입고)와 재고 날짜를 DB에서 새로 읽는다.
// 재고 엑셀에 그 상품·칼라·사이즈가 없으면 재고 0으로 본다. 값의 형식이 다르면 막는다.
// 재고 날짜가 없으면 입고 계산을 할 수 없으므로 막는다.
async function readStockBaseline(
  item: Pick<RestockItem, "상품코드" | "칼라" | "사이즈">
): Promise<{ 기준재고: number; 기준일: string }> {
  const stockPath = `product/${toSafeKey(item.상품코드)}/재고/${toSafeKey(item.칼라)}/${toSafeKey(item.사이즈)}`;
  const [stockSnapshot, 기준일, incoming] = await Promise.all([
    get(child(dbRef, stockPath)),
    readProductUploadedAt(),
    readRestockIncoming(),
  ]);
  if (!기준일)
    throw new Error("재고 기준일이 없습니다. 재고 엑셀을 먼저 올려 주세요.");
  const raw: unknown = stockSnapshot.val();
  if (raw !== null && (typeof raw !== "number" || !Number.isFinite(raw)))
    throw new Error(`재고 값의 형식이 맞지 않습니다: ${String(raw)}`);
  // 재고 엑셀에 그 칸이 없으면 전산재고 0
  const systemStock = typeof raw === "number" ? raw : 0;
  // 기준재고는 실물재고(전산재고 − 금일 입고)로 적는다 (spec.md "금일 입고 제외")
  const 기준재고 =
    getPhysicalStock(systemStock, incoming, 기준일, item.상품코드, item.칼라, item.사이즈) ?? 0;
  return { 기준재고, 기준일 };
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

// 선판매 목록의 "등록완료"를 바꾼다. 지우지 않고 표시만 한다 (잘못 눌러도 DB에서 되살릴 수 있게).
// 없는 항목에 반쪽 항목이 생기지 않도록 트랜잭션으로 쓴다.
async function setRestockPresaleRegistered(id: string, registered: boolean): Promise<void> {
  const presaleRef = ref(db, `${RESTOCK_PATH}/presales/${toSafeKey(id)}`);
  let isMissing = false;
  const result = await runTransaction(presaleRef, (value: unknown) => {
    if (value === null) return null;
    if (!isRestockLine(value)) {
      isMissing = true;
      return undefined;
    }
    return { ...(value as RestockPresale), 등록완료: registered };
  });
  if (isMissing || !result.committed || !isRestockLine(result.snapshot.val()))
    throw new Error("선판매 목록에 없는 항목입니다. 새로고침해 주세요.");
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
  readRestockIncoming,
  saveRestockIncoming,
  changeRestockItemStatus,
  setRestockReturnChecked,
  setRestockPresaleRegistered,
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
  readEventDeletionLog,
  readEventDeletionChecks,
  setEventDeletionCheck,
};
