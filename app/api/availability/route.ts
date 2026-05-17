import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({ region: process.env.APP_REGION ?? 'ca-central-1' });

export async function GET() {
  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE ?? 'tesla-groupeb-bookings',
      FilterExpression: '#s = :confirmed',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':confirmed': { S: 'confirmed' } },
      ProjectionExpression: 'startDate, endDate',
    }));

    const bookings = (result.Items ?? []).map(item => ({
      startDate: item.startDate?.S ?? '',
      endDate: item.endDate?.S ?? '',
    })).filter(b => b.startDate && b.endDate);

    // Expand each booking into individual blocked dates
    const blockedDates: string[] = [];
    for (const { startDate, endDate } of bookings) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const cur = new Date(start);
      while (cur <= end) {
        blockedDates.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }

    return NextResponse.json({ blockedDates }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
    });
  } catch (err: any) {
    // If DynamoDB fails (e.g. no bookings yet), return empty — don't crash the page
    console.error('[availability] DynamoDB error:', err.message);
    return NextResponse.json({ blockedDates: [] });
  }
}
