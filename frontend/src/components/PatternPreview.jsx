function PatternPreview({ imageSrc, patternSize, confidence }) {
  return (
    <div className="panel preview-panel">
      <h3>Pattern preview</h3>
      <div className="preview-frame">
        {imageSrc ? (
          <img src={imageSrc} alt="Fabric preview" />
        ) : (
          <div className="preview-placeholder">No preview yet</div>
        )}
      </div>
      <div className="stats-row">
        <span>Tile size: {patternSize ?? '—'}</span>
        <span>Confidence: {confidence ? `${confidence.toFixed(1)}%` : '—'}</span>
      </div>
    </div>
  );
}

export default PatternPreview;
