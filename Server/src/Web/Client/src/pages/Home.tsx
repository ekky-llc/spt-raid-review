import { Link, useLoaderData } from "react-router-dom";
import api from "../api/api";
import { IAkiProfile } from "../../../../../types/models/eft/profile/IAkiProfile";

import './Home.css'

export async function loader() {
    const profiles = await api.getProfiles();
    return profiles
}

export default function Home() {
    const profiles = useLoaderData() as IAkiProfile[];

    return (
        <main className="h-screen w-screen text-eft grid place-content-center font-mono">
            <h1 className="text-center text-2xl mb-2 font-bold">SELECT YOUR PROFILE</h1>
            <div className="grid gap-4 bg-black/75 p-6">
                {profiles.length > 0 ? profiles.map((profile) => (
                <Link key={profile.info.id} to={`/p/${profile.info.id}`} className="home__profile-card flex border border-eft p-2 hover:bg-orange-200/20">
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
                </Link>
                )) : 'No Profiles Found...'}
            </div>
        </main>
    )
}