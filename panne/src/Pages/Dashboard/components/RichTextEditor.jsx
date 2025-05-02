import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';
import './RichTextEditor.css';

const RichTextEditor = ({ 
  note, 
  selectedNotebook, 
  notebooks, 
  onSave, 
  onClose 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notebookId, setNotebookId] = useState('');
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef(null);
  
  useEffect(() => {
    // If editing an existing note, populate the fields
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setNotebookId(note.notebookId || '');
    } else if (selectedNotebook) {
      setNotebookId(selectedNotebook.id);
    } else if (notebooks && notebooks.length > 0) {
      setNotebookId(notebooks[0].id);
    }
  }, [note, selectedNotebook, notebooks]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title for your note');
      return;
    }
    
    if (!notebookId) {
      alert('Please select a notebook');
      return;
    }
    
    // Get the HTML content from the contentEditable div
    const htmlContent = editorRef.current.innerHTML;
    
    onSave(title, htmlContent, notebookId);
  };

  const formatDoc = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Insert the image at cursor position
      const img = document.createElement('img');
      img.src = downloadURL;
      img.className = 'editor-image';
      img.style.maxWidth = '100%';
      
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(img);
      } else {
        editorRef.current.appendChild(img);
      }
      
      // Make images resizable
      makeImageResizable(img);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const makeImageResizable = (img) => {
    img.style.cursor = 'move';
    
    img.addEventListener('mousedown', function(e) {
      // Prevent default to avoid text selection
      e.preventDefault();
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = img.clientWidth;
      const startHeight = img.clientHeight;
      
      // Function to handle mouse movement
      function handleMouseMove(e) {
        const newWidth = startWidth + (e.clientX - startX);
        const aspectRatio = startHeight / startWidth;
        const newHeight = newWidth * aspectRatio;
        
        img.style.width = `${newWidth}px`;
        img.style.height = `${newHeight}px`;
      }
      
      // Function to handle mouse up
      function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
      
      // Add event listeners for mousemove and mouseup
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  };

  const handlePaste = (e) => {
    // Allow pasting formatted content
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text');
    document.execCommand('insertHTML', false, text);
  };
  
  // Make existing images resizable when the editor loads
  useEffect(() => {
    if (editorRef.current) {
      const images = editorRef.current.querySelectorAll('img');
      images.forEach(img => makeImageResizable(img));
    }
  }, [content]);

  return (
    <div className="rich-text-editor">
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
        
        <div className="form-group notebook-selector">
          <label htmlFor="notebook-select">Select Notebook:</label>
          <select 
            id="notebook-select" 
            value={notebookId} 
            onChange={(e) => setNotebookId(e.target.value)}
            required
          >
            <option value="">Select a notebook</option>
            {notebooks && notebooks.map(notebook => (
              <option key={notebook.id} value={notebook.id}>
                {notebook.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button type="button" onClick={() => formatDoc('bold')} title="Bold">
              <strong>B</strong>
            </button>
            <button type="button" onClick={() => formatDoc('italic')} title="Italic">
              <em>I</em>
            </button>
            <button type="button" onClick={() => formatDoc('underline')} title="Underline">
              <u>U</u>
            </button>
          </div>
          
          <div className="toolbar-group">
            <select onChange={(e) => formatDoc('formatBlock', e.target.value)}>
              <option value="">Format</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="p">Paragraph</option>
            </select>
            
            <select onChange={(e) => formatDoc('fontSize', e.target.value)}>
              <option value="">Font Size</option>
              <option value="1">Very Small</option>
              <option value="2">Small</option>
              <option value="3">Normal</option>
              <option value="4">Medium Large</option>
              <option value="5">Large</option>
              <option value="6">Very Large</option>
              <option value="7">Maximum</option>
            </select>
          </div>
          
          <div className="toolbar-group">
            <input 
              type="color" 
              onChange={(e) => formatDoc('foreColor', e.target.value)} 
              title="Text Color" 
            />
            <input 
              type="color" 
              onChange={(e) => formatDoc('hiliteColor', e.target.value)} 
              title="Background Color" 
            />
          </div>
          
          <div className="toolbar-group">
            <button type="button" onClick={() => formatDoc('justifyLeft')} title="Align Left">
              ⟵
            </button>
            <button type="button" onClick={() => formatDoc('justifyCenter')} title="Align Center">
              ⟷
            </button>
            <button type="button" onClick={() => formatDoc('justifyRight')} title="Align Right">
              ⟶
            </button>
          </div>
          
          <div className="toolbar-group">
            <button type="button" onClick={() => formatDoc('insertUnorderedList')} title="Bullet List">
              • List
            </button>
            <button type="button" onClick={() => formatDoc('insertOrderedList')} title="Numbered List">
              1. List
            </button>
          </div>
          
          <div className="toolbar-group">
            <label className="image-upload-btn">
              {uploading ? 'Uploading...' : '📷 Image'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
                disabled={uploading}
              />
            </label>
          </div>
        </div>
        
        <div className="editor-content-wrapper">
          <div
            ref={editorRef}
            className="editor-content"
            contentEditable
            dangerouslySetInnerHTML={{ __html: content }}
            onPaste={handlePaste}
          ></div>
        </div>
        
        <div className="editor-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="save-btn" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Save Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RichTextEditor;