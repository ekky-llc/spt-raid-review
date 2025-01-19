import React, { useEffect } from 'react';
import { useRaidReviewCommunityStore } from '../../store/community';
import { useNavigate } from 'react-router-dom';

const SignOut: React.FC = () => {
  const navigate = useNavigate();
  const raidReviewStore = useRaidReviewCommunityStore((s) => s);

  useEffect(() => {
    raidReviewStore.signOut();
    return navigate('/');
  }, []);

  return <div>Loading...</div>;
};

export default SignOut;
