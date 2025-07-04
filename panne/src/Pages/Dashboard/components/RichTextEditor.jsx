import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../../firebase';
import './RichTextEditor.css';
import CustomDropdown from './CustomDropdown';
import { doc, updateDoc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import VersionHistoryModal from './VersionHistoryModal';

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
  const [lastSelectionRange, setLastSelectionRange] = useState(null);
  const [hasLoadedContent, setHasLoadedContent] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  const [userId, setUserId] = useState(''); // You should set this from auth context
  const editorRef = useRef(null);

  useEffect(() => {
    // If editing an existing note, populate the fields
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setNotebookId(note.notebookId || '');
      setHasLoadedContent(false);
    } else if (selectedNotebook) {
      setNotebookId(selectedNotebook.id);
      setHasLoadedContent(false);
    } else if (notebooks && notebooks.length > 0) {
      setNotebookId(notebooks[0].id);
      setHasLoadedContent(false);
    }
  }, [note, selectedNotebook, notebooks]);

  // Only set initial content on first load
  useEffect(() => {
    if (editorRef.current && content && !hasLoadedContent) {
      editorRef.current.innerHTML = content;
      setHasLoadedContent(true);
    }
  }, [content, hasLoadedContent]);

  // Load current note content on mount or when notebook/note/user changes
  useEffect(() => {
    if (!userId || !notebookId || !note?.id) return;
    const loadCurrent = async () => {
      const currentRef = doc(db, 'users', userId, 'notebooks', notebookId, 'notes', note.id, 'current');
      const snap = await getDoc(currentRef);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || '');
        setContent(data.content || '');
      }
    };
    loadCurrent();
  }, [userId, notebookId, note?.id]);

  // Save: add version and update current
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title for your note');
      return;
    }
    if (!notebookId) {
      alert('Please select a notebook');
      return;
    }
    if (!userId || !note?.id) {
      alert('User or note not set.');
      return;
    }
    const htmlContent = editorRef.current.innerHTML;
    setSaveStatus('saving');
    try {
      // Add version
      const versionsRef = collection(db, 'users', userId, 'notebooks', notebookId, 'notes', note.id, 'versions');
      await addDoc(versionsRef, {
        content: htmlContent,
        title,
        notebookId,
        timestamp: serverTimestamp(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      });
      // Update current
      const currentRef = doc(db, 'users', userId, 'notebooks', notebookId, 'notes', note.id, 'current');
      await updateDoc(currentRef, {
        content: htmlContent,
        title,
        notebookId,
        updatedAt: serverTimestamp(),
      });
      onSave(title, htmlContent, notebookId);
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('');
        }, 1000);
      }, 300);
    } catch (err) {
      alert('Failed to save note version.');
      setSaveStatus('');
    }
  };

  const formatDoc = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  // Save selection range when user interacts with the editor
  const saveSelectionRange = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      setLastSelectionRange(range.cloneRange());
    }
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

      // Insert the image at the last saved cursor position in the editor
      const wrapper = document.createElement('span');
      wrapper.className = 'editor-image-wrapper';
      wrapper.contentEditable = 'false';

      const img = document.createElement('img');
      img.src = downloadURL;
      img.className = 'editor-image';
      img.style.maxWidth = '600px';
      img.alt = file.name.split('.')[0];
      img.draggable = false;

      const handle = document.createElement('span');
      handle.className = 'editor-image-resize-handle';
      handle.title = 'Resize image';
      wrapper.appendChild(img);
      wrapper.appendChild(handle);

      // Restore selection before inserting
      const selection = window.getSelection();
      selection.removeAllRanges();
      if (lastSelectionRange) {
        selection.addRange(lastSelectionRange);
      } else if (editorRef.current) {
        // fallback: place at end
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.addRange(range);
      }

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.collapse(false);
        range.insertNode(wrapper);
        // Move cursor after image
        range.setStartAfter(wrapper);
        range.setEndAfter(wrapper);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.appendChild(wrapper);
      }

      makeImageResizable(wrapper, img, handle);
      // FIX: Update content state after inserting image
      setContent(editorRef.current.innerHTML);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again. Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Replace makeImageResizable with new version
  const makeImageResizable = (wrapper, img, handle) => {
    let startX, startWidth, aspectRatio;

    handle.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startWidth = img.offsetWidth;
      aspectRatio = img.naturalHeight / img.naturalWidth;

      function onMouseMove(e) {
        const newWidth = Math.max(40, startWidth + (e.clientX - startX));
        img.style.width = newWidth + 'px';
        img.style.height = (newWidth * aspectRatio) + 'px';
      }
      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
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
      const images = editorRef.current.querySelectorAll('img.editor-image');
      images.forEach(img => {
        if (!img.parentElement.classList.contains('editor-image-wrapper')) {
          const wrapper = document.createElement('span');
          wrapper.className = 'editor-image-wrapper';
          wrapper.contentEditable = 'false';
          img.parentNode.insertBefore(wrapper, img);
          wrapper.appendChild(img);
          // Add handle
          const handle = document.createElement('span');
          handle.className = 'editor-image-resize-handle';
          handle.title = 'Resize image';
          wrapper.appendChild(handle);
          makeImageResizable(wrapper, img, handle);
        }
      });
    }
  }, [content]);

  // Prepare notebook options for the custom dropdown
  const notebookOptions = notebooks.map(notebook => ({
    value: notebook.id,
    label: notebook.name
  }));

  // Cancel: reload from current
  const handleCancel = async () => {
    if (!userId || !notebookId || !note?.id) return;
    const currentRef = doc(db, 'users', userId, 'notebooks', notebookId, 'notes', note.id, 'current');
    const snap = await getDoc(currentRef);
    if (snap.exists()) {
      const data = snap.data();
      setTitle(data.title || '');
      setContent(data.content || '');
    }
  };

  // Fetch version history for this note
  const fetchVersions = async () => {
    if (!userId || !notebookId || !note?.id) return;
    const versionsRef = collection(db, 'users', userId, 'notebooks', notebookId, 'notes', note.id, 'versions');
    const q = query(versionsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const versionList = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    setVersions(versionList);
  };

  // Revert logic
  const handleRevert = async (version) => {
    if (!userId || !notebookId || !note?.id || !version) return;
    try {
      const currentRef = doc(db, 'users', userId, 'notebooks', notebookId, 'notes', note.id, 'current');
      await updateDoc(currentRef, {
        content: version.content,
        title: version.title,
        notebookId: version.notebookId,
        updatedAt: serverTimestamp(),
      });
      setTitle(version.title);
      setContent(version.content);
      setShowHistory(false);
    } catch {
      alert('Failed to revert to selected version.');
    }
  };

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
            suppressContentEditableWarning={true}
            onInput={e => {
              const html = e.currentTarget.innerHTML;
              if (html !== content) {
                setContent(html);
              }
            }}
            onPaste={handlePaste}
            onMouseUp={saveSelectionRange}
            onKeyUp={saveSelectionRange}
            onBlur={saveSelectionRange}
            onFocus={() => {
              if (!hasLoadedContent && content) {
                editorRef.current.innerHTML = content;
                setHasLoadedContent(true);
              }
            }}
          ></div>
        </div>

        <div className="editor-actions">
          <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
          <button type="button" className="history-btn" onClick={async () => { await fetchVersions(); setShowHistory(true); }}>
            Previous Saves
          </button>
          <button type="submit" className={`save-btn ${saveStatus ? saveStatus : ''}`} disabled={uploading}>
            {uploading ? 'Uploading...' :
             saveStatus === 'saving' ? 'Saving...' :
             saveStatus === 'saved' ? 'Saved!' :
             'Save Note'}
          </button>
        </div>
        <VersionHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          versions={versions}
          onRevert={handleRevert}
        />
      </form>
    </div>
  );
};

export default RichTextEditor;