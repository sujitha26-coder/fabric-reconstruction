import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Eraser, Paintbrush, RefreshCw, UploadCloud, Undo2, Redo2 } from 'lucide-react';
import { createRestorationJob, reviewRestorationJob, saveRestorationVersion } from '../services/api';

function RestorationLabPage() {
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [maskReady, setMaskReady] = useState(false);
  const [brushSize, setBrushSize] = useState(24);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    if (!file) {
      setSourceUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setSourceUrl(objectUrl);
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([canvas.toDataURL()]);
      setHistoryIndex(0);
      setMaskReady(false);
    };
    image.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setJob(null);
    setResultUrl('');
    setError('');
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
    const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = brushSize * (canvas.width / bounds.width);
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = 'rgba(255,255,255,0.85)';
    if (event.type === 'pointerdown') {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 0.1, y + 0.1);
      context.stroke();
      return;
    }
    context.lineTo(x, y);
    context.stroke();
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    draw(event);
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL();
    setHistory((current) => [...current.slice(0, historyIndex + 1), snapshot]);
    setHistoryIndex((current) => current + 1);
    setMaskReady(true);
  };

  const restoreMask = (index: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const snapshot = history[index];
    if (!canvas || !context || !snapshot) return;
    const image = new Image();
    image.onload = () => context.clearRect(0, 0, canvas.width, canvas.height);
    image.onload = () => context.drawImage(image, 0, 0);
    image.src = snapshot;
    setHistoryIndex(index);
    setMaskReady(index > 0);
  };

  const handleCreateJob = async () => {
    if (!file || !maskReady) {
      setError('Upload a textile and paint at least one region to restore.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Restoration mask is unavailable.');
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskContext = maskCanvas.getContext('2d');
      if (!maskContext) throw new Error('Unable to create the restoration mask.');
      maskContext.fillStyle = '#000000';
      maskContext.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskContext.drawImage(canvas, 0, 0);
      const maskBlob = await new Promise<Blob>((resolve, reject) => maskCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to export the restoration mask.')), 'image/png'));
      formData.append('mask', maskBlob, 'restoration-mask.png');
      formData.append('strength', '0.5');
      const response = await createRestorationJob(formData);
      setJob(response);
      setResultUrl(new URL(response.result_url, import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').toString());
    } catch (jobError) {
      setError((jobError as Error).message || 'Restoration failed.');
    } finally {
      setLoading(false);
    }
  };

  const review = async (decision: 'approve' | 'reject') => {
    if (!job) return;
    try {
      const response = await reviewRestorationJob(job.job_id, decision);
      setJob((current) => current ? { ...current, approval_status: response.status, approved: decision === 'approve' } : current);
    } catch (reviewError) {
      setError((reviewError as Error).message || 'Unable to record your decision.');
    }
  };

  const saveVersion = async () => {
    if (!job) return;
    try {
      const response = await saveRestorationVersion(job.job_id);
      setJob((current) => current ? { ...current, version: response.version } : current);
    } catch (versionError) {
      setError((versionError as Error).message || 'Unable to save a version.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">Restoration studio</p>
        <h1 className="mt-2 font-serif text-5xl text-[#382B27]">Heritage Restoration Lab</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-[#e7dcc8] bg-white/80 p-6 shadow-soft">
          <div className="rounded-[24px] border-2 border-dashed border-[#d8c7b2] bg-[#faf5ef] p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2e5d9] text-[#70263A]">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="text-lg font-medium text-[#382B27]">Upload a textile and mark regions to inpaint</p>
            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full bg-[#b65335] px-5 py-3 text-sm font-medium text-white">
              Choose File
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFileChange} />
            </label>
          </div>

          {file && sourceUrl && (
            <div className="mt-5 space-y-3 overflow-hidden rounded-[22px] border border-[#e7dcc8] bg-[#faf5ef] p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-full border border-[#e7dcc8] bg-white p-1">
                  <button type="button" aria-pressed={tool === 'brush'} onClick={() => setTool('brush')} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${tool === 'brush' ? 'bg-[#ad583b] text-white' : 'text-[#5b463f]'}`}><Paintbrush className="h-3.5 w-3.5" /> Brush</button>
                  <button type="button" aria-pressed={tool === 'eraser'} onClick={() => setTool('eraser')} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${tool === 'eraser' ? 'bg-[#ad583b] text-white' : 'text-[#5b463f]'}`}><Eraser className="h-3.5 w-3.5" /> Eraser</button>
                </div>
                <label className="text-xs text-[#5b463f]">Brush size {brushSize}px<input type="range" min="4" max="80" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} className="ml-2 accent-[#ad583b]" /></label>
                <div className="flex gap-1">
                  <button type="button" aria-label="Undo mask stroke" disabled={historyIndex <= 0} onClick={() => restoreMask(historyIndex - 1)} className="grid h-8 w-8 place-items-center border border-[#e7dcc8] disabled:opacity-40"><Undo2 className="h-4 w-4" /></button>
                  <button type="button" aria-label="Redo mask stroke" disabled={historyIndex >= history.length - 1} onClick={() => restoreMask(historyIndex + 1)} className="grid h-8 w-8 place-items-center border border-[#e7dcc8] disabled:opacity-40"><Redo2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="relative w-full overflow-hidden rounded-lg bg-white">
                <img src={sourceUrl} alt="Fabric restoration source image" className="h-auto w-full select-none" draggable={false} />
                <canvas ref={canvasRef} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} className="absolute inset-0 h-full w-full touch-none cursor-crosshair" />
              </div>
              <p className="text-xs text-[#75645a]">Painted translucent regions will be synthesized by the inpainting baseline. The original remains unchanged.</p>
            </div>
          )}

          {error && <p role="alert" className="mt-3 text-sm text-[#a53f28]">{error}</p>}
          <button type="button" onClick={handleCreateJob} disabled={loading || !file || !maskReady} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b65335] px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
            <RefreshCw className="h-4 w-4" />
            {loading ? 'Creating restoration job...' : 'Start restoration job'}
          </button>
        </div>

        <div className="rounded-[28px] border border-[#e7dcc8] bg-white/80 p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3e8de] text-[#70263A]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a564d]">Restoration job</p>
              <h2 className="font-serif text-3xl text-[#382B27]">Processing status</h2>
            </div>
          </div>

          {!job ? (
            <div className="rounded-[24px] border border-dashed border-[#d8c6b2] bg-[#faf5ef] p-8 text-center text-[#5f4d49]">
              No restoration job is active yet. Start a job to see the masked repair status and result preview.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-[#efdfc6] bg-[#f9f3eb] p-4 text-sm text-[#5b463f]">
                <p><span className="font-medium text-[#382B27]">Job ID:</span> {job.job_id}</p>
                <p><span className="font-medium text-[#382B27]">Status:</span> {job.status}</p>
                <p><span className="font-medium text-[#382B27]">Method:</span> {job.method}</p>
                <p><span className="font-medium text-[#382B27]">Version:</span> {job.version}</p>
              </div>

              {resultUrl && sourceUrl && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><p className="mb-2 text-xs font-medium text-[#5b463f]">Original</p><img src={sourceUrl} alt="Original textile before restoration" className="h-56 w-full rounded-lg border border-[#e7dcc8] bg-white object-contain" /></div>
                  <div><p className="mb-2 text-xs font-medium text-[#5b463f]">Inpainted result</p><img src={resultUrl} alt="OpenCV inpainting result; masked pixels are synthesized" className="h-56 w-full rounded-lg border border-[#e7dcc8] bg-white object-contain" /></div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <a href={resultUrl} download className="inline-flex items-center gap-2 rounded-full border border-[#d5c2a3] bg-[#f9f3eb] px-4 py-2.5 text-sm font-medium text-[#382B27]">
                  <Download className="h-4 w-4" />
                  Download output
                </a>
                <button type="button" onClick={() => review('approve')} className="inline-flex items-center gap-2 rounded-full bg-[#b65335] px-4 py-2.5 text-sm font-medium text-white">Approve restoration</button>
                <button type="button" onClick={() => review('reject')} className="inline-flex items-center gap-2 rounded-full border border-[#d5c2a3] bg-white px-4 py-2.5 text-sm font-medium text-[#382B27]">Reject</button>
                <button type="button" onClick={saveVersion} className="inline-flex items-center gap-2 rounded-full border border-[#d5c2a3] bg-white px-4 py-2.5 text-sm font-medium text-[#382B27]">Save as version</button>
              </div>
              {job.approval_status && <p className="text-sm text-[#5b463f]">Review status: {job.approval_status}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestorationLabPage;
