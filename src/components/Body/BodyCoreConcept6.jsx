import "./BodyCoreConcepts.css";

export function BodyCoreConcept6({ star, description, image, name, location }) {
  return (
    <>
      <div id="grid-6-hover">
        <ul className="inline-gridd-6">
          <img src={star} />
          <img src={star} />
          <img src={star} />
          <img src={star} />
          <img src={star} />
          <p className="grid-6-text-p">"{description}"</p>

          <div className="inline-grid-6">
            <div>
              <img src={image} />
            </div>
            <div className="grid-6-second">
              <p className="grid-6-text" id="grid-6-first">{name}</p>
              <h4 className="grid-6-text" id="grid-6-text">{location}</h4>
            </div>
          </div>
        </ul>
      </div>
    </>
  );
}
