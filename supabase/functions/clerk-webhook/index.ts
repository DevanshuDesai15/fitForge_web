import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET');
  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Verify the Clerk webhook signature
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing Svix headers', { status: 400 });
  }

  const body = await req.text();

  // Validate timestamp (reject messages older than 5 minutes)
  const timestampMs = parseInt(svixTimestamp) * 1000;
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return new Response('Webhook timestamp too old', { status: 400 });
  }

  // Verify HMAC signature
  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const secretBytes = Uint8Array.from(
    atob(webhookSecret.replace('whsec_', '')),
    (c) => c.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(toSign));
  const computedSignature = `v1,${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  const signatures = svixSignature.split(' ');
  const isValid = signatures.some((sig) => sig === computedSignature);

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;
    const primaryEmail = email_addresses?.find((e: { id: string }) => e.id === event.data.primary_email_address_id)?.email_address ?? null;
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || null;

    const { error } = await supabase.from('profiles').upsert(
      {
        id,
        email: primaryEmail,
        display_name: displayName,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (error) {
      console.error('Error upserting profile:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
