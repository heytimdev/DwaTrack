import "./Header.css";
import logo from '../../assets/logo.svg';
import { Link } from "react-router-dom";

export function Header() {
  return (
    <>
      <div id="header">
        <div className="flex flex-row gap-2 items-center ml-5">
          <img src={logo} alt="logo" id="logo"/>
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
          <Link to="/signup" className="no-underline">
          <button className="button">Get Started</button>
          </Link>
        </div>
      </div>
    </>
  );
}
