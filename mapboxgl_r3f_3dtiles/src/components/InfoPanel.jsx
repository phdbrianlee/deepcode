import React from 'react';

function InfoPanel({ tilesLoaded, stats, tilesetUrl, onViewOnMap }) {
  return (
    <div className="info-panel">
      <h2>3D Tiles Renderer</h2>
      
      <div className="status">
        <span className={`status-dot ${tilesLoaded ? 'loaded' : ''}`}></span>
        <span>{tilesLoaded ? 'Tileset Loaded' : (tilesetUrl ? 'Loading...' : 'Not Loaded')}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Processed</div>
          <div className="stat-value">{stats.tilesProcessed}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Loaded</div>
          <div className="stat-value">{stats.tilesLoaded}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">In Frustum</div>
          <div className="stat-value">{stats.tilesInFrustum}</div>
        </div>
      </div>

      {tilesetUrl && (
        <div className="url-box">
          <div className="url-label">Current Tileset</div>
          <div style={{ fontSize: '11px', marginTop: '4px', wordBreak: 'break-all' }}>
            {tilesetUrl.length > 50 ? tilesetUrl.substring(0, 50) + '...' : tilesetUrl}
          </div>
        </div>
      )}

      {tilesLoaded && onViewOnMap && (
        <button 
          className="view-on-map-btn"
          onClick={onViewOnMap}
        >
          View on Map
        </button>
      )}
    </div>
  );
}

export default InfoPanel;
