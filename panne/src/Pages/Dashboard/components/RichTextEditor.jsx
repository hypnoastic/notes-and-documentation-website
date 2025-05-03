import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';
import CustomDropdown from './CustomDropdown';
import './RichTextEditor.css';

const RichTextEditor = ({ 
  note, 
  selectedNotebook, 
  notebooks, 
  onSave, 
  onClose,
  onTabChange
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
      img.alt = file.name.split('.')[0]; // Add alt text for accessibility
      
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(img);
        
        // Move cursor after the image
        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
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
      // Clear the file input so the same file can be selected again if needed
      e.target.value = '';
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

  // Handle navigation to other tabs
  const handleNavigate = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-header">
        <h2>{note ? 'Edit Note' : 'Create New Note'}</h2>
        <div className="editor-nav-buttons">
          <button type="button" className="editor-nav-btn" onClick={() => handleNavigate('home')}>Home</button>
          <button type="button" className="editor-nav-btn" onClick={() => handleNavigate('notes')}>Notes</button>
          <button type="button" className="editor-nav-btn" onClick={() => handleNavigate('notebooks')}>Notebooks</button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
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
          <CustomDropdown
            label="Select Notebook:"
            options={notebooks.map(notebook => ({
              value: notebook.id,
              label: notebook.name
            }))}
            value={notebookId}
            onChange={(value) => setNotebookId(value)}
            placeholder="Select a notebook"
            required={true}
          />
        </div>
        
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button type="button" onClick={() => formatDoc('bold')} title="Bold" className="toolbar-btn">
              <span className="toolbar-btn-label">B</span>
              <span className="toolbar-tooltip">Bold</span>
            </button>
            <button type="button" onClick={() => formatDoc('italic')} title="Italic" className="toolbar-btn">
              <span className="toolbar-btn-label"><em>I</em></span>
              <span className="toolbar-tooltip">Italic</span>
            </button>
            <button type="button" onClick={() => formatDoc('underline')} title="Underline" className="toolbar-btn">
              <span className="toolbar-btn-label"><u>U</u></span>
              <span className="toolbar-tooltip">Underline</span>
            </button>
          </div>
          
          <div className="toolbar-group">
            <div className="toolbar-dropdown">
              <span className="toolbar-label">Format:</span>
              <CustomDropdown
                options={[
                  { value: '', label: 'Format' },
                  { value: 'h1', label: 'Heading 1' },
                  { value: 'h2', label: 'Heading 2' },
                  { value: 'h3', label: 'Heading 3' },
                  { value: 'p', label: 'Paragraph' }
                ]}
                onChange={(value) => value && formatDoc('formatBlock', value)}
                placeholder="Format"
              />
            </div>
            
            <div className="toolbar-dropdown">
              <span className="toolbar-label">Size:</span>
              <CustomDropdown
                options={[
                  { value: '', label: 'Font Size' },
                  { value: '1', label: 'Very Small' },
                  { value: '2', label: 'Small' },
                  { value: '3', label: 'Normal' },
                  { value: '4', label: 'Medium Large' },
                  { value: '5', label: 'Large' },
                  { value: '6', label: 'Very Large' },
                  { value: '7', label: 'Maximum' }
                ]}
                onChange={(value) => value && formatDoc('fontSize', value)}
                placeholder="Font Size"
              />
            </div>
          </div>
          
          <div className="toolbar-group">
            <div className="color-picker">
              <span className="toolbar-label">Text:</span>
              <input 
                type="color" 
                onChange={(e) => formatDoc('foreColor', e.target.value)} 
                title="Text Color" 
              />
            </div>
            <div className="color-picker">
              <span className="toolbar-label">Highlight:</span>
              <input 
                type="color" 
                onChange={(e) => formatDoc('hiliteColor', e.target.value)} 
                title="Background Color" 
              />
            </div>
          </div>
          
          <div className="toolbar-group">
            <button type="button" onClick={() => formatDoc('justifyLeft')} title="Align Left" className="toolbar-btn">
              <span className="toolbar-btn-label">⟵</span>
              <span className="toolbar-tooltip">Align Left</span>
            </button>
            <button type="button" onClick={() => formatDoc('justifyCenter')} title="Align Center" className="toolbar-btn">
              <span className="toolbar-btn-label">⟷</span>
              <span className="toolbar-tooltip">Align Center</span>
            </button>
            <button type="button" onClick={() => formatDoc('justifyRight')} title="Align Right" className="toolbar-btn">
              <span className="toolbar-btn-label">⟶</span>
              <span className="toolbar-tooltip">Align Right</span>
            </button>
          </div>
          
          <div className="toolbar-group">
            <button type="button" onClick={() => formatDoc('insertUnorderedList')} title="Bullet List" className="toolbar-btn">
              <span className="toolbar-btn-label">• List</span>
              <span className="toolbar-tooltip">Bullet List</span>
            </button>
            <button type="button" onClick={() => formatDoc('insertOrderedList')} title="Numbered List" className="toolbar-btn">
              <span className="toolbar-btn-label">1. List</span>
              <span className="toolbar-tooltip">Numbered List</span>
            </button>
          </div>
          
          <div className="toolbar-group">
            <label className="image-upload-btn">
              {uploading ? 'Uploading...' : '📷 Insert Image'}
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