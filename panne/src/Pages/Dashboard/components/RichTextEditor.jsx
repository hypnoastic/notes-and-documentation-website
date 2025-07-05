import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../../firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './RichTextEditor.css';
import CustomDropdown from './CustomDropdown';
import VersionHistoryModal from './VersionHistoryModal';

const RichTextEditor = ({
  note,
  selectedNotebook,
  notebooks,
  onSave,
  onClose,
  user
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notebookId, setNotebookId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [lastSelectionRange, setLastSelectionRange] = useState(null);
  const [hasLoadedContent, setHasLoadedContent] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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

    // Always get the latest HTML from the DOM
    const htmlContent = editorRef.current.innerHTML;
    setSaveStatus('saving');

    try {
      // Create the note document if it doesn't exist
      let noteId = note?.id;
      if (!noteId) {
        const userNotesRef = collection(db, 'users', user.uid, 'notes');
        const newNoteRef = await addDoc(userNotesRef, {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          notebookId,
          notebookName: notebooks.find(nb => nb.id === notebookId)?.name || ''
        });
        noteId = newNoteRef.id;
      }

      // Update the current version
      const currentRef = doc(db, 'users', user.uid, 'notes', noteId, 'current', 'latest');
      await setDoc(currentRef, {
        title,
        content: htmlContent,
        updatedAt: serverTimestamp()
      });

      // Add to version history
      const versionsRef = collection(db, 'users', user.uid, 'notes', noteId, 'versions');
      await addDoc(versionsRef, {
        title,
        content: htmlContent,
        editedBy: user.email,
        timestamp: serverTimestamp()
      });

      // Call the parent's onSave to update UI
      onSave(title, htmlContent, notebookId);

      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('');
      }, 1000);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
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
      img.style.maxWidth = '200px';
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

  const handleRevertToVersion = async (version) => {
    try {
      // Update the current version with the selected version's content
      const currentRef = doc(db, 'users', user.uid, 'notes', note.id, 'current', 'latest');
      await setDoc(currentRef, {
        title: version.title,
        content: version.content,
        updatedAt: serverTimestamp()
      });

      // Add this reversion as a new version
      const versionsRef = collection(db, 'users', user.uid, 'notes', note.id, 'versions');
      await addDoc(versionsRef, {
        title: version.title,
        content: version.content,
        editedBy: user.email,
        timestamp: serverTimestamp(),
        isReversion: true,
        revertedFromVersion: version.id
      });

      // Update the editor content
      setTitle(version.title);
      setContent(version.content);
      editorRef.current.innerHTML = version.content;
      setShowVersionHistory(false);
      
      // Show success message
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 1000);
    } catch (error) {
      console.error('Error reverting to version:', error);
      alert('Failed to revert to selected version. Please try again.');
    }
  };

  const handleCancelEdit = async () => {
    if (!note?.id) {
      onClose();
      return;
    }

    try {
      // Reload the current version
      const currentRef = doc(db, 'users', user.uid, 'notes', note.id, 'current', 'latest');
      const currentSnap = await setDoc(currentRef);
      
      if (currentSnap.exists()) {
        const currentData = currentSnap.data();
        setTitle(currentData.title);
        setContent(currentData.content);
        editorRef.current.innerHTML = currentData.content;
      }
    } catch (error) {
      console.error('Error reloading current version:', error);
      alert('Failed to reload current version. Please try again.');
    }
  };

  const getShareableLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-note?userId=${user.uid}&noteId=${note.id}`;
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
          <div className="editor-action-left">
            {note && (
              <>
                <button 
                  type="button" 
                  className="share-btn"
                  onClick={() => setShowShareModal(true)}
                >
                  Share
                </button>
                <button
                  type="button"
                  className="history-btn"
                  onClick={() => setShowVersionHistory(true)}
                >
                  Previous Saves
                </button>
              </>
            )}
          </div>
          <div className="editor-action-right">
            <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
              Cancel
            </button>
            <button type="submit" className={`save-btn ${saveStatus ? saveStatus : ''}`} disabled={uploading}>
              {uploading ? 'Uploading...' :
               saveStatus === 'saving' ? 'Saving...' :
               saveStatus === 'saved' ? 'Saved!' :
               'Save Note'}
            </button>
          </div>
        </div>
      </form>

      {showVersionHistory && (
        <VersionHistoryModal
          note={note}
          userId={user.uid}
          onClose={() => setShowVersionHistory(false)}
          onRevert={handleRevertToVersion}
        />
      )}

      {showShareModal && (
        <div className="share-modal">
          <div className="share-modal-content">
            <h3>Share Note</h3>
            <p>Anyone with this link can view this note:</p>
            <div className="share-link-container">
              <input
                type="text"
                value={getShareableLink()}
                readOnly
                onClick={e => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getShareableLink());
                  alert('Link copied to clipboard!');
                }}
              >
                Copy
              </button>
            </div>
            <button className="share-modal-close-btn" onClick={() => setShowShareModal(false)}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;