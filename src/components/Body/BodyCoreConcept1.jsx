import "./BodyCoreConcepts.css";

export function BodyCoreConcept1({ image, text }) {
  return (
    <div className="problem-card">
      <div className="problem-icon-wrap">
        <img src={image} className="problem-icon" alt="" />
      </div>
      <p className="problem-card-text">{text}</p>
    </div>
  );
}
