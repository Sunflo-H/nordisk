import useRestockIncoming from "../../hooks/useRestockIncoming";
import useStoreSaleName from "../../hooks/useStoreSaleName";
import ExcelManager from "../ExcelManager/ExcelManager";
import IncomingUploader from "../Restock/IncomingUploader";
import SalesUploader from "../Restock/SalesUploader";
import StoreSaleNameField from "./StoreSaleNameField";

// 홈의 업로드 묶음 (PC 전용, spec.md Phase 31)
// 날마다 올리는 순서대로 둔다: 재고 엑셀 → 금일 입고 → 판매내역
const UploadPanel = () => {
  const { incoming, reload } = useRestockIncoming();
  const { storeSaleName, setStoreSaleName } = useStoreSaleName();

  return (
    <section data-testid="upload-panel" className="hidden sm:flex flex-col gap-3 pb-10">
      <h2 className="font-bold text-gray-700">업로드</h2>
      <ExcelManager />
      <IncomingUploader incoming={incoming} onSaved={reload} />
      <div className="flex flex-col gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <StoreSaleNameField value={storeSaleName} onChange={setStoreSaleName} />
        <SalesUploader storeSaleName={storeSaleName} />
      </div>
    </section>
  );
};

export default UploadPanel;
