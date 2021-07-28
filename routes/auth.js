const express = require('express');
const { check,body } = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);
router.post('/signup',
    [
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value,{req})=>{
        if(value==='admin@admin.com'){
            throw new Error('This email address is not allowed');
        }
        return true;
    }),
    body('password','Please enter a password with 5 numbers').isLength({min:5}).isAlphanumeric()   
], authController.postSignup);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getPassReset);
router.post('/reset-password', authController.postPassReset);


module.exports = router;