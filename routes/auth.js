const express = require('express');
const { check,body } = require('express-validator');
const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login',
    [
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
    body('password','Password is not valid or very short').isLength({min:5}).isAlphanumeric(),
    ], authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);
router.post('/signup',
    [
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value,{req})=>{
        return User.findOne({email: value})
        .then(userDoc =>{
          if(userDoc){
           return Promise.reject('Email already exists');
          }
    });
    }),
    body('password','Please enter a password with 5 numbers').isLength({min:5}).isAlphanumeric(),
    body('confirmpassword').custom((value,{req}) =>{
        if(value !== req.body.password){
            throw new Error('Password does not match!')
        }
        return true;
    })
], authController.postSignup);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getPassReset);
router.post('/reset-password', authController.postPassReset);


module.exports = router;