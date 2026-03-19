import "./BodyCoreConcepts.css";

export function BodyCoreConcept3({image, title, description}) {
  return (
    <>
      <div >
        <ul id="grid-3-style">
            <img src={image} id="img-section-3"/>
            <h4 id="text-h3">{title}</h4>
            <p id="text-h4">{description}</p>
        </ul>
      </div>
    </>
  );
}
