import "./BodyCoreConcepts.css";

export function BodyCoreConcept5({ image, description }) {
  return (
    <>
      <div>
        <ul className="grid-5">
          <img src={image} id="img-5" />
          <p id="grid-5-text" >{description}</p>
        </ul>
      </div>
    </>
  );
}
