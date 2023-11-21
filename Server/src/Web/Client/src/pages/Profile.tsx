import { Link } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import api from "../api/api";
import { IAkiProfile } from "../../../../../types/models/eft/profile/IAkiProfile";

import './Profile.css'

export async function loader(loaderData : any) {
    const profile = await api.getProfile(loaderData.params.profileId);
    return { profile }
}

export default function Profile() {
    const { profile } = useLoaderData() as { profile : IAkiProfile };

    return (
        <div className="profile__layout p-6 font-mono">
            <div className="profile__header">
                <ul>
                    <li>
                        <Link to="/">
                            <button className="bg-eft w-32 px-4 py-1 text-xl font-black flex hover:opacity-75">
                                <svg className="mr-2" width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.0625 19.8013L4.0625 14.8013L9.0625 9.80127M18.0625 4.80127V14.8013H5.0625" stroke="black" strokeWidth="2"/>
                                </svg>
                                <span>Return</span>
                            </button>
                        </Link>
                    </li>
                    <li>
                        <button>
                            Overall
                        </button>
                    </li>
                </ul>
            </div>
            <div className="profile__sidebar bg-black/75 p-6">
                <div className="border-eft p-2">
                    <h2 className="text-xl font-black text-eft mb-2">Raid Selection</h2>
                </div>
            </div>
            <div className="profile__body bg-black/75 p-6">
            <div className="border-eft p-2">
                    { profile.characters.pmc.Info.Nickname } Overall Statistics
                </div>
            </div>
        </div>
    )
}