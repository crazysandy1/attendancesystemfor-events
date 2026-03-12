import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== Deno.env.get("ADMIN_SECRET_TOKEN")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    let csv = "";
    let filename = "";

    if (type === "registered") {
      const { data } = await supabase
        .from("registrations")
        .select("name, email, usn, registered_at")
        .order("registered_at", { ascending: true });

      csv = "Name,Email,USN,Registered At\n";
      csv += (data || [])
        .map((r) => `"${r.name}","${r.email}","${r.usn}","${r.registered_at}"`)
        .join("\n");
      filename = "all_registered.csv";
    } else if (type === "attended") {
      const { data: attendance } = await supabase
        .from("attendance")
        .select("usn, submitted_at")
        .order("submitted_at", { ascending: true });

      if (attendance && attendance.length > 0) {
        const usns = attendance.map((a) => a.usn);
        const { data: regs } = await supabase
          .from("registrations")
          .select("name, email, usn")
          .in("usn", usns);

        const regMap = new Map((regs || []).map((r) => [r.usn, r]));

        csv = "Name,Email,USN,Attended At\n";
        csv += attendance
          .map((a) => {
            const r = regMap.get(a.usn);
            return `"${r?.name || ""}","${r?.email || ""}","${a.usn}","${a.submitted_at}"`;
          })
          .join("\n");
      } else {
        csv = "Name,Email,USN,Attended At\n";
      }
      filename = "attended.csv";
    } else if (type === "absent") {
      const { data: allRegs } = await supabase
        .from("registrations")
        .select("name, email, usn")
        .order("usn", { ascending: true });

      const { data: allAtt } = await supabase
        .from("attendance")
        .select("usn");

      const attendedUSNs = new Set((allAtt || []).map((a) => a.usn));
      const absent = (allRegs || []).filter((r) => !attendedUSNs.has(r.usn));

      csv = "Name,Email,USN\n";
      csv += absent.map((r) => `"${r.name}","${r.email}","${r.usn}"`).join("\n");
      filename = "did_not_attend.csv";
    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: registered, attended, absent" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
