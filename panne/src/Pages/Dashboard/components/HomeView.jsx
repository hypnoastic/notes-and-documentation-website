import React from 'react';
import './HomeView.css';

const HomeView = ({
                    recentNotes,
                    recentNotebooks,
                    onNoteClick,
                    onNotebookClick,
                    onViewAllNotes,
                    onViewAllNotebooks
                  }) => {
  const formatDate = (date) => {
    if (!date) return '';

    if (date instanceof Date) {
      return date.toLocaleDateString();
    }

    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }

    return new Date(date).toLocaleDateString();
  };

  return (
      <div className="home-view">
        <h2 className="welcome-title">Welcome to Your Dashboard</h2>

        <div className="home-section">
          <div className="section-header">
            <h3>Recent Notes</h3>
            <button className="view-all-btn" onClick={onViewAllNotes}>View All</button>
          </div>

          <div className="items-grid">
            {recentNotes && recentNotes.length > 0 ? (
                recentNotes.map(note => (
                    <div
                        key={note.id}
                        className="item-card note-card"
                        onClick={() => onNoteClick(note)}
                    >
                      <h4>{note.title}</h4>
                      <div className="item-content">
                        {note.content && typeof note.content === 'string' && note.content.includes('<') ? (
                            <div dangerouslySetInnerHTML={{
                              __html: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '')
                            }} />
                        ) : (
                            <p>{note.content?.substring(0, 100)}{note.content?.length > 100 ? '...' : ''}</p>
                        )}
                      </div>
                      <div className="item-footer">
                  <span className="notebook-name">
                    {note.notebookName || 'Uncategorized'}
                  </span>
                        <span className="item-date">{formatDate(note.updatedAt)}</span>
                      </div>
                    </div>
                ))
            ) : (
                <p className="no-items">No notes yet. Create your first note!</p>
            )}
          </div>
        </div>

        <div className="home-section">
          <div className="section-header">
            <h3>Recent Notebooks</h3>
            <button className="view-all-btn" onClick={onViewAllNotebooks}>View All</button>
          </div>

          <div className="items-grid notebook-grid">
            {recentNotebooks && recentNotebooks.length > 0 ? (
                recentNotebooks.map(notebook => (
                    <div
                        key={notebook.id}
                        className="item-card notebook-card"
                        onClick={() => onNotebookClick(notebook)}
                    >
                      <h4>{notebook.name}</h4>
                      {notebook.description && (
                          <p className="notebook-description">{notebook.description}</p>
                      )}
                      <div className="item-footer">
                  <span className="note-count">
                    {notebook.noteCount || 0} {notebook.noteCount === 1 ? 'note' : 'notes'}
                  </span>
                        <span className="item-date">{formatDate(notebook.updatedAt)}</span>
                      </div>
                    </div>
                ))
            ) : (
                <p className="no-items">No notebooks yet. Create your first notebook!</p>
            )}
          </div>
        </div>
      </div>
  );
};

export default HomeView;
