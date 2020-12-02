export default {
  "00-namespace": {
    key: "value",
  },

  "10-env": async () => {
    return {
      promise: true,
    };
  },

  "20-ini-test.ini": {
    key: "value",

    database: {
      user: "dbuser",
      password: "dbpassword",
    },
  },
};
