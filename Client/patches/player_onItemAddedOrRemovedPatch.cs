using SPT.Reflection.Patching;
using EFT.InventoryLogic;
using EFT;
using Newtonsoft.Json;
using System.Reflection;
using System;
using System.Threading.Tasks;

namespace RAID_REVIEW
{
    public class RAID_REVIEW_Player_OnItemAddedOrRemovedPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(Player).GetMethod("OnItemAddedOrRemoved", BindingFlags.Instance | BindingFlags.Public);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref Player __instance, Item item, ItemAddress location, bool added)
        {
            if (__instance.Location == "hideout") return;

            try
            {
                bool isPackingMagazine = location.Container.ID == "cartridges";
                if (RAID_REVIEW.LootTracking.Value && !isPackingMagazine)
                {
                    TrackingLootItem newLootItem = new TrackingLootItem
                    {
                        sessionId = RAID_REVIEW.sessionId,
                        profileId = __instance.ProfileId,
                        time = RAID_REVIEW.stopwatch.ElapsedMilliseconds,
                        itemId = item.Id,
                        itemName = item.ShortName,
                        qty = item.StackObjectsCount,
                        type = item.QuestItem ? "QUEST_ITEM" : "LOOT",
                        added = added
                    };

                    Telemetry.Send("LOOT", JsonConvert.SerializeObject(newLootItem));
                }
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
    }
}
