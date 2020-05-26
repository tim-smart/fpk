export default {
  "00-namespace": {
    key: "value",
  },

  "10-env.json": async () => {
    return {
      promise: true,
    };
  },

  "20-env.foo": async () => {
    return {
      promise: true,
    };
  },
};
