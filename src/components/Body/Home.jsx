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

export function Home() {
  const [data, setData] = useState();

  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  function handleSelect(input) {
    setData(input);
    console.log(data);
  }
  function handleDelete() {
    setData("hey");
  }
  return (
    <>
      <Header />
      <Body />
      <section>
        <menu>
          <li id="list">
            {listData.map((list) => (
              <BodyCoreConcept1 key={list.text} {...list} />
            ))}
          </li>
        </menu>
      </section>

      <section id="section-2">
        <h3 className="body-text">Automate What Used to Take Hours</h3>
        <p id="pp-text" className="body-text">
          KoboTrack digitalizes your entire transaction workflow
        </p>
        <li id="grid-2">
          {listData2.map((list) => (
            <BodyCoreConcept2 key={list.text} {...list} />
          ))}
        </li>
      </section>

      <section id="section-3-space">
        <h3 id="section-3">Get Started in 3 Simple Steps</h3>
        <li className="grid-3">
          {listData3.map((list) => (
            <BodyCoreConcept3 key={list.title} {...list} />
          ))}
        </li>
      </section>

      <section id="section-4-background">
        <h3 id="section-4">The Impact of Digitalization</h3>
        <li className="grid-4">
          {listData4.map((list) => (
            <BodyCoreConcept4 key={list.title} {...list} />
          ))}
        </li>
      </section>

      <section id="section-5-background">
        <h3 id="section-5">Everything You Need, Nothing You Don't</h3>
        <li className="grid-4">
          {listData5.map((list) => (
            <BodyCoreConcept5 key={list.description} {...list} />
          ))}
        </li>
      </section>

      <section id="section-6-background">
        <h3 id="section-6">Trusted by Microentrepreneurs Across Africa</h3>
        <li className="grid-6">
          {listData6.map((list) => (
            <BodyCoreConcept6 key={list.name} {...list} />
          ))}
        </li>
      </section>

      <section id="section-7-background">
        <h3 id="section-7">Frequently Asked Questions</h3>

        <BodyCoreConcept7 input={() => handleSelect("equipment")}>
          Do I need to buy any special equipment?
          {data === "equipment" ? (
            <p className="active">{listData7[0].description}</p>
          ) : (
            ""
          )}
        </BodyCoreConcept7>

        <BodyCoreConcept7 input={() => handleSelect("internet")}>
          Can I use this without the internet?
          {data === "internet" ? (
            <p className="active">{listData7[1].description}</p>
          ) : (
            ""
          )}
        </BodyCoreConcept7>
        <BodyCoreConcept7 input={() => handleSelect("workers")}>
          How do I add my workers?
          {data === "workers" ? (
            <p className="active">{listData7[2].description}</p>
          ) : (
            ""
          )}
        </BodyCoreConcept7>
        <BodyCoreConcept7 input={() => handleSelect("data")}>
          Can I export my data?
          {data === "data" ? (
            <p className="active">{listData7[3].description}</p>
          ) : (
            ""
          )}
        </BodyCoreConcept7>
        <BodyCoreConcept7 input={() => handleSelect("limit")}>
          Is there a limit on transactions?
          {data === "limit" ? (
            <p className="active">{listData7[4].description}</p>
          ) : (
            ""
          )}
        </BodyCoreConcept7>
      </section>

      <section>
        <BodyCoreConcept8 />
      </section>

      <section id="section-9">
        <BodyCoreConcept9 />
      </section>
    </>
  );
}
