import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Header } from "./components/Header";
import { Body } from "./components/Body";
import { listData, listData2, listData3, listData4, listData5, listData6, listData7 } from "./components/data";
import { BodyCoreConcept1 } from "./components/BodyCoreConcept1";
import { BodyCoreConcept2 } from "./components/BodyCoreConcept2";
import { BodyCoreConcept3 } from "./components/BodyCoreConcept3";
import { BodyCoreConcept4 } from "./components/BodyCoreConcept4";
import { BodyCoreConcept5 } from "./components/BodyCoreConcept5";
import { BodyCoreConcept6 } from "./components/BodyCoreConcept6";
import { BodyCoreConcept7 } from "./components/BodyCoreConcept7";
import { BodyCoreConcept8 } from "./components/BodyCoreConcept8";
import { BodyCoreConcept9 } from "./components/BodyCoreConcept9";


function App() {
  const [data, setData] = useState();

  function handleSelect (input){
    setData(input)
    console.log(data)
  }
  function handleDelete(){
    setData('hey')
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
          {listData5.map((list) => <BodyCoreConcept5 key={list.description} {...list} /> )}
        </li>
      </section>

      <section id="section-6-background">
        <h3 id="section-6">Trusted by Microentrepreneurs Across Africa</h3>
        <li className="grid-6">
          {listData6.map((list) => <BodyCoreConcept6 key={list.name} {...list} />)}
        </li>
      </section>

      <section id="section-7-background">
        <h3 id="section-7">Frequently Asked Questions</h3>
      
        <BodyCoreConcept7 input={() => handleSelect('equipment')} >Do I need to buy any special equipment?
          {data === 'equipment' ? <p className="active">{listData7[0].description }</p> : ''}
       
        </BodyCoreConcept7>
        

        <BodyCoreConcept7 input={() => handleSelect('internet')}>Can I use this without the internet?
          {data === 'internet' ? <p className="active">{listData7[1].description }</p> : ''}
        </BodyCoreConcept7>
        <BodyCoreConcept7 input={() => handleSelect('workers')} >How do I add my workers?
          {data === 'workers' ? <p className="active">{listData7[2].description }</p> : ''}
        </BodyCoreConcept7>
        <BodyCoreConcept7 input={() => handleSelect('data')} >Can I export my data?
          {data === 'data' ? <p className="active">{listData7[3].description }</p> : ''}
        </BodyCoreConcept7>
        <BodyCoreConcept7 input={() => handleSelect('limit')} >Is there a limit on transactions?
          {data === 'limit' ? <p className="active">{listData7[4].description }</p> : ''}
        </BodyCoreConcept7>
          
      </section>

      <section>
       <BodyCoreConcept8/>
      </section>

      <section id="section-9">
          <BodyCoreConcept9 />
      </section>
    </>
  );
}

export default App;
