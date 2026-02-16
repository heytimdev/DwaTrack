import "./BodyCoreConcepts.css";

export function BodyCoreConcept2({image, title, description}) {
  return (
    <>
      <div className="style-2">
        <ul className="inline-style">
          <div>
            <img  src= {image}/>
          </div>
          <div >
            <h4>{title}</h4>
            <p id="body-text-2">{description}</p>
          </div>
        </ul>
      </div>
    </>
  );
}
