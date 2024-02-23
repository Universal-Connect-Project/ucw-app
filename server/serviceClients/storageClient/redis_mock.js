module.exports = {
  createClient () {
    return {
      async connect () {
        return await Promise.resolve('mocked');
      },
    };
  },
};
