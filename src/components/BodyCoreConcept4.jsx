import './BodyCoreConcepts.css';

export function BodyCoreConcept4 ({number, title, description}){
    return(
        <>
        <div >
            <ul className='grid-4-style'>
                <h2>{number}</h2>
                <h4>{title}</h4>
                <p>{description}</p>
            </ul>
        </div>
        
        
        
        </>
    )
}