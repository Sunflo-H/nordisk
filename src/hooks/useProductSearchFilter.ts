import { useMemo, useState } from "react";
import type { FilterOptionsType, ProductType } from "../types";
import {
  countProductsByOption,
  countSelectedOptions,
  emptyFilterOptions,
  getSearchedFilteredData,
} from "../utils/productFilter";
import { sortProducts, type ProductSortMode } from "../utils/productSort";

export type ProductSearchFilter = {
  keyword: string;
  setKeyword: (keyword: string) => void;
  filterOptions: FilterOptionsType;
  toggleFilterOption: (key: keyof FilterOptionsType, option: string) => void;
  // 검색어와 칩을 모두 지운다 ("필터 초기화"·"해제" 공용)
  clearFilter: () => void;
  // 검색어·칩을 건 결과 (정렬 방식대로 정렬됨)
  filteredProducts: ProductType[];
  // 목록 정렬 방식 (spec.md "숫자순 정렬"). 필터 초기화·해제와 상관없이 따로 유지된다.
  sortMode: ProductSortMode;
  setSortMode: (mode: ProductSortMode) => void;
  // 칩 옆 상품 수 (검색어와 다른 항목 선택을 반영해 실시간으로 센다)
  optionCounts: Record<keyof FilterOptionsType, Record<string, number>>;
  // 검색어나 칩이 하나라도 걸려 있는지
  isFiltering: boolean;
};

// 상품 목록의 검색·필터 상태 (spec.md "검색·필터"). 검색·필터 영역과 목록이 떨어져 있어 페이지에서 한 번 만들어 둘에 넘긴다.
function useProductSearchFilter(products: ProductType[]): ProductSearchFilter {
  const [keyword, setKeyword] = useState("");
  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsType>(emptyFilterOptions);
  const [sortMode, setSortMode] = useState<ProductSortMode>("code");

  const filteredProducts = useMemo(
    () =>
      sortProducts(
        getSearchedFilteredData(products, keyword, filterOptions),
        sortMode
      ),
    [products, keyword, filterOptions, sortMode]
  );

  const optionCounts = useMemo(
    () => ({
      year: countProductsByOption(products, "year", keyword, filterOptions),
      gender: countProductsByOption(products, "gender", keyword, filterOptions),
      category: countProductsByOption(
        products,
        "category",
        keyword,
        filterOptions
      ),
    }),
    [products, keyword, filterOptions]
  );

  // 칩 하나를 켜고 끈다 (누르는 즉시 걸린다)
  const toggleFilterOption = (key: keyof FilterOptionsType, option: string) => {
    setFilterOptions((prev) => ({
      ...prev,
      [key]: prev[key].includes(option)
        ? prev[key].filter((value) => value !== option)
        : [...prev[key], option],
    }));
  };

  const clearFilter = () => {
    setKeyword("");
    setFilterOptions(emptyFilterOptions);
  };

  return {
    keyword,
    setKeyword,
    filterOptions,
    toggleFilterOption,
    clearFilter,
    filteredProducts,
    sortMode,
    setSortMode,
    optionCounts,
    isFiltering:
      keyword.trim() !== "" || countSelectedOptions(filterOptions) > 0,
  };
}

export default useProductSearchFilter;
