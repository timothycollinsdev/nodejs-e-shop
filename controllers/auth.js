const User = require('../models/user');

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

exports.postSignup = (req, res, next) => {}
  