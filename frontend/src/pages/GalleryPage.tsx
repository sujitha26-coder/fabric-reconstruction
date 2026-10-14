import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import FabricCard from '../components/fabric/FabricCard';
import { categories, fabrics } from '../data/fabrics';

function GalleryPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('All');

  const filtered = useMemo(() => {
    return fabrics.filter((item) => {
      const queryMatch =
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

      const categoryMatch =
        selectedCategory === 'All' || item.category === selectedCategory;

      return queryMatch && categoryMatch;
    });
  }, [query, selectedCategory]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="mb-8 flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">Curated archive</p>
          <h1 className="mt-2 font-serif text-5xl text-[#382B27]">Fabric Gallery</h1>
        </div>

        <div className="rounded-[24px] border border-[#e9dcc8] bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a645e]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-full border border-[#e7dcc8] bg-[#faf5ef] py-3 pl-11 pr-4 text-sm text-[#382B27] outline-none focus:border-[#b65335]"
                placeholder="Search textile stories, categories, and motifs"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] transition ${
                    selectedCategory === category
                      ? 'border-[#b65335] bg-[#f4e8dc] text-[#70263A]'
                      : 'border-[#e5d8c5] bg-white text-[#5c4b49] hover:border-[#c8a57a]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <FabricCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-[#d8c6b2] bg-white/60 p-10 text-center text-[#5f4d49]">
          No matching fabric records are available for the current filter.
        </div>
      )}
    </div>
  );
}

export default GalleryPage;
