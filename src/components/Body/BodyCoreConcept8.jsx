import "./BodyCoreConcepts.css";
import {Link} from "react-router-dom";

export function BodyCoreConcept8() {
  return (
    <>
    <ul id="section-8">
      <h3 id="section-8-h3">Ready to Digitalize Your Business?</h3>
      <p className="section-8-text">Join hundreds of microenterprises saving time and growing faster.</p>
      <Link to="/signup" className="no-underline ">
      <button onClick={() => handleSelect} id="section-8-button" className="bg-teal-500 text-white rounded-md p-2 mt-4 ">
        Get Started free - No Credit Card Required
      </button>
      </Link>
      <p className="section-8-p">SET UP YOUR BUSINESS IN UNDER 2 MINUTES</p>
      </ul>
    </>
  );
}
