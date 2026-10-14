export type FabricCategory =
  | 'Banarasi'
  | 'Kanjeevaram'
  | 'Patola'
  | 'Bandhani'
  | 'Tussar'
  | 'AI Reconstruction';

export interface FabricItem {
  id: string;
  name: string;
  category: FabricCategory;
  description: string;
  image: string;
  tags: string[];
  detail: string;
  palette: string[];
  confidence: number;
  weaveType: string;
}

export interface UploadPayload {
  fileName: string;
  category: string;
  description?: string;
}

export interface UploadResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  message: string;
  backendReady: boolean;
  previewUrl?: string;
}

export interface ReconstructionResponse {
  filename: string;
  pattern: {
    tile_size: number | null;
    tile_dimensions: {
      width: number | null;
      height: number | null;
    };
    direction: string;
    confidence: number;
    horizontal_confidence: number;
    vertical_confidence: number;
    reliable: boolean;
  };
  palette: string[];
  image_url: string;
  tile_preview_url: string | null;
}

export interface AnalysisResult {
  jobId: string;
  weaveType: string;
  motif: string;
  confidence: number;
  palette: string[];
  texture: string;
  metadata: Record<string, string | number>;
}

export interface ApiErrorResponse {
  message: string;
  detail?: string;
  details?: string;
}
