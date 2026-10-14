import { useParams } from 'react-router-dom';
import { fabrics } from '../data/fabrics';

function AnalysisPage() {
  const { id } = useParams();
  const fabric = fabrics.find((item) => item.id === id) ?? fabrics[0];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">Pattern analysis</p>
        <h1 className="mt-2 font-serif text-5xl text-[#382B27]">{fabric.name}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="overflow-hidden rounded-[28px] border border-[#e7dcc8] bg-white p-4 shadow-soft">
              <img src={fabric.image} alt={fabric.name} className="h-[300px] w-full rounded-[20px] object-cover" />
            </div>
            <div className="overflow-hidden rounded-[28px] border border-[#e7dcc8] bg-white p-4 shadow-soft">
              <img src={fabric.image} alt={`${fabric.name} reconstruction`} className="h-[300px] w-full rounded-[20px] object-cover" />
            </div>
          </div>

          <div className="rounded-[28px] border border-[#e7dcc8] bg-white p-5 shadow-soft">
            <h2 className="font-serif text-3xl text-[#382B27]">Weave information</h2>
            <p className="mt-4 text-base leading-7 text-[#5f4d49]">{fabric.detail}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#f7efe7] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7a564d]">Category</p>
                <p className="mt-2 font-medium text-[#382B27]">{fabric.category}</p>
              </div>
              <div className="rounded-2xl bg-[#f7efe7] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7a564d]">Weave type</p>
                <p className="mt-2 font-medium text-[#382B27]">{fabric.weaveType}</p>
              </div>
              <div className="rounded-2xl bg-[#f7efe7] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7a564d]">Confidence</p>
                <p className="mt-2 font-medium text-[#382B27]">{fabric.confidence}%</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[28px] border border-[#e7dcc8] bg-white p-5 shadow-soft">
          <h2 className="font-serif text-3xl text-[#382B27]">Palette</h2>
          <div className="mt-5 space-y-4">
            {fabric.palette.map((color) => (
              <div key={color} className="flex items-center gap-3 rounded-2xl bg-[#faf4ee] p-3">
                <span className="h-10 w-10 rounded-full border border-[#e5d8c5]" style={{ background: color }} />
                <span className="text-sm font-medium text-[#382B27]">{color}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-[#f7efe7] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7a564d]">Available metadata</p>
            <ul className="mt-3 space-y-2 text-sm text-[#5d4b49]">
              <li>Source: Traditional textile archive</li>
              <li>Tile confidence: {fabric.confidence}%</li>
              <li>Pattern type: {fabric.weaveType}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AnalysisPage;
