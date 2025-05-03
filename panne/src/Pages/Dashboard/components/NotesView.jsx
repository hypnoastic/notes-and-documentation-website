import React, { useState } from 'react';
import CustomDropdown from './CustomDropdown';
import './NotesView.css';

const NotesView = ({ notes, notebooks, onNoteClick, onCreateNote }) => {
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

  return (
    <div className="notes-view">
      <div className="notes-header">
        <h2>All Notes</h2>
        <button className="create-note-btn" onClick={onCreateNote}>
          Create New Note
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
              label="Notebook:"
              options={[
                { value: 'all', label: 'All Notebooks' },
                ...notebooks.map(notebook => ({
                  value: notebook.id,
                  label: notebook.name
                }))
              ]}
              value={selectedNotebook}
              onChange={(value) => setSelectedNotebook(value)}
            />
          </div>
          
          <div className="filter-group">
            <CustomDropdown
              label="Sort by:"
              options={[
                { value: 'updatedAt', label: 'Last Updated' },
                { value: 'createdAt', label: 'Date Created' },
                { value: 'title', label: 'Title' }
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value)}
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
              className="note-card"
              onClick={() => onNoteClick(note)}
            >
              <h3>{note.title}</h3>
              <div className="note-preview">
                {note.content && typeof note.content === 'string' && note.content.includes('<') ? (
                  <div dangerouslySetInnerHTML={{ 
                    __html: note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '') 
                  }} />
                ) : (
                  <p>{note.content?.substring(0, 150)}{note.content?.length > 150 ? '...' : ''}</p>
                )}
              </div>
              <div className="note-footer">
                <span className="notebook-label">
                  {notebooks.find(nb => nb.id === note.notebookId)?.name || 'Uncategorized'}
                </span>
                <span className="note-date">{formatDate(note.updatedAt)}</span>
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