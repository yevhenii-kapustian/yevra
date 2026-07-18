type FilterSection = {
  key: "brand" | "size";
  label: string;
  options: string[];
  selected: string[];
  open: boolean;
  onToggleOpen: () => void;
  onToggleOption: (value: string) => void;
};

type CatalogFiltersProps = {
  sections: FilterSection[];
};

export default function CatalogFilters({ sections }: CatalogFiltersProps) {
  return (
    <aside className="w-full lg:w-57.5 lg:flex-none">
      {sections.map((section) => {
        const isSizeFilter = section.key === "size";
        const renderOptions = () => (
          <div className="mt-3 flex flex-col gap-2.5">
            {section.options.map((option) => {
              const checked = section.selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => section.onToggleOption(option)}
                  className="flex items-center gap-2.5 text-[13px] text-[oklch(35%_0.02_50)]"
                >
                  <span
                    className="w-3.75 h-3.75 rounded-[3px] border-[1.5px] flex-none flex items-center justify-center"
                    style={{
                      borderColor: checked ? "var(--accent)" : "oklch(80% 0.01 50)",
                      background: checked ? "var(--accent)" : "transparent",
                    }}
                  >
                    {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        );

        if (isSizeFilter) {
          const renderSummary = () => (
            <summary className="w-full flex items-center justify-between text-[13.5px] font-bold cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span>{section.label}</span>
              <span className="text-base font-normal">
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">−</span>
              </span>
            </summary>
          );

          return (
            <div key={section.key} className="border-b border-line py-4">
              <details className="group min-[1025px]:hidden">
                {renderSummary()}
                {renderOptions()}
              </details>
              <details className="group hidden min-[1025px]:block" open>
                {renderSummary()}
                {renderOptions()}
              </details>
            </div>
          );
        }

        return (
          <div key={section.key} className="border-b border-line py-4">
            <button
              type="button"
              onClick={section.onToggleOpen}
              className="w-full flex items-center justify-between text-[13.5px] font-bold"
            >
              <span>{section.label}</span>
              <span className="text-base font-normal">
                {isSizeFilter ? (
                  <>
                    <span className="min-[1025px]:hidden">{section.open ? "−" : "+"}</span>
                    <span className="max-[1024px]:hidden">−</span>
                  </>
                ) : (
                  section.open ? "−" : "+"
                )}
              </span>
            </button>
            {section.open && renderOptions()}
          </div>
        );
      })}
    </aside>
  );
}
