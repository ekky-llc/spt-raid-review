using BepInEx.Bootstrap;
using EFT;
using HarmonyLib;
using System;
using System.Reflection;

namespace RAID_REVIEW
{
    public static class SAINInterop
    {
        private static bool _SAINLoadedChecked = false;
        private static bool _SAINInteropInited = false;

        private static bool _IsSAINLoaded;
        private static Type _SAINComponentsType;
        public static Type _SAINBotController { get; private set; }

        /**
         * Return true if SAIN is loaded in the client
         */
        public static bool IsSAINLoaded()
        {
            if (!_SAINLoadedChecked)
            {
                _SAINLoadedChecked = true;
                _IsSAINLoaded = Chainloader.PluginInfos.ContainsKey("me.sol.sain");
            }

            return _IsSAINLoaded;
        }

        /**
         * Initialize the SAIN interop class data
         * Return true on success, and add to 'RAID_REVIEW' namespace
         */
        public static bool Init()
        {
            if (!IsSAINLoaded()) return false;

            if (!_SAINInteropInited)
            {                
                _SAINComponentsType = Type.GetType("SAIN.Components, SAIN");
                if (_SAINComponentsType != null)
                {
                    _SAINBotController = Type.GetType("SAIN.Components.SAINBotController, SAIN");
                    if (_SAINBotController != null) {
                        RAID_REVIEW.sainBotController = _SAINBotController;
                        _SAINInteropInited = true;
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * If SAIN is loaded, return the Bot Component from the Player using reflection
         */
        public static object GetBotComponent(Player player)
        {
            if (!Init()) return null;

            var getComponentMethod = typeof(Player).GetMethod("GetComponent", BindingFlags.Public | BindingFlags.Instance)?.MakeGenericMethod(_SAINBotController);
            if (getComponentMethod == null) return null;

            return getComponentMethod.Invoke(player, null);
        }
    }
}
