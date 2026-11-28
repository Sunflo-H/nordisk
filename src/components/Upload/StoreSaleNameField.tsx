type StoreSaleNameFieldProps = {
  value: string;
  onChange: (name: string) => void;
};

// 매장 판매 표시 이름 입력칸 (판매내역 업로드에서 매장 판매를 가려내는 데 쓴다)
// 실제 이름은 이 브라우저(localStorage)에만 저장한다 (useStoreSaleName).
const StoreSaleNameField = ({ value, onChange }: StoreSaleNameFieldProps) => (
  <div>
    <label htmlFor="store-sale-name" className="block text-sm font-semibold mb-1">
      매장 판매 표시 이름
    </label>
    <p className="text-xs text-gray-500 mb-2">
      판매내역의 고객명이 이 이름이면 매장 판매로 봅니다. 이 브라우저에만 저장됩니다.
    </p>
    <input
      id="store-sale-name"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="엑셀에 보이는 그대로 입력 (예: 홍*동)"
      autoComplete="off"
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
    />
  </div>
);

export default StoreSaleNameField;
