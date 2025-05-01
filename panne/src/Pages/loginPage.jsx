import React from 'react';
import './loginPage.css';
import loginImage from './pageAssets/login.png';
import { Link } from 'react-router-dom';

export default function Login() {
    return (
        <div className="login-page">
            <div className="login-left">
                <h1>पन्ने</h1>
                <h2>Welcome Back</h2>
                <p>Login to start taking notes</p>
                <form className="login-form">
                    <input type="email" id="email" placeholder="Enter your email" />
                    <input type="password" id="password" placeholder="Enter your password" />

                    <button type="submit" className="auth-login-btn">Login</button>
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