

using EFT;
using SAIN.SAINComponent;

namespace RAID_REVIEW 
{
    public class BotHelper
    {
        public static string getBotType(BotComponent botComponent)
        {
            if (RAID_REVIEW.SOLARINT_SAIN__DETECTED)
            {
                var mod_SAIN_version = SAIN.AssemblyInfoClass.SAINVersion;
                var splittedVersion = mod_SAIN_version.Split('.');

                var isPlayerScav = splittedVersion.Length > 2 && int.Parse(splittedVersion[0]) >= 2 && int.Parse(splittedVersion[1]) >= 3 && int.Parse(splittedVersion[2]) >= 3 && botComponent.Info.Profile.IsPlayerScav;
                switch (isPlayerScav)
                {
                    case true:
                        return "PLAYER_SCAV";
                    case false:
                        switch (botComponent.Info.Profile.WildSpawnType)
                        {
                            case WildSpawnType.assault:
                                return "SCAV|SCAV";
                            case WildSpawnType.assaultGroup:
                                return "SCAV GROUP|SCAV";
                            case WildSpawnType.crazyAssaultEvent:
                                return "CRAZY SCAV EVENT|SCAV";
                            case WildSpawnType.marksman:
                                return "SCAV SNIPER|SNIPER";
                            case WildSpawnType.cursedAssault:
                                return "TAGGED AND CURSED SCAV|SCAV";
                            case WildSpawnType.bossKnight:
                                return "KNIGHT|GOON";
                            case WildSpawnType.followerBigPipe:
                                return "BIGPIPE|GOON";
                            case WildSpawnType.followerBirdEye:
                                return "BIRDEYE|GOON";
                            case WildSpawnType.exUsec:
                                return "ROGUE|FOLLOWER";
                            case WildSpawnType.pmcBot:
                                return "RAIDER|FOLLOWER";
                            case WildSpawnType.arenaFighterEvent:
                                return "BLOODHOUND|BLOODHOUND";
                            case WildSpawnType.sectantPriest:
                                return "CULTIST PRIEST|CULT";
                            case WildSpawnType.sectantWarrior:
                                return "CULTIST|CULT";
                            case WildSpawnType.bossKilla:
                                return "KILLA|BOSS";
                            case WildSpawnType.bossBully:
                                return "RASHALA|BOSS";
                            case WildSpawnType.followerBully:
                                return "RASHALA GUARD|FOLLOWER";
                            case WildSpawnType.bossKojaniy:
                                return "SHTURMAN|BOSS";
                            case WildSpawnType.followerKojaniy:
                                return "SHTURMAN GUARD|FOLLOWER";
                            case WildSpawnType.bossTagilla:
                                return "TAGILLA|BOSS";
                            case WildSpawnType.followerTagilla:
                                return "TAGILLA GUARD|FOLLOWER";
                            case WildSpawnType.bossSanitar:
                                return "SANITAR|BOSS";
                            case WildSpawnType.followerSanitar:
                                return "SANITAR GUARD|FOLLOWER";
                            case WildSpawnType.bossGluhar:
                                return "GLUHAR|BOSS";
                            case WildSpawnType.followerGluharSnipe:
                                return "GLUHAR GUARD SNIPE|FOLLOWER";
                            case WildSpawnType.followerGluharScout:
                                return "GLUHAR GUARD SCOUT|FOLLOWER";
                            case WildSpawnType.followerGluharSecurity:
                                return "GLUHAR GUARD SECURITY|FOLLOWER";
                            case WildSpawnType.followerGluharAssault:
                                return "GLUHAR GUARD ASSAULT|FOLLOWER";
                            case WildSpawnType.bossZryachiy:
                                return "ZRYACHIY|BOSS";
                            case WildSpawnType.followerZryachiy:
                                return "ZRYACHIY GUARD|FOLLOWER";
                            case WildSpawnType.bossBoar:
                                return "KABAN|BOSS";
                            case WildSpawnType.followerBoar:
                                return "KABAN GUARD|FOLLOWER";
                            case WildSpawnType.bossBoarSniper:
                                return "KABAN SNIPER|FOLLOWER";
                            case WildSpawnType.bossKolontay:
                                return "KOLONTAY|BOSS";
                            case WildSpawnType.followerKolontayAssault:
                                return "KOLONTAY ASSAULT|FOLLOWER";
                            case WildSpawnType.followerKolontaySecurity:
                                return "KOLONTAY SECURITY|FOLLOWER";
                            case WildSpawnType.shooterBTR:
                                return "BTR|OTHER";
                            default:
                                return "UNKNOWN";
                        }
                }

            }
            return "";
        }
    }
}