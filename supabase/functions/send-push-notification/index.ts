// Edge Function: send-push-notification
// Triggered via Supabase Database Webhooks on:
//   - INSERT into post_likes
//   - INSERT into post_comments
//
// Configurar los webhooks en Supabase Dashboard:
//   Table: post_likes  → Events: INSERT → URL: <function-url>
//   Table: post_comments → Events: INSERT → URL: <function-url>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface WebhookPayload {
  type: 'INSERT';
  table: 'post_likes' | 'post_comments';
  record: {
    post_id: string;
    user_id: string; // quien hizo el like / comentó
    content?: string; // solo en post_comments
  };
}

Deno.serve(async (req: Request) => {
  const payload: WebhookPayload = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const actorId = payload.record.user_id;
  const postId = payload.record.post_id;

  // 1. Obtener el owner del post
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (!post) return new Response('post not found', { status: 404 });

  const ownerId = post.user_id;

  // No notificar al propio autor
  if (ownerId === actorId) return new Response('ok', { status: 200 });

  // 2. Obtener el username del actor
  const { data: actor } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', actorId)
    .single();

  const actorName = actor?.username ?? 'Someone';

  // 3. Obtener los push tokens del owner
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', ownerId);

  if (!tokens?.length) return new Response('no tokens', { status: 200 });

  // 4. Construir el mensaje
  const isLike = payload.table === 'post_likes';
  const title = 'KnifeCompanion';
  const body = isLike
    ? `${actorName} liked your post`
    : `${actorName} commented: "${payload.record.content?.slice(0, 60)}"`;

  // 5. Enviar a Expo Push API (batch)
  const messages = tokens.map(({ token }) => ({
    to: token,
    title,
    body,
    data: { postId },
    sound: 'default',
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    console.error('Expo push error:', await response.text());
    return new Response('push error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
