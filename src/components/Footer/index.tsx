const FOOTER_COLUMNS = [
  { title: "Shop", items: ["Men", "Women", "Kids", "Sale"] },
  { title: "Help", items: ["Shipping & Returns", "FAQ", "Size Guide", "Contact Us"] },
  { title: "Company", items: ["About", "Careers", "Sustainability"] },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-line px-4 pt-12 pb-7 sm:px-8 lg:px-12 mt-10">
      <div className="flex gap-12 flex-wrap mb-8">
        <div className="flex-1 min-w-40">
          <div className="text-lg font-extrabold tracking-[2px] text-white mb-2.5">YEVRA</div>
          <div className="text-[13px] leading-relaxed text-white/70 max-w-55">
            Considered clothing for everyday life.
          </div>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title} className="flex-1 min-w-35">
            <div className="text-[12.5px] font-bold text-white mb-3">{col.title}</div>
            <div className="flex flex-col gap-2 text-[13px] text-white/70">
              {col.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/20 pt-5 text-xs text-white/60">
        © 2026 Yevra. All rights reserved.
      </div>
    </footer>
  );
}
