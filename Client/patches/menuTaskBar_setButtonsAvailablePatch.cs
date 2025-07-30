using EFT;
using EFT.UI;
using Newtonsoft.Json;
using RAID_REVIEW;
using SPT.Reflection.Patching;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace RAID_REVIEW
{
    internal class RAID_REVIEW_menuTaskBar_setButtonsAvailablePatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(MenuTaskBar).GetMethod("Awake", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref MenuTaskBar __instance)
        {
            try
            {
                if (RAID_REVIEW.InsertMenuItem.Value)
                {
                    Boolean result = MenuTaskbarMod.Insert(__instance);
                    if (result)
                    {
                        Logger.LogInfo("RAID_REVIEW :::: Inserted Menu Item");
                    }
                }
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
    }
}
