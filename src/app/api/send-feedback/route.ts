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

    // Get friendly type labels
    const typeLabels: Record<string, string> = {
      broken: "Something's broken 🐛",
      confusing: "Something's confusing 🤔",
      missing: "Missing a feature 💡",
      slow: "Something's slow 🐌",
      idea: "User has an idea 💭",
      other: "Something else"
    };
    const typeLabel = typeLabels[feedbackType] || feedbackType;

    const emailHtml = `
      <h2>Issue Report from Eat App</h2>
      <p><strong>Issue Type:</strong> ${typeLabel}</p>
      <p><strong>What they said:</strong></p>
      <p style="background: #f9fafb; padding: 12px; border-radius: 8px; margin: 12px 0;">${message.replace(/\n/g, '<br>')}</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; color: #6b7280;">
        <strong>User:</strong> ${userEmail}<br>
        <strong>User ID:</strong> ${userId}<br>
        <strong>When:</strong> ${timestamp}
      </p>
    `;

    const emailText = `
Issue Report from Eat App

Issue Type: ${typeLabel}

What they said:
${message}

---
User: ${userEmail}
User ID: ${userId}
When: ${timestamp}
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Eat App <onboarding@resend.dev>', // You'll change this to your domain later
      to: [recipientEmail],
      subject: `[Eat] ${typeLabel}`,
      html: emailHtml,
      text: emailText,
      replyTo: user?.email || undefined,
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
