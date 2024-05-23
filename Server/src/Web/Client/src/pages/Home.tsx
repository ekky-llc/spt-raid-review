import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { IAkiProfile } from "../../../../../types/models/eft/profile/IAkiProfile";

import './Home.css'

export async function loader() {
    const profiles = await api.getProfiles();

    return { profiles }
}

export default function Home() {
    const [ searchParams ] = useSearchParams();
    const { profiles } = useLoaderData() as { profiles: IAkiProfile[] };

    
    function renderError(profileId: string) {
        const error = searchParams.get('error');
        const affected_profile = searchParams.get('profileId');
    
        const error_mapping = {
            "core_file_is_corrupt" : ": It appears the 'core.json' file was corrupted for this profifle, recompiling data, try again."
        }

        if (error === "core_file_is_corrupt" && affected_profile === profileId) {
            api.recompileCoreFile(profileId);
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
        <main className="h-screen w-screen text-eft grid place-content-center font-mono">
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
        </main>
    )
}