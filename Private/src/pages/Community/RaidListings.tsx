import { FC } from 'react';
import { NavLink, LoaderFunctionArgs, useLoaderData } from 'react-router';
import { community_api } from '../../api/community_api';
import { getLocation } from '../../helpers/locations';

const whitelisted_days = {
    '7' : 7,
    '14' : 14,
    '30' : 30,
    '90' : 90,
    'ALL' : 99999,
} as { [key: string] : number }

export async function loader(loaderData: LoaderFunctionArgs) {

    let url = new URL(loaderData.request.url);
    let days_qs = url.searchParams.get('days') || '7';
    let days = whitelisted_days[days_qs];

    if (days === undefined) days = 7;

    const raids = await community_api.getRaids(days);
    return { raids, days };
}

// Component to display the raid listings
const RaidListings: FC = () => {
    const { raids, days } = useLoaderData() as { raids: any[], days: number };

    return (
        <div>
            <div className='mt-4 flex justify-between'>
                <div className='flex gap-2'>
                    <h2 className='font-bold text-lg'>Uploaded: { days === 99999 ? `All Time` : `Last ${days} Days` }</h2>
                </div>
                <div className='flex gap-2'>
                    <NavLink className='underline underline-offset-2' to="/?days=7">7</NavLink>
                    <NavLink className='underline underline-offset-2' to="/?days=14">14</NavLink>
                    <NavLink className='underline underline-offset-2' to="/?days=30">30</NavLink>
                    <NavLink className='underline underline-offset-2' to="/?days=90">90</NavLink>
                    <NavLink className='underline underline-offset-2' to="/?days=ALL">All</NavLink>
                </div>
            </div>
            <hr className="border-eft mb-4" />
            <div>
                <ul className='grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4'>
                    {raids.map((raid, index) => (
                        <li key={index} className='border border-eft min-h-[350px] relative'>
                            <img src={`/public/images/${raid.location}.png`} />
                            <div className='bg-eft text-black font-bold px-2 py-1'>
                                { raid.title }
                            </div>
                            <div className='p-3 text-xs flex flex-col gap-2'>
                                <div>
                                    <p className='font-bold underline'>Location</p>
                                    { getLocation(raid.location) }
                                </div>
                                <div>
                                    <p className='font-bold underline'>Description</p>
                                    { raid.description }
                                </div>
                                <div>
                                    <p className='font-bold underline'>Username</p>
                                    { raid.username }
                                </div>
                            </div>
                            <NavLink className='absolute underline text-sm bottom-0 font-bold right-0 bg-eft text-black w-fit px-2 py-1 hover:opacity-75 cursor-pointer' to={`/raid/${raid.raidId}`}>
                                View Raid
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default RaidListings;
