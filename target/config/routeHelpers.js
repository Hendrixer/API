(function() {
  var Session, Stats, User, apiUrl, bcrypt, uuid;

  User = require('../models/user');

  Stats = require('../models/stat');

  Session = require('../models/session');

  apiUrl = require('./apiConfig')['url'];

  bcrypt = require('bcrypt-nodejs');

  uuid = require('node-uuid');

  module.exports = {
    index: function(req, res) {
      return res.json({
        'test': 'hello world'
      });
    },
    signup: function(req, res) {
      var email, password;
      email = req.body.email;
      password = req.body.password;
      return User.findOne({
        'email': email
      }, function(err, user) {
        var newSession, newUser;
        if (err) {
          console.error('err', err);
          res.send(500);
        }
        if (user) {
          res.setHeader("location", "" + apiUrl + "/login");
          res.send(409);
        }
        if (!user) {
          newSession = new Session();
          newSession._access_token = uuid.v4();
          newUser = new User();
          newUser.email = email;
          return bcrypt.genSalt(10, function(err, salt) {
            if (err) {
              console.error('bcrypt.genSalt error: ', err);
              res.send(500);
            }
            return bcrypt.hash(password, salt, null, function(err, hash) {
              if (err) {
                console.error('bcrypt.hash error: ', err);
                res.send(500);
              }
              newUser.password = hash;
              return newUser.save(function(err) {
                var responseJSON;
                if (err) {
                  console.error('error - could not save user ', err);
                  res.send(500);
                }
                res.setHeader("location", "" + apiUrl + "/users/" + newUser._id);
                responseJSON = {};
                responseJSON.createdAt = newUser.createdAt;
                responseJSON._id = newUser._id;
                newSession._userId = newUser._id;
                return newSession.save(function(err) {
                  if (err) {
                    console.log('failed: could notsave session', err);
                    res.send(500);
                  }
                  responseJSON._access_token = newSession._access_token;
                  return res.json(201, responseJSON);
                });
              });
            });
          });
        }
      });
    },
    login: function(req, res) {
      var email, password;
      email = req.body.email;
      password = req.body.password;
      return User.findOne({
        'email': email
      }, function(err, user) {
        if (err) {
          console.error('Mongo findOne error ', err);
          res.send(500);
        }
        if (!user) {
          return res.send(401);
        } else {
          return bcrypt.compare(password, user.password, function(err, same) {
            var responseJSON, session;
            if (err) {
              console.error('bcrypt.compare error ', err);
              return res.send(500);
            } else if (!same) {
              return res.send(401);
            } else {
              responseJSON = {};
              responseJSON._id = user._id;
              responseJSON.createdAt = user.createdAt;
              res.setHeader("location", "" + apiUrl + "/users/" + user._id);
              session = new Session();
              session._userId = user._id;
              session._access_token = uuid.v4();
              return session.save(function(err) {
                if (err) {
                  console.log('could not make session in log in', err);
                  res.send(500);
                }
                responseJSON._access_token = session._access_token;
                return res.json(responseJSON);
              });
            }
          });
        }
      });
    },
    logout: function(req, res) {
      var user_id;
      user_id = req.body._id;
      return Session.findOne({
        'userId': user_id
      }, function(err, session) {
        if (err) {
          console.log('err finding session to log out', err);
          res.send(500);
        }
        return session.remove(function(err, sesh) {
          if (err) {
            console.log('err removing session logout');
            res.send(500);
          }
          return res.send(204, sesh);
        });
      });
    },
    getUser: function(req, res) {
      var id;
      id = req.params.id;
      return User.findOne({
        '_id': id
      }, function(err, user) {
        if (err) {
          console.error('User.findOne error ', err);
          res.send(500);
        }
        if (!user) {
          res.send(204);
        }
        if (user) {
          return res.json(user);
        }
      });
    },
    getAll: function(req, res) {
      var id;
      id = req.params.id;
      return User.find(function(err, users) {
        if (err) {
          console.error('User.find error', err);
          res.send(500);
        }
        return res.json(users);
      });
    },
    deleteUser: function(req, res) {
      var email, id, password;
      email = req.body.email;
      password = req.body.password;
      id = req.params.id;
      return User.findOne({
        '_id': id,
        'email': email
      }, function(err, user) {
        if (err) {
          console.error('User.findOne error', err);
          res.send(500);
        }
        if (!user) {
          return res.send(204);
        } else {
          return bcrypt.compare(password, user.password, function(err, same) {
            if (err) {
              console.error('bcrypt.compare error ', err);
              return res.send(500);
            } else if (!same) {
              return res.send(401);
            } else {
              return user.remove(function(err, user) {
                if (err) {
                  console.error('user.remove error ', err);
                  res.send(500);
                }
                return res.json(204, user);
              });
            }
          });
        }
      });
    },
    linkUserWithAuth: function(req, res) {
      var authData, email, id, password;
      email = req.body.email;
      password = req.body.password;
      authData = JSON.parse(req.body.authData);
      id = req.params.id;
      return User.findOne({
        '_id': id,
        'email': email
      }, function(err, user) {
        if (err) {
          console.error('User.findOne error', err);
          res.send(500);
        }
        if (!user) {
          return res.send(204);
        } else {
          return bcrypt.compare(password, user.password, function(err, same) {
            if (err) {
              console.error('bcrypt.compare error', err);
              return res.send(500);
            } else if (!same) {
              return res.send(401);
            } else {
              if (typeof authData.facebook === 'object') {
                user.set("authData.facebook", authData.facebook);
              }
              if (typeof authData.twitter === 'object') {
                user.set("authData.twitter", authData.twitter);
              }
              return user.save(function(err) {
                if (err) {
                  console.error('err', err);
                  res.send(500);
                }
                res.setHeader("location", "" + apiUrl + "/users/" + user._id);
                return res.json(user);
              });
            }
          });
        }
      });
    }
  };

}).call(this);

//# sourceMappingURL=../../target/config/routeHelpers.js.map
