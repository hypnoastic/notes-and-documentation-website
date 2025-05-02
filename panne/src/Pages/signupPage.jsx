import React, { useState } from 'react';
import './loginPage.css';
import signupImage from './pageAssets/login.png';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update user profile with name
            await updateProfile(userCredential.user, {
                displayName: name
            });
            
            // Redirect to dashboard on successful signup
            navigate('/dashboard');
        } catch (error) {
            setError('Failed to create an account. ' + error.message);
            console.error('Signup error:', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-left">
                <h1>पन्ने</h1>
                <h2>Create Account</h2>
                <p>Sign up to start your note-taking journey</p>
                {error && <p className="error-message">{error}</p>}
                <form className="login-form" onSubmit={handleSignup}>
                    <input 
                        type="text" 
                        id="name" 
                        placeholder="Enter your name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input 
                        type="email" 
                        id="email" 
                        placeholder="Enter your email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input 
                        type="password" 
                        id="password" 
                        placeholder="Create a password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button 
                        type="submit" 
                        className="auth-login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <p className="switch-text">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
            <div className="login-right">
                <img src={signupImage} alt="Signup visual" />
                <h1>Your notes, organized and always with you</h1>
            </div>
        </div>
    );
}
