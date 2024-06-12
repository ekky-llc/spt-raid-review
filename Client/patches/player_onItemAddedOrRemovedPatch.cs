using Aki.Reflection.Patching;
using EFT.InventoryLogic;
using EFT;
using Newtonsoft.Json;
using System.Reflection;
using System;

namespace RAID_REVIEW
{
    public class RAID_REVIEW_Player_OnItemAddedOrRemovedPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(Player).GetMethod("OnItemAddedOrRemoved", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref Player __instance, Item item, ItemAddress location, bool added)
        {
            try
            {
                if (RAID_REVIEW.LootTracking.Value)
                {
                    TrackingLootItem newLootItem = new TrackingLootItem();

                    newLootItem.profileId = __instance.ProfileId;
                    newLootItem.time = RAID_REVIEW.stopwatch.ElapsedMilliseconds;
                    newLootItem.itemId = item.Id;
                    newLootItem.itemName = item.ShortName;
                    newLootItem.qty = item.StackObjectsCount;
                    newLootItem.type = item.QuestItem ? "QUEST_ITEM" : "LOOT";
                    newLootItem.added = added;

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
