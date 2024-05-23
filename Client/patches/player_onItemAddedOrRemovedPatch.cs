using Aki.Reflection.Patching;
using EFT.InventoryLogic;
using EFT;
using Newtonsoft.Json;
using System.Reflection;
using System;

namespace STATS
{
    public class STATS_Player_OnItemAddedOrRemovedPatch : ModulePatch
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
                if (STATS.LootTracking.Value)
                {
                    TrackingLootItem newLootItem = new TrackingLootItem();

                    newLootItem.playerId = __instance.Profile.ProfileId;
                    newLootItem.time = STATS.stopwatch.ElapsedMilliseconds;
                    newLootItem.id = item.Id;
                    newLootItem.name = item.ShortName;
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
