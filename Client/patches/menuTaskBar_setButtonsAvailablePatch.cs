using Aki.Reflection.Patching;
using EFT;
using EFT.UI;
using Newtonsoft.Json;
using STATS;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace STATS
{
    internal class STATS_menuTaskBar_setButtonsAvailablePatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(MenuTaskBar).GetMethod("SetButtonsAvailable", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref MenuTaskBar __instance, bool available)
        {
            try
            {
                Boolean result = MenuTaskbarMod.Insert();
                if (result)
                {
                    Logger.LogInfo("STATS :::: Inserted Menu Item");
                }

                Telemetry.Send("MAIN_MENU", "{\"data\":\"\"}");
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
    }
}
