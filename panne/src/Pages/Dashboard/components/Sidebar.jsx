import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import './Sidebar.css';
import homeIcon from '../../pageAssets/homeicon.png'
import noteIcon from '../../pageAssets/notesicon.png'
import notebookIcon from '../../pageAssets/notebookicon.png'
import logoutIcon from '../../pageAssets/logouticon.png'

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
          <div className="nav-text">
            <img src={homeIcon} alt="Home icon" className="sidebar-icon" /><p>Home</p></div>
        </button>
        <button
          className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <div className="nav-text">
            <img src={noteIcon} alt="notes icon" className="sidebar-icon" /><p>Notes</p></div>
        </button>
        <button
          className={`nav-item ${activeTab === 'notebooks' ? 'active' : ''}`}
          onClick={() => setActiveTab('notebooks')}
        >
          <div className="nav-text">
            <img src={notebookIcon} alt="notebook icon" className="sidebar-icon" /><p>Notebooks</p></div>
        </button>
      </div>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <div className="nav-text">
            <img src={logoutIcon} alt="logout icon" className="sidebar-icon" /><p>Logout</p></div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;