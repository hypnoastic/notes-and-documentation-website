import React, { useState } from 'react';
import './CreateNotebookModal.css';

const CreateNotebookModal = ({ onClose, onCreateNotebook }) => {
  const [notebookName, setNotebookName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!notebookName.trim()) {
      alert('Please enter a name for your notebook');
      return;
    }
    
    onCreateNotebook(notebookName, description);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Notebook</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="notebook-name">Notebook Name:</label>
            <input
              id="notebook-name"
              type="text"
              value={notebookName}
              onChange={(e) => setNotebookName(e.target.value)}
              placeholder="Enter notebook name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notebook-description">Description (optional):</label>
            <textarea
              id="notebook-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for your notebook"
              rows="3"
            ></textarea>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="create-btn">Create Notebook</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNotebookModal;