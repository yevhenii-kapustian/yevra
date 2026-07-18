"use client";

import { useMemo, useState } from "react";
import CatalogFilters from "@/components/CatalogFilters";
import ProductCard from "@/components/ProductCard";
import SortDropdown from "@/components/SortDropdown";
import { filterAndSortProducts, getCategoryFacets, type EnrichedProduct, type SortKey } from "@/lib/products";

type CatalogViewProps = {
  products: EnrichedProduct[];
};

export default function CatalogView({ products }: CatalogViewProps) {
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("popular");
  const [sizeFilterOpen, setSizeFilterOpen] = useState(false);

  const facets = useMemo(() => getCategoryFacets(products), [products]);
  const filtered = useMemo(
    () => filterAndSortProducts(products, { sizes: selectedSizes, sort: sortBy }),
    [products, selectedSizes, sortBy]
  );

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

  // Accessories mostly have no Size option at all — an empty filter section
  // would just be dead space, so only show it when there's something to filter.
  const filterSections =
    facets.sizes.length > 0
      ? [
          {
            key: "size" as const,
            label: "Size",
            options: facets.sizes,
            selected: selectedSizes,
            open: sizeFilterOpen,
            onToggleOpen: () => setSizeFilterOpen((o) => !o),
            onToggleOption: toggleSize,
          },
        ]
      : [];

  return (
    <div className="flex gap-8 flex-wrap items-start">
      {filterSections.length > 0 && <CatalogFilters sections={filterSections} />}

      <div className="flex-1 min-w-0" style={{ flexBasis: "480px" }}>
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <span className="text-[13px] text-muted">{filtered.length} items</span>
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5.5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} showQuickAdd />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-[oklch(55%_0.02_50)] text-sm">No items match these filters.</div>
        )}
      </div>
    </div>
  );
}
