// Edge Function: send-push-notification
// Triggered via Supabase Database Webhooks on:
//   - INSERT into post_likes
//   - INSERT into post_comments
//   - INSERT into posts  (notifica a los seguidores del autor)
//
// Configurar los webhooks en Supabase Dashboard:
//   Table: post_likes    → Events: INSERT → URL: <function-url>
//   Table: post_comments → Events: INSERT → URL: <function-url>
//   Table: posts         → Events: INSERT → URL: <function-url>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface WebhookPayload {
  type: 'INSERT';
  table: 'post_likes' | 'post_comments' | 'posts' | 'announcements';
  record: {
    id?: string;           // posts.id / announcements.id
    post_id?: string;      // post_likes / post_comments
    user_id?: string;      // autor (posts) o actor (likes/comments) — no existe en announcements
    content?: string;      // solo en post_comments
    title?: string;        // announcements.title
    body?: string;         // announcements.body
    published_at?: string; // announcements.published_at
  };
}

async function sendMessages(
  messages: object[],
): Promise<void> {
  if (!messages.length) return;
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!response.ok) {
    console.error('Expo push error:', await response.text());
  }
}

Deno.serve(async (req: Request) => {
  const payload: WebhookPayload = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── New announcement: notify all users with push token ─────────────────────
  if (payload.table === 'announcements') {
    // Solo notificar si el anuncio tiene published_at (no es borrador)
    if (!payload.record.published_at) return new Response('draft', { status: 200 });

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token');

    if (!tokens?.length) return new Response('ok', { status: 200 });

    const messages = tokens.map(({ token }) => ({
      to: token,
      title: 'KnifeCompanion',
      body: payload.record.title ?? 'New notification',
      data: { announcementId: payload.record.id },
      sound: 'default',
    }));

    await sendMessages(messages);
    return new Response('ok', { status: 200 });
  }

  // ── New post: notify followers ──────────────────────────────────────────────
  if (payload.table === 'posts') {
    const authorId = payload.record.user_id!;
    const postId = payload.record.id!;

    // Obtener username del autor
    const { data: author } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', authorId)
      .single();

    const authorName = author?.username ?? 'Someone';

    // Obtener todos los seguidores del autor
    const { data: follows } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', authorId);

    if (!follows?.length) return new Response('ok', { status: 200 });

    const followerIds = follows.map((f) => f.follower_id);

    // Obtener push tokens de todos los seguidores (en una sola query)
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', followerIds);

    if (!tokens?.length) return new Response('ok', { status: 200 });

    const messages = tokens.map(({ token }) => ({
      to: token,
      title: 'KnifeCompanion',
      body: `${authorName} published a new post`,
      data: { postId },
      sound: 'default',
    }));

    await sendMessages(messages);
    return new Response('ok', { status: 200 });
  }

  // ── Like / Comment: notify post owner ──────────────────────────────────────
  const actorId = payload.record.user_id!;
  const postId = payload.record.post_id!;

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
  const body = isLike
    ? `${actorName} liked your post`
    : `${actorName} commented: "${payload.record.content?.slice(0, 60)}"`;

  // 5. Enviar a Expo Push API
  const messages = tokens.map(({ token }) => ({
    to: token,
    title: 'KnifeCompanion',
    body,
    data: { postId },
    sound: 'default',
  }));

  await sendMessages(messages);
  return new Response('ok', { status: 200 });
});
