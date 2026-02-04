\
/**
 * Netlify Function: /.netlify/functions/goal?url=<goal_url>
 * Fetches a donate goal page and extracts:
 * - title (og:title or <title>)
 * - image (og:image)
 * - target / raised / remaining (best-effort via multiple regex strategies)
 *
 * Notes:
 * - Works as a CORS-safe proxy for the static front-end.
 * - Extraction is best-effort because HTML structure may change.
 */

const isAllowedUrl = (u) => {
  try{
    const url = new URL(u);
    return url.hostname === "donate.utq.org.sa" && /^\/goal_\d+\/?$/.test(url.pathname);
  }catch{ return false; }
};

const pickFirst = (...vals) => vals.find(v => v !== undefined && v !== null && String(v).trim().length);

function stripHtml(s){
  return String(s||"")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMeta(html, prop){
  const re = new RegExp(`<meta\\s+[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
  const m = html.match(re);
  return m ? m[1] : "";
}

function findTitle(html){
  const og = findMeta(html, "og:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? stripHtml(m[1]) : "";
}

function findImage(html){
  const og = findMeta(html, "og:image");
  if (og) return og;
  const m = html.match(/<img[^>]*src=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

function parseNumberLike(s){
  if (!s) return null;
  const cleaned = String(s)
    .replace(/[^\d.,٬\s]/g, "")
    .replace(/\s+/g, "")
    .replace(/٬/g, ",");
  let x = cleaned;
  const hasComma = x.includes(",");
  const hasDot = x.includes(".");
  if (hasComma && hasDot){
    x = x.replace(/,/g, "");
  } else if (hasComma && !hasDot){
    x = x.replace(/,/g, "");
  }
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function extractMoneyTriplet(text){
  const t = text;
  const patterns = [
    { key: "raised", re: /(تم\s*جمع|المجموع|تم\s*التحصيل|المتحقق|المبلغ\s*المجموع)\s*[:\-]?\s*([0-9][0-9\s.,٬]*)/i },
    { key: "target", re: /(المستهدف|الهدف|المبلغ\s*المستهدف|قيمة\s*الهدف)\s*[:\-]?\s*([0-9][0-9\s.,٬]*)/i },
    { key: "remaining", re: /(المتبقي|المتبقى|المتبقّي)\s*[:\-]?\s*([0-9][0-9\s.,٬]*)/i },
  ];
  const out = {};
  for (const p of patterns){
    const m = t.match(p.re);
    if (m){
      const n = parseNumberLike(m[2]);
      if (n != null) out[p.key] = n;
    }
  }
  return out;
}

function extractFromPercent(text){
  const m = text.match(/([0-9]{1,3})\s*%/);
  if (!m) return null;
  const pct = Number(m[1]);
  return Number.isFinite(pct) ? pct : null;
}

function extractFallbackNumbers(text){
  const nums = [];
  const re = /([0-9][0-9\s.,٬]{2,})\s*(?:ر\.?\s*س|ريال|SAR)?/gi;
  let m;
  while ((m = re.exec(text)) && nums.length < 8){
    const n = parseNumberLike(m[1]);
    if (n != null) nums.push(n);
  }
  if (nums.length >= 2){
    const sorted = [...nums].sort((a,b)=>b-a);
    const target = sorted[0];
    const raised = sorted.find(x => x <= target) ?? sorted[1];
    return { raised, target };
  }
  return {};
}

exports.handler = async (event) => {
  const url = event.queryStringParameters?.url || "";
  if (!isAllowedUrl(url)){
    return {
      statusCode: 400,
      headers: {"content-type":"application/json; charset=utf-8"},
      body: JSON.stringify({ ok:false, error:"Invalid url. Only https://donate.utq.org.sa/goal_<id>/ is allowed." })
    };
  }

  try{
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; UTQ-GoalFetcher/1.0)",
        "accept": "text/html,*/*"
      }
    });
    if (!res.ok){
      return {
        statusCode: 502,
        headers: {"content-type":"application/json; charset=utf-8"},
        body: JSON.stringify({ ok:false, error:`Upstream error: ${res.status}` })
      };
    }
    const html = await res.text();
    const title = findTitle(html);
    const image_url = findImage(html);

    const text = stripHtml(html);

    let {raised, target, remaining} = extractMoneyTriplet(text);

    if (raised == null || target == null){
      const fb = extractFallbackNumbers(text);
      raised = pickFirst(raised, fb.raised);
      target = pickFirst(target, fb.target);
    }

    const rN = raised != null ? Number(raised) : null;
    const tN = target != null ? Number(target) : null;
    let remN = remaining != null ? Number(remaining) : null;
    if (remN == null && rN != null && tN != null){
      remN = Math.max(0, tN - rN);
    }

    let pct = null;
    if (rN != null && tN != null && tN > 0){
      pct = Math.max(0, Math.min(100, (rN / tN) * 100));
    }else{
      pct = extractFromPercent(text);
    }

    return {
      statusCode: 200,
      headers: {"content-type":"application/json; charset=utf-8", "cache-control":"no-store"},
      body: JSON.stringify({
        ok:true,
        source_url: url,
        title: title || "",
        image_url: image_url || "",
        raised: rN,
        target: tN,
        remaining: remN,
        progress_pct: pct,
        currency: "SAR",
        fetched_at: new Date().toISOString()
      })
    };
  }catch(err){
    return {
      statusCode: 500,
      headers: {"content-type":"application/json; charset=utf-8"},
      body: JSON.stringify({ ok:false, error:String(err) })
    };
  }
};
