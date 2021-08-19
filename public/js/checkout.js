var stripe = Stripe('pk_test_51JPn42FYfl6Xxd1eXaySU1GNundCVWJJaBwtynwhBRO1y4CqbCieG3rGZHui9XZNrw98cKUWJ0T6wOKhbcnHs0Po00YPIX9bt8');
var elements = stripe.elements();
var style = {
  base: {
    color: "#32325d",
  }
};

var card = elements.create("card", { style: style });
card.mount("#card-element");

card.on('change', ({error}) => {
  let displayError = document.getElementById('card-errors');
  if (error) {
    displayError.textContent = error.message;
  } else {
    displayError.textContent = '';
  }
});

var form = document.getElementById('payment-form');

form.addEventListener('submit', function(ev) {
  ev.preventDefault();
  window.location = "/create-order";

  // If the client secret was rendered server-side as a data-secret attribute
  // on the <form> element, you can retrieve it here by calling `form.dataset.secret`
  // stripe.confirmCardPayment(form.dataset.secret, {
  //   payment_method: {
  //     card: card,
  //     billing_details: {
  //       name: 'Jenny Rosen'
  //     }
  //   }
  // }).then(function(result) {
  //   if (result.error) {
  //     // Show error to your customer (e.g., insufficient funds)
  //     console.log(result.error.message);
  //   } else {
  //     // The payment has been processed!
  //     if (result.paymentIntent.status === 'succeeded') {
  //       router.post('/create-order', isAuth, shopController.postOrder);

  //       // Show a success message to your customer
  //       // There's a risk of the customer closing the window before callback
  //       // execution. Set up a webhook or plugin to listen for the
  //       // payment_intent.succeeded event that handles any business critical
  //       // post-payment actions.
  //     }
  //   }
  // });
});