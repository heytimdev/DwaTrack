import "./BodyCoreConcepts.css";

export function BodyCoreConcept3({ step, title, description }) {
  return (
    <div className="step-card">
      <div className="step-number">{step}</div>
      <h4 className="step-title">{title}</h4>
      <p className="step-desc">{description}</p>
    </div>
  );
}
