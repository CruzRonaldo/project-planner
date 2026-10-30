import api, { verify2FA, setup2FA, request2FAReset, verify2FAReset } from './api';

export const authApi = {
  verify2FA,
  setup2FA,
  request2FAReset,
  verify2FAReset,
};

export { verify2FA, setup2FA, request2FAReset, verify2FAReset };
export default authApi;
