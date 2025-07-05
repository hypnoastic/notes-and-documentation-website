import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './read-only.css';

const ReadOnlyView = () => {
  const [searchParams] = useSearchParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = searchParams.get('userId');
  const noteId = searchParams.get('noteId');

  useEffect(() => {
    const fetchNote = async () => {
      if (!userId || !noteId) {
        setError('Invalid URL parameters');
        setLoading(false);
        return;
      }

      try {
        const noteRef = doc(db, 'users', userId, 'notes', noteId, 'current', 'latest');
        const noteSnap = await getDoc(noteRef);

        if (!noteSnap.exists()) {
          setError('Note not found');
          setLoading(false);
          return;
        }

        setNote({
          id: noteId,
          ...noteSnap.data()
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching note:', error);
        setError('Error loading note');
        setLoading(false);
      }
    };

    fetchNote();
  }, [userId, noteId]);

  if (loading) {
    return (
      <div className="read-only-loading">
        <div className="loader"></div>
        <p>Loading note...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="read-only-error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="read-only-container">
      <div className="read-only-content">
        <h1 className="read-only-title">{note.title}</h1>
        <div 
          className="read-only-body"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </div>
    </div>
  );
};

export default ReadOnlyView;