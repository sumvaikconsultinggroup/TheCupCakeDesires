'use client';

import { useCart } from '@/components/useCartStore';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PayUCheckoutPage = () => {
  const { orderDetails, userInfo } = useCart();
  const router = useRouter();
  const { user } = useUser();
  
  const [hash, setHash] = useState('');

  useEffect(() => {
    if (!orderDetails) {
      router.push('/(shop)/(other-pages)/checkout');
    }
  }, [orderDetails, router]);

  useEffect(() => {
    if (orderDetails && userInfo) {
      const payload = {
          txnid: orderDetails.orderId,
          amount: orderDetails.price,
          productinfo: 'CupCake Desires Order',
          firstname: userInfo.name.split(' ')[0],
          email: userInfo.email,
          phone: userInfo.phone,
      };

      fetch('/api/payment/payu', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
      })
      .then(res => res.json())
      .then(data => {
          if (data.hash) {
              setHash(data.hash);
          }
      });
    }
  }, [orderDetails, userInfo]);

  if (!orderDetails || !userInfo) {
    return (
      <div className="container py-16 lg:pt-20 lg:pb-28">
        <h2 className="text-2xl font-semibold">Loading...</h2>
        <p>You will be redirected to the checkout page.</p>
      </div>
    );
  }

  const payUForm = {
    key: process.env.NEXT_PUBLIC_PAYU_KEY,
    txnid: orderDetails.orderId,
    amount: orderDetails.price.toString(),
    productinfo: 'CupCake Desires Order',
    firstname: userInfo.name.split(' ')[0],
    email: userInfo.email,
    phone: userInfo.phone,
    surl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/payu-success`,
    furl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/payu-failure`,
    hash: hash,
  };

  return (
    <div className="container py-16 lg:pt-20 lg:pb-28">
      <h1 className="mb-5 block text-3xl font-semibold lg:text-4xl">Proceed to PayU</h1>
      <p>Please review your order details and proceed to payment.</p>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold">Order ID: {orderDetails.orderId}</h3>
        <p>Amount: ${orderDetails.price.toFixed(2)}</p>
      </div>

      {hash ? (
        <form action={process.env.NEXT_PUBLIC_PAYU_URL} method="post" className="mt-8">
          {Object.entries(payUForm).map(([key, value]) => (
            <input type="hidden" key={key} name={key} value={value || ''} />
          ))}
          <ButtonPrimary type="submit">
            Proceed to Payment
          </ButtonPrimary>
        </form>
      ) : (
        <p>Generating secure payment hash...</p>
      )}
    </div>
  );
};

export default PayUCheckoutPage;
