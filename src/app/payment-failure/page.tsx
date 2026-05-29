'use client';

import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import Link from 'next/link';

const PaymentFailurePage = () => {
  return (
    <div className="container py-16 text-center lg:pt-20 lg:pb-28">
      <h1 className="mb-5 block text-3xl font-semibold text-red-500 lg:text-4xl">Payment Failed</h1>
      <p className="mb-8">Unfortunately, your payment could not be processed.</p>
      <p className="mb-8">Please try again or contact our support if you continue to have issues.</p>
      <Link href="/(shop)/(other-pages)/checkout">
        <ButtonPrimary>
            Try Again
        </ButtonPrimary>
      </Link>
    </div>
  );
};

export default PaymentFailurePage;