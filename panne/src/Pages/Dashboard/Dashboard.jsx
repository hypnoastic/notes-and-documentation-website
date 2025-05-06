import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import './Dashboard.css';
import Lottie from 'lottie-react';
import loadingAnimation from '../pageAssets/loading.json';

// Import components
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

  // Show toast notification
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, duration });
  };

  // Hide toast notification
  const hideToast = () => {
    setToast(null);
  };

  useEffect(() => {
    // Set minimum loading time to 3 seconds for animation
    const minLoadingTime = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Try to load data from localStorage first
        const cachedNotes = localStorage.getItem(`notes_${currentUser.uid}`);
        const cachedNotebooks = localStorage.getItem(`notebooks_${currentUser.uid}`);
        
        if (cachedNotebooks) {
          try {
            const parsedNotebooks = JSON.parse(cachedNotebooks);
            setNotebooks(parsedNotebooks);
          } catch (error) {
            console.error('Error parsing cached notebooks:', error);
          }
        }
        
        if (cachedNotes) {
          try {
            const parsedNotes = JSON.parse(cachedNotes);
            setNotes(parsedNotes);
          } catch (error) {
            console.error('Error parsing cached notes:', error);
          }
        }
        
        // Fetch fresh data from Firebase
        fetchNotebooks(currentUser.uid);
        fetchNotes(currentUser.uid);
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(minLoadingTime);
      unsubscribe();
    };
  }, [navigate]);

  const fetchNotebooks = async (userId) => {
    try {
      const notebooksRef = collection(db, 'notebooks');
      const q = query(
        notebooksRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedNotebooks = [];

      querySnapshot.forEach((doc) => {
        fetchedNotebooks.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to Date objects for serialization
          createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()) : new Date(),
          updatedAt: doc.data().updatedAt ? new Date(doc.data().updatedAt.toDate()) : new Date()
        });
      });

      setNotebooks(fetchedNotebooks);
      
      // Store notebooks in localStorage
      localStorage.setItem(`notebooks_${userId}`, JSON.stringify(fetchedNotebooks));

      // If no notebooks exist, create a default notebook
      if (fetchedNotebooks.length === 0) {
        createDefaultNotebook(userId);
      }
    } catch (error) {
      console.error('Error fetching notebooks:', error);
    }
  };

  const createDefaultNotebook = async (userId) => {
    try {
      const defaultNotebook = {
        name: 'My First Notebook',
        description: 'This is your default notebook for storing notes.',
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        noteCount: 0
      };

      const docRef = await addDoc(collection(db, 'notebooks'), defaultNotebook);
      const newNotebook = {
        id: docRef.id,
        ...defaultNotebook,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedNotebooks = [newNotebook];
      setNotebooks(updatedNotebooks);
      setSelectedNotebook(newNotebook);
      
      // Update localStorage
      localStorage.setItem(`notebooks_${userId}`, JSON.stringify(updatedNotebooks));

      return newNotebook;
    } catch (error) {
      console.error('Error creating default notebook:', error);
      return null;
    }
  };

  const fetchNotes = async (userId) => {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(
        notesRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedNotes = [];

      querySnapshot.forEach((doc) => {
        fetchedNotes.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to Date objects for serialization
          createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()) : new Date(),
          updatedAt: doc.data().updatedAt ? new Date(doc.data().updatedAt.toDate()) : new Date()
        });
      });

      // Fetch notebook details for each note
      const notesWithNotebookDetails = await Promise.all(
        fetchedNotes.map(async (note) => {
          if (note.notebookId) {
            try {
              const notebookRef = doc(db, 'notebooks', note.notebookId);
              const notebookSnap = await getDoc(notebookRef);

              if (notebookSnap.exists()) {
                return {
                  ...note,
                  notebookName: notebookSnap.data().name
                };
              }
            } catch (error) {
              console.error('Error fetching notebook details:', error);
            }
          }
          return note;
        })
      );

      setNotes(notesWithNotebookDetails);
      
      // Store notes in localStorage
      localStorage.setItem(`notes_${userId}`, JSON.stringify(notesWithNotebookDetails));

      // If no notes exist, create a welcome note
      if (fetchedNotes.length === 0) {
        const defaultNotebook = notebooks.length > 0 ? notebooks[0] : await createDefaultNotebook(userId);
        if (defaultNotebook) {
          createWelcomeNote(userId, defaultNotebook.id, defaultNotebook.name);
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const createWelcomeNote = async (userId, notebookId, notebookName) => {
    try {
      const welcomeNote = {
        title: 'Welcome to पन्ने!',
        content: '<h2>Getting Started</h2><p>This is your first note. Click on "Create Note" to start writing your own notes.</p><p>You can format your text, add images, and organize your notes into notebooks.</p>',
        userId: userId,
        notebookId: notebookId,
        notebookName: notebookName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notes'), welcomeNote);

      // Update notebook note count
      const notebookRef = doc(db, 'notebooks', notebookId);
      await updateDoc(notebookRef, {
        noteCount: 1,
        updatedAt: serverTimestamp()
      });

      const newNote = {
        id: docRef.id,
        ...welcomeNote,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedNotes = [newNote];
      setNotes(updatedNotes);
      
      // Update localStorage
      localStorage.setItem(`notes_${userId}`, JSON.stringify(updatedNotes));
      
      // Update notebooks in localStorage
      const updatedNotebooks = notebooks.map(nb =>
        nb.id === notebookId
          ? {
              ...nb,
              noteCount: 1,
              updatedAt: new Date()
            }
          : nb
      );
      setNotebooks(updatedNotebooks);
      localStorage.setItem(`notebooks_${userId}`, JSON.stringify(updatedNotebooks));
    } catch (error) {
      console.error('Error creating welcome note:', error);
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
        noteCount: 0
      };

      const docRef = await addDoc(collection(db, 'notebooks'), newNotebook);

      const notebookWithId = {
        id: docRef.id,
        ...newNotebook,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedNotebooks = [notebookWithId, ...notebooks];
      setNotebooks(updatedNotebooks);
      // Don't change the active tab
      // setActiveTab('notebooks');
      
      // Update localStorage
      localStorage.setItem(`notebooks_${user.uid}`, JSON.stringify(updatedNotebooks));
      
      // Show notification
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

  const handleSaveNote = async (title, content, notebookId) => {
    try {
      // Find the notebook
      const notebook = notebooks.find(nb => nb.id === notebookId);
      if (!notebook) {
        showToast('Please select a valid notebook', 'error');
        return;
      }

      if (selectedNote) {
        // Update existing note
        const noteRef = doc(db, 'notes', selectedNote.id);

        // If notebook changed, update counts
        if (selectedNote.notebookId !== notebookId) {
          // Decrement old notebook count if it exists
          if (selectedNote.notebookId) {
            const oldNotebookRef = doc(db, 'notebooks', selectedNote.notebookId);
            const oldNotebookSnap = await getDoc(oldNotebookRef);

            if (oldNotebookSnap.exists()) {
              const currentCount = oldNotebookSnap.data().noteCount || 0;
              await updateDoc(oldNotebookRef, {
                noteCount: Math.max(0, currentCount - 1),
                updatedAt: serverTimestamp()
              });
            }
          }

          // Increment new notebook count
          const newNotebookRef = doc(db, 'notebooks', notebookId);
          const newNotebookSnap = await getDoc(newNotebookRef);

          if (newNotebookSnap.exists()) {
            const currentCount = newNotebookSnap.data().noteCount || 0;
            await updateDoc(newNotebookRef, {
              noteCount: currentCount + 1,
              updatedAt: serverTimestamp()
            });
          }
        }

        // Update the note
        await updateDoc(noteRef, {
          title,
          content,
          notebookId,
          notebookName: notebook.name,
          updatedAt: serverTimestamp()
        });

        // Update local state
        const updatedNotes = notes.map(note =>
          note.id === selectedNote.id
            ? {
                ...note,
                title,
                content,
                notebookId,
                notebookName: notebook.name,
                updatedAt: new Date()
              }
            : note
        );
        setNotes(updatedNotes);
        
        // Update localStorage
        localStorage.setItem(`notes_${user.uid}`, JSON.stringify(updatedNotes));
        
        // Update notebooks in localStorage if notebook changed
        if (selectedNote.notebookId !== notebookId) {
          const updatedNotebooks = notebooks.map(nb => {
            if (nb.id === selectedNote.notebookId) {
              return {
                ...nb,
                noteCount: Math.max(0, (nb.noteCount || 0) - 1),
                updatedAt: new Date()
              };
            } else if (nb.id === notebookId) {
              return {
                ...nb,
                noteCount: (nb.noteCount || 0) + 1,
                updatedAt: new Date()
              };
            }
            return nb;
          });
          setNotebooks(updatedNotebooks);
          localStorage.setItem(`notebooks_${user.uid}`, JSON.stringify(updatedNotebooks));
        }
        
        // Show notification
        showToast('Note saved successfully!', 'success', 1000);
      } else {
        // Create new note
        const newNote = {
          title,
          content,
          userId: user.uid,
          notebookId,
          notebookName: notebook.name,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'notes'), newNote);

        // Update notebook note count
        const notebookRef = doc(db, 'notebooks', notebookId);
        const notebookSnap = await getDoc(notebookRef);

        if (notebookSnap.exists()) {
          const currentCount = notebookSnap.data().noteCount || 0;
          await updateDoc(notebookRef, {
            noteCount: currentCount + 1,
            updatedAt: serverTimestamp()
          });

          // Update notebooks in state and localStorage
          const updatedNotebooks = notebooks.map(nb =>
            nb.id === notebookId
              ? {
                  ...nb,
                  noteCount: currentCount + 1,
                  updatedAt: new Date()
                }
              : nb
          );
          setNotebooks(updatedNotebooks);
          localStorage.setItem(`notebooks_${user.uid}`, JSON.stringify(updatedNotebooks));
        }

        const newNoteWithId = {
          id: docRef.id,
          ...newNote,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedNotes = [newNoteWithId, ...notes];
        setNotes(updatedNotes);
        
        // Update localStorage
        localStorage.setItem(`notes_${user.uid}`, JSON.stringify(updatedNotes));
        
        // Show notification
        showToast('Note created successfully!', 'success', 1000);
      }
      // Don't close the editor after saving
      // setShowEditor(false);
    } catch (error) {
      console.error('Error saving note:', error);
      showToast('Failed to save note. Please try again.', 'error');
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
    return notebooks.slice(0, 3);
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
                />
              )}

              {activeTab === 'notebooks' && (
                <NotebooksView
                  notebooks={notebooks}
                  notes={notes}
                  onNotebookClick={(notebook) => setSelectedNotebook(notebook)}
                  onNoteClick={handleEditNote}
                  onCreateNotebook={handleCreateNotebook}
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