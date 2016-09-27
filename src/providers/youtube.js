module.exports = {

  refresh(callback) {
    console.log(' -> Refreshing YouTube subscriptions');

    setTimeout(_ => callback(0), 2000);
  }

};
