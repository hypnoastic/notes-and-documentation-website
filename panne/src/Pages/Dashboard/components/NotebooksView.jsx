import React, { useState } from 'react';
import './NotebooksView.css';

const NotebooksView = ({ 
  notebooks, 
  notes, 
  onNotebookClick, 
  onNoteClick, 
  onCreateNotebook 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNotebook, setExpandedNotebook] = useState(null);
  
  const formatDate = (date) => {
    if (!date) return '';
    
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    
    // Handle Firestore Timestamp
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    
    return new Date(date).toLocaleDateString();
  };
  
  // Filter notebooks based on search term
  const filteredNotebooks = notebooks.filter(notebook => 
    notebook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (notebook.description && notebook.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get notes for a specific notebook
  const getNotebookNotes = (notebookId) => {
    return notes.filter(note => note.notebookId === notebookId);
  };
  
  const toggleNotebook = (notebookId) => {
    if (expandedNotebook === notebookId) {
      setExpandedNotebook(null);
    } else {
      setExpandedNotebook(notebookId);
    }
  };

  return (
    <div className="notebooks-view">
      <div className="notebooks-header">
        <h2>All Notebooks</h2>
        <button className="create-notebook-btn" onClick={onCreateNotebook}>
          + Notebook
        </button>
      </div>
      
      <div className="notebooks-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search notebooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="notebooks-count">
        {filteredNotebooks.length} {filteredNotebooks.length === 1 ? 'notebook' : 'notebooks'} found
      </div>
      
      <div className="notebooks-list">
        {filteredNotebooks.length > 0 ? (
          filteredNotebooks.map(notebook => {
            const notebookNotes = getNotebookNotes(notebook.id);
            const isExpanded = expandedNotebook === notebook.id;
            
            return (
              <div key={notebook.id} className="notebook-item">
                <div 
                  className="notebook-header"
                  onClick={() => toggleNotebook(notebook.id)}
                >
                  <div className="notebook-info">
                    <h3>{notebook.name}</h3>
                    <div className="notebook-meta">
                      <span className="note-count">
                        {notebookNotes.length} {notebookNotes.length === 1 ? 'note' : 'notes'}
                      </span>
                      <span className="notebook-date">
                        Updated {formatDate(notebook.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="notebook-actions">
                    <button 
                      className="expand-btn"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '▼' : '►'}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="notebook-notes">
                    {notebookNotes.length > 0 ? (
                      <div className="notes-grid">
                        {notebookNotes.map(note => (
                          <div 
                            key={note.id} 
                            className="note-card"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNoteClick(note);
                            }}
                          >
                            <h4>{note.title}</h4>
                            <div className="note-preview">
                              {note.content && typeof note.content === 'string' && note.content.includes('<') ? (
                                <div dangerouslySetInnerHTML={{ 
                                  __html: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') 
                                }} />
                              ) : (
                                <p>{note.content?.substring(0, 100)}{note.content?.length > 100 ? '...' : ''}</p>
                              )}
                            </div>
                            <div className="note-footer">
                              <span className="note-date">{formatDate(note.updatedAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-notes-message">
                        This notebook has no notes yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-notebooks-message">
            {searchTerm ? (
              <p>No notebooks match your search criteria.</p>
            ) : (
              <p>You don't have any notebooks yet. Create your first notebook!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotebooksView;