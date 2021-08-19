const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const errorController = require('./controllers/error');

const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');

const User = require('./models/user');
const flash = require('connect-flash');
const multer = require('multer');

const MONGODB_URI = 'mongodb://ahmad1:p2K6S5mmpktG4KfI@cluster0-shard-00-00.xmre6.mongodb.net:27017,cluster0-shard-00-01.xmre6.mongodb.net:27017,cluster0-shard-00-02.xmre6.mongodb.net:27017/shop?ssl=true&replicaSet=atlas-9tacbu-shard-0&authSource=admin&retryWrites=true&w=majority';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb)=>{
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, Math.random() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) =>{
  if( file.mimetype === 'image/png' || 
      file.mimetype === 'image/jpg' || 
      file.mimetype === 'image/jpeg')
    {
    cb(null, true);
  }else{
    cb(null, false);
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store}));

app.use(flash());

app.use((req, res, next)=>{
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use((req, res, next) => { 
  if(!req.session.user){
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if(!user){
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});


app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrfProtection);
app.use((req, res, next)=>{
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next)=>{
  console.log(error);
  res.status(500).render('500', { 
    pageTitle: 'Some error!', 
    path: '/500',  
    isAuthenticated: req.session.isLoggedIn
});
});

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true } )
.then(result=>{
  app.listen(3000);
})
.catch(err=>{
  console.log(err);
});