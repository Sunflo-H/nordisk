type FilterOptionProps = {
  title: string;
  options: string[];
  selectedOptions: string[];
  setSelectedOptions: React.Dispatch<React.SetStateAction<string[]>>;
};

const FilterOption: React.FC<FilterOptionProps> = ({
  title,
  options,
  selectedOptions,
  setSelectedOptions,
}) => {
  const handleClick = (year: string) => {
    setSelectedOptions((prev) =>
      prev.includes(year) ? prev.filter((g) => g !== year) : [...prev, year]
    );
  };
  return (
    <div className="flex flex-col items-center px-4 border-b border-gray-200">
      <div className="filter-title w-full text-left text-xl font-bold pt-2 pb-1">
        {title}
      </div>
      <div className="flex w-full gap-2 flex-wrap pb-3 ">
        {options.map((option) => (
          <div
            key={option}
            className={`cursor-pointer px-3 py-1 rounded-full border border-gray-300 hover:border-blue-500 transition-colors duration-200 ${
              selectedOptions.includes(option)
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => handleClick(option)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterOption;
