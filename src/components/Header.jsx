import "./Header.css";

export function Header() {
  return (
    <>
      <div id="header">
        <div>
          <p id="main">KoboTrack</p>
        </div>
        <div>
          <ul id="nav-bar">
            <a href="/" className="nav-text">
              The Problem
            </a>
            <a href="/" className="nav-text">
              Features
            </a>
            <a href="/" className="nav-text">
              How it Works
            </a>
          </ul>
        </div>
        <div>
          <button className="button">Get Started Free</button>
        </div>
      </div>
    </>
  );
}
