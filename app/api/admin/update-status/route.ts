import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({ region: process.env.APP_REGION ?? 'ca-central-1' });

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  if (token !== process.env.ADMIN_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId, licenseStatus } = await req.json();
  if (!bookingId || !['pending', 'approved', 'rejected'].includes(licenseStatus)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    await dynamo.send(new UpdateItemCommand({
      TableName: process.env.DYNAMODB_TABLE ?? 'tesla-groupeb-bookings',
      Key: { bookingId: { S: bookingId } },
      UpdateExpression: 'SET licenseStatus = :s, updatedAt = :t',
      ExpressionAttributeValues: {
        ':s': { S: licenseStatus },
        ':t': { S: new Date().toISOString() },
      },
    }));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
