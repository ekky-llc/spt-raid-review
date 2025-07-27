import React, { useEffect, useRef } from 'react';
import { useRaidReviewCommunityStore } from '../../store/community';
import { useNavigate } from 'react-router';
import { community_api } from '../../api/community_api';
import { DiscordAccount, RaidReviewAccount } from '../../types/api_types';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const hasRun = useRef(false);
  const raidReviewStore = useRaidReviewCommunityStore((s) => s);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const fetchUser = async () => {
        const accessToken = new URLSearchParams(window.location.hash.slice(1)).get('access_token') as string;
        if (!accessToken) return navigate('/?loginError=true');

        raidReviewStore.setDiscordToken(accessToken);

        try {

              let discordResponse = await community_api.login(accessToken);
              let userAccountData = null as null | RaidReviewAccount;

              if (discordResponse === null) {
                  userAccountData = await community_api.registerAccount(accessToken) as RaidReviewAccount;
                  discordResponse = await community_api.login(accessToken);

                  if (discordResponse === null) {
                      return navigate('/?loginError=true');
                  }
              }

              const discordData = discordResponse.discordAccount as DiscordAccount;
              raidReviewStore.setDiscordAccount(discordData);

              // Get the users Raid Review data
              const userResponse = await community_api.getAccount(discordData) as null | RaidReviewAccount;
              if (userResponse !== null) {
                userAccountData = userResponse;
              } 

              if (userAccountData !== null) {
                raidReviewStore.setRaidReviewAccount(userAccountData)
                return navigate('/my-account');
              }


        } catch (err: any) {
            console.log(err);
            return navigate('/?loginError=true');
        }
    };

    fetchUser();
  }, []);

  return <div>Loading...</div>;
};

export default Auth;
