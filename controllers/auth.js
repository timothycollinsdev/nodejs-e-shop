const User = require('../models/user');
const bcrypt = require('bcryptjs'); 

exports.getLogin = (req, res, next) => {
        res.render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          isAuthenticated: false
        });
  };

  exports.postLogin = (req,res,next)=>{
    User.findById("5f967670af2d7704d8604c22")
    .then(user=>{
      req.session.isLoggedIn = true;
      req.session.user = user
      res.redirect('/');
    })
    .catch(err=>console.log(err));
  }
  
  exports.postLogout = (req,res,next)=>{
    req.session.destroy(()=>{
      res.redirect('/');
    });
  }

  exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password  = req.body.password;
    const confirmPassword = req.body.confirmpassword;
    User.findOne({email: email})
    .then(userDoc =>{
      if(userDoc){
        return res.redirect('/signup');
      }
      return bcrypt
      .hash(password, 12) 
      .then(hashedPassword =>{
        const user = new User({
          email: email,
          password: hashedPassword,
          cart: {items:[]}
        });
        return user.save();
      })
      .then(result=>{
        res.redirect('/login');
      });
    })
    .catch(err=>console.log(err));
};
  