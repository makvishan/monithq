import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), { status: 400 });
    }
    // Store in DB
    await prisma.Contact.create({ data: { email } });
    // Send notification email using resend util
    await sendEmail('support@monithq.com', 'contact', { email });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Error in contact form submission:', err);
    return new Response(JSON.stringify({ error: 'Failed to submit contact form.' }), { status: 500 });
  }
}
