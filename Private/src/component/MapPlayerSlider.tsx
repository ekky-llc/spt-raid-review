import { useState, useEffect, useRef } from 'react';
import { findInsertIndex } from '../modules/utils';

interface TimelineEvent {
    time: number
    profileNickname: string
    profileId: string
    killedId: string
    killedNickname: string
    weapon: string
    distance: number
    source: {
      x: number
      y: number
      z: number
    }
    target: {
      x: number
      y: number
      z: number
    }
  }
  

interface PlayerSliderProps {
    raidData: any;
    sliderTimes: number[];
    timeCurrentIndex: number;
    events : TimelineEvent[];
    setTimeCurrentIndex: (index: number) => void;
    setTimeStartLimit: (index: number) => void;
    setTimeEndLimit: (index: number) => void;
    preserveHistory: boolean;
}

export function PlayerSlider({ sliderTimes, events, timeCurrentIndex, setTimeCurrentIndex, setTimeStartLimit, setTimeEndLimit, preserveHistory }: PlayerSliderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = () => {
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent) => {
        if (!isDragging) return;

        // @ts-ignore; stupdid fucking error I cant get rid off...
        const parentNode = sliderRef.current.parentNode as HTMLElement;
        const parentRect = parentNode.getBoundingClientRect();
        const newLeft = e.clientX - parentRect.left;
        const newPercentage = Math.max(0, Math.min(newLeft / parentRect.width, 1));
        const newIndex = Math.round(newPercentage * (sliderTimes.length - 1));

        setTimeCurrentIndex(newIndex);
        if (!preserveHistory) {
            setTimeStartLimit(sliderTimes[Math.max(0, newIndex - 200)]);
        } else {
            setTimeStartLimit(sliderTimes[0]);
        }
        setTimeEndLimit(sliderTimes[newIndex]);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent) => {
        e;
        setIsDragging(false);
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent) => {

        const parentNode = sliderRef?.current?.parentNode as HTMLElement;
        const parentRect = parentNode.getBoundingClientRect();
        const newLeft = e.clientX - parentRect.left;
        const newPercentage = Math.max(0, Math.min(newLeft / parentRect.width, 1));
        const newIndex = Math.round(newPercentage * (sliderTimes.length - 1));

        setTimeCurrentIndex(newIndex);
        if (!preserveHistory) {
            setTimeStartLimit(sliderTimes[Math.max(0, newIndex - 200)]);
        } else {
            setTimeStartLimit(sliderTimes[0]);
        }
        setTimeEndLimit(sliderTimes[newIndex]);
    };

    // Fixes rendering in Firefox
    useEffect(() => {
        sliderTimes.sort((a, b) => a - b);
    }, [sliderTimes]);
    
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, preserveHistory]);

    return (
        <div
            className="timeline-container border border-eft relative mt-7"
            onClick={(e) => handleTimelineClick(e)}
        >
            { events.length > 0 ? events.map(e => 
            <div key={e.time} className='event-marker tooltip event' style={{left: `${(100 - (((findInsertIndex(e.time, sliderTimes) / sliderTimes.length - 1) * 100) * -1)) > 99.7166 ? 99.7166 : (100 - (((findInsertIndex(e.time, sliderTimes) / sliderTimes.length - 1) * 100) * -1))}%`,
                }} data-e={JSON.stringify(e)}>
                    <span className="tooltiptext event"><strong>{ e.profileNickname }</strong><br /> killed <br /><strong>{ e.killedNickname }</strong></span>
                </div>)  : ''}
            <div
                className="shelf-slider"
                ref={sliderRef}
                style={{
                    display: preserveHistory ? 'none' : '',
                    left: `${(Math.max(0, timeCurrentIndex - 200) / (sliderTimes.length - 1)) * 100 > 99.7166 ? 99.7166 : (Math.max(0, timeCurrentIndex - 200) / (sliderTimes.length - 1)) * 100}%`,
                }}
                onMouseDown={handleMouseDown}
            ></div>   

            <div
                className="player-slider"
                ref={sliderRef}
                style={{
                    left: `${(timeCurrentIndex / (sliderTimes.length - 1)) * 100 > 99.7166 ? 99.7166 : (timeCurrentIndex / (sliderTimes.length - 1)) * 100}%`,
                }}
                onMouseDown={handleMouseDown}
            ></div>
        </div>
    );
}
