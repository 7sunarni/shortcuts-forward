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

function text(msg: string, status = 400) {
  return new Response(msg, { status, headers: { ...corsHeaders } });
}

async function readJson<T = Json>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function ttlFrom(req: Request, env: Env): number | undefined {
  const url = new URL(req.url);
  const ttlQ = url.searchParams.get("ttl");
  const ttlEnv = Number(env.DEFAULT_TTL || 0) || 0;
  const ttl = ttlQ !== null ? Number(ttlQ) : ttlEnv;
  return ttl > 0 ? ttl : undefined;
}

const statusOK = '200';
const headers = {
  'Content-Type': 'text/plain',
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};


async function get(req: Request, env: Env): Promise<Response> {
  console.log("[get]: prepare to get")
  let statusCode = statusOK;
  let body;
  let ts = Date.now();
  ts = ts - 1000 * 60 * 10;

  return json({ key: "", ok: true });

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
    console.log("fetch",req)
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, ""); // trim trailing slash


    if (req.method === "GET") {
      return get(req, env);
    }

    if (req.method === "POST") {
      return put(req, env);
    }
  },
};
