import {
  listData,
  listData2,
  listData3,
  listData4,
  listData5,
  listData6,
  listData7,
} from "../data.js";
import { useState, useEffect } from "react";
import { BodyCoreConcept1 } from "./BodyCoreConcept1.jsx";
import { BodyCoreConcept2 } from "./BodyCoreConcept2.jsx";
import { BodyCoreConcept3 } from "./BodyCoreConcept3.jsx";
import { BodyCoreConcept4 } from "./BodyCoreConcept4.jsx";
import { BodyCoreConcept5 } from "./BodyCoreConcept5.jsx";
import { BodyCoreConcept6 } from "./BodyCoreConcept6.jsx";
import { BodyCoreConcept7 } from "./BodyCoreConcept7.jsx";
import { BodyCoreConcept8 } from "./BodyCoreConcept8.jsx";
import { BodyCoreConcept9 } from "./BodyCoreConcept9.jsx";
import { Header } from "./Header.jsx";
import { Body } from "./Body.jsx";
import { BackToTop } from "./BackToTop.jsx";

export function Home() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in-view");
        }),
      { threshold: 0.08 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  function handleFaqToggle(key) {
    setOpenFaq((prev) => (prev === key ? null : key));
  }

  const faqKeys = ["equipment", "internet", "workers", "data", "limit"];

  return (
    <>
      <Header />
      <Body />

      {/* Section 1 — The Problem */}
      <section id="problem-section">
        <ul id="list">
          {listData.map((list) => (
            <BodyCoreConcept1 key={list.text} {...list} />
          ))}
        </ul>
      </section>

      {/* Section 2 — Automation Features */}
      <section id="features-section">
        <div id="section-2">
          <h3 className="section-heading">Automate What Used to Take Hours</h3>
          <p className="section-subheading">
            KoboTrack digitalizes your entire transaction workflow
          </p>
          <ul id="grid-2">
            {listData2.map((list) => (
              <BodyCoreConcept2 key={list.title} {...list} />
            ))}
          </ul>
        </div>
      </section>

      {/* Section 3 — Steps */}
      <section id="steps-section">
        <div id="section-3-space">
          <h3 id="section-3">Get Started in 3 Simple Steps</h3>
          <ul className="grid-3">
            {listData3.map((list) => (
              <BodyCoreConcept3 key={list.title} {...list} />
            ))}
          </ul>
        </div>
      </section>

      {/* Section 4 — Impact Stats */}
      <section>
        <div id="section-4-background">
          <h3 id="section-4">The Impact of Digitalization</h3>
          <ul className="grid-4">
            {listData4.map((list) => (
              <BodyCoreConcept4 key={list.title} {...list} />
            ))}
          </ul>
        </div>
      </section>

      {/* Section 5 — Feature Checklist */}
      <section>
        <div id="section-5-background">
          <h3 id="section-5">Everything You Need, Nothing You Don't</h3>
          <ul className="grid-4">
            {listData5.map((list) => (
              <BodyCoreConcept5 key={list.description} {...list} />
            ))}
          </ul>
        </div>
      </section>

      {/* Section 6 — Testimonials */}
      <section>
        <div id="section-6-background">
          <h3 id="section-6">Trusted by Microentrepreneurs Across Africa</h3>
          <ul className="grid-6">
            {listData6.map((list) => (
              <BodyCoreConcept6 key={list.name} {...list} />
            ))}
          </ul>
        </div>
      </section>

      {/* Section 7 — FAQ */}
      <section id="faq-section">
        <div id="section-7-background">
          <h3 id="section-7">Frequently Asked Questions</h3>

          {listData7.map((item, i) => (
            <BodyCoreConcept7
              key={faqKeys[i]}
              question={item.question}
              answer={item.description}
              isOpen={openFaq === faqKeys[i]}
              onToggle={() => handleFaqToggle(faqKeys[i])}
            />
          ))}
        </div>
      </section>

      {/* Section 8 — CTA */}
      <section>
        <BodyCoreConcept8 />
      </section>

      {/* Section 9 — Footer */}
      <section id="section-9">
        <BodyCoreConcept9 />
      </section>

      <BackToTop />
    </>
  );
}
