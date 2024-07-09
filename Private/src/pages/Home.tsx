import { Link, useLoaderData, useNavigation, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { IAkiProfile } from "../../../../../types/models/eft/profile/IAkiProfile";

import './Home.css'
import GlobalSpinner from "../component/GlobalSpinner";
// import { useState } from "react";

export async function loader() {
    let profiles = await api.getProfiles();

    profiles = [...profiles, ...profiles, ...profiles, ...profiles, ...profiles, ...profiles]

    return { profiles }
}

export default function Home() {
    const [ searchParams ] = useSearchParams();
    const navigation = useNavigation();
    const { profiles } = useLoaderData() as { profiles: IAkiProfile[], hideUpdateMessage: boolean };

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

    return (
        <main className="h-screen w-screen text-eft grid place-content-center font-mono relative">

            { navigation.state === "loading" && <GlobalSpinner /> }

            <h1 className="text-center text-2xl mb-2 font-bold">{profiles.length > 6 ? (`SELECT YOUR Prof.. woah... why so many?${profiles.length >= 12 ? '... seriously?' : ''}`) : 'SELECT YOUR PROFILE'}</h1>
            <div className={`grid gap-4 bg-black/75 p-6 ${profiles.length >= 6 ? `profile-collector ${profiles.length >= 12 ? 'even-more' : ''}` : ''}`}>
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

            <div className="text-xs text-center mt-4">
                Need help? Found a bug?<br />Join the <a target="_blank" className="underline" href="https://discord.gg/5AyDs66h8S">Discord</a>.
            </div>
        </main>
    )
}