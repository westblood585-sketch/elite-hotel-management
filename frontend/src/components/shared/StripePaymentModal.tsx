import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe outside of component to avoid recreating it
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentModalProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onClose: () => void;
}

const CheckoutForm: React.FC<{ onSuccess: (id: string) => void }> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL is required for some payment methods, but we handle it via JS
        return_url: window.location.origin + '/booking/success', 
      },
      redirect: "if_required", // Important: valid for card payments to avoid redirect if not needed
    });

    if (error) {
      setErrorMessage(error.message || 'An unknown error occurred');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
       onSuccess(paymentIntent.id);
    } else {
       setErrorMessage("Payment status: " + (paymentIntent?.status || "unknown"));
       setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onClose,
}) => {
  if (!clientSecret) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
          <p className="text-gray-500 text-sm mt-1">
            Total: {currency.toUpperCase()} {amount.toFixed(2)}
          </p>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
           <CheckoutForm onSuccess={onSuccess} />
        </Elements>
      </div>
    </div>
  );
};

export default StripePaymentModal;
