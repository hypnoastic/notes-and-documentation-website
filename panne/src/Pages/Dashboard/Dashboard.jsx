import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import './Dashboard.css';
import NoteEditor from './NoteEditor';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchNotes(currentUser.uid);
            } else {
                // Redirect to login if not authenticated
                navigate('/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchNotes = async (userId) => {
        try {
            const notesRef = collection(db, 'notes');
            const q = query(
                notesRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const fetchedNotes = [];
            
            querySnapshot.forEach((doc) => {
                fetchedNotes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            setNotes(fetchedNotes);
            
            // If no notes exist, create a welcome note
            if (fetchedNotes.length === 0) {
                createWelcomeNote(userId);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    const createWelcomeNote = async (userId) => {
        try {
            const welcomeNote = {
                title: 'Welcome to पन्ने!',
                content: 'This is your first note. Click on "Create New Note" to start writing your own notes.',
                userId: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const docRef = await addDoc(collection(db, 'notes'), welcomeNote);
            setNotes([{ id: docRef.id, ...welcomeNote }]);
        } catch (error) {
            console.error('Error creating welcome note:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleCreateNote = () => {
        setSelectedNote(null);
        setShowEditor(true);
    };

    const handleEditNote = (note) => {
        setSelectedNote(note);
        setShowEditor(true);
    };

    const handleSaveNote = async (title, content) => {
        try {
            if (selectedNote) {
                // Update existing note
                const noteRef = doc(db, 'notes', selectedNote.id);
                await updateDoc(noteRef, {
                    title,
                    content,
                    updatedAt: new Date()
                });
                
                // Update local state
                const updatedNotes = notes.map(note => 
                    note.id === selectedNote.id 
                        ? { 
                            ...note, 
                            title, 
                            content, 
                            updatedAt: new Date() 
                        } 
                        : note
                );
                setNotes(updatedNotes);
            } else {
                // Create new note
                const newNote = {
                    title,
                    content,
                    userId: user.uid,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                const docRef = await addDoc(collection(db, 'notes'), newNote);
                setNotes([{ id: docRef.id, ...newNote }, ...notes]);
            }
            setShowEditor(false);
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note. Please try again.');
        }
    };

    const handleCloseEditor = () => {
        setShowEditor(false);
    };

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

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-left">
                    <h1 className="logo">पन्ने</h1>
                </div>
                <div className="nav-right">
                    <div className="user-profile">
                        <span className="user-name">{user?.displayName || 'User'}</span>
                        <div className="avatar">
                            {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
                        </div>
                        <div className="dropdown-menu">
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="sidebar">
                    <button className="create-note-btn" onClick={handleCreateNote}>
                        Create New Note
                    </button>
                    <div className="notes-list">
                        <h3>Recent Notes</h3>
                        {notes.length > 0 ? (
                            notes.map(note => (
                                <div 
                                    key={note.id} 
                                    className="note-item"
                                    onClick={() => handleEditNote(note)}
                                >
                                    <h4>{note.title}</h4>
                                    <p>{note.content.substring(0, 50)}{note.content.length > 50 ? '...' : ''}</p>
                                    <span className="note-date">{formatDate(note.updatedAt)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="no-notes">No notes yet. Create your first note!</p>
                        )}
                    </div>
                </div>

                <div className="main-content">
                    {showEditor ? (
                        <NoteEditor 
                            note={selectedNote}
                            onSave={handleSaveNote}
                            onClose={handleCloseEditor}
                        />
                    ) : (
                        <div className="welcome-message">
                            <h2>Welcome to your Dashboard, {user?.displayName || 'User'}!</h2>
                            <p>Select a note from the sidebar or create a new one to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;