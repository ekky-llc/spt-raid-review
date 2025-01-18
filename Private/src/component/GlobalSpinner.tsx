import { FC, useEffect } from 'react';
import './GlobalSpinner.css';

interface GlobalSpinnerProps {
    message?: string; // Optional prop
  }

const GlobalSpinner: FC<GlobalSpinnerProps> = ({ message }) => {

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
                { message ? message : 'Loading'}<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </div>
        </div>
    );
}

export default GlobalSpinner;
