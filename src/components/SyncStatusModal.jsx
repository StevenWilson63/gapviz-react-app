// src/components/SyncStatusModal.jsx
import React from 'react';
import './SyncStatusModal.css'; // Optional styling hook

export function SyncStatusModal({ isSyncing, progress }) {
  if (!isSyncing) return null;

  return (
    <div className="sync-status-overlay">
      <div className="sync-status-card">
        <div className="sync-header-row">
          <span className="on-air-badge flashing">ON AIR</span>
          <h3>Metadata Sync in Progress</h3>
        </div>
        <p className="sync-track-info">
          {progress?.currentTrack ? `Processing: ${progress.currentTrack}` : "Gathering playlist and track metadata..."}
        </p>
        
        <div className="sync-progress-bar-container">
          <div 
            className="sync-progress-fill" 
            style={{ width: `${progress?.percent || 0}%` }}
          ></div>
        </div>
        
        <div className="sync-footer-row">
          <span>{progress?.processed || 0} of {progress?.total || 0} tracks processed</span>
          <span className="sync-percent">{progress?.percent || 0}%</span>
        </div>
      </div>
    </div>
  );
}