import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRaidReviewCommunityStore } from '../../store/community';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const raidReviewStore = useRaidReviewCommunityStore((s) => s);

  useEffect(() => {
    const fetchUser = async () => {
        const accessToken = new URLSearchParams(window.location.hash.slice(1)).get('access_token') as string;

        if (!accessToken) return navigate('/?loginError=true');
        raidReviewStore.setDiscordToken(accessToken);

        try {

              const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              raidReviewStore.setDiscordAccount(userResponse.data)
              return navigate('/my-account');

        } catch (err: any) {
            return navigate('/?loginError=true');
        }
    };

    fetchUser();
  }, []);

  return <div>Loading...</div>;
};

export default Auth;
