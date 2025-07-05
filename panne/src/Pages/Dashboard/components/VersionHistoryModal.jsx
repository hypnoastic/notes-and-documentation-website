import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import './VersionHistoryModal.css';

const VersionHistoryModal = ({ note, userId, onClose, onRevert }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const versionsRef = collection(db, 'users', userId, 'notes', note.id, 'versions');
        const versionsQuery = query(versionsRef, orderBy('timestamp', 'desc'));
        const versionsSnap = await getDocs(versionsQuery);
        
        const fetchedVersions = versionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        
        setVersions(fetchedVersions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching versions:', error);
        setLoading(false);
      }
    };

    if (note && userId) {
      fetchVersions();
    }
  }, [note, userId]);

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="version-history-modal">
      <div className="version-history-content">
        <div className="version-history-header">
          <h2>Version History</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="version-history-body">
          <div className="versions-list">
            {loading ? (
              <div className="loading">Loading versions...</div>
            ) : versions.length === 0 ? (
              <div className="no-versions">No previous versions found</div>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className={`version-item ${selectedVersion?.id === version.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="version-info">
                    <span className="version-date">{formatDate(version.timestamp)}</span>
                    <span className="version-editor">by {version.editedBy}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="version-preview">
            {selectedVersion ? (
              <>
                <div className="preview-header">
                  <h3>Preview</h3>
                  <button
                    className="revert-btn"
                    onClick={() => onRevert(selectedVersion)}
                  >
                    Revert to This Version
                  </button>
                </div>
                <div
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                />
              </>
            ) : (
              <div className="no-selection">
                Select a version to preview its content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;