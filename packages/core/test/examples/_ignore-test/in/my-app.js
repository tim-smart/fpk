exports.default = async () => ({
  "00-namespace": {
    key: "value",
  },

  "10-env": async () => {
    return {
      promise: true,
    };
  },
});
