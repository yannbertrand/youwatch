module.exports = function (Datastore) {
  return new Datastore({ filename: 'db.json', autoload: true });
};
