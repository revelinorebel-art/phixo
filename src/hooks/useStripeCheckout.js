import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from '@/components/ui/use-toast';

// IMPORTANT: Replace with your actual Stripe Publishable Key
const STRIPE_PUBLISHABLE_KEY = "pk_test_YOUR_KEY"; // Replace this placeholder

let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);

  const redirectToCheckout = async (priceId, callbacks = {}) => {
    if (STRIPE_PUBLISHABLE_KEY === "pk_test_YOUR_KEY") {
      toast({
        title: "Stripe is niet geconfigureerd 🔑",
        description: "Vervang de placeholder API-sleutel in src/hooks/useStripeCheckout.js.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe.js is niet geladen.');
      }

      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'payment', // Use 'subscription' for recurring payments
        successUrl: `${window.location.origin}${window.location.pathname}?stripe_session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}${window.location.pathname}`,
        clientReferenceId: `user_id_placeholder`, // Replace with actual user ID
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        toast({
          title: "Betalingsfout",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Fout bij afrekenen",
        description: "Er is iets misgegaan. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const url = new URL(window.location);
    const sessionId = url.searchParams.get('stripe_session_id');

    if (sessionId) {
      // Find the callback from the URL or session storage if needed
      // For simplicity, we just show a generic success message
      toast({
        title: "Betaling Succesvol! 🎉",
        description: "Je aankoop is verwerkt.",
      });

      // Here you would typically call your success callback
      // This is simplified for this context. A more robust solution
      // would use webhooks or pass state through the redirect.

      // Clean up the URL
      url.searchParams.delete('stripe_session_id');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);


  return { redirectToCheckout, loading };
};

export default useStripeCheckout;