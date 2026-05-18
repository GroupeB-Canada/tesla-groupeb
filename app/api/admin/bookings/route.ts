import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({ region: process.env.APP_REGION ?? 'ca-central-1' });

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  if (token !== process.env.ADMIN_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE ?? 'tesla-groupeb-bookings',
    }));

    const bookings = (result.Items ?? []).map(item => ({
      bookingId:     item.bookingId?.S     ?? '',
      startDate:     item.startDate?.S     ?? '',
      endDate:       item.endDate?.S       ?? '',
      days:          item.days?.N          ?? '0',
      firstName:     item.firstName?.S     ?? '',
      lastName:      item.lastName?.S      ?? '',
      email:         item.email?.S         ?? '',
      phone:         item.phone?.S         ?? '',
      licenseNumber: item.licenseNumber?.S ?? '',
      licenseStatus: item.licenseStatus?.S ?? 'pending',
      promoCode:     item.promoCode?.S     ?? '',
      amountTotal:   item.amountTotal?.N   ?? '0',
      status:        item.status?.S        ?? 'confirmed',
      createdAt:     item.createdAt?.S     ?? '',
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ ok: true, bookings });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
