import React, { useEffect, useState } from 'react';
import './VersionHistoryModal.css';

const VersionHistoryModal = ({
  isOpen,
  onClose,
  versions,
  onRevert
}) => {
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (!isOpen) setSelectedVersion(null);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="version-history-modal-backdrop">
      <div className="version-history-modal">
        <div className="version-history-header">
          <h3>Previous Saves</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="version-history-list">
          {versions.length === 0 ? (
            <div className="empty">No previous saves found.</div>
          ) : (
            <ul>
              {versions.map((v, idx) => (
                <li key={v.id || idx} className={selectedVersion === v ? 'selected' : ''}>
                  <label>
                    <input
                      type="radio"
                      name="version"
                      checked={selectedVersion === v}
                      onChange={() => setSelectedVersion(v)}
                    />
                    <span className="version-date">{v.date}</span>
                    <span className="version-time">{v.time}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="version-history-actions">
          <button className="revert-btn" disabled={!selectedVersion} onClick={() => onRevert(selectedVersion)}>
            Revert to this version
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
