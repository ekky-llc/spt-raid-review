import { useState } from "react";
import { useNavigate } from "react-router";

import api from "../../api/api";
import GlobalSpinner from "../../component/GlobalSpinner";

export default function RaidImport() {
    const navigate = useNavigate();

    const [ confirmCount, setConfirmCount ] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");
    const [ isLoading, setIsLoading ] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const file = event.target.files[0];
            if (file) {
                setFile(file);
                setFileName(file.name);
                return;
            }
        }

        setFile(null);
        setFileName("");

        return;
    };

    const handleUploadSubmit = async () => {
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setIsLoading(true);
        const response = await api.importRaid(formData);
        setIsLoading(false);
        if (response) {
            navigate("/");
        }
        
        return;
    }

    return (
        <>
            { isLoading && <GlobalSpinner message="Importing (this can take awhile)" /> }
            <div className="raid-import-container">
                <>
                    <div>
                        <div className="text-eft font-mono overflow-x-auto mt-2">

                            <strong>Import Raid</strong>
                            <div className="flex flex-col items-center justify-between border border-eft p-2">

                                { confirmCount < 2 ? (
                                    <div className="border bg-red-100 border-red-800 text-red-800 w-full p-2">
                                        <p className="font-bold">Important Warning!</p>
                                        <p className="text-xs">
                                            You're about to import a raid. Please proceed only if you absolutely trust the person who provided this file. Importing data from an untrusted source could compromise your system or introduce incorrect data. Neither the author of this mod nor anyone else is responsible for any issues, damage, or loss that may occur as a result of this action. Proceed at your own risk.
                                        </p>
                                            <button onClick={() => setConfirmCount(confirmCount + 1)} className="border border-red-800 bg-red-100 py-2 px-4 mt-4 font-bold hover:bg-red-500 hover:text-white">
                                                { confirmCount === 0 && 'I Understand' }
                                                { confirmCount === 1 && 'I Really Understand' }
                                            </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="border border-eft text-eft w-full p-2">
                                            <div className="flex flex-col items-center w-full p-8">
                                                <label 
                                                    htmlFor="fileInput" 
                                                    className="cursor-pointer border border-eft text-eft font-medium py-2 px-4 hover:bg-[#9a8866] hover:text-black focus:ring focus:ring-blue-300 transition">
                                                    Select Your File
                                                </label>
                                                <input 
                                                    id="fileInput" 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={handleFileChange}
                                                />
                                                {fileName && (
                                                    <p className="text-sm text-eft mt-2">
                                                        Selected file: <span className="font-medium">{fileName}</span>
                                                    </p>
                                                )}
                                                <p className="text-sm text-eft mt-2">
                                                    Supported formats: .raidreview
                                                </p>
                                            </div>
                                        </div>
                                        { fileName && (
                                            <button onClick={handleUploadSubmit} className="py-1 px-4 bg-eft text-black hover:opacity-75 w-full mt-2">
                                                Import Raid
                                            </button>
                                        )}
                                    </>
                                )}

                            </div>

                        </div>
                    </div>
                </>
            </div>
        </>
    )
}