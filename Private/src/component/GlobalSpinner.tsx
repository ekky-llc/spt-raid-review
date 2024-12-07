import { useEffect } from 'react';
import './GlobalSpinner.css';

const GlobalSpinner = () => {

    useEffect(() => {
        const body = document.querySelector('body');
        if (body) {
            body.style.overflow = 'hidden';
        }

        return () => {
            if (body) {
                body.style.overflow = '';
            }
        };
    }, []);

    return (
        <div className='global-spinner-container'>
            <div>
                Loading<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </div>
        </div>
    );
}

export default GlobalSpinner;
