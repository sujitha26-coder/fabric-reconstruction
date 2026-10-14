import { useEffect, useState } from 'react';
import { AlertTriangle, Download, ImageIcon, SlidersHorizontal } from 'lucide-react';
import { inspectFabricQuality } from '../services/api';

function QualityInspectorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.65);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentFile = event.target.files?.[0] || null;
    setFile(currentFile);
    setError('');
  };

  const handleInspect = async () => {
    if (!file) {
      setError('Please choose a fabric image to inspect.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const payload = await inspectFabricQuality(formData);
      setResult(payload);
    } catch (inspectError) {
      setError((inspectError as Error).message || 'Quality inspection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">Quality checks</p>
        <h1 className="mt-2 font-serif text-5xl text-[#382B27]">Weave Quality Inspector</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-[#e7dcc8] bg-white/80 p-6 shadow-soft">
          <label className="block text-sm font-medium text-[#382B27]">Upload textile sample</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFileChange}
            className="mt-3 block w-full rounded-2xl border border-[#e2d4c1] bg-[#faf5ef] p-3 text-sm"
          />

          <button
            type="button"
            onClick={handleInspect}
            disabled={loading || !file}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b65335] px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {loading ? 'Inspecting...' : 'Run Quality Inspection'}
          </button>

          {file && previewUrl && (
            <div className="mt-6 overflow-hidden rounded-[22px] border border-[#e7dcc8] bg-[#faf5ef] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a564d]">Preview</p>
              <div className="relative">
                <img src={previewUrl} alt="Selected textile sample" className="h-60 w-full rounded-2xl object-contain" />
                {showHeatmap && result?.heatmap_url && (
                  <img
                    src={new URL(result.heatmap_url, import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').toString()}
                    alt="Heuristic low-quality-region overlay, not model confidence"
                    className="absolute inset-0 h-60 w-full rounded-2xl object-contain"
                    style={{ opacity: overlayOpacity }}
                  />
                )}
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-[#a53f28]">{error}</p>}
        </div>

        <div className="rounded-[28px] border border-[#e7dcc8] bg-white/80 p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3e8de] text-[#70263A]">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a564d]">Inspection report</p>
              <h2 className="font-serif text-3xl text-[#382B27]">Image Quality Summary</h2>
            </div>
          </div>

          {!result ? (
            <div className="rounded-[24px] border border-dashed border-[#d8c6b2] bg-[#faf5ef] p-8 text-center text-[#5f4d49]">
              Upload a fabric sample to generate the quality assessment and heatmap metadata.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#ebdfcf] bg-[#faf5ef] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7a564d]">Resolution</p>
                  <p className="mt-2 text-2xl font-semibold text-[#382B27]">{result.metrics?.width} × {result.metrics?.height}</p>
                </div>
                <div className="rounded-2xl border border-[#ebdfcf] bg-[#faf5ef] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7a564d]">Brightness</p>
                  <p className="mt-2 text-2xl font-semibold text-[#382B27]">{Number(result.metrics?.brightness || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-[#ebdfcf] bg-[#faf5ef] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7a564d]">Sharpness</p>
                  <p className="mt-2 text-2xl font-semibold text-[#382B27]">{Number(result.metrics?.sharpness || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-[#ebdfcf] bg-[#faf5ef] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7a564d]">Contrast</p>
                  <p className="mt-2 text-2xl font-semibold text-[#382B27]">{Number(result.metrics?.contrast || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#efdfc6] bg-[#f9f3eb] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#382B27]">
                  <AlertTriangle className="h-4 w-4 text-[#b65335]" />
                  <span className="text-sm font-medium">Detected warnings</span>
                </div>
                <ul className="space-y-2 text-sm text-[#5b463f]">
                  {(result.warnings || []).length > 0 ? result.warnings.map((warning: string) => <li key={warning}>• {warning}</li>) : <li>• No major quality warnings were identified in this sample.</li>}
                </ul>
              </div>

              <p className="text-xs leading-5 text-[#75645a]">{result.quality_metadata?.note}</p>

              <div className="flex flex-wrap gap-3">
                <a
                  href={new URL(result.heatmap_url, import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').toString()}
                  download
                  className="inline-flex items-center gap-2 rounded-full border border-[#d5c2a3] bg-[#f9f3eb] px-4 py-2.5 text-sm font-medium text-[#382B27]"
                >
                  <Download className="h-4 w-4" />
                  Download Overlay
                </a>
                <a
                  href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(result, null, 2))}`}
                  download={`quality-report-${result.inspection_id}.json`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d5c2a3] bg-[#f9f3eb] px-4 py-2.5 text-sm font-medium text-[#382B27]"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </a>
                <button type="button" onClick={() => setShowHeatmap((visible) => !visible)} className="inline-flex items-center gap-2 rounded-full bg-[#ad583b] px-4 py-2.5 text-sm font-medium text-white">
                  {showHeatmap ? 'Hide heatmap' : 'View heatmap'}
                </button>
              </div>
              {showHeatmap && (
                <label className="block text-sm text-[#5b463f]">
                  Overlay opacity
                  <input type="range" min="0" max="1" step="0.05" value={overlayOpacity} onChange={(event) => setOverlayOpacity(Number(event.target.value))} className="mt-2 block w-full accent-[#ad583b]" />
                </label>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QualityInspectorPage;
