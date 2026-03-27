import "./BodyCoreConcepts.css";

export function BodyCoreConcept4({ number, title, description }) {
  return (
    <div className="impact-card">
      <div className="impact-number">{number}</div>
      <p className="impact-title">{title}</p>
      <p className="impact-desc">{description}</p>
    </div>
  );
}
