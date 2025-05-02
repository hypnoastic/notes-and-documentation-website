import React, { useState, useEffect } from 'react';
import './NoteEditor.css';

const NoteEditor = ({ note, onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        // If editing an existing note, populate the fields
        if (note) {
            setTitle(note.title);
            setContent(note.content);
        }
    }, [note]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Please enter a title for your note');
            return;
        }
        onSave(title, content);
    };

    return (
        <div className="note-editor">
            <div className="editor-header">
                <h2>{note ? 'Edit Note' : 'Create New Note'}</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Note Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="note-title"
                        required
                    />
                </div>
                <div className="form-group">
                    <textarea
                        placeholder="Start writing your note here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="note-content"
                        rows="15"
                    ></textarea>
                </div>
                <div className="editor-actions">
                    <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button type="submit" className="save-btn">Save Note</button>
                </div>
            </form>
        </div>
    );
};

export default NoteEditor;