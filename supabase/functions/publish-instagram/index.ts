import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { post_id } = await req.json();
    if (!post_id) throw new Error('post_id required');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userErr || !user) throw new Error('Unauthorized');

    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('image_url, description')
      .eq('id', post_id)
      .eq('user_id', user.id)
      .single();
    if (postErr || !post) throw new Error('Post not found');

    const { data: conn, error: connErr } = await supabase
      .from('social_connections')
      .select('access_token, account_id')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .single();
    if (connErr || !conn) throw new Error('Instagram not connected');

    const igUserId = conn.account_id;
    const token = conn.access_token;

    // Paso 1: crear media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: post.image_url,
          caption: post.description,
          access_token: token,
        }),
      }
    );
    const containerData = await containerRes.json();
    if (!containerRes.ok) throw new Error(containerData.error?.message ?? 'IG container error');

    const creationId = containerData.id;

    // Paso 2: publicar el container
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: token,
        }),
      }
    );
    const publishData = await publishRes.json();
    if (!publishRes.ok) throw new Error(publishData.error?.message ?? 'IG publish error');

    // Guardar ig_media_id
    await supabase
      .from('posts')
      .update({ ig_media_id: publishData.id })
      .eq('id', post_id);

    return new Response(JSON.stringify({ success: true, ig_media_id: publishData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
