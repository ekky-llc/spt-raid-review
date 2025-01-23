import React, { useEffect } from 'react';
import { useRaidReviewCommunityStore } from '../../store/community';
import { useNavigate } from 'react-router';
import GlobalSpinner from '../../component/GlobalSpinner';

const SignOut: React.FC = () => {
  const navigate = useNavigate();
  const raidReviewStore = useRaidReviewCommunityStore((s) => s);

  useEffect(() => {
    raidReviewStore.signOut();
    setTimeout(() => {
      navigate('/')
    }, 1000)
    return;
  }, []);

  return <GlobalSpinner message="Signing Out" />;
};

export default SignOut;
