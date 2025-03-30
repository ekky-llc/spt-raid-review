import React from 'react';
import { useRaidReviewCommunityStore } from '../../store/community';
import { useNavigate } from 'react-router';

function Membership() {

    const navigate = useNavigate();
    const raidReviewStore = useRaidReviewCommunityStore((s) => s);

    return (
      <div>Membership</div>
    )
}

export default Membership;