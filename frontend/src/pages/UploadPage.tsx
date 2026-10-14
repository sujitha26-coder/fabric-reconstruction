import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ImageUp, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadFabricImage } from '../services/api';

const uploadSchema = z.object({
  file: z.any().refine((value) => value && value.length > 0, 'Please select a fabric image.'),
  category: z.string().min(1, 'Please choose a fabric category.'),
  description: z.string().max(250).optional()
});

type UploadForm = z.infer<typeof uploadSchema>;

function UploadPage() {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      category: 'Banarasi',
      description: ''
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload JPG, JPEG, PNG, or WebP.');
      return;
    }

    if (file.size > maxSize) {
      setErrorMessage('Image exceeds the 10MB limit. Please choose a smaller file.');
      return;
    }

    setErrorMessage('');
    setPreviewUrl(URL.createObjectURL(file));
    setValue('file', event.target.files, { shouldValidate: true });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector<HTMLInputElement>('input[type="file"][data-fabric-upload]');
    if (input) {
      input.files = transfer.files;
      handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const onSubmit = async (values: UploadForm) => {
    const file = values.file?.[0] as File | undefined;
    if (!file) {
      setErrorMessage('Please choose an image before starting reconstruction.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadFabricImage(formData);
      navigate('/results', {
        state: {
          previewUrl,
          fileName: file.name,
          category: values.category,
          description: values.description,
          result: {
            ...result,
            image_url: new URL(result.image_url, import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').toString(),
            tile_preview_url: result.tile_preview_url
              ? new URL(result.tile_preview_url, import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').toString()
              : null
          }
        }
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Reconstruction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">AI Textile Studio</p>
        <h1 className="mt-2 font-serif text-5xl text-[#382B27]">Bring Your Fabric Pattern to Life</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-[#e7dcc8] bg-white/80 p-6 shadow-soft">
          <div
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-[24px] border-2 border-dashed p-8 text-center transition ${isDragging ? 'border-[#ad583b] bg-[#f5e7d9]' : 'border-[#d8c7b2] bg-[#faf5ef]'}`}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2e5d9] text-[#70263A]">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="text-lg font-medium text-[#382B27]">Drag and drop your fabric image here</p>
            <p className="mt-2 text-sm text-[#5f4d49]">JPG, JPEG, PNG, and WebP up to 10 MB</p>
            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full bg-[#b65335] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#a24b2c]">
              Choose File
              <input data-fabric-upload type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {previewUrl && (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-[#e7dcc8] bg-[#f9f3eb] p-4">
              <p className="mb-3 text-sm font-medium text-[#382B27]">Image Preview</p>
              <img src={previewUrl} alt="Uploaded textile preview" className="h-72 w-full rounded-2xl object-cover" />
            </div>
          )}

          {errorMessage && <p className="mt-4 text-sm text-[#a53f28]">{errorMessage}</p>}
        </div>

        <div className="rounded-[28px] border border-[#e7dcc8] bg-white/80 p-6 shadow-soft">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#382B27]">Fabric category</label>
              <select
                {...register('category')}
                className="w-full rounded-2xl border border-[#e5d8c5] bg-[#faf5ef] px-4 py-3 text-sm outline-none focus:border-[#b65335]"
              >
                <option value="">Unknown / not sure</option>
                <option value="Banarasi">Banarasi</option>
                <option value="Kanjeevaram">Kanjeevaram</option>
                <option value="Patola">Patola</option>
                <option value="Bandhani">Bandhani</option>
                <option value="Tussar">Tussar</option>
                <option value="AI Reconstruction">AI Reconstruction</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#382B27]">Description</label>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="Add context such as weave origin, textile story, or subtle damage areas."
                className="w-full rounded-2xl border border-[#e5d8c5] bg-[#faf5ef] px-4 py-3 text-sm outline-none focus:border-[#b65335]"
              />
            </div>

            {errors.file && <p className="text-sm text-[#a53f28]">{errors.file.message as string}</p>}

            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b65335] px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:bg-[#a44a2d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isProcessing ? 'Processing...' : 'Start Reconstruction'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="rounded-2xl border border-[#eedfc5] bg-[#f9f3eb] p-4 text-sm leading-6 text-[#5a4b48]">
              <div className="mb-2 flex items-center gap-2 font-medium text-[#382B27]">
                <ImageUp className="h-4 w-4 text-[#b65335]" />
                Demo note
              </div>
              The current backend generates a repeat preview using image-processing heuristics. It is not a trained generative AI model, and its repeat score is not a model confidence value.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UploadPage;
