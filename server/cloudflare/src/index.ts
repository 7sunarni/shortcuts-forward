export interface Env {
  forward: KVNamespace;
  DEFAULT_TTL?: string; // seconds, optional
}

type Json = Record<string, unknown> | unknown[];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders, ...(init.headers || {}) },
    status: init.status || 200,
  });
}

async function get(req: Request, env: Env): Promise<Response> {
  console.log("[get]: prepare to get")
  const list = await env.forward.list();

  const results = [] as {
    id: number;
    ts: number;
    data: string;
  }[];

  for (const key of list.keys) {
    const data = await env.forward.get(key.name, "json");
    results.push({ id: Number(key.name), ts: Number(key.name), data: data.sms });
  }

  return json(results);
}

async function put(req: Request, env: Env): Promise<Response> {
  console.log("[put]: ready to put")
  const kvKey = Date.now().toString();
  const data = await req.json();
  await env.forward.put(kvKey, JSON.stringify(data), {
    expirationTtl: 60 * 10,
  });

  return json({ key: kvKey, ok: true });
}


export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    console.log("fetch", req)
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (req.method === "GET") {
      return get(req, env);
    }

    if (req.method === "POST") {
      return put(req, env);
    }
  },
};
