module.exports = {

  refresh(callback) {
    console.log(' -> Refreshing YouTube subscriptions');

    setTimeout(() => callback(0), 2000);
  },

};
