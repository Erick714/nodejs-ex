var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/ID";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/ID";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  db.createCollection("C6", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});
