import { useRaidReviewCommunityStore } from '../../store/community'
import './Account.css'

export default function Account() {

    const raidReviewStore = useRaidReviewCommunityStore(s => s)

    return (
        <>
            <h1 className='mt-4 font-bold mb-1'>My Account</h1>
            <div className='border border-eft text-eft p-4 grid gap-4'>
                {raidReviewStore.discordAccount !== null && (
                    <div>
                        <div className='bg-[#9a8866] text-black px-2'>
                            <h1 className='font-bold'>Discord Details</h1>
                        </div>
                        <div className='border border-eft p-2'>
                            <div className='grid grid-cols-[150px_auto]'>
                                <p className='font-bold'>ID</p>
                                <p>{ raidReviewStore.discordAccount.id }</p>
                                <p className='font-bold'>Username</p>
                                <p>{ raidReviewStore.discordAccount.username }</p>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <div className='bg-[#9a8866] text-black px-2'>
                        <h1 className='font-bold'>My Account</h1>
                    </div>
                    <div className='border border-eft p-2'>
                        <div className='grid grid-cols-[150px_auto]'>
                            <p className='font-bold'>Upload Key</p>
                            <p>00000-00000-00000-00000</p>
                            <p className='font-bold'>Uploaded Raids</p>
                            <p>2/5</p>
                        </div>
                    </div>
                </div>

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