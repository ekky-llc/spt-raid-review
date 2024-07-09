import './GlobalSpinner.css';

const GlobalSpinner = () => {
    return (
        <div className='global-spinner-container'>
            <div>
                Loading<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </div>
        </div>
    );
}

export default GlobalSpinner;
