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

    // Auth — extraer user del JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Obtener el JWT del usuario para extraer user_id
    const { data: { user }, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userErr || !user) throw new Error('Unauthorized');

    // Obtener el post
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('image_url, description')
      .eq('id', post_id)
      .eq('user_id', user.id)
      .single();
    if (postErr || !post) throw new Error('Post not found');

    // Obtener el access_token de Facebook
    const { data: conn, error: connErr } = await supabase
      .from('social_connections')
      .select('access_token, account_id')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .single();
    if (connErr || !conn) throw new Error('Facebook not connected');

    // Publicar en Facebook Graph API
    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${conn.account_id}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: post.image_url,
          caption: post.description,
          access_token: conn.access_token,
        }),
      }
    );
    const fbData = await fbRes.json();
    if (!fbRes.ok) throw new Error(fbData.error?.message ?? 'Facebook API error');

    // Guardar el fb_post_id
    await supabase
      .from('posts')
      .update({ fb_post_id: fbData.post_id ?? fbData.id })
      .eq('id', post_id);

    return new Response(JSON.stringify({ success: true, fb_post_id: fbData.id }), {
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
