var stripe = Stripe('pk_test_51JPn42FYfl6Xxd1eXaySU1GNundCVWJJaBwtynwhBRO1y4CqbCieG3rGZHui9XZNrw98cKUWJ0T6wOKhbcnHs0Po00YPIX9bt8');
var elements = stripe.elements();
var checkError = false;
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
    checkError = true;
  } else {
    displayError.textContent = '';
    checkError = false;
  }
});

var form = document.getElementById('payment-form');

if(!checkError){
form.addEventListener('submit', function(ev) {
  let dataset = form.dataset.secret.split("=");
  const clientSecret = dataset[0];
  const userEmail = dataset[1];
  const totalSum = dataset[2];
  
  stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: card,
      billing_details: {
        name: userEmail,
      },
      // Verify your integration in this guide by including this parameter
      metadata: {integration_check: 'accept_a_payment', amount: totalSum * 100, currency: 'usd', description: 'User confirms the payment'},
    }
  }).then(function(result) {
    if (result.error) {
      // Show error to your customer (e.g., insufficient funds)
      console.log(result.error.message);
    } else {
      // The payment has been processed!
      if (result.paymentIntent.status === 'succeeded') {
        console.log(result.paymentIntent.status);
        alert('Payment Successfull!');

        // Show a success message to your customer
        // There's a risk of the customer closing the window before callback
        // execution. Set up a webhook or plugin to listen for the
        // payment_intent.succeeded event that handles any business critical
        // post-payment actions.
      }
    }
  }).catch(err=>console.log(err));
});
}