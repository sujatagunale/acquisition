export const cookieUtils = {
  getOptions: () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  }),

  set: (res, name, value, options = {}) => {
    res.cookie(name, value, { ...cookieUtils.getOptions(), ...options });
  },

  clear: (res, name, options = {}) => {
    res.clearCookie(name, { ...cookieUtils.getOptions(), ...options });
  },

  get: (req, name) => {
    return req.cookies[name];
  },
};
