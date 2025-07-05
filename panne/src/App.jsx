import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import LandingPage from './Pages/landingPage.jsx';
import Login from './Pages/loginPage.jsx';
import Signup from './Pages/signupPage.jsx';
import Dashboard from './Pages/Dashboard/Dashboard.jsx';
import ReadOnlyView from './Pages/read-only.jsx';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Protected route component
    const ProtectedRoute = ({ children }) => {
        if (loading) return <div></div>;
        if (!user) return <Navigate to="/login" />;
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
                <Route path="/shared-note" element={<ReadOnlyView />} />
            </Routes>
        </Router>
    );
}

export default App;
