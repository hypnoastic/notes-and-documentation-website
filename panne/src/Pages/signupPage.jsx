import React from 'react';
import './loginPage.css';
import signupImage from './pageAssets/login.png';
import { Link } from 'react-router-dom';

export default function Signup() {
    return (
        <div className="login-page">
            <div className="login-left">
                <h1>पन्ने</h1>
                <h2>Create Account</h2>
                <p>Sign up to start your note-taking journey</p>
                <form className="login-form">
                    <input type="text" id="name" placeholder="Enter your name" />
                    <input type="email" id="email" placeholder="Enter your email" />
                    <input type="password" id="password" placeholder="Create a password" />

                    <button type="submit" className="auth-login-btn">Sign Up</button>
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
