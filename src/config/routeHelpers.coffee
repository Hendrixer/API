# call backs for the routes

User = require '../models/user'
Stats = require '../models/stat'
Session = require '../models/session'
apiUrl = require('./apiConfig')['url']

module.exports =

  # TO-DO: DECIDE WHAT INDEX ROUTE SHOULD RETURN
  index: (req, res) ->
    res.json 'test': 'hello world'

  signup: (req, res) ->
    email = req.body.email
    password = req.body.password
    User.findOne('email': email, (err, user) ->
      if err
        console.error 'err', err
        res.send 500
      if user
        #user is already signed up, set location header to login route
        res.setHeader "location", "#{apiUrl}/login"
        res.send 204
      if not user
        # new user sign up
        newUser = new User()
        newUser.email = email
        newUser.password = newUser.generateHash password

        newUser.save (err) ->
          if err
            console.error 'err', err
            res.send 500
          res.setHeader "location", "#{apiUrl}/users/#{newUser._id}"
          responseJSON = {}
          responseJSON.createdAt = newUser.createdAt
          responseJSON._id = newUser._id
          # TO-DO: IMPLEMENT ACCESS TOKENS
          res.json(201, responseJSON)
    )

  login: (req, res) ->
    email = req.body.email
    password = req.body.password
    User.findOne('email': email, (err, user) ->
      if err
        console.error 'err', err
        res.send 500
      if (not user or not user.validPassword(password))
        # email or password is incorrect
        res.send 401
      else
        res.setHeader "location", "#{apiUrl}/users/#{user._id}"
        res.json user
    )

  getUser: (req, res) ->
    id = req.params.id
    User.findOne('_id': id, (err, user) ->
      if err
        console.error 'err', err
        res.send 500
      if not user
        # user isn't in the db
        res.send 204
      if user
        res.json user
    )

  getAll: (req, res) ->
    id = req.params.id
    User.find((err, users) ->
      if err
        console.error 'err', err
        res.send 500
      res.json users
    )

  deleteUser: (req, res) ->
    email = req.body.email
    password = req.body.password
    id = req.params.id
    User.findOne({'_id':id, 'email':email}, (err, user) ->
      console.log "USER ====>", user
      if err
        console.error 'err', err
        res.send 500
      if not user
        # user is not in DB anyways..
        res.send 204
      else if !user.validPassword(password)
        res.send 401
      else
        user.remove (err, user) ->
          if err
            console.error 'err', err
            res.send 500
          res.json 204, user
    )
