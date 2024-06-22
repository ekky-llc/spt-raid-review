import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { IAkiProfile } from "../../../../../types/models/eft/profile/IAkiProfile";

import './Home.css'
// import { useState } from "react";

export async function loader() {
    const profiles = await api.getProfiles();

    // const hideUpdateMessage = !window.localStorage.getItem('hide_message__v0.0.4');

    return { profiles }
}

export default function Home() {
    const [ searchParams ] = useSearchParams();
    const { profiles } = useLoaderData() as { profiles: IAkiProfile[], hideUpdateMessage: boolean };
    // const [ showMessage, setShowMessage ] = useState(hideUpdateMessage);
    
    function renderError(profileId: string) {
        const error = searchParams.get('error');
        const affected_profile = searchParams.get('profileId');
    
        const error_mapping = {
            "core_file_is_corrupt" : ": It appears the 'core.json' file was corrupted for this profifle, recompiling data, try again."
        }
        
        if (error && affected_profile === profileId) {
            return <div className="border border-red-700 bg-red-300 text-red-700 m-2 p-2">
            <strong>ERROR</strong>
            { /* @ts-ignore */ }
            <span>{ error_mapping[error] }</span>
        </div>
        }
    }

    // function updateHideMessage() {
    //     setShowMessage(false);
    //     window.localStorage.setItem('hide_message__v0.0.4', 'true');
    // }

    return (
        <main className="h-screen w-screen text-eft grid place-content-center font-mono relative">
            <h1 className="text-center text-2xl mb-2 font-bold">SELECT YOUR PROFILE</h1>
            <div className="grid gap-4 bg-black/75 p-6">
                {profiles.length > 0 ? profiles.map((profile) => (
                <Link key={profile.info.id} to={`/p/${profile.info.id}`} className="border border-eft hover:bg-orange-200/20">
                    <div className="home__profile-card flex p-2">
                        <div className="home__profile-card-image border border-eft bg-black">
                            <img src={`/images/${profile.characters.pmc.Info.Side.toLowerCase()}.png`} alt={`A logo of the private military contractor faction '${profile.characters.pmc.Info.Side}'.`} />
                        </div>
                        <div className="flex flex-col justify-between pl-4">
                            <h2 className="text-xl font-bold">{profile.characters.pmc.Info.Nickname}</h2>
                            <div>
                                <p className="p-0">Level {profile.characters.pmc.Info.Level}</p>
                                <p className="p-0">{profile.info.edition}</p>
                            </div>
                        </div>
                    </div>
                    { renderError(profile.info.id) }
                </Link>
                )) : 'No Profiles Found...'}
            </div>

            {/* { showMessage ? 
                <div id="notification">
                        <div className="home-message">
                            <div className="text-right mx-auto mb-2"> 
                                <a className="text-sm p-2 py-1 hover:bg-neutral-500/25 text-sm cursor-pointer border border-eft text-eft" onClick={updateHideMessage}>Hide Message</a>
                            </div>
                            <div className="border border-eft text-sm text-center p-2 mb-2 mx-auto bg-black p-2">
                                <strong>👋🏾 Hello There 👋🏾</strong>
                                <p className="mt-2">As part of this v0.0.4 update, I've implemented a statistics service that sends post-raid data back to a public web server for some dashboard fun.</p>
                                <p className="mt-2">All data is completely <strong className="underline">anonymous</strong> and is <strong className="underline">disabled</strong> by default.</p>
                                <p className="mt-2">If you'd like to participate you can do so from the new settings page which you'll find in the top-right corner when you select a profile.</p>
                                <p className="mt-2">If you'd like to know more about this <a target='_blank' className="underline" href="https://github.com/ekky-llc/spt-raid-review/blob/main/TELEMETRY.md">read here</a>.</p>
                                <p className="mt-2">You can check out the overall statistics here<br/> <a className="underline" target="_blank" href="https://raid-review.online">https://raid-review.online</a></p>
                                <p className="mt-4">Have fun! - Ekky</p>
                            </div>
                        </div>
                </div>    
            : ''} */}

            <div className="text-xs text-center mt-4">
                Need help? Found a bug?<br />Join the <a target="_blank" className="underline" href="https://discord.gg/5AyDs66h8S">Discord</a>.
            </div>
        </main>
    )
}