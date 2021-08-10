const mongoose = require('mongoose');
const Product = require('../models/product');
const {validationResult} = require('express-validator')

exports.getAddProduct = (req, res, next) => {
  let message = req.flash('error');
      if(message.length > 0){
        message = message[0];
      }else{
        message = null;
      }
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: message,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl  ;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: { 
        title: title, 
        price: price,
        description: description,
        imageUrl: imageUrl
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

 const product = new Product({
   _id:new mongoose.Types.ObjectId('5fcbe729044e93176875c4da'),
   title: title, 
   price:price,
   description: description,
   imageUrl: imageUrl,
   userId: req.user 
  });
    product
    .save()
    .then(result => {
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
     let message = req.flash('error');
      if(message.length > 0){
        message = message[0];
      }else{
        message = null;
      }
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: message,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: { 
        title: updatedTitle, 
        imageUrl: updatedImageUrl, 
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  Product.findById(prodId)
  .then(product=>{
    if(product.userId.toString() !== req.user._id.toString()){
      return res.redirect('/');
    }
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;
    product.imageUrl = updatedImageUrl; 
    return product.save()
    .then(result => {
      res.redirect('/admin/products');
    });
  })
  .catch(err => console.log(err));
};

exports.getProducts = (req, res, next ) => {
  Product.find({userId: req.user._id})
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};

exports.postDeleteProduct = (req, res, next) => {   
  const prodId = req.body.productId;
    Product.deleteOne({_id: prodId, userId: req.user._id})
    .then(() => {
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
