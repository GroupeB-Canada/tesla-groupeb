import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

const PRICE_PER_DAY = 17500; // cents

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      startDate, endDate, days,
      firstName, lastName, email, phone,
      promoCode, extras, subtotal, discount, total,
    } = body;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Location Tesla Model 3 — ${days} jour${days !== 1 ? 's' : ''}`,
            description: `${startDate} → ${endDate} · tesla.groupeb.ca`,
            images: ['https://groupeb-storage.s3.ca-central-1.amazonaws.com/tesla-model-y.jpg'],
          },
          unit_amount: PRICE_PER_DAY * days,
        },
        quantity: 1,
      },
    ];

    // Extras
    if (extras?.insurance) {
      lineItems.push({
        price_data: { currency: 'cad', product_data: { name: 'Assurance premium' }, unit_amount: 3000 * days },
        quantity: 1,
      });
    }
    if (extras?.delivery) {
      lineItems.push({
        price_data: { currency: 'cad', product_data: { name: 'Livraison à domicile' }, unit_amount: 5000 },
        quantity: 1,
      });
    }
    if (extras?.gps) {
      lineItems.push({
        price_data: { currency: 'cad', product_data: { name: 'Suivi GPS client' }, unit_amount: 1000 * days },
        quantity: 1,
      });
    }

    // Promo discount
    if (promoCode && discount > 0) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: { name: `Code promo: ${promoCode}` },
          unit_amount: -Math.round(discount * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      automatic_tax: { enabled: true },
      customer_email: email,
      metadata: {
        startDate, endDate, days: String(days),
        firstName, lastName, email, phone: phone ?? '',
        promoCode: promoCode ?? '',
        discount: String(discount ?? 0),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/book`,
    });

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (err: any) {
    console.error('[checkout]', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
