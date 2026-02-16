import "./BodyCoreConcepts.css";

export function BodyCoreConcept1({ image, text }) {
  return (
    <>
      <div  className="style">
        <ul className="style-text">
            <img src={image}  />
            <p>{text}</p>
        </ul>
      </div>
    </>
  );
}
