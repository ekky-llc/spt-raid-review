
namespace RAID_REVIEW {
    public static class Integrations {
        public static void ModCheck()
        {
            if (!RAID_REVIEW.MODS_SEARCHED)
            {
                LoggerInstance.Log.LogInfo("RAID_REVIEW :::: INFO :::: Searching For Supported Mods");

                RAID_REVIEW.MODS_SEARCHED = true;
                if (RAID_REVIEW.DetectMod("me.sol.sain"))
                {
                    LoggerInstance.Log.LogInfo("RAID_REVIEW :::: INFO :::: Found 'SAIN' Enabling Plugin Features for 'SAIN'.");
                    RAID_REVIEW.SOLARINT_SAIN__DETECTED = true;
                }

                if (RAID_REVIEW.DetectMod("com.fika.core"))
                {
                    LoggerInstance.Log.LogInfo("RAID_REVIEW :::: INFO :::: Found 'FIKA' Enabling Plugin Features for 'FIKA'.");
                    RAID_REVIEW.FIKA__DETECTED = true;
                }
                
                LoggerInstance.Log.LogInfo("RAID_REVIEW :::: INFO :::: Finished Searching For Supported Mods");
            }
            LoggerInstance.Log.LogInfo("RAID_REVIEW :::: INFO :::: RAID Settings Loaded");
        }
    }
}