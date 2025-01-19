import { Link, Outlet, useNavigation } from "react-router-dom";

import GlobalSpinner from "../../component/GlobalSpinner";

import './Layout.css'

export default function CommunityHome() {
    const navigation = useNavigation();

    return (
        <main className="text-eft font-mono relative mb-4">
            { navigation.state === "loading" && <GlobalSpinner /> }

            <nav className="bg-eft border border-eft border-t-0 grid grid-cols-[auto_1fr]">
                <div className="w-fit">
                    <h1 className="font-bold text-2xl bg-black py-2 px-4 w-fit">RAID REVIEW COMMUNITY HUB</h1>
                </div>
                <ul className="text-black flex justify-end">
                    <li className="text-base h-full hover:bg-black/20">
                        <Link className="h-full w-full grid place-items-center px-4 underline" to="/settings">My Account</Link>
                    </li>
                    <li className="text-base h-full hover:bg-black/20">
                        <Link className="h-full w-full grid place-items-center px-4 underline" to="/">Sign In</Link>
                    </li>
                </ul>
            </nav>

            <Outlet />

            <div className="text-xs text-center mt-4">
                Need help? Found a bug?<br />Join the <a target="_blank" className="underline" href="https://discord.gg/5AyDs66h8S">Discord</a>.
            </div>
        </main>
    )
}