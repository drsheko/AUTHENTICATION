const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const { ifError } = require("assert");
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema;
const flash = require('connect-flash')

const mongoDb = "mongodb+srv://shady:shady1@users.y1khye5.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
  })
);

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
passport.use(
    new LocalStrategy({passReqToCallback:true},(req,username, password, done) => {
      User.findOne({ username: username }, (err, user) => {
        if (err) { 
          return done(console.log(err));
        }
        if (!user) {
          return done(null, false, req.flash('error',"user is not found :("));
        }
       
        bcrypt.compare(password, user.password,(err, res) => {
          if(err){return done(console.log(err))}
          if (!res) {
              return done(null, false,req.flash('error','Incorrect password...try again'))
          } 
          else{
            return done(null, user);
          }
        })
        
        
      });
    })
  );




  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });



  app.use(flash())  
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
  });
app.get("/", (req, res) => {
  const messages =req.flash().error||[];
  res.render("index" ,{user:req.user , messages})});



app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post("/sign-up", (req, res, next) => {
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
        if (err) {console.log(err)
        }else{
            var user = new User({
                username: req.body.username,
                password: hashedPassword
                  }).save(err => {
                    if (err) { 
                      return next(err);
                    }
                    res.redirect("/");
                  });
        }
      });
    
  });


  app.post('/log-in',
    passport.authenticate("local", {
      successRedirect: "/tem",
        failureRedirect: "/",
        failureFlash:true,
      })
     )


  app.get('/tem' , (req,res)=>{
    res.render('tem')})

  app.get("/log-out", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });
  app.get('/404', (req,res)=>{
    
    res.render('404')
  })
  app.use((req,res)=>{
      res.render('404' ,{message:req.flash('message')})
  })


  app.listen(3000, () => console.log("app listening on port 3000!"));