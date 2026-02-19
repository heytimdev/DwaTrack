import "./BodyCoreConcepts.css";
import down from "../assets/down.svg";

export function BodyCoreConcept7({ children, input }) {
  return (
    <>
      <div id="section-77" onClick={input}>
        <ul id="img-span">
          <p id="section-7-text" >
            {children}
            {/* <span id="img-span-1">
              <img src={down} />
            </span> */}
          </p>
        </ul>
      </div>
    </>
  );
}
