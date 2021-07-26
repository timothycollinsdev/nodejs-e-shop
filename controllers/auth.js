const User = require('../models/user');
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto');
const nodemailer = require("nodemailer");
const {validationResult} = require('express-validator/check')

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "Gmail",
  port: 25,
  secure: false,
  auth: {
  user: '', //Enter your mail here
  pass: '' //Enter your password here
  },
  tls: {
    rejectUnauthorized: false
    }
});

exports.getLogin = (req, res, next) => {
        let message = req.flash('error');
        if(message.length > 0){
          message = message[0];
        }else{
          message = null;
        }
        res.render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: message
        });
  };

  exports.postLogin = (req,res,next)=>{
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
    .then(user=>{
      if(!user){
        req.flash('error', 'Invalid email please signup first');
        return res.redirect('/login');
      }
      bcrypt.compare(password, user.password)
      .then(doMatch=>{
        if(doMatch){
          req.session.isLoggedIn = true;
          req.session.user = user
          return req.session.save(err=>{
             res.redirect('/');
          })
        }
        req.flash('error', 'Invalid password please try again');
        res.redirect('/login');
      })
      .catch(err=>{
        res.redirect('/login');
      })
    })
    .catch(err=>console.log(err));
  }
  
  exports.postLogout = (req,res,next)=>{
    req.session.destroy(()=>{
      res.redirect('/');
    });
  }

  exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0){
      message = message[0];
    }else{
      message = null;
    }
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: message
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password  = req.body.password;
    const confirmPassword = req.body.confirmpassword;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(422).render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: errors.array()
      });
    }
    User.findOne({email: email})
    .then(userDoc =>{
      if(userDoc){
        req.flash('error', 'Email already exists');
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
        return transporter.sendMail({
          to: email,
          subject: 'Signup Completed!!',
          html: '<h1>Congrats, You are signed up!</h1>'
        });
      })
      .catch(err=>console.log(err));
    })
    .catch(err=>console.log(err));
};

exports.getReset = (req, res, next) =>{
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  }else{
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
}
  
exports.postReset = (req, res, next) =>{
  crypto.randomBytes(32, (err, buffer) => {
    if(err){
      return res.redirect('/reset') 
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email})
    .then(user=>{
      if(!user){ 
        req.flash('error', 'No account found with your email');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetTokenExpiration= Date.now()+3600000;
      return user.save();
    })
    .then(result=>{
      res.redirect('/');
      transporter.sendMail({
        to: req.body.email,
        subject: 'Password Reset',
        html: `<p>Password reset request</p><p>Here is your password reset <a href="https://localhost:3000/reset/${token}">link</a></p>`
      });
    })
    .catch(err=>console.log(err));
  });
  };

exports.getPassReset = (req, res, next) =>{
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user=>{
     res.render('auth/reset-password', {
      path: '/reset-password',
      pageTitle: 'Reset Password',
      userId: user._id.toString(),
      passwordToken: token
    });
  }).catch(err=>console.log(err));
}

exports.postPassReset = (req, res, next) =>{
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId})
  .then(user=>{
    resetUser = user;
    return bcrypt.hash(newPassword, 12);
  })
  .then(hashedPassword=>{
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
  })
  .then(result=>{
    res.redirect('/login');
  })
  .catch(err=>console.log(err));
}

