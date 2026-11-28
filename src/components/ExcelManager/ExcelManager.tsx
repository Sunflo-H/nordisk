import { useState } from "react";
import {
  deleteData,
  readAllProducts,
  replaceAllProducts,
} from "../../firebase/firebaseDatabase";
import type { UploadedAtState } from "../../hooks/useUploadStatus";
import {
  parseInventoryExcel,
  type ParseExcelResult,
} from "../../utils/excelParser";
import {
  summarizeUpload,
  type UploadSummary,
} from "../../utils/uploadSummary";
import { toLocalDateString } from "../../utils/date";
import UploadRow from "../Upload/UploadRow";

type ExcelManagerProps = {
  // 재고 엑셀을 마지막으로 올린 날
  uploadedAt: UploadedAtState;
  // 올리기를 마친 뒤(저장·취소 상관없이) 올린 날을 다시 읽는다
  onFinished: () => Promise<void>;
};

// 재고 엑셀 업로드 줄 (PC 전용, 홈 업로드 묶음 안에 있다)
// 업로드: 파일 선택 → 검사 → 요약 확인창 → 확인하면 /product 전체 교체 → 저장이 끝난 뒤 결과 알림
const ExcelManager = ({ uploadedAt, onFinished }: ExcelManagerProps) => {
  // 업로드 처리 중에는 버튼을 막아 중복 저장을 막는다
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelected = async (file: File) => {
    setIsUploading(true);
    try {
      await uploadExcelFile(file);
      // uploadExcelFile은 저장 여부를 돌려주지 않으므로 끝나면 늘 다시 읽는다 (읽기만)
      await onFinished();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <UploadRow
      testId="stock-excel-uploader"
      label="재고 엑셀"
      uploadedAt={uploadedAt}
      isUploading={isUploading}
      onFileSelected={(file) => void handleFileSelected(file)}
    />
  );
};

export default ExcelManager;

// 모든 상품 데이터 삭제 버튼 (홈 업로드 묶음 아래쪽의 작은 회색 글자 버튼, 동작은 예전 그대로)
export const DeleteAllDataButton = () => {
  const handleDeleteAllProducts = () => {
    if (confirm("정말 모든 상품 데이터를 삭제하시겠습니까?")) {
      alert("정상적으로 모든 상품 데이터를 삭제했습니다.");
      deleteData();
    } else {
      alert("취소했습니다.");
    }
  };

  return (
    <button
      type="button"
      data-testid="delete-all-data"
      onClick={handleDeleteAllProducts}
      className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 hover:underline"
    >
      데이터 삭제
    </button>
  );
};

// 엑셀 파일 하나를 검사하고, 요약을 보여 준 뒤 확인하면 /product를 통째로 바꾼다.
// 어느 단계에서든 실패하거나 취소하면 DB에 쓰지 않는다.
async function uploadExcelFile(file: File) {
  // 1. 엑셀 읽기 + 필수 열·상품코드 검사
  let parsed: ParseExcelResult;
  try {
    parsed = parseInventoryExcel(await file.arrayBuffer());
  } catch (error) {
    console.error(error);
    alert("엑셀 파일을 읽지 못했습니다. 저장하지 않았습니다.");
    return;
  }
  if (!parsed.ok) {
    alert(`저장하지 않았습니다.\n${parsed.reason}`);
    return;
  }

  // 2. 현재 DB와 비교해 요약 만들기
  let summary: UploadSummary;
  try {
    summary = summarizeUpload(await readAllProducts(), parsed.products);
  } catch (error) {
    console.error(error);
    alert("현재 상품 데이터를 읽지 못했습니다. 저장하지 않았습니다.");
    return;
  }

  // 3. 요약 확인창 (취소하면 끝)
  if (!window.confirm(formatSummary(file.name, summary))) {
    alert("취소했습니다. 상품 데이터는 바뀌지 않았습니다.");
    return;
  }

  // 4. /product 전체 교체 + 올린 날짜 저장 (쓰기 한 번) → 끝난 뒤 결과 알림
  try {
    await replaceAllProducts(parsed.products, toLocalDateString());
  } catch (error) {
    console.error(error);
    alert("저장에 실패했습니다. 상품 데이터는 업로드 전 그대로입니다.");
    return;
  }
  alert(`저장했습니다. (상품 ${summary.totalCount}개)`);
}

// 요약 확인창 문구. 사라지는 상품은 몇 개만 예로 보여 준다.
function formatSummary(fileName: string, summary: UploadSummary) {
  const { totalCount, addedCodes, removedCodes, changedCodes } = summary;
  const lines = [
    `"${fileName}"의 내용으로 상품 데이터를 통째로 바꿉니다.`,
    "",
    `· 상품 수: ${totalCount}개`,
    `· 새 상품: ${addedCodes.length}개`,
    `· 사라지는 상품: ${removedCodes.length}개`,
    `· 재고·판매가가 바뀐 상품: ${changedCodes.length}개`,
  ];
  if (removedCodes.length > 0) {
    const examples = removedCodes.slice(0, 5).join(", ");
    const more = removedCodes.length > 5 ? ` 외 ${removedCodes.length - 5}개` : "";
    lines.push("", `사라지는 상품: ${examples}${more}`);
  }
  lines.push("", "저장할까요?");
  return lines.join("\n");
}
