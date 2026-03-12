import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { usn, fingerprint } = await req.json();

    if (!usn?.trim()) {
      return new Response(JSON.stringify({ error: "USN is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upperUSN = usn.trim().toUpperCase();

    const { data: event } = await supabase.from("events").select("*").limit(1).single();
    if (!event?.exit_open) {
      return new Response(JSON.stringify({ error: "The exit window is not open yet." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event.exit_closes_at) {
      const closesAt = new Date(event.exit_closes_at);
      if (new Date() > closesAt) {
        return new Response(JSON.stringify({ error: "The exit window has closed." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: reg } = await supabase
      .from("registrations")
      .select("id")
      .eq("usn", upperUSN)
      .maybeSingle();

    if (!reg) {
      return new Response(JSON.stringify({ error: "USN not found. You must register first." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("usn", upperUSN)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Attendance already marked for this USN." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               "unknown";

    const { error: insertError } = await supabase.from("attendance").insert({
      usn: upperUSN,
      ip,
      fingerprint: fingerprint || null,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return new Response(JSON.stringify({ error: "Attendance already marked for this USN." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Exit error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
