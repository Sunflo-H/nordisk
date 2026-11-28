import useStoreSaleName from "../../hooks/useStoreSaleName";
import useUploadStatus from "../../hooks/useUploadStatus";
import ExcelManager, { DeleteAllDataButton } from "../ExcelManager/ExcelManager";
import IncomingUploader from "../Restock/IncomingUploader";
import SalesUploader from "../Restock/SalesUploader";
import StoreSaleNameField from "./StoreSaleNameField";

// 홈의 업로드 묶음 (PC 전용, spec.md Phase 31·32)
// 카드 하나 안에 파일마다 한 줄. 날마다 올리는 순서대로 둔다: 재고 엑셀 → 금일 입고 → 판매내역
const UploadPanel = () => {
  const { stockUploadedAt, incomingUploadedAt, salesUploadedAt, incoming, reload } =
    useUploadStatus();
  const { storeSaleName, setStoreSaleName } = useStoreSaleName();

  return (
    <section
      data-testid="upload-panel"
      className="hidden sm:block pb-10"
    >
      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="font-bold text-gray-700 mb-3">업로드</h2>
        <div className="divide-y divide-gray-100">
          <ExcelManager uploadedAt={stockUploadedAt} onFinished={reload} />
          <IncomingUploader incoming={incoming} uploadedAt={incomingUploadedAt} onSaved={reload} />
          <SalesUploader storeSaleName={storeSaleName} uploadedAt={salesUploadedAt} onSaved={reload}>
            <StoreSaleNameField value={storeSaleName} onChange={setStoreSaleName} />
          </SalesUploader>
        </div>
        <div className="mt-1 pt-2 border-t border-gray-100 flex justify-end">
          <DeleteAllDataButton />
        </div>
      </div>
    </section>
  );
};

export default UploadPanel;
