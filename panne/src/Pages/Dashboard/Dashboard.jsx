import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import './Dashboard.css';
import Lottie from 'lottie-react';
import loadingAnimation from '../pageAssets/loading.json';
import Sidebar from './components/Sidebar';
import RichTextEditor from './components/RichTextEditor';
import CreateNotebookModal from './components/CreateNotebookModal';
import HomeView from './components/HomeView';
import NotesView from './components/NotesView';
import NotebooksView from './components/NotebooksView';
import Toast from './components/Toast';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showEditor, setShowEditor] = useState(false);
  const [showCreateNotebookModal, setShowCreateNotebookModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, duration });
  };

  const hideToast = () => {
    setToast(null);
  };

  useEffect(() => {
    const minLoadingTime = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        fetchUserData(currentUser.uid);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(minLoadingTime);
      unsubscribe();
    };
  }, [navigate]);

  const fetchUserData = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const notebooksRef = collection(userDocRef, 'notebooks');
      const notebooksQuery = query(notebooksRef, orderBy('updatedAt', 'desc'));
      const notebooksSnapshot = await getDocs(notebooksQuery);
      const fetchedNotebooks = notebooksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()) : new Date(),
        updatedAt: doc.data().updatedAt ? new Date(doc.data().updatedAt.toDate()) : new Date(),
      }));
      setNotebooks(fetchedNotebooks);

      // Fetch notes
      const notesRef = collection(userDocRef, 'notes');
      const notesQuery = query(notesRef, orderBy('updatedAt', 'desc'));
      const notesSnapshot = await getDocs(notesQuery);
      
      // For each note, fetch its current content
      const fetchedNotes = await Promise.all(notesSnapshot.docs.map(async (noteDoc) => {
        const currentRef = doc(notesRef, noteDoc.id, 'current', 'latest');
        const currentSnap = await getDoc(currentRef);
        
        return {
          id: noteDoc.id,
          ...noteDoc.data(),
          ...currentSnap.data(),
          createdAt: noteDoc.data().createdAt ? new Date(noteDoc.data().createdAt.toDate()) : new Date(),
          updatedAt: noteDoc.data().updatedAt ? new Date(noteDoc.data().updatedAt.toDate()) : new Date(),
        };
      }));
      
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setShowEditor(true);
  };

  const handleCreateNotebook = () => {
    setShowCreateNotebookModal(true);
  };

  const handleSaveNotebook = async (name, description) => {
    try {
      const newNotebook = {
        name,
        description,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        noteCount: 0,
      };

      const userDocRef = doc(db, 'users', user.uid);
      const notebooksRef = collection(userDocRef, 'notebooks');
      const docRef = await addDoc(notebooksRef, newNotebook);

      const notebookWithId = {
        id: docRef.id,
        ...newNotebook,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setNotebooks([notebookWithId, ...notebooks]);
      showToast(`Notebook "${name}" created successfully!`, 'success');
      return notebookWithId;
    } catch (error) {
      console.error('Error creating notebook:', error);
      showToast('Failed to create notebook. Please try again.', 'error');
      return null;
    }
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setShowEditor(true);
  };

  const handleSaveNote = (title, content, notebookId) => {
    const notebook = notebooks.find((nb) => nb.id === notebookId);
    if (!notebook) {
      showToast('Please select a valid notebook', 'error');
      return;
    }

    if (selectedNote) {
      // Update existing note in local state
      const updatedNotes = notes.map((note) =>
        note.id === selectedNote.id
          ? {
              ...note,
              title,
              content,
              notebookId,
              notebookName: notebook.name,
              updatedAt: new Date(),
            }
          : note
      );
      setNotes(updatedNotes);
      showToast('Note updated successfully!', 'success');
    } else {
      // This shouldn't happen since RichTextEditor handles new note creation
      // But keeping for safety - just show success message
      showToast('Note created successfully!', 'success');
      // Refresh data to get the new note
      fetchUserData(user.uid);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const noteRef = doc(userDocRef, 'notes', noteId);
      await deleteDoc(noteRef);
      
      setNotes(notes.filter(note => note.id !== noteId));
      showToast('Note deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Failed to delete note. Please try again.', 'error');
    }
  };

  const handleDeleteNotebook = async (notebookId) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Delete all notes in the notebook
      const notesToDelete = notes.filter(note => note.notebookId === notebookId);
      await Promise.all(notesToDelete.map(note => 
        deleteDoc(doc(userDocRef, 'notes', note.id))
      ));
      
      // Delete the notebook
      const notebookRef = doc(userDocRef, 'notebooks', notebookId);
      await deleteDoc(notebookRef);
      
      setNotebooks(notebooks.filter(notebook => notebook.id !== notebookId));
      setNotes(notes.filter(note => note.notebookId !== notebookId));
      showToast('Notebook and all its notes deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting notebook:', error);
      showToast('Failed to delete notebook. Please try again.', 'error');
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
  };

  // Modified to close editor when changing tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowEditor(false);
  };

  const getRecentNotes = () => {
    return notes.slice(0, 3);
  };

  const getRecentNotebooks = () => {
    return notebooks.slice(0, 3).map(notebook => ({
      ...notebook,
      noteCount: notes.filter(note => note.notebookId === notebook.id).length
    }));
  };

  if (loading || showLoadingAnimation) {
    return (
        <div className="loading-container">
          <div className="animation-wrapper">
            <Lottie
                animationData={loadingAnimation}
                loop={true}
                style={{ width: 500, height: 500 }}
            />
          </div>

          <div className="bottom-text">
            <h1>Getting Your Notes Ready</h1>
            <p>❤️ Made with Love</p>
          </div>
        </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onCreateNote={handleCreateNote}
          onCreateNotebook={handleCreateNotebook}
        />

        <div className="main-content">
          {/* Mobile action buttons - only visible on small screens */}
          <div className="mobile-action-buttons">
            <button className="mobile-action-btn create-note" onClick={handleCreateNote}>
              + Note
            </button>
            <button className="mobile-action-btn create-notebook" onClick={handleCreateNotebook}>
              + Notebook
            </button>
          </div>

          {showEditor ? (
            <RichTextEditor
              note={selectedNote}
              selectedNotebook={selectedNotebook}
              notebooks={notebooks}
              onSave={handleSaveNote}
              onClose={handleCloseEditor}
              user={user}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView
                  recentNotes={getRecentNotes()}
                  recentNotebooks={getRecentNotebooks()}
                  onNoteClick={handleEditNote}
                  onNotebookClick={(notebook) => {
                    setSelectedNotebook(notebook);
                    setActiveTab('notebooks');
                  }}
                  onViewAllNotes={() => setActiveTab('notes')}
                  onViewAllNotebooks={() => setActiveTab('notebooks')}
                />
              )}

              {activeTab === 'notes' && (
                <NotesView
                  notes={notes}
                  notebooks={notebooks}
                  onNoteClick={handleEditNote}
                  onCreateNote={handleCreateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}

              {activeTab === 'notebooks' && (
                <NotebooksView
                  notebooks={notebooks}
                  notes={notes}
                  onNotebookClick={(notebook) => setSelectedNotebook(notebook)}
                  onNoteClick={handleEditNote}
                  onCreateNotebook={handleCreateNotebook}
                  onDeleteNotebook={handleDeleteNotebook}
                />
              )}
            </>
          )}
        </div>
      </div>

      {showCreateNotebookModal && (
        <CreateNotebookModal
          onClose={() => setShowCreateNotebookModal(false)}
          onCreateNotebook={handleSaveNotebook}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default Dashboard;