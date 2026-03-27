import "./BodyCoreConcepts.css";

export function BodyCoreConcept6({ description, image, name, location }) {
  return (
    <div className="testimonial-card">
      <div className="star-rating">★★★★★</div>
      <p className="testimonial-body">"{description}"</p>
      <div className="testimonial-author">
        <img src={image} alt={name} className="author-avatar" />
        <div>
          <p className="author-name">{name}</p>
          <p className="author-location">{location}</p>
        </div>
      </div>
    </div>
  );
}
