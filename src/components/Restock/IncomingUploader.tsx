import { useState } from "react";
import {
  readProductUploadedAt,
  saveRestockIncoming,
} from "../../firebase/firebaseDatabase";
import type { UploadedAtState } from "../../hooks/useUploadStatus";
import type { RestockIncoming } from "../../types";
import { sumIncoming } from "../../utils/incomingView";
import { parseIncomingExcel, type ParseIncomingResult } from "../../utils/incomingParser";
import UploadRow from "../Upload/UploadRow";

type IncomingUploaderProps = {
  // 지금 저장된 금일 입고 (없으면 null)
  incoming: RestockIncoming | null;
  // 금일 입고를 마지막으로 올린 날
  uploadedAt: UploadedAtState;
  // 저장에 성공한 뒤 화면 값을 다시 읽는다
  onSaved: () => Promise<void>;
};

// ⓘ 설명 (예전 카드의 안내 문구)
const INCOMING_INFO =
  "아직 도착 안 했을 때만 올립니다. 전산재고에는 잡혔지만 실물이 아직 안 온 입고 엑셀을 올리면, 재고에서 빼서 실물재고로 챙깁니다. 재고 엑셀을 먼저 올려 주세요. 다시 올리면 덮어씁니다.";

// 금일 입고 업로드 줄 (PC 전용, 2026-11-17 사용자 결정. 2026-11-28부터 홈 업로드 묶음에 있다)
// 그날 입고가 아직 매장에 도착하지 않았을 때 올리면 전산재고에서 빼 실물재고로 계산한다.
// 파일 선택 → 검사 → 미리보기 확인창 → 확인하면 /restock/incoming을 통째로 덮어쓴다
const IncomingUploader = ({ incoming, uploadedAt, onSaved }: IncomingUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelected = async (file: File) => {
    setIsUploading(true);
    try {
      const saved = await uploadIncomingFile(file, incoming);
      if (saved) await onSaved();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <UploadRow
      testId="restock-incoming-uploader"
      label="금일 입고"
      info={INCOMING_INFO}
      uploadedAt={uploadedAt}
      isUploading={isUploading}
      onFileSelected={(file) => void handleFileSelected(file)}
    />
  );
};

export default IncomingUploader;

// 금일 입고 파일 하나를 검사하고, 미리보기를 보여 준 뒤 확인하면 저장한다.
// 어느 단계에서든 실패하거나 취소하면 DB에 쓰지 않는다. 저장했으면 true를 돌려준다.
async function uploadIncomingFile(
  file: File,
  previous: RestockIncoming | null
): Promise<boolean> {
  let parsed: ParseIncomingResult;
  try {
    parsed = parseIncomingExcel(await file.arrayBuffer());
  } catch (error) {
    console.error(error);
    alert("엑셀 파일을 읽지 못했습니다. 저장하지 않았습니다.");
    return false;
  }
  if (!parsed.ok) {
    alert(`저장하지 않았습니다.\n${parsed.reason}`);
    return false;
  }

  // 재고 엑셀을 먼저 올려야 그 재고 날짜에 적용할 수 있다
  let stockDate: string | null;
  try {
    stockDate = await readProductUploadedAt();
  } catch (error) {
    console.error(error);
    alert("재고 기준일을 읽지 못했습니다. 저장하지 않았습니다.");
    return false;
  }
  if (!stockDate) {
    alert("재고 엑셀을 먼저 올려 주세요. 저장하지 않았습니다.");
    return false;
  }

  const lines = [
    `"${file.name}" 금일 입고를 저장합니다.`,
    "",
    `· 입고 ${parsed.lineCount}줄 → 상품 ${parsed.productCount}개, 칸 ${parsed.cellCount}개, 전체 ${parsed.totalQuantity}장`,
    `· 재고일 ${stockDate}의 전산재고에서 빼서 실물재고로 계산합니다.`,
  ];
  if (previous) {
    lines.push(
      "",
      `이미 저장된 금일 입고(재고일 ${previous.재고일}, ${sumIncoming(previous)}장)를 덮어씁니다.`
    );
  }
  lines.push("", "저장할까요?");
  if (!window.confirm(lines.join("\n"))) {
    alert("취소했습니다. 아무것도 저장하지 않았습니다.");
    return false;
  }

  try {
    await saveRestockIncoming(parsed.quantities, stockDate);
  } catch (error) {
    console.error(error);
    alert(
      `저장에 실패했습니다. 아무것도 저장하지 않았습니다.\n${error instanceof Error ? error.message : ""}`
    );
    return false;
  }
  alert(`저장했습니다. (재고일 ${stockDate}, 전체 ${parsed.totalQuantity}장)`);
  return true;
}

