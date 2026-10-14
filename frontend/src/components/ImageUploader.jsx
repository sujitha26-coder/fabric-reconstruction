function ImageUploader({ onFileSelect, isUploading, selectedFileName }) {
  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="panel uploader-panel">
      <h3>Upload fabric image</h3>
      <label className="upload-box">
        <input type="file" accept="image/*" onChange={handleChange} />
        <span>{isUploading ? 'Uploading...' : 'Choose image'}</span>
      </label>
      {selectedFileName && <p className="file-name">Selected: {selectedFileName}</p>}
    </div>
  );
}

export default ImageUploader;
