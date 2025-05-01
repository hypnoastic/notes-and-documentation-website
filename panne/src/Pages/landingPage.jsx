import './landingPage.css';
import docs from './pageAssets/docs.webp';
import classNotes from './pageAssets/class-notes.webp';
import journal from './pageAssets/journal.webp';
import thoughts from './pageAssets/thoughts.webp';
import l1 from './pageAssets/l1.png';
import l2 from './pageAssets/l2.png';
import l3 from './pageAssets/l3.png';
import l4 from './pageAssets/l4.png';
import left from './pageAssets/left.png';
import right from './pageAssets/right.png';

const LandingPage = () => {
    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="container">
            {/* Navbar */}
            <div className="navbar">
                <div className="navbar-left">
                    <div className="logo">पन्ने</div>
                    <ul className="nav-links">
                        <li onClick={() => scrollToSection('features')}>Features</li>
                        <li onClick={() => scrollToSection('about-us')}>About Us</li>
                        <li onClick={() => scrollToSection('contact-us')}>Contact</li>
                    </ul>
                </div>
                <div className="nav-buttons">
                    <button className="login-btn">Login</button>
                    <button className="get-started-btn">Get Started</button>
                </div>
            </div>

            {/* Hero Section */}
            <section className="hero">
                <h1>What will you <span className="highlight-green">achieve</span> today?</h1>
                <p>Remember everything and tackle any project with your notes, tasks, and schedule all in one place.</p>
                <button className="get-evernote-btn">Get Started</button>
            </section>


            {/* Horizontal Feature Section */}
            <section className="horizontal-features">
                <div className="scroll-wrapper">
                    <div className="scroll-container">
                        <div className="scroll-card">
                            <img src={docs} alt="Docs" />
                        </div>
                        <div className="scroll-card">
                            <img src={classNotes} alt="Class Notes" />
                        </div>
                        <div className="scroll-card">
                            <img src={journal} alt="Journal" />
                        </div>
                        <div className="scroll-card">
                            <img src={thoughts} alt="Thoughts" />
                        </div>
                    </div>
                </div>
            </section>




            {/* Features Section */}
            <section id="features" className="features">
                <div className="feature-cards">
                    <div className="feature-card">
                        <img src={l2} alt="logo" />
                        <h3>Work anywhere</h3>
                        <p>Keep important info handy—your notes sync automatically to all your devices.</p>
                    </div>
                    <div className="feature-card">
                        <img src={l3} alt="logo" />
                        <h3>Remember everything</h3>
                        <p>Make notes more useful by adding text, images, audio, scans, PDFs, and documents.</p>
                    </div>
                    <div className="feature-card">
                        <img src={l4} alt="logo" />
                        <h3>Turn to-do into done</h3>
                        <p>Bring your notes, tasks, and schedules together to get things done more easily.</p>
                    </div>
                    <div className="feature-card">
                        <img src={l1} alt="logo" />
                        <h3>Find things fast</h3>
                        <p>Get what you need, when you need it with powerful, flexible search capabilities.</p>
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about-us" className="about-us-section">
                <div className="about-us-container">
                    <img src={right} alt="Left visual" className="about-us-image" />

                    <div className="about-us-content">
                        <h2>About Us</h2>
                        <p>
                            Panne is your personal digital notebook—designed to help you capture, organize, and revisit your thoughts effortlessly. Whether you're taking notes, planning ideas, or journaling moments, Panne keeps everything simple, clean, and always accessible.
                        </p>
                    </div>

                    <img src={left} alt="Right visual" className="about-us-image" />
                </div>
            </section>


            {/* Contact Us Section */}
            <section id="contact-us" className="contact-us">
                <h2>Contact Us</h2>
                <div className="contact-form">
                    <input type="text" placeholder="Name" className="form-input" />
                    <input type="email" placeholder="Email" className="form-input" />
                    <textarea placeholder="Message" className="form-textarea"></textarea>
                    <button className="submit-btn">Send Message</button>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Contact</h4>
                        <p>Email: support@panne.com<br />Phone: 000 - 0000 - 0000</p>
                    </div>
                </div>
                <p className="footer-bottom">© 2025 पन्ने. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
