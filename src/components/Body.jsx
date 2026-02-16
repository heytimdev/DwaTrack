import './Body.css';
import bodyimg from '../assets/bodyimg.png';

export function Body (){
    return (
        <>
        <div id='body-container'>
            <div id='body-text'>
                <h2>Digitalize Your Microenterprise Transactions</h2>
                <p id='p-text'>Transform manual record-keeping into automated digital workflows. Generate professional receipts instantly, track daily sales, and grow your business with confidence.</p>
                <button id='button-main'>Start for Free</button>
                <button id='button-sub'> Watch Demo</button>
            </div>
            <div>
            <img src= {bodyimg} alt='Transaction summary' id='img'/>
            </div>
        </div>
        <h2 id='note-text'>Are You Still Using Notebooks and Handwritten Receipts?</h2>
        <p id='box'></p>

        
        </>
    )
}