"use client";

import { useEffect, useState, use } from "react";

const PaymentSuccessPage = ({ params }: { params: Promise<{ txnid: string }> }) => {
  const { txnid } = use(params);
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/after-payment/success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ txnid }),
        });

        const data = await response.json();

        if (data.success && data.status === 'paid') {
          setStatus("success");
        } else {
          setStatus("failed");
          setError(data.message || "Payment verification failed.");
        }
      } catch (err) {
        setStatus("failed");
        setError("An error occurred while verifying payment.");
      }
    };

    if (txnid) {
      verifyPayment();
    }
  }, [txnid]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-lg text-gray-600">Verifying your payment...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold text-red-500">Payment Failed</h1>
        <p className="mt-4 text-lg text-gray-600">
          {error || "There was an issue with your payment."}
        </p>
        <p className="mt-2 text-md text-gray-500">
            Transaction ID: {txnid}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-green-500">Payment Successful!</h1>
      <p className="mt-4 text-lg text-gray-600">
        Thank you for your purchase. Your order has been placed successfully.
      </p>
      <p className="mt-2 text-md text-gray-500">
        Transaction ID: {txnid}
      </p>
    </div>
  );
};

export default PaymentSuccessPage;