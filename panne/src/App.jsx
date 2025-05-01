import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/landingPage.jsx';
import Login from './Pages/loginPage.jsx';
import Signup from './Pages/signupPage.jsx';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
            </Routes>
        </Router>
    );
}

export default App;

