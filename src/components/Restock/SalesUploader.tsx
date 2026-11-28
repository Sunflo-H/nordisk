import { useState, type ReactNode } from "react";
import {
  SalesDateConflictError,
  readAllProducts,
  readEventCategories,
  readProductUploadedAt,
  readRestockIncoming,
  readSalesDates,
  saveSalesUpload,
} from "../../firebase/firebaseDatabase";
import type { UploadedAtState } from "../../hooks/useUploadStatus";
import { toLocalDateString } from "../../utils/date";
import { getPhysicalStock, isIncomingActive } from "../../utils/physicalStock";
import { planSalesUpload, type SalesUploadPlan } from "../../utils/restockPlan";
import { parseSalesExcel, type ParseSalesResult } from "../../utils/salesParser";
import UploadRow from "../Upload/UploadRow";

type SalesUploaderProps = {
  // 매장 판매 표시 이름 (비어 있으면 업로드를 막는다)
  storeSaleName: string;
  // 판매내역을 마지막으로 올린 날
  uploadedAt: UploadedAtState;
  // 저장에 성공한 뒤 할 일
  onSaved: () => Promise<void>;
  // 줄 아래에 붙일 내용 (매장 판매 표시 이름)
  children?: ReactNode;
};

// ⓘ 설명 (예전 카드의 안내 문구)
const SALES_INFO =
  "금일상품별판매내역 엑셀을 올리면 행사장 판매를 골라 챙길 목록을 만듭니다. 이미 저장된 판매일자는 다시 저장하지 않습니다. 고객명이 아래 매장 판매 이름이면 매장 판매로 봅니다.";

// 판매내역 업로드 줄 (PC 전용, 2026-11-28부터 홈 업로드 묶음에 있다. 그 전에는 판매분 챙기기에서 폰·워치도 썼다)
// 파일 선택 → 검사·판별 → 미리보기 확인창 → 확인하면 /restock에 쓰기 한 번 → 끝난 뒤 결과 알림
const SalesUploader = ({ storeSaleName, uploadedAt, onSaved, children }: SalesUploaderProps) => {
  // 처리 중에는 버튼을 막아 중복 저장을 막는다
  const [isUploading, setIsUploading] = useState(false);

  // 이름 없이 [올리기]를 누르면 파일 선택창을 열지 않고 알린다
  const checkStoreSaleName = () => {
    if (storeSaleName.trim() === "") {
      alert("매장 판매 표시 이름을 먼저 입력해 주세요.");
      return false;
    }
    return true;
  };

  const handleFileSelected = async (file: File) => {
    setIsUploading(true);
    try {
      const saved = await uploadSalesFile(file, storeSaleName);
      if (saved) await onSaved();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <UploadRow
      testId="sales-uploader"
      label="판매내역"
      info={SALES_INFO}
      uploadedAt={uploadedAt}
      isUploading={isUploading}
      beforeOpen={checkStoreSaleName}
      onFileSelected={(file) => void handleFileSelected(file)}
    >
      {children}
    </UploadRow>
  );
};

export default SalesUploader;

// 판매내역 파일 하나를 검사·판별하고, 미리보기를 보여 준 뒤 확인하면 저장한다.
// 어느 단계에서든 실패하거나 취소하면 DB에 쓰지 않는다. 저장했으면 true를 돌려준다.
async function uploadSalesFile(file: File, storeSaleName: string): Promise<boolean> {
  // 1. 엑셀 읽기 + 필수 열 검사 + 매장 판매 판별 (결과에 고객명 없음)
  let parsed: ParseSalesResult;
  try {
    parsed = parseSalesExcel(await file.arrayBuffer(), storeSaleName);
  } catch (error) {
    console.error(error);
    alert("엑셀 파일을 읽지 못했습니다. 저장하지 않았습니다.");
    return false;
  }
  if (!parsed.ok) {
    alert(`저장하지 않았습니다.\n${parsed.reason}`);
    return false;
  }

  // 2. 행사장 목록·이미 올린 날짜·지금 재고·금일 입고를 읽어 계획 만들기
  // (재고를 못 읽으면 선판매를 가를 수 없으므로 저장하지 않는다)
  // 선판매는 실물재고(전산재고 − 금일 입고)가 음수인지로 가른다 (spec.md "금일 입고 제외")
  let plan: SalesUploadPlan;
  let incomingApplied = false;
  try {
    const [eventCategories, uploadedDates, products, stockDate, incoming] = await Promise.all([
      readEventCategories(),
      readSalesDates(),
      readAllProducts(),
      readProductUploadedAt(),
      readRestockIncoming(),
    ]);
    incomingApplied = isIncomingActive(incoming, stockDate);
    const productMap = new Map(products.map((product) => [product.상품코드, product]));
    plan = planSalesUpload(
      parsed.lines,
      new Set(Object.keys(eventCategories)),
      uploadedDates,
      toLocalDateString(),
      (상품코드, 칼라, 사이즈) =>
        getPhysicalStock(
          productMap.get(상품코드)?.재고?.[칼라]?.[사이즈],
          incoming,
          stockDate,
          상품코드,
          칼라,
          사이즈
        )
    );
  } catch (error) {
    console.error(error);
    alert("행사장 목록, 올린 판매일자, 재고, 금일 입고 중 하나를 읽지 못했습니다. 저장하지 않았습니다.");
    return false;
  }

  if (plan.summaries.length === 0) {
    alert(
      `이 파일의 판매내역은 이미 저장되어 있어 다시 저장하지 않았습니다.\n이미 저장된 판매일자: ${plan.skippedDates.join(", ")}`
    );
    return false;
  }

  // 3. 미리보기 확인창 (취소하면 끝)
  if (!window.confirm(formatPreview(file.name, plan, incomingApplied))) {
    alert("취소했습니다. 아무것도 저장하지 않았습니다.");
    return false;
  }

  // 4. 쓰기 한 번으로 저장 → 끝난 뒤 결과 알림
  try {
    await saveSalesUpload(plan);
  } catch (error) {
    console.error(error);
    if (error instanceof SalesDateConflictError) {
      alert(
        `다른 곳에서 같은 날짜를 먼저 저장했습니다. 아무것도 저장하지 않았습니다.\n날짜: ${error.dates.join(", ")}\n새로고침한 뒤 다시 올려 주세요.`
      );
      return false;
    }
    alert("저장에 실패했습니다. 아무것도 저장하지 않았습니다.");
    return false;
  }
  const itemCount = Object.keys(plan.items).length;
  const presaleCount = Object.keys(plan.presales).length;
  const lines = [
    `저장했습니다. (판매일자 ${plan.summaries.length}일, 챙길 목록 ${itemCount}개, 선판매 ${presaleCount}개)`,
  ];
  if (plan.skippedDates.length > 0) {
    lines.push(`이미 저장되어 있어 건너뛴 판매일자: ${plan.skippedDates.join(", ")}`);
  }
  alert(lines.join("\n"));
  return true;
}

// 미리보기 확인창 문구
function formatPreview(fileName: string, plan: SalesUploadPlan, incomingApplied: boolean) {
  const lines = [`"${fileName}" 판매내역을 저장합니다.`, ""];
  for (const summary of plan.summaries) {
    lines.push(
      `· ${summary.판매일자}: 판매 ${summary.rowCount}줄 / 행사장 판매 ${summary.eventLineCount}줄 → 챙길 목록 ${summary.itemCount}개, 선판매 ${summary.presaleCount}개`
    );
  }
  if (plan.skippedDates.length > 0) {
    lines.push("", `이미 저장되어 있어 건너뛸 판매일자: ${plan.skippedDates.join(", ")}`);
  }
  lines.push(
    "",
    "선판매: 지금 재고가 음수인 칸의 판매입니다. 챙길 목록 대신 선판매 목록에 넣습니다. (오늘 재고 엑셀을 먼저 올렸는지 확인해 주세요)",
    incomingApplied
      ? "지금 재고는 금일 입고를 뺀 실물재고로 판단했습니다."
      : "금일 입고는 올리지 않아 전산재고 그대로 판단했습니다.",
    "",
    "저장할까요?"
  );
  return lines.join("\n");
}
