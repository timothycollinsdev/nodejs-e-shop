const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');

const errorController = require('./controllers/error');
const User = require('./models/user');
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: '', resave: false, saveUninitialized: false}));

app.use((req, res, next) => { 
  User.findById("5f967670af2d7704d8604c22")
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect('mongodb://ahmad1:p2K6S5mmpktG4KfI@cluster0-shard-00-00.xmre6.mongodb.net:27017,cluster0-shard-00-01.xmre6.mongodb.net:27017,cluster0-shard-00-02.xmre6.mongodb.net:27017/shop?ssl=true&replicaSet=atlas-9tacbu-shard-0&authSource=admin&retryWrites=true&w=majority',{ useNewUrlParser: true })
.then(result=>{
  User.findOne().then(user=>{
    if(!user){

      const user = new User({
        name: 'Suleman',
        email: 'Suleman@test.com',
        cart:{
          items:[]
        }
      });
      user.save();
    }
  })
  app.listen(3000);
})
.catch(err=>{
  console.log(err);
});