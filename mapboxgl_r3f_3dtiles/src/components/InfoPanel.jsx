import React from 'react';

function InfoPanel({ tilesLoaded, stats, tilesetUrl }) {
  return (
    <div className="info-panel">
      <h2>3D Tiles Renderer</h2>
      
      <div className="status">
        <span className={`status-dot ${tilesLoaded ? 'loaded' : ''}`}></span>
        <span>{tilesLoaded ? 'Tileset Loaded' : 'Loading...'}</span>
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

      <div className="url-box">
        <div className="url-label">Tileset URL</div>
        <div style={{ fontSize: '11px', marginTop: '4px', wordBreak: 'break-all' }}>
          {tilesetUrl}
        </div>
      </div>
    </div>
  );
}

export default InfoPanel;
