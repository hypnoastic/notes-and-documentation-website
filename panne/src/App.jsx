import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from './firebase';
import LandingPage from './Pages/landingPage.jsx';
import Login from './Pages/loginPage.jsx';
import Signup from './Pages/signupPage.jsx';
import Dashboard from './Pages/Dashboard/Dashboard.jsx';
import LoadingAnimation from './Pages/LoadingAnimation.jsx';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Set persistence to LOCAL to persist the user's session
        setPersistence(auth, browserLocalPersistence)
            .catch((error) => {
                console.error("Error setting persistence:", error);
            });

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthenticated(!!currentUser);
            setLoading(false);
            
            // If user just logged in, show loading animation
            if (currentUser && !isAuthenticated) {
                setShowLoadingAnimation(true);
            }
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // Protected route component
    const ProtectedRoute = ({ children }) => {
        if (loading) return <div className="initial-loading">Loading...</div>;
        if (!user) return <Navigate to="/login" />;
        
        if (showLoadingAnimation) {
            return <LoadingAnimation onAnimationComplete={() => setShowLoadingAnimation(false)} />;
        }
        
        return children;
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;
