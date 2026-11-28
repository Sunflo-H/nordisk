import { useMemo, useState } from "react";
import { saveEventCategories } from "../../firebase/firebaseDatabase";
import type {
  EventCategory,
  EventCategoryMap,
  FilterOptionsType,
  ProductType,
} from "../../types";
import {
  categoryOptions,
  genderOptions,
  getSearchedFilteredData,
  yearOptions,
} from "../../utils/productFilter";
import { locationBadgeLabels } from "../../utils/stockLocation";
import FilterChipGroup from "../Filter/FilterChipGroup";

type EventProductPickerProps = {
  // 검색·선택 대상이 되는 전체 상품
  allProducts: ProductType[];
  // 현재 DB에 저장된 행사장 상품코드·분류 (처음 체크 상태와 분류로 쓴다)
  eventCategories: EventCategoryMap;
  // 저장 성공 후 행사장 목록을 다시 읽는 함수
  onSaved: () => Promise<void>;
};

// 행사장 상품 선택 영역 (PC 전용)
// 상품코드·상품명 검색 + 연도·성별·카테고리 칩 필터 + "선택한 것만 보기"로 좁혀 고르고,
// 상품마다 [매장]·[행사장] 버튼을 켜고 꺼서 분류를 고르고, [행사장]이 켜진 상품을 분류와 함께 그대로 행사장 목록으로 저장한다.
//   [매장]은 모든 상품이 처음부터 켜져 있다. [행사장]만 켜면 둘 다(both), [매장]을 끄면 행사장만(event_only).
//   [행사장]을 끄면 목록에서 빠지고 [매장]은 다시 켜진다. [행사장]이 꺼져 있으면 [매장]은 끌 수 없다.
// 화면에서 가려진 상품도 선택 상태는 그대로 남고, 저장하면 함께 저장된다.
// 부모에서 key로 행사장 목록(상품코드·분류)을 넘겨, 목록을 다시 읽으면 체크 상태가 새로 초기화된다.
const EventProductPicker: React.FC<EventProductPickerProps> = ({
  allProducts,
  eventCategories,
  onSaved,
}) => {
  const [keyword, setKeyword] = useState("");
  // 행사장이 켜진 상품코드 → 분류. /product에 없는 기존 코드도 그대로 두어 저장할 때 지워지지 않게 한다.
  // 미분류(예전 값 true)는 매장+행사장으로 보고 both로 둔다 (저장하면 both로 바뀐다, 2026-11-27 사용자 승인)
  const [selectedCategories, setSelectedCategories] = useState<
    Map<string, EventCategory>
  >(
    () =>
      new Map(
        Object.entries(eventCategories).map(([code, category]) => [
          code,
          category === "unclassified" ? "both" : category,
        ])
      )
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
    // 상품코드·상품명 검색(대소문자 구분 없음) + 칩 필터
    const filtered = getSearchedFilteredData(allProducts, keyword, filterOptions);
    return showSelectedOnly
      ? filtered.filter((product) => selectedCategories.has(product.상품코드))
      : filtered;
  }, [allProducts, keyword, filterOptions, showSelectedOnly, selectedCategories]);

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

  // [행사장] 켜기/끄기: 켜면 매장이 켜진 상태라 둘 다(both)로 넣고, 끄면 목록에서 뺀다 (매장만으로 돌아감)
  const toggleEvent = (code: string) => {
    setSelectedCategories((prev) => {
      const next = new Map(prev);
      if (next.has(code)) next.delete(code);
      else next.set(code, "both");
      return next;
    });
  };

  // [매장] 켜기/끄기: 행사장이 켜진 상품만 바꿀 수 있다 (둘 다 ↔ 행사장만)
  const toggleStore = (code: string) => {
    setSelectedCategories((prev) => {
      const current = prev.get(code);
      if (current === undefined) return prev;
      return new Map(prev).set(code, current === "event_only" ? "both" : "event_only");
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveEventCategories(Object.fromEntries(selectedCategories));
    } catch (error) {
      console.error(error);
      alert("행사장 목록 저장에 실패했습니다. 다시 시도해주세요.");
      setIsSaving(false);
      return;
    }
    alert(`행사장 목록을 저장했습니다. (${selectedCategories.size}개)`);
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
        <FilterChipGroup
          title="연도"
          options={yearOptions}
          selectedOptions={filterOptions.year}
          onToggle={(option) => toggleFilterOption("year", option)}
        />
        <FilterChipGroup
          title="성별"
          options={genderOptions}
          selectedOptions={filterOptions.gender}
          onToggle={(option) => toggleFilterOption("gender", option)}
        />
        <FilterChipGroup
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
          행사장 상품만 보기
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
          visibleProducts.map((product) => {
            const category = selectedCategories.get(product.상품코드);
            const isEventOn = category !== undefined;
            const isStoreOn = category !== "event_only";
            return (
              <li
                key={product.상품코드}
                data-testid="picker-row"
                data-product-code={product.상품코드}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50"
              >
                <div className="flex flex-1 min-w-0 items-center gap-3">
                  <span className="font-mono text-sm">{product.상품코드}</span>
                  <span className="text-sm text-gray-600 truncate">
                    {product.상품명}
                  </span>
                </div>
                <div
                  data-testid="category-select"
                  className="flex shrink-0 items-center gap-1"
                >
                  <LocationToggle
                    testId="toggle-store"
                    label={locationBadgeLabels.store}
                    isOn={isStoreOn}
                    onClass="bg-blue-500 text-white border-blue-500"
                    // 행사장이 꺼져 있으면 매장은 끌 수 없다 (둘 다 꺼진 상품은 없다)
                    disabled={!isEventOn}
                    title={!isEventOn ? "행사장이 꺼져 있으면 매장은 끌 수 없습니다" : undefined}
                    onClick={() => toggleStore(product.상품코드)}
                  />
                  <LocationToggle
                    testId="toggle-event"
                    label={locationBadgeLabels.event}
                    isOn={isEventOn}
                    onClass="bg-emerald-500 text-white border-emerald-500"
                    onClick={() => toggleEvent(product.상품코드)}
                  />
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-gray-600">
          행사장 {selectedCategories.size}개
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

type LocationToggleProps = {
  testId: string;
  label: string;
  isOn: boolean;
  // 켜졌을 때의 색
  onClass: string;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
};

// [매장]·[행사장] 켜고 끄는 버튼 (화면 상태만 바꾸고, "저장"을 눌러야 DB에 반영된다)
const LocationToggle = ({
  testId,
  label,
  isOn,
  onClass,
  disabled = false,
  title,
  onClick,
}: LocationToggleProps) => (
  <button
    type="button"
    data-testid={testId}
    aria-pressed={isOn}
    disabled={disabled}
    title={title}
    onClick={onClick}
    className={`px-2 py-0.5 text-xs rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
      isOn ? onClass : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
    }`}
  >
    {label}
  </button>
);
