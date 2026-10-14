import API from './api';

export const rewardService = {
  getMyRewards: async () => {
    const res = await API.get('/rewards/my-rewards');
    return res.data;
  },

  redeemReward: async (rewardId) => {
    const res = await API.post('/rewards/redeem', { rewardId });
    return res.data;
  },
};
