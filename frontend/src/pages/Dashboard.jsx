import { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import PatternPreview from '../components/PatternPreview';
import ColorPalette from '../components/ColorPalette';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setError('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const payload = await response.json();
      setResult(payload);
    } catch (uploadError) {
      setError(uploadError.message || 'Could not upload the image.');
      setResult(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI textile analysis</p>
          <h1>Fabric Reconstruction</h1>
        </div>
      </header>

      <main className="dashboard-grid">
        <ImageUploader
          onFileSelect={handleFileSelect}
          isUploading={isUploading}
          selectedFileName={selectedFile?.name}
        />

        {error && <div className="error-banner">{error}</div>}

        <div className="results-grid">
          <PatternPreview
            imageSrc={result?.image_url ? `${API_BASE_URL}${result.image_url}` : ''}
            patternSize={result?.pattern?.tile_size}
            confidence={result?.pattern?.confidence}
          />

          <ColorPalette palette={result?.palette || []} />
        </div>

        {result && (
          <section className="panel analysis-panel">
            <h3>Analysis summary</h3>
            <ul>
              <li>Filename: {result.filename}</li>
              <li>Detected repeat: {result.pattern?.tile_size || 'n/a'}</li>
              <li>Suggested direction: {result.pattern?.direction || 'n/a'}</li>
              <li>Palette colors: {result.palette?.length || 0}</li>
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
