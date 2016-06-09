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
    findAllSubscriptions,
    refreshSubscriptions,
  };
};

function findAllSubscriptions(callback) {
  db.find({ kind: 'youtube#subscription' }, callback);
}

function refreshSubscriptions(callback) {
  let pageToken = true;
  let newSubscriptions = [];

  // console.info('START: refreshSubscriptions');

  async.whilst(
    () => pageToken,
    getASubscriptionPage,
    sendNewSubscriptions
  );

  function getASubscriptionPage(nextPage) {
    YouTube.subscriptions.list(
      concoctRequest(pageToken),
      handleError(gotASubscriptionPage)
    );

    function gotASubscriptionPage(subscriptionsPage) {
      pageToken = subscriptionsPage.nextPageToken || false;
      
      insertSubscriptions(subscriptionsPage.items, handleError(subscriptionsInserted));
    }

    function subscriptionsInserted(someNewSubscriptions) {
      newSubscriptions.push(...someNewSubscriptions);

      nextPage();
    }
  }

  function sendNewSubscriptions(err) {
    // console.info('END: refreshSubscriptions');
    callback(err, newSubscriptions);
  }
}

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

function insertSubscriptions(subscriptions, callback) {
  let someNewSubscriptions = [];

  // console.info('START: insertSubscriptions');

  async.each(subscriptions, insertSubscriptionIfNotInDb, sendSomeNewSubscriptions);

  function insertSubscriptionIfNotInDb(subscription, nextSubscription) {
    db.findOne({
      kind: 'youtube#subscription',
      id: subscription.id,
    }, handleError(foundSubscription));

    function foundSubscription(result) {
      if (!result) {
        insertInDb(subscription);
      } else {
        nextSubscription();
      }
    }

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

  function sendSomeNewSubscriptions(err) {
    // console.info('END: insertSubscriptions');
    return callback(err, someNewSubscriptions);
  }
}

function handleError(next) {
  return function (err) {
    if (err) {
      console.error(err);
      return callback(err);
    }

    let _arguments = Array.prototype.slice.call(arguments, 1);
    next.apply(null, _arguments);
  };
}
