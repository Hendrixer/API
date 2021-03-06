(function() {
  var SessionSchema, mongoose;

  mongoose = require('mongoose');

  SessionSchema = new mongoose.Schema({
    _expiration: {
      type: Date,
      expires: '30d',
      "default": Date.now()
    },
    _userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      unique: true,
      required: true
    },
    _access_token: {
      type: String,
      unique: true,
      required: true
    }
  });

  module.exports = mongoose.model('Session', SessionSchema);

}).call(this);

//# sourceMappingURL=../../target/models/session.js.map
