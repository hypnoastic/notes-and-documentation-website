import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';
import './RichTextEditor.css';
import CustomDropdown from './CustomDropdown';

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
  const [saveStatus, setSaveStatus] = useState('');
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

    // Show saving status
    setSaveStatus('saving');

    // Call the save function
    onSave(title, htmlContent, notebookId);

    // Show saved status for 1 second
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('');
      }, 1000);
    }, 300);
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

      // Create a reference to the file in Firebase Storage with a unique name
      const storageRef = ref(storage, `images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);

      // Upload the file with metadata to help with CORS
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'origin': window.location.origin
        }
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);

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
      } else {
        editorRef.current.appendChild(img);
      }

      // Make images resizable
      makeImageResizable(img);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again. Error: ' + error.message);
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

  // Prepare notebook options for the custom dropdown
  const notebookOptions = notebooks.map(notebook => ({
    value: notebook.id,
    label: notebook.name
  }));

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
          <CustomDropdown
            options={notebookOptions}
            value={notebookId}
            onChange={setNotebookId}
            placeholder="Select a notebook"
            label="Select Notebook:"
          />
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
          <div>
          <select className="font-size-edit" onChange={(e) => formatDoc('fontSize', e.target.value)}>

            <option value="">Font Size</option>
            <option value="7">Heading</option>
            <option value="6">Sub Heading</option>
            <option value="3">Body</option>

          </select>
          </div>
          <div className="toolbar-group">
            <input
              type="color"
              onChange={(e) => formatDoc('foreColor', e.target.value)}
              title="Text Color"
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
          <button type="submit" className={`save-btn ${saveStatus ? saveStatus : ''}`} disabled={uploading}>
            {uploading ? 'Uploading...' :
             saveStatus === 'saving' ? 'Saving...' :
             saveStatus === 'saved' ? 'Saved!' :
             'Save Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RichTextEditor;