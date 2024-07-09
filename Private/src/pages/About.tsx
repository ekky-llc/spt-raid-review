// import { Link, useLoaderData, useSearchParams } from "react-router-dom";
// import api from "../api/api";
// import { ISptProfile } from "../../../../../types/models/eft/profile/ISptProfile";

import './About.css'

export async function loader() {

}

export default function About() {
    return (
        <div className="text-eft font-mono overflow-x-auto">
            <div className='border border-eft px-4 py-2 mb-4'>
                <strong className='underline'>How To / Info</strong>
                <p className='mb-4'>
                    Play a raid, once the mod has collected information you'll be sent a notification in-game and you'll see the raids on the left hand side to review.
                </p>
                <div className='flex gap-8 p-2 border border-eft'>
                    <p>
                        <strong>Current Version</strong>: v0.1.1
                    </p>
                    <p>
                        <strong>Compatibility</strong>: SPT v3.8.x
                    </p>
                </div>
            </div>

            <div className='border border-eft px-4 py-2 mb-4'>
                <strong className='underline'>Known Issues</strong>
                <ul className="mb-0">
                    <li>
                        - Currently does not work on Mozilla, please use a Chromium based browser.
                    </li>
                </ul>
            </div>

            <div className='border border-eft px-4 py-2 mb-4'>
                <strong className='underline'>Features</strong>
                <ul className="mb-0">
                    <li>
                        - Review information for raids such as kills, looting, players, bots, and positional information.
                    </li>
                    <li>
                        - Basic toggle filters/grouping features to view raid information after the fact.
                    </li>
                    <li>
                        - Replay and visualize positional movement and events that occurred throughout a raid.
                    </li>
                    <li>
                        - [Playback] Follow a specific/player by clicking on them.
                    </li>
                    <li>
                        - [Playback] Click on an 'event' in the timeline.
                    </li>
                    <li>
                        - [Playback] Focus/highlight a player by hovering over name in the Legend panel.
                    </li>
                    <li>
                        - [Playback] Toggle various visulisations to hide and show markers on the map.
                    </li>
                    <li>
                        - [Playback] Toggle map layers to see different levels of a map.
                    </li>
                </ul>
            </div>

            <div className='border border-eft px-4 py-2 mb-4'>
                <strong className='underline'>Roadmap</strong>
                <p className='mt-2'>
                    Interested to see what's on the roadmap, if you have an idea, or wish to contribute, everything is available on <a className='underline' href="https://github.com/ekky-llc/spt-post-raid-statistics">Github</a>.
                </p>
            </div>

            <div className='border border-eft px-4 py-2 mb-4'>
                <strong className='underline'>Credits / Thank You</strong>
                <ul>
                    <li>
                        - The entire SPT team for an amazing framework, and documentation.
                    </li>
                    <li>
                        - SPT Discord, specfically people active in the 'mod-development' and 'dev-community' channels.
                    </li>
                    <li>
                        - The folks over at '<a className="underline" href="https://tarkov.dev">tarkov.dev</a>' for having an Open Sourced MIT Licensed repo that I could fork the interactive map from, litterally saved me weeks of work.
                    </li>
                    <li>
                        - You for downloading the mod, and taking the time to install it.
                    </li>
                </ul>
            </div>
        </div>
    )
}