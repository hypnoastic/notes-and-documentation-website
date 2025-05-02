import React, { useState } from 'react';
import './loginPage.css';
import loginImage from './pageAssets/login.png';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect to dashboard on successful login
            navigate('/dashboard');
        } catch (error) {
            setError('Failed to log in. Please check your credentials.');
            console.error('Login error:', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-left">
                <h1>पन्ने</h1>
                <h2>Welcome Back</h2>
                <p>Login to start taking notes</p>
                {error && <p className="error-message">{error}</p>}
                <form className="login-form" onSubmit={handleLogin}>
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
                        placeholder="Enter your password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button 
                        type="submit" 
                        className="auth-login-btn" 
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="switch-text">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
            <div className="login-right">
                <img src={loginImage} alt="Login visual" />
                <h1>Tame your work, organize your life</h1>
            </div>
        </div>
    );
}