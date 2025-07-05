import React, { useState } from 'react';
import './NotesView.css';
import CustomDropdown from './CustomDropdown';

const NotesView = ({ notes, notebooks, onNoteClick, onCreateNote, onDeleteNote }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotebook, setSelectedNotebook] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  
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
  
  // Filter notes based on search term and selected notebook
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesNotebook = selectedNotebook === 'all' || note.notebookId === selectedNotebook;
    
    return matchesSearch && matchesNotebook;
  });
  
  // Sort notes based on selected sort option
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'createdAt') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  });

  // Prepare notebook options for the custom dropdown
  const notebookOptions = [
    { value: 'all', label: 'All Notebooks' },
    ...notebooks.map(notebook => ({
      value: notebook.id,
      label: notebook.name
    }))
  ];

  // Prepare sort options for the custom dropdown
  const sortOptions = [
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'createdAt', label: 'Date Created' },
    { value: 'title', label: 'Title' }
  ];

  return (
    <div className="notes-view">
      <div className="notes-header">
        <h2>All Notes</h2>
        <button className="create-note-btn" onClick={onCreateNote}>
          +  Note
        </button>
      </div>
      
      <div className="notes-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-options">
          <div className="filter-group">
            <CustomDropdown
              options={notebookOptions}
              value={selectedNotebook}
              onChange={setSelectedNotebook}
              label="Notebook:"
            />
          </div>
          
          <div className="filter-group">
            <CustomDropdown
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              label="Sort by:"
            />
          </div>
        </div>
      </div>
      
      <div className="notes-count">
        {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} found
      </div>

      <div className="notes-grid">
        {sortedNotes.length > 0 ? (
          sortedNotes.map(note => (
              <div
                  key={note.id}
                  className="item-card note-card"
                  onClick={() => onNoteClick(note)}
              >
                <button 
                  className="delete-note-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  title="Delete note"
                >
                  ×
                </button>
                <h4>{note.title}</h4>

                <div className="item-content">
                  {note.content && typeof note.content === 'string' && note.content.includes('<') ? (
                      <div
                          dangerouslySetInnerHTML={{
                            __html: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '')
                          }}
                      />
                  ) : (
                      <p>
                        {note.content?.substring(0, 100)}
                        {note.content?.length > 100 ? '...' : ''}
                      </p>
                  )}
                </div>

                <div className="item-footer">
    <span className="notebook-name">
      {notebooks.find(nb => nb.id === note.notebookId)?.name || 'Uncategorized'}
    </span>
                  <span className="item-date">{formatDate(note.updatedAt)}</span>
                </div>
              </div>

          ))
        ) : (
          <div className="no-notes-message">
            {searchTerm || selectedNotebook !== 'all' ? (
              <p>No notes match your search criteria.</p>
            ) : (
              <p>You don't have any notes yet. Create your first note!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesView;