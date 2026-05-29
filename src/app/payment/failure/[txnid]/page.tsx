"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";

const PaymentFailurePage = ({ params }: { params: Promise<{ txnid: string }> }) => {
  const { txnid } = use(params);
  const [status, setStatus] = useState<"loading" | "verified">("loading");
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/after-payment/failure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ txnid }),
        });

        const data = await response.json();
        
        if (response.ok) {
            setPaymentStatus(data.status);
        } else {
            setError(data.message || "Failed to get payment status.");
        }

      } catch (err) {
        setError("An error occurred while checking payment status.");
      } finally {
        setStatus("verified");
      }
    };

    if (txnid) {
      verifyPayment();
    }
  }, [txnid]);

  const renderContent = () => {
    if (status === "loading") {
      return (
        <>
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg text-gray-600">Checking payment status...</p>
        </>
      );
    }
    
    return (
        <>
            <h1 className="text-4xl font-bold text-red-500">Payment Failed!</h1>
            <p className="mt-4 text-lg text-gray-600">
                Unfortunately, your payment could not be processed.
            </p>
            {paymentStatus && <p className="mt-2 text-md text-gray-500">Status: {paymentStatus}</p>}
            {error && <p className="mt-2 text-md text-red-400">{error}</p>}
            <p className="mt-2 text-sm text-gray-500">
                Transaction ID: {txnid}
            </p>
            <Link href="/checkout" className="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Try Again
            </Link>
        </>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      {renderContent()}
    </div>
  );
};

export default PaymentFailurePage;