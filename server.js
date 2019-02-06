'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns');

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(process.env.MONGO_URI);
var Schema = mongoose.Schema;

app.use(cors());

var Link = new Schema({
  url: {type: String, required: true},
  shorturl: {type: Number,required: true}
});

var Link = mongoose.model("Link", Link);

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({extended: 'false'}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:shorturl', function(req, res) {
  var shorturl = Number(req.params.shorturl);
  var url = "";

  Link.find({shorturl: shorturl}, (err, data) => {
    if (err)
      res.json({err: err});
    else if (data.length == 0){
      res.json({unknown: "short url does not exist"});
    } else {
      url = data[0].url;
      res.redirect(url);
    }
  });
});

app.post('/api/shorturl/new', function(req, res) {
  var url = req.body.url;

  // Check if url exists already
  Link.find({url: url}, (err, data) => {
    if (err) {
      res.json({found: "nope"});
    } else if (data === undefined || data.length == 0) {

      Link.count({}, (err, count) => {
        if (err) {
          res.json({err: err})
        }

        var newLink = new Link({
          url: url,
          shorturl: count + 1
        });

        dns.lookup(url.split('//')[1], function(err, address, family){
          if (err)
            res.json({err: "invalid URL"});
          else if (address != null){
            newLink.save( (err, link) => {
              if (err)
                res.json({err: err});
              else
                res.json({url: newLink.url, shorturl: newLink.shorturl});
            });
          } else {
            res.json({err: "invalid URL"});
          }
        });
      });
    } else {
      res.json({original_url: url, short_url: data[0].shorturl});
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
