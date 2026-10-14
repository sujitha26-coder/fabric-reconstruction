import { useEffect, useState } from 'react';
import { Bookmark, FolderOpen, Search, Star } from 'lucide-react';
import { getLibraryProjects } from '../services/api';

function TextileLibraryPage() {
  const [projects, setProjects] = useState<Array<Record<string, any>>>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const payload = await getLibraryProjects(search || undefined);
        setProjects(payload.items || []);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [search]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ad583b]">Development archive</p>
          <h1 className="mt-2 font-serif text-5xl text-[#382B27]">My Textile Library</h1>
        </div>

        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a645e]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-full border border-[#e7dcc8] bg-white px-4 py-3 pl-11 text-sm text-[#382B27] outline-none focus:border-[#b65335]"
            placeholder="Search textile projects and notes"
          />
        </div>
      </div>

      <div role="note" className="mb-6 border border-[#e6c9a8] bg-[#fff8ee] p-4 text-sm leading-6 text-[#6b5141]">
        This development library has no authentication or per-user access controls, and its records reset when the backend restarts. Do not store private client work here.
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-dashed border-[#d8c6b2] bg-white/60 p-10 text-center text-[#5f4d49]">
          Loading your textile archive...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#d8c6b2] bg-white/60 p-10 text-center text-[#5f4d49]">
          No saved textile projects yet. Upload a fabric and start building your collection.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="rounded-[28px] border border-[#e7dcc8] bg-white/80 p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#382B27]">
                  <FolderOpen className="h-4 w-4 text-[#70263A]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">{project.fabric_category || 'Unsorted'}</span>
                </div>
                <button type="button" className="rounded-full border border-[#e7dcc8] bg-[#faf5ef] p-2 text-[#70263A]">
                  <Star className="h-4 w-4" fill={project.favorite ? '#d9a94e' : 'none'} />
                </button>
              </div>

              <div className="rounded-[22px] border border-[#efdfc6] bg-[#f9f3eb] p-3">
                <div className="flex h-36 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#f4e7d8] to-[#e5d2b4] text-[#382B27]">
                  <Bookmark className="h-10 w-10 opacity-70" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <h2 className="font-serif text-2xl text-[#382B27]">{project.title}</h2>
                  <p className="mt-2 text-sm text-[#5b463f]">{project.description || 'No notes added yet.'}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-[#5b463f]">
                  <span className="rounded-full bg-[#f4e8dc] px-2.5 py-1">{project.status || 'active'}</span>
                  <span className="rounded-full bg-[#f4e8dc] px-2.5 py-1">{project.favorite ? 'Favorite' : 'Standard'}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#6a514d]">
                  <span>Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}</span>
                  <button type="button" className="font-medium text-[#70263A]">Open</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default TextileLibraryPage;
