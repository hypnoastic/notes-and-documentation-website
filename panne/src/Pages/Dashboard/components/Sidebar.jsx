import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import './Sidebar.css';

const Sidebar = ({ 
  user, 
  activeTab, 
  setActiveTab, 
  onCreateNote, 
  onCreateNotebook 
}) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="sidebar">
      {/* User Profile */}
      <div className="sidebar-profile">
        <div className="avatar">
          {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
        </div>
        <div className="user-info">
          <h3>{user?.displayName || 'User'}</h3>
          <p>{user?.email}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sidebar-actions">
        <button className="action-btn create-note" onClick={onCreateNote}>
          Create Note
        </button>
        <button className="action-btn create-notebook" onClick={onCreateNotebook}>
          Create Notebook
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Home</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <span className="nav-icon">📝</span>
          <span className="nav-text">Notes</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'notebooks' ? 'active' : ''}`}
          onClick={() => setActiveTab('notebooks')}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-text">Notebooks</span>
        </button>
      </div>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;