import { Link, Outlet, useNavigation } from "react-router-dom";

import GlobalSpinner from "../../component/GlobalSpinner";

import './Layout.css'
import { useRaidReviewCommunityStore } from "../../store/community";

export default function CommunityHome() {
    const navigation = useNavigation();


    const raidReviewStore = useRaidReviewCommunityStore(s => s);    

    const isDev = window.location.host.includes("517");
    const authLink = isDev ?
    "https://discord.com/oauth2/authorize?client_id=1199563113993867305&response_type=token&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth&scope=identify" :
    "https://discord.com/oauth2/authorize?client_id=1199563113993867305&response_type=token&redirect_uri=https%3A%2F%2Fcommunity.raid-review.online%2Fauth&scope=identify";

    return (
        <main className="text-eft font-mono relative mb-4 px-4 lg:p-0">
            { navigation.state === "loading" && <GlobalSpinner /> }

            <nav className="bg-eft border border-eft border-t-0 grid grid-cols-[auto_1fr]">
                <div className="w-fit">
                    <h1 className="font-bold text-2xl bg-black py-2 px-4 w-fit">RAID REVIEW COMMUNITY HUB</h1>
                </div>
                <ul className="text-black flex justify-end">
                    { raidReviewStore.discordAccount && raidReviewStore.discordToken ? ( 
                        <>
                            { window.location.pathname.match(/my-account/gi) ? (
                                <li className="text-base h-full hover:bg-black/20">
                                    <Link className="h-full w-full grid place-items-center px-4 underline" to="/">
                                        Home
                                    </Link>
                                </li>
                            ) : (
                                <li className="text-base h-full hover:bg-black/20">
                                    <Link className="h-full w-full grid place-items-center px-4 underline" to="/my-account">
                                        My Account
                                    </Link>
                                </li>
                            )}
                            <li className="text-base h-full hover:bg-black/20">
                                <Link className="h-full w-full grid place-items-center px-4 underline" to="/sign-out">
                                    Sign Out
                                </Link>
                            </li>
                        </>
                    ) : (
                        <li className="text-base h-full hover:bg-black/20">
                            <a href={authLink} className="h-full w-full grid place-items-center px-4 underline">
                                Sign In With Discord
                            </a>
                        </li>
                    )}
                </ul>
            </nav>

            <Outlet />

            <div className="text-xs text-center mt-4">
                Need help? Found a bug?<br />Join the <a target="_blank" className="underline" href="https://discord.gg/5AyDs66h8S">Discord</a>.
            </div>
        </main>
    )
}