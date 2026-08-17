import { createClient } from "npm:@blinkdotnew/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let query = url.searchParams.get("q");

    if (!query && req.method === "POST") {
        try {
            const body = await req.json();
            query = body.q;
        } catch (e) {
            // ignore
        }
    }

    if (!query) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Google's autocomplete API
    const googleUrl = `http://google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
    const response = await fetch(googleUrl);
    const data = await response.json();

    // Data format is [query, [suggestions...], ...]
    const suggestions = data[1] || [];

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handler);
