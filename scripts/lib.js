export const qs = (sel, el=document) => el.querySelector(sel);
export const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));

export function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs||{})){
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const ch of (Array.isArray(children)?children:[children])){
    if (ch == null) continue;
    node.appendChild(typeof ch === "string" ? document.createTextNode(ch) : ch);
  }
  return node;
}

export function money(n){
  try{
    return new Intl.NumberFormat("ar-SA",{style:"currency", currency:"SAR", maximumFractionDigits:0}).format(n||0);
  }catch{
    return `${n||0} ر.س`;
  }
}

let toastTimer = null;
export function toast(msg){
  let t = document.querySelector(".toast");
  if (!t){
    t = el("div",{class:"toast"});
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove("show"), 2200);
}

export async function getJSON(url){
  const r = await fetch(url, {cache:"no-store"});
  if (!r.ok) throw new Error(`Fetch failed: ${url}`);
  return await r.json();
}

export function safeCode(s){
  return (s||"").toString().trim().replace(/[^a-zA-Z0-9_-]/g,"");
}

export function shareText({title, text, url}){
  if (navigator.share){
    return navigator.share({title, text, url}).catch(()=>{});
  }
  // fallback: copy
  const payload = [text, url].filter(Boolean).join("\n\n");
  return navigator.clipboard.writeText(payload).then(()=>toast("تم النسخ ✅")).catch(()=>toast("تعذّر النسخ"));
}
