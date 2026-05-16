import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
const dynamo = new DynamoDBClient({ region: process.env.APP_REGION ?? 'ca-central-1' });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[webhook] signature error:', err.message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { startDate, endDate, days, firstName, lastName, email, phone, promoCode } = session.metadata ?? {};

    const bookingId = session.id;
    const now = new Date().toISOString();

    try {
      await dynamo.send(new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE ?? 'tesla-groupeb-bookings',
        Item: {
          bookingId:   { S: bookingId },
          startDate:   { S: startDate ?? '' },
          endDate:     { S: endDate ?? '' },
          days:        { N: days ?? '1' },
          firstName:   { S: firstName ?? '' },
          lastName:    { S: lastName ?? '' },
          email:       { S: email ?? '' },
          phone:       { S: phone ?? '' },
          promoCode:   { S: promoCode ?? '' },
          amountTotal: { N: String((session.amount_total ?? 0) / 100) },
          currency:    { S: session.currency ?? 'cad' },
          status:      { S: 'confirmed' },
          stripeSessionId: { S: session.id },
          createdAt:   { S: now },
          updatedAt:   { S: now },
        },
      }));
      console.log('[webhook] booking saved:', bookingId);
    } catch (err: any) {
      console.error('[webhook] DynamoDB error:', err.message);
      return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('[webhook] checkout expired:', session.id);
  }

  return NextResponse.json({ received: true });
}
