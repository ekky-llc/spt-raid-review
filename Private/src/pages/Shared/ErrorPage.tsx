import { NavLink } from "react-router";

export function ErrorPage() {
    return <div className="grid h-screen w-screen items-center text-eft text-center">
        <div className="grid w-fit mx-auto">
            <img className="w-64 mx-auto" src="/dead_scav.png" alt="" />
            <h1 className="text-3xl font-bold">Ah snap, you've found an <span className="text-red-400">err...</span> dead scav!</h1>
            <p className="text-sm">Can you do me a favour and report how this happened: <a className="underline underline-offset-4" href="https://github.com/ekky-llc/spt-raid-review/issues" target="__blank">github/spt-raid-review/issues</a></p>
            <NavLink className="py-2 px-4 bg-eft text-black hover:opacity-75 mt-8" to="/">Return Home</NavLink>
        </div>
    </div>
}