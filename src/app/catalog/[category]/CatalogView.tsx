"use client";

import { useMemo, useState } from "react";
import CatalogFilters from "@/components/CatalogFilters";
import ProductCard from "@/components/ProductCard";
import SortDropdown from "@/components/SortDropdown";
import { getCategoryFacets, getProductsByCategory, type CategoryKey, type SortKey } from "@/lib/products";

type CatalogViewProps = {
  category: CategoryKey;
};

export default function CatalogView({ category }: CatalogViewProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("popular");
  const [filterOpen, setFilterOpen] = useState({ brand: true, size: false });

  const facets = useMemo(() => getCategoryFacets(category), [category]);
  const products = useMemo(
    () => getProductsByCategory(category, { brands: selectedBrands, sizes: selectedSizes, sort: sortBy }),
    [category, selectedBrands, selectedSizes, sortBy]
  );

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  };
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

  return (
    <div className="flex gap-8 flex-wrap items-start">
      <CatalogFilters
        sections={[
          {
            key: "brand",
            label: "Brand",
            options: facets.brands,
            selected: selectedBrands,
            open: filterOpen.brand,
            onToggleOpen: () => setFilterOpen((s) => ({ ...s, brand: !s.brand })),
            onToggleOption: toggleBrand,
          },
          {
            key: "size",
            label: "Size",
            options: facets.sizes,
            selected: selectedSizes,
            open: filterOpen.size,
            onToggleOpen: () => setFilterOpen((s) => ({ ...s, size: !s.size })),
            onToggleOption: toggleSize,
          },
        ]}
      />

      <div className="flex-1 min-w-0" style={{ flexBasis: "480px" }}>
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <span className="text-[13px] text-muted">{products.length} items</span>
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5.5">
            {products.map((product) => (
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
