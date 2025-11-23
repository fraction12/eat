import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // Create Supabase client to get user info
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { message, rating, feedbackType } = body;

    // Validate input
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Feedback message is required' },
        { status: 400 }
      );
    }

    // Get recipient email from env or use default
    const recipientEmail = process.env.FEEDBACK_EMAIL || 'dushyantgarg3@gmail.com';

    // Prepare email content
    const userEmail = user?.email || 'Anonymous';
    const userId = user?.id || 'Not logged in';
    const timestamp = new Date().toISOString();

    const emailHtml = `
      <h2>New Feedback Received</h2>
      <p><strong>Type:</strong> ${feedbackType || 'General'}</p>
      ${rating ? `<p><strong>Rating:</strong> ${'⭐'.repeat(rating)} (${rating}/5)</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><strong>User Email:</strong> ${userEmail}</p>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Submitted:</strong> ${timestamp}</p>
    `;

    const emailText = `
New Feedback Received

Type: ${feedbackType || 'General'}
${rating ? `Rating: ${'★'.repeat(rating)} (${rating}/5)` : ''}

Message:
${message}

---
User Email: ${userEmail}
User ID: ${userId}
Submitted: ${timestamp}
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Eat App Feedback <onboarding@resend.dev>', // You'll change this to your domain later
      to: [recipientEmail],
      subject: `New Feedback: ${feedbackType || 'General'} ${rating ? `(${rating}⭐)` : ''}`,
      html: emailHtml,
      text: emailText,
      reply_to: user?.email || undefined,
    });

    if (error) {
      console.error('Error sending feedback email:', error);
      return NextResponse.json(
        { error: 'Failed to send feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback sent successfully',
      emailId: data?.id
    });

  } catch (error) {
    console.error('Error in send-feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
