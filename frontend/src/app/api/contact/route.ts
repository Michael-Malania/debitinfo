import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const ticketId = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
  
  return NextResponse.json({
    success: true,
    message: 'მადლობა, თქვენი შეტყობინება მიღებულია. ოპერატორი მალე დაგიკავშირდებათ.',
    ticketId,
    receivedAt: new Date().toISOString(),
    payload: body,
  });
}
