const fs = require('fs');
const path = require('path');
const stripe = require('stripe')('sk_test_51JPn42FYfl6Xxd1eeC7uhC5fQA1E8zwgFle0q5NHezcDVwt157kT98UuPn4wRe2x8cZtHFBJ53LcPyWWyPF8W79O00Wlrb8SgR');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
  .countDocuments()
  .then(numProducts=>{
    totalItems = numProducts;
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
  .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
    {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    };
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => { 
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
  .countDocuments()
  .then(numProducts=>{
    totalItems = numProducts;
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
  .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
    {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    };
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
       const products = user.cart.items;
          res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products
          });
        })
    .catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then(product=>{
     return req.user.addToCart(product);
    })
    .then(result=>{
      // console.log(result);
      res.redirect('/cart');
  });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getCheckout = (req, res, next) =>{
  let total = 0;
  let clientId;
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
       const products = user.cart.items;
      products.forEach(p=>{
        console.log(p);
        total += p.quantity * p.productId.price;
       });
      
      stripe.paymentIntents.create({
        amount: total * 100,
        currency: 'usd',
        description: 'User comes to checkout page',
        // Verify your integration in this guide by including this parameter
        metadata: {integration_check: 'accept_a_payment'},
      })
      .then(response=>{
        clientId = response.client_secret
        res.render('shop/checkout', {
          path: '/checkout',
          pageTitle: 'Checkout',
          products: products,
          totalSum: total,
          client_secret: clientId
        });
      })
      .catch(err=>console.log(err));
      })
    .catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postOrder = (req, res, next) => {
  let totalSum = 0;

  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      user.cart.items.forEach(p=>{
        totalSum += p.quantity * p.productId.price;
      });
       const products = user.cart.items.map(i=>{
         return {quantity: i.quantity, product: {...i.productId._doc}};
       }); 
       const order = new Order({
        user:{
          email:req.user.email,
          userId: req.user
        },
        products: products
      });
      order.save();
      })
      .then(result => {
        console.log('Result stripe',result)
        const clientSecret = document.getElementById('payment-form').dataset.client_secret;
        stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: card,
            billing_details: {
              email: req.user.email,
              amount: total * 100,
              currency: 'usd',
              description: 'User confirms the payment',
              // Verify your integration in this guide by including this parameter
              metadata: {integration_check: 'accept_a_payment'},
            },
          }
        }).then(function(result) {
          if (result.error) {
            // Show error to your customer (e.g., insufficient funds)
            console.log(result.error.message);
          } else {
            // The payment has been processed!
            if (result.paymentIntent.status === 'succeeded') {
              // Show a success message to your customer
              // There's a risk of the customer closing the window before callback
              // execution. Set up a webhook or plugin to listen for the
              // payment_intent.succeeded event that handles any business critical
              // post-payment actions.
            }
          }
        }).catch(err=>console.log(err));
      return req.user.clearCart();
    })
    .then(()=>{
      res.redirect('/orders');
    })
    .catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({"user.userId": req.user._id})
  .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then(order=>{
    if(!order){
      return next(new Error('No error found!'));
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Not authorized'))
    } 
  const invoiceName = 'invoice-' + orderId + '.pdf';
  const invoicePath = path.join('data', 'invoices', invoiceName);

  const pdfDoc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

  pdfDoc.pipe(fs.createWriteStream(invoicePath));

  pdfDoc.pipe(res);
  
  pdfDoc.fontSize(25).text('MUSA IS A SOFTWARE ENGINEER', {
    underline: true
  });

  pdfDoc.text('----------------------------------');
  
  let totalPrice = 0;
  
  order.products.forEach(prod=> {
    totalPrice += prod.quantity * prod.product.price;
    pdfDoc.fontSize(14).text(
      prod.product.title + 
      ' - ' + prod.quantity + 
      'x' + '$' + prod.product.price
      );
  });
  
  pdfDoc.text('Total Price: $' + totalPrice);

  pdfDoc.end();
 
  }).catch(err=>next(err));
};

