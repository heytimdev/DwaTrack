import "./BodyCoreConcepts.css";

export function BodyCoreConcept5({ description }) {
  return (
    <div className="checklist-item">
      <span className="check-icon">✓</span>
      <p className="checklist-text">{description}</p>
    </div>
  );
}
