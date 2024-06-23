

using EFT;
using SAIN.SAINComponent;

namespace RAID_REVIEW
{
    public class BotHelper
    {
        public static string getBotType(BotComponent botComponent)
        {
            
            string RR_WildSpawnType = "UNKNOWN";
            if (RAID_REVIEW.SOLARINT_SAIN__DETECTED)
            {

                switch (botComponent.Info.Profile.WildSpawnType)
                {
                    case WildSpawnType.assault:
                        RR_WildSpawnType = "SCAV|SCAV";
                        break;
                    case WildSpawnType.assaultGroup:
                        RR_WildSpawnType = "SCAV GROUP|SCAV";
                        break;
                    case WildSpawnType.crazyAssaultEvent:
                        RR_WildSpawnType = "CRAZY SCAV EVENT|SCAV";
                        break;
                    case WildSpawnType.marksman:
                        RR_WildSpawnType = "SCAV SNIPER|SNIPER";
                        break;
                    case WildSpawnType.cursedAssault:
                        RR_WildSpawnType = "TAGGED AND CURSED SCAV|SCAV";
                        break;
                    case WildSpawnType.bossKnight:
                        RR_WildSpawnType = "KNIGHT|GOON";
                        break;
                    case WildSpawnType.followerBigPipe:
                        RR_WildSpawnType = "BIGPIPE|GOON";
                        break;
                    case WildSpawnType.followerBirdEye:
                        RR_WildSpawnType = "BIRDEYE|GOON";
                        break;
                    case WildSpawnType.exUsec:
                        RR_WildSpawnType = "ROGUE|FOLLOWER";
                        break;
                    case WildSpawnType.pmcBot:
                        RR_WildSpawnType = "RAIDER|FOLLOWER";
                        break;
                    case WildSpawnType.arenaFighterEvent:
                        RR_WildSpawnType = "BLOODHOUND|BLOODHOUND";
                        break;
                    case WildSpawnType.sectantPriest:
                        RR_WildSpawnType = "CULTIST PRIEST|CULT";
                        break;
                    case WildSpawnType.sectantWarrior:
                        RR_WildSpawnType = "CULTIST|CULT";
                        break;
                    case WildSpawnType.bossKilla:
                        RR_WildSpawnType = "KILLA|BOSS";
                        break;
                    case WildSpawnType.bossBully:
                        RR_WildSpawnType = "RASHALA|BOSS";
                        break;
                    case WildSpawnType.followerBully:
                        RR_WildSpawnType = "RASHALA GUARD|FOLLOWER";
                        break;
                    case WildSpawnType.bossKojaniy:
                        RR_WildSpawnType = "SHTURMAN|BOSS";
                        break;
                    case WildSpawnType.followerKojaniy:
                        RR_WildSpawnType = "SHTURMAN GUARD|FOLLOWER";
                        break;
                    case WildSpawnType.bossTagilla:
                        RR_WildSpawnType = "TAGILLA|BOSS";
                        break;
                    case WildSpawnType.followerTagilla:
                        RR_WildSpawnType = "TAGILLA GUARD|FOLLOWER";
                        break;
                    case WildSpawnType.bossSanitar:
                        RR_WildSpawnType = "SANITAR|BOSS";
                        break;
                    case WildSpawnType.followerSanitar:
                        RR_WildSpawnType = "SANITAR GUARD|FOLLOWER";
                        break;
                    case WildSpawnType.bossGluhar:
                        RR_WildSpawnType = "GLUHAR|BOSS";
                        break;
                    case WildSpawnType.followerGluharSnipe:
                        RR_WildSpawnType = "GLUHAR GUARD SNIPE|FOLLOWER";
                        break;
                    case WildSpawnType.followerGluharScout:
                        RR_WildSpawnType = "GLUHAR GUARD SCOUT|FOLLOWER";
                        break;
                    case WildSpawnType.followerGluharSecurity:
                        RR_WildSpawnType = "GLUHAR GUARD SECURITY|FOLLOWER";
                        break;
                    case WildSpawnType.followerGluharAssault:
                        RR_WildSpawnType = "GLUHAR GUARD ASSAULT|FOLLOWER";
                        break;
                    case WildSpawnType.bossZryachiy:
                        RR_WildSpawnType = "ZRYACHIY|BOSS";
                        break;
                    case WildSpawnType.followerZryachiy:
                        RR_WildSpawnType = "ZRYACHIY GUARD|FOLLOWER";
                        break;
                    case WildSpawnType.bossBoar:
                        RR_WildSpawnType = "KABAN|BOSS";
                        break;
                    case WildSpawnType.followerBoar:
                        RR_WildSpawnType = "KABAN GUARD|FOLLOWER";
                        break;
                    case WildSpawnType.bossBoarSniper:
                        RR_WildSpawnType = "KABAN SNIPER|FOLLOWER";
                        break;
                    case WildSpawnType.bossKolontay:
                        RR_WildSpawnType = "KOLONTAY|BOSS";
                        break;
                    case WildSpawnType.followerKolontayAssault:
                        RR_WildSpawnType = "KOLONTAY ASSAULT|FOLLOWER";
                        break;
                    case WildSpawnType.followerKolontaySecurity:
                        RR_WildSpawnType = "KOLONTAY SECURITY|FOLLOWER";
                        break;
                    case WildSpawnType.shooterBTR:
                        RR_WildSpawnType = "BTR|OTHER";
                        break;
                    default:
                        RR_WildSpawnType = "UNKNOWN";
                        break;
                }

                var mod_SAIN_version = SAIN.AssemblyInfoClass.SAINVersion;
                var splittedVersion = mod_SAIN_version.Split('.');
                var isPlayerScav = splittedVersion.Length > 2 && int.Parse(splittedVersion[0]) >= 2 && int.Parse(splittedVersion[1]) >= 3 && int.Parse(splittedVersion[2]) >= 3 && botComponent.Info.Profile.IsPlayerScav;
                if (isPlayerScav) {
                    RR_WildSpawnType = "PLAYER_SCAV|SCAV";
                }

                // If a boss hasn't already been found, but the 'IsBoss' flag is true, return a 'boss'
                var isCustomBoss = !RR_WildSpawnType.EndsWith("BOSS") && botComponent.Info.Profile.IsBoss;
                if (isCustomBoss) RR_WildSpawnType = "CUSTOM|BOSS";

            }

            return RR_WildSpawnType;
        }
    }
}