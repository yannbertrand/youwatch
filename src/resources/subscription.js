let async;
let YouTube;
let oauth2Client;
let db;

module.exports = function (_async, _YouTube, _oauth2Client, _db) {
  async = _async;
  YouTube = _YouTube;
  oauth2Client = _oauth2Client;
  db = _db;

  return {
    refreshSubscriptions,
  };
};

function refreshSubscriptions(cb) {
  let pageToken = true;
  let newSubscriptions = [];

  console.info('START: refreshSubscriptions');

  async.whilst(
    () => pageToken,
    getASubscriptionPage,
    sendNewSubscriptions
  );



  function getASubscriptionPage(nextPage) {
    YouTube.subscriptions.list(
      concoctRequest(pageToken),
      gotASubscriptionPage
    );

    function concoctRequest(pageToken) {
      return {
        part: 'id, snippet',
        mine: true,
        maxResults: 50,
        order: 'alphabetical',
        pageToken: pageToken || null,
        auth: oauth2Client,
      };
    }

    function gotASubscriptionPage(err, subscriptionsPage) {
      if (err) {
        printError(err);
        return nextPage(); // In fact retrying the same page
      }

      pageToken = subscriptionsPage.nextPageToken || false;
      insertSubscriptions(subscriptionsPage.items, function (err, someNewSubscriptions) {
        newSubscriptions = newSubscriptions.concat(someNewSubscriptions);
        nextPage();
      });

      function printError(err) {
        let message = `Error while trying to find a subscription page`;
        if (pageToken !== true) {
          message += ` (${pageToken})`;
        }
        console.error(message, err);
      }
    }
  }

  function sendNewSubscriptions(err) {
    console.info('END: refreshSubscriptions');
    cb(err, newSubscriptions);
  }
}

function insertSubscriptions(subscriptions, cb) {
  let someNewSubscriptions = [];

  console.info('START: insertSubscriptions');

  async.each(subscriptions, insertSubscriptionIfNotInDb, sendNewSubscriptions);



  function insertSubscriptionIfNotInDb(subscription, nextSubscription) {
    db.findOne({
      kind: 'youtube#subscription',
      id: subscription.id,
    }, function (err, result) {
      if (err) {
        console.error(err);
        return nextSubscription();
      }

      if (!result) {
        insertInDb(subscription);
      } else {
        nextSubscription();
      }
    });

    function insertInDb(subscription) {
      let dbSubscription = {
        kind: 'youtube#subscription',
        id: subscription.id,
        channelId: subscription.snippet.resourceId.channelId,
      };

      someNewSubscriptions.push(dbSubscription);
      db.insert(dbSubscription, nextSubscription);
    }
  }

  function sendNewSubscriptions(err) {
    console.info('END: insertSubscriptions');
    return cb (err, someNewSubscriptions);
  }
}
