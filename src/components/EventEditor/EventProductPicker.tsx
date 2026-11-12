import { useMemo, useState } from "react";
import { saveEventProductCodes } from "../../firebase/firebaseDatabase";
import type { FilterOptionsType, ProductType } from "../../types";
import {
  categoryOptions,
  genderOptions,
  getFilteredData,
  yearOptions,
} from "../../utils/productFilter";
import PickerChipGroup from "./PickerChipGroup";

type EventProductPickerProps = {
  // 검색·선택 대상이 되는 전체 상품
  allProducts: ProductType[];
  // 현재 DB에 저장된 행사장 상품코드 (처음 체크 상태로 쓴다)
  eventProductCodes: string[];
  // 저장 성공 후 행사장 목록을 다시 읽는 함수
  onSaved: () => Promise<void>;
};

// 행사장 상품 선택 영역 (PC 전용)
// 상품코드·상품명 검색 + 연도·성별·카테고리 칩 필터 + "선택한 것만 보기"로 좁혀 고르고,
// 체크한 목록을 그대로 행사장 목록으로 저장한다.
// 화면에서 가려진 상품도 체크 상태는 그대로 남고, 저장하면 함께 저장된다.
// 부모에서 key로 eventProductCodes를 넘겨, 목록을 다시 읽으면 체크 상태가 새로 초기화된다.
const EventProductPicker: React.FC<EventProductPickerProps> = ({
  allProducts,
  eventProductCodes,
  onSaved,
}) => {
  const [keyword, setKeyword] = useState("");
  // 체크된 상품코드. /product에 없는 기존 코드도 그대로 두어 저장할 때 지워지지 않게 한다.
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(
    () => new Set(eventProductCodes)
  );
  const [isSaving, setIsSaving] = useState(false);
  // 칩 필터 (같은 항목 안은 OR, 항목끼리는 AND — /inventory 필터와 같은 규칙)
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType>({
    year: [],
    gender: [],
    category: [],
  });
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // 검색어 · 칩 필터 · 선택한 것만 보기를 모두 AND로 건다
  const visibleProducts = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    // 상품코드·상품명 검색 (대소문자 구분 없음)
    const searched = query
      ? allProducts.filter(
          (product) =>
            product.상품코드.toLowerCase().includes(query) ||
            (product.상품명 ?? "").toLowerCase().includes(query)
        )
      : allProducts;
    const filtered = getFilteredData(searched, filterOptions);
    return showSelectedOnly
      ? filtered.filter((product) => selectedCodes.has(product.상품코드))
      : filtered;
  }, [allProducts, keyword, filterOptions, showSelectedOnly, selectedCodes]);

  // 칩 하나를 켜고 끈다
  const toggleFilterOption = (key: keyof FilterOptionsType, option: string) => {
    setFilterOptions((prev) => ({
      ...prev,
      [key]: prev[key].includes(option)
        ? prev[key].filter((value) => value !== option)
        : [...prev[key], option],
    }));
  };

  const hasActiveFilter =
    filterOptions.year.length > 0 ||
    filterOptions.gender.length > 0 ||
    filterOptions.category.length > 0;

  const resetFilters = () =>
    setFilterOptions({ year: [], gender: [], category: [] });

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveEventProductCodes([...selectedCodes]);
    } catch (error) {
      console.error(error);
      alert("행사장 목록 저장에 실패했습니다. 다시 시도해주세요.");
      setIsSaving(false);
      return;
    }
    alert(`행사장 목록을 저장했습니다. (${selectedCodes.size}개)`);
    // 다시 읽으면 부모가 key를 바꿔 이 컴포넌트가 새로 그려지므로 저장 중 상태도 풀린다
    setIsSaving(false);
    await onSaved();
  };

  // 상품 데이터를 아직 못 읽었으면 저장을 막는다 (빈 목록으로 덮어쓰는 것을 방지)
  const canSave = !isSaving && allProducts.length > 0;

  return (
    <section className="hidden sm:block bg-white rounded-xl shadow-md p-4">
      <h2 className="text-lg font-bold mb-3">행사장 상품 선택</h2>

      <input
        type="search"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="상품코드 또는 상품명 검색"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-blue-500"
      />

      <div className="flex flex-col gap-2 mb-3">
        <PickerChipGroup
          title="연도"
          options={yearOptions}
          selectedOptions={filterOptions.year}
          onToggle={(option) => toggleFilterOption("year", option)}
        />
        <PickerChipGroup
          title="성별"
          options={genderOptions}
          selectedOptions={filterOptions.gender}
          onToggle={(option) => toggleFilterOption("gender", option)}
        />
        <PickerChipGroup
          title="카테고리"
          options={categoryOptions}
          selectedOptions={filterOptions.category}
          onToggle={(option) => toggleFilterOption("category", option)}
        />
      </div>

      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showSelectedOnly}
            onChange={(event) => setShowSelectedOnly(event.target.checked)}
            className="w-4 h-4"
          />
          선택한 것만 보기
        </label>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{visibleProducts.length}개 표시</span>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilter}
            className="text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
          >
            필터 초기화
          </button>
        </div>
      </div>

      <ul className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {allProducts.length === 0 ? (
          <li className="px-3 py-4 text-center text-gray-500">
            상품 데이터를 불러오는 중...
          </li>
        ) : visibleProducts.length === 0 ? (
          <li className="px-3 py-4 text-center text-gray-500">
            검색 결과가 없습니다
          </li>
        ) : (
          visibleProducts.map((product) => (
            <li key={product.상품코드}>
              <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedCodes.has(product.상품코드)}
                  onChange={() => toggleCode(product.상품코드)}
                  className="w-4 h-4"
                />
                <span className="font-mono text-sm">{product.상품코드}</span>
                <span className="text-sm text-gray-600 truncate">
                  {product.상품명}
                </span>
              </label>
            </li>
          ))
        )}
      </ul>

      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-gray-600">
          선택 {selectedCodes.size}개
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
      </div>
    </section>
  );
};

export default EventProductPicker;
