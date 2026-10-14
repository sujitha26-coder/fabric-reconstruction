import { useEffect, useState } from 'react';
import { Download, Palette, Redo2, Undo2, Save } from 'lucide-react';
import { generateColorway, getColorwayPresets, saveColorway } from '../services/api';

const defaultPalette = ['#7B2D2D', '#D6A867', '#F4E9DE', '#3D2B2D'];

function ColorwayStudioPage() {
  const [palette, setPalette] = useState<string[]>(defaultPalette);
  const [presets, setPresets] = useState<Array<{ name: string; palette: string[] }>>([]);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<string[][]>([defaultPalette]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (!sourceFile) {
      setSourceUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(sourceFile);
    setSourceUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [sourceFile]);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const payload = await getColorwayPresets();
        setPresets(payload.presets || []);
      } catch (error) {
        console.error('Unable to load colorway presets', error);
      }
    };

    loadPresets();
  }, []);

  const commitPalette = (newPalette: string[]) => {
    setPalette(newPalette);
    setHistory((current) => [...current.slice(0, historyIndex + 1), newPalette]);
    setHistoryIndex((current) => current + 1);
    setSaved(false);
  };

  const applyPreset = (newPalette: string[]) => commitPalette(newPalette);

  const updateSwatch = (index: number, value: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;
    commitPalette(palette.map((swatch, swatchIndex) => (swatchIndex === index ? value : swatch)));
  };

  const handleGenerate = async () => {
    if (!sourceFile) {
      setError('Choose a textile image before generating a colorway.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', sourceFile);
      formData.append('palette', JSON.stringify(palette));
      formData.append('strength', '0.85');
      const response = await generateColorway(formData);
      response.output.preview_url = new URL(response.output.preview_url, import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').toString();
      setResult(response);
      setSaved(false);
    } catch (generateError) {
      setError((generateError as Error).message || 'Colorway generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await saveColorway(result.colorway_id);
      setSaved(true);
    } catch (saveError) {
      setError((saveError as Error).message || 'Unable to save this colorway.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">Palette design</p>
        <h1 className="mt-2 font-serif text-5xl text-[#382B27]">Colorway Studio</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] border border-[#e7dcc8] bg-white/80 p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3e8de] text-[#70263A]">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a564d]">Custom palette</p>
              <h2 className="font-serif text-3xl text-[#382B27]">Palette Editor</h2>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#382B27]">
              Source textile image
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { setSourceFile(event.target.files?.[0] || null); setResult(null); setError(''); }} className="mt-2 block w-full rounded-xl border border-[#e5d8c5] bg-[#faf5ef] p-3 text-sm" />
            </label>
            {sourceUrl && <img src={sourceUrl} alt="Source textile for colorway transformation" className="h-48 w-full rounded-lg border border-[#e9dcc8] bg-[#faf5ef] object-contain" />}
            {palette.map((swatch, index) => (
              <div key={`${swatch}-${index}`} className="flex items-center gap-3 rounded-2xl border border-[#e9dcc8] bg-[#faf5ef] p-3">
                <input
                  type="color"
                  value={swatch}
                  onChange={(event) => updateSwatch(index, event.target.value)}
                  className="h-12 w-12 rounded-xl border-none bg-transparent"
                />
                <input
                  type="text"
                  value={swatch}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(nextValue)) updateSwatch(index, nextValue);
                    else if (nextValue.length <= 7) setPalette((current) => current.map((color, colorIndex) => colorIndex === index ? nextValue : color));
                  }}
                  className="w-full rounded-xl border border-[#e5d8c5] bg-white px-3 py-2 text-sm text-[#382B27] outline-none"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={handleGenerate} className="inline-flex items-center gap-2 rounded-full bg-[#b65335] px-5 py-3 text-sm font-medium text-white" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Colorway'}
            </button>
            <button type="button" onClick={() => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setPalette(history[historyIndex - 1]); } }} disabled={historyIndex === 0} className="inline-flex items-center gap-2 rounded-full border border-[#d5c2a3] bg-[#f9f3eb] px-5 py-3 text-sm font-medium text-[#382B27] disabled:opacity-40">
              <Undo2 className="h-4 w-4" />
              Undo
            </button>
            <button type="button" onClick={() => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setPalette(history[historyIndex + 1]); } }} disabled={historyIndex >= history.length - 1} className="inline-flex items-center gap-2 rounded-full border border-[#d5c2a3] bg-[#f9f3eb] px-5 py-3 text-sm font-medium text-[#382B27] disabled:opacity-40">
              <Redo2 className="h-4 w-4" />
              Redo
            </button>
            <button type="button" onClick={handleSave} disabled={!result || saved} className="inline-flex items-center gap-2 rounded-full border border-[#d5c2a3] bg-[#f9f3eb] px-5 py-3 text-sm font-medium text-[#382B27] disabled:opacity-40">
              <Save className="h-4 w-4" />
              {saved ? 'Saved' : 'Save Colorway'}
            </button>
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-[#a53f28]">{error}</p>}
        </div>

        <div className="rounded-[28px] border border-[#e7dcc8] bg-white/80 p-6 shadow-soft">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a564d]">Preset looks</p>
            <h2 className="mt-1 font-serif text-3xl text-[#382B27]">Quick transformations</h2>
          </div>

          <div className="space-y-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset.palette)}
                className="flex w-full items-center justify-between rounded-2xl border border-[#e9dcc8] bg-[#faf5ef] p-3 text-left"
              >
                <div>
                  <p className="font-medium text-[#382B27]">{preset.name}</p>
                  <p className="text-xs text-[#6a514d]">Preserve pattern structure</p>
                </div>
                <div className="flex gap-2">
                  {preset.palette.map((color) => (
                    <span key={`${preset.name}-${color}`} className="h-7 w-7 rounded-full border border-white" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-[#efdfc6] bg-[#f9f3eb] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-[#382B27]">Generated result</p>
              {result && <a href={result.output?.preview_url} download className="inline-flex items-center gap-2 text-sm font-medium text-[#ad583b]">
                <Download className="h-4 w-4" />
                Download
              </a>}
            </div>

            {result ? (
              <div className="space-y-2">
                <p className="text-sm text-[#5b463f]">{result.output?.name}</p>
                <img src={result.output.preview_url} alt="Generated palette-mapped textile preview" className="h-56 w-full rounded-lg border border-[#e9dcc8] bg-white object-contain" />
                <div className="flex gap-2">
                  {(result.palette || []).map((color: string) => (
                    <span key={color} className="h-9 w-9 rounded-full border border-white" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#5b463f]">Choose a source textile and generate a luminance-preserving palette mapping.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColorwayStudioPage;
