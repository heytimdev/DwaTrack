import "./Body.css";
import bodyimg from "../../assets/bodyimg.png";
import { Link } from "react-router-dom";

export function Body() {
  return (
    <>
      <div id="body-container">
        <div id="hero-text">
          <div id="hero-badge">
            <span className="badge-dot"></span>
            Built for African Microentrepreneurs
          </div>
          <h2 id="hero-heading">
            Digitalize Your Microenterprise Transactions
          </h2>
          <p id="p-text">
            Transform manual record-keeping into automated digital workflows.
            Generate professional receipts instantly, track daily sales, and
            grow your business with confidence.
          </p>
          <div id="hero-buttons">
            <Link to="/signup">
              <button id="button-main">Get Started Free →</button>
            </Link>
            <Link to="/login">
              <button id="button-sub">Log In</button>
            </Link>
          </div>
        </div>

        <div id="hero-image-wrap">
          {/* Browser window chrome mockup */}
          <div id="browser-frame">
            <div id="browser-bar">
              <div className="browser-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div id="browser-url">
                <span id="url-lock">🔒</span>
                kobotrack.app/dashboard
              </div>
              <div className="browser-spacer"></div>
            </div>
            <div id="browser-content">
              <img src={bodyimg} alt="KoboTrack dashboard preview" id="img" />
            </div>
          </div>
        </div>
      </div>

      <div id="hero-stats">
        <div className="stat-item">
          <span className="stat-num">500+</span>
          <span className="stat-label">Active Businesses</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-num">60%</span>
          <span className="stat-label">Time Saved Daily</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-num">GH₵0</span>
          <span className="stat-label">Forever Free</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-num">99%</span>
          <span className="stat-label">Accuracy Rate</span>
        </div>
      </div>

      <h2 id="note-text">
        Are You Still Using Notebooks and Handwritten Receipts?
      </h2>
      <p id="box"></p>
    </>
  );
}
