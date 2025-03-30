import { useEffect } from 'react'
import { useRaidReviewCommunityStore } from '../../store/community'
import './Account.css'
import { useNavigate } from 'react-router'

const isDev = window.location.hostname.includes('localhost');
const rootDomain = isDev ? '' : 'https://community.raid-review.online';

export default function Account() {
    const navigator  = useNavigate();

    const raidReviewStore = useRaidReviewCommunityStore(s => s)

    useEffect(() => {
   
        if (!raidReviewStore.isLoading && 
            raidReviewStore.discordAccount === null && 
            raidReviewStore.raidReviewAccount === null) {
            navigator('/');
        }

    }, [raidReviewStore.isLoading, raidReviewStore.discordAccount, raidReviewStore.raidReviewAccount]);

    return (
        <>
            <h1 className='mt-4 font-bold mb-1'>My Account</h1>
            <div className='border border-eft text-eft p-4 grid gap-4'>
                { raidReviewStore.discordAccount !== null && (
                    <div>
                        <div className='bg-[#9a8866] text-black px-2'>
                            <h1 className='font-bold'>Discord Details</h1>
                        </div>
                        <div className='border border-eft p-2'>
                            <div className='grid md:grid-cols-[150px_auto] grid-cols-1'>
                                <p className='font-bold'>ID</p>
                                <p>{ raidReviewStore.discordAccount.id }</p>
                                <p className='font-bold md:mt-0 mt-4'>Username</p>
                                <p>{ raidReviewStore.discordAccount.username }</p>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <div className='bg-[#9a8866] text-black px-2'>
                        <h1 className='font-bold'>Upload Token</h1>
                    </div>
                    <div className='border border-eft p-2'>
                        <div className="flex flex-col">
                            <div>
                                <label className="ml-1" htmlFor="upload_token">Upload Token</label>
                            </div>
                            <input readOnly value={raidReviewStore.raidReviewAccount?.uploadToken} className="placeholder-gray-700 bg-black px-2 py-1 border border-eft" type="text" name="upload_token" id="upload_token" placeholder="Upload Token" required />
                        </div>
                    </div>
                </div>

                { raidReviewStore.raidReviewAccount !== null && (
                    <div>
                        <div className='bg-[#9a8866] text-black px-2'>
                            <h1 className='font-bold'>Upgrade/Membership</h1>
                        </div>

                        { raidReviewStore.raidReviewAccount.membership === 1 ? (
                            <div className='border border-eft p-2'>
                                <div className="flex flex-col">
                                    <p className='mb-4'>Want to upload more raids?</p>
                                    <form action={`${rootDomain}/api/v1/membership/create-checkout-session`} method="POST">
                                        <input type="hidden" name="account_id" value={raidReviewStore?.raidReviewAccount?.id} />
                                        <input type="hidden" name="lookup_key" value="raid_review_premium" />
                                        <button id="checkout-and-portal-button" className="ml-8 py-2 px-12 bg-eft text-black hover:opacity-75" type="submit">
                                            Upgrade for $1/Month
                                        </button>
                                    </form>
                                    <div>
                                        <p className='mt-4'>By upgrading you will increase your upload limit from 1 to 30 Raids (or rather increase your storage limit from ~50MB to ~1GB).</p>
                                        <p className="mt-2">This is how I'd allocate your $1 per month:</p>
                                        <ul className='ml-8 mt-2 border border-eft text-eft p-2 px-4 w-fit'>
                                            <li className="grid grid-cols-[125px_75px_auto]">
                                                <strong>Raid Data</strong> $0.20 <span>Cost to store your raid data</span>
                                            </li>
                                            <li className="grid grid-cols-[125px_75px_auto]">
                                                <strong>Asset Data</strong> $0.20 <span>Storage of Map Assets</span>
                                            </li>
                                            <li className="grid grid-cols-[125px_75px_auto]">
                                                <strong>Processing</strong> $0.40 <span>Server rental for producing replays/heatmaps</span>
                                            </li>
                                            <li className="grid grid-cols-[125px_75px_auto]">
                                                <strong>Development</strong> $0.20 <span>Features/bug fixes</span>
                                            </li>
                                        </ul>
                                        <p className="mt-2">I hope that this breakdown explains that I'm not trying to "profit" from this project, and just trying to cover costs.</p>
                                                                            
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='border border-eft p-2'>
                                <div className="flex flex-col">
                                    <p>🤝🏾 Thank you for supporting the project, even if it's just a little bit, and hey, you get a little more storage at the same time!</p>
                                    <p className='mt-2'>You can view or cancel your subscription by clicking the button below!</p>
                                    <form action={`${rootDomain}/api/v1/membership/create-portal-session`} method="POST">
                                        <input
                                            type="hidden"
                                            id="discord_id"
                                            name="discord_id"
                                            value={raidReviewStore.raidReviewAccount.discordId}
                                        />
                                        <button id="checkout-and-portal-button" className="py-2 px-4 mt-4 bg-eft text-black hover:opacity-75" type="submit">
                                            Manage Subscription
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                    </div>
                )}

                <div>
                    <div className='bg-[#9a8866] text-black px-2'>
                        <h1 className='font-bold'>Community Guidelines</h1>
                    </div>
                    <div className='border border-eft p-2'>
                        <p className='mb-2'>
                            These are some common sense requests, but I'll make them anyway:
                        </p>
                        <ul className="list-disc pl-5 ml-4">
                            <li><strong>Be Respectful:</strong> No racism, vulgarity, or offensive content in your raid data, please!</li>
                            <li><strong>Be Sensible:</strong> Share appropriate content that aligns with the platform’s purpose.</li>
                            <li><strong>No Spamming:</strong> Avoid flooding the platform with excessive content or irrelevant uploads.</li>
                            <li><strong>No Abuse:</strong> Do not exploit or abuse the system, anything that could harm the platform.</li>
                            <li><strong>Follow Upload Guidelines:</strong> Ensure your uploads comply with size and format restrictions.</li>
                        </ul>
                        <p className='mt-2'>
                            If these rules are broken, I will take down the whole platform.
                        </p>
                    </div>
                </div>

            </div>
        </>
    )
}