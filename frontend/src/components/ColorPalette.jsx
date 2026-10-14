function ColorPalette({ palette }) {
  return (
    <div className="panel palette-panel">
      <h3>Suggested palette</h3>
      {palette && palette.length > 0 ? (
        <div className="palette-grid">
          {palette.map((color, index) => (
            <div key={`${color}-${index}`} className="swatch-item">
              <div className="swatch" style={{ backgroundColor: color }} />
              <span>{color}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">Upload an image to generate a palette.</p>
      )}
    </div>
  );
}

export default ColorPalette;
