import "./BodyCoreConcepts.css";

export function BodyCoreConcept7({ question, answer, isOpen, onToggle }) {
  return (
    <div className={`faq-item${isOpen ? " faq-open" : ""}`} onClick={onToggle}>
      <div className="faq-question-row">
        <p className="faq-question-text">{question}</p>
        <span className={`faq-chevron${isOpen ? " faq-chevron-open" : ""}`}>›</span>
      </div>
      {isOpen && <p className="faq-answer">{answer}</p>}
    </div>
  );
}
