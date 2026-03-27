import "./BodyCoreConcepts.css";

export function BodyCoreConcept2({ image, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-icon-wrap">
        <img src={image} alt={title} className="feature-icon" />
      </div>
      <h4 className="feature-card-title">{title}</h4>
      <p className="feature-card-desc">{description}</p>
    </div>
  );
}
