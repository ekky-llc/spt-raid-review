import React, { useEffect } from 'react';
import { useRaidReviewCommunityStore } from '../../store/community';
import { useNavigate } from 'react-router';
import GlobalSpinner from '../../component/GlobalSpinner';
import { community_api } from '../../api/community_api';

const SignOut: React.FC = () => {
  const navigate = useNavigate();
  const raidReviewStore = useRaidReviewCommunityStore((s) => s);

  useEffect(() => {

    (async () => {
      await community_api.logout();
      raidReviewStore.signOut();
      setTimeout(async () => {
          navigate('/')
      }, 1000)
    })()

  }, []);

  return <GlobalSpinner message="Signing Out" />;
};

export default SignOut;
