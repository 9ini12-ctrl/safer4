import { el, money, toast } from "../../scripts/lib.js";

function key(code){ return `goals_v1_${code}`; }

function load(code){
  try{ return JSON.parse(localStorage.getItem(key(code))||"[]"); }catch{ return []; }
}
function save(code, arr){
  localStorage.setItem(key(code), JSON.stringify(arr||[]));
}

function normalizeUrl(u){
  try{
    const url = new URL(u);
    if (url.hostname !== "donate.utq.org.sa") return null;
    if (!/^\/goal_\d+\/?$/.test(url.pathname)) return null;
    url.search = "";
    url.hash = "";
    return url.toString();
  }catch{ return null; }
}

async function fetchGoal(url){
  const api = `/.netlify/functions/goal?url=${encodeURIComponent(url)}`;
  const res = await fetch(api, {cache:"no-store"});
  const data = await res.json().catch(()=>({ok:false}));
  if (!res.ok || !data.ok) throw new Error(data.error || "Fetch failed");
  return data;
}

function goalCard(goal, idx, onRemove, onRefresh){
  const title = goal.title || "صندوق سهمي";
  const pct = (goal.progress_pct==null) ? null : goal.progress_pct;
  const raised = goal.raised==null ? "—" : money(goal.raised);
  const target = goal.target==null ? "—" : money(goal.target);
  const remaining = goal.remaining==null ? "—" : money(goal.remaining);

  const top = el("div",{style:"display:flex;align-items:flex-start;justify-content:space-between;gap:10px;"},[
    el("div",{},[
      el("div",{style:"font-weight:900;font-size:15px;line-height:1.25;margin-bottom:4px;"},[title]),
      el("a",{href: goal.source_url, target:"_blank", class:"small", style:"text-decoration:underline;opacity:.85;"},["فتح الرابط"])
    ]),
    el("div",{style:"display:flex;gap:8px;align-items:center;"},[
      el("button",{class:"btn", style:"width:auto;padding:10px 12px;border-radius:999px;", onclick:()=>onRefresh(idx)},["تحديث"]),
      el("button",{class:"btn", style:"width:auto;padding:10px 12px;border-radius:999px;opacity:.85;", onclick:()=>onRemove(idx)},["حذف"])
    ])
  ]);

  const img = goal.image_url ? el("div",{class:"thumb", style:"margin-top:10px;"},[
    el("img",{src: goal.image_url, alt: title})
  ]) : null;

  const kpis = el("div",{style:"margin-top:10px;display:flex;flex-direction:column;gap:10px;"},[
    el("div",{class:"kpi"},[
      el("div",{},[el("div",{class:"label"},["تم جمع"]), el("div",{class:"value"},[raised])]),
      el("div",{style:"opacity:.75;font-weight:800"},[pct==null ? "—" : `${Math.round(pct)}%`])
    ]),
    el("div",{class:"row"},[
      el("div",{class:"kpi"},[
        el("div",{},[el("div",{class:"label"},["المستهدف"]), el("div",{class:"value"},[target])]),
        el("div",{style:"opacity:.75;font-weight:800"},["هدف"])
      ]),
      el("div",{class:"kpi"},[
        el("div",{},[el("div",{class:"label"},["المتبقي"]), el("div",{class:"value"},[remaining])]),
        el("div",{style:"opacity:.75;font-weight:800"},["باقي"])
      ]),
    ])
  ]);

  const updated = goal.fetched_at ? el("div",{class:"small", style:"margin-top:10px;opacity:.75;"},[
    "آخر تحديث: ", new Date(goal.fetched_at).toLocaleString("ar-SA")
  ]) : null;

  return el("div",{style:"padding:12px 0;border-top:1px solid rgba(255,255,255,.10);"},[
    top,
    img,
    kpis,
    updated
  ]);
}

export async function mount({mount, ambassador}){
  const code = ambassador?.code || "x";
  let urls = load(code);

  const header = el("div",{},[
    el("p",{class:"small", style:"margin:0 0 10px;"},[
      "أضف روابط صناديقك السهمية (مثال: ",
      el("span",{style:"direction:ltr;text-align:left;font-weight:800;"},["https://donate.utq.org.sa/goal_2439/"]),
      "). النظام يجلب العنوان + الصورة + التقدم عبر Netlify Function."
    ])
  ]);

  const listWrap = el("div",{},[]);
  const controls = el("div",{style:"margin-top:12px;"},[
    el("div",{class:"row"},[
      el("input",{class:"input", id:"g_url", placeholder:"ألصق رابط الصندوق هنا", style:"direction:ltr;text-align:left;"}),
      el("button",{class:"btn primary", style:"width:45%;", onclick: async ()=>{
        const raw = document.getElementById("g_url").value.trim();
        const norm = normalizeUrl(raw);
        if (!norm) return toast("الرابط غير صحيح (لازم donate.utq.org.sa/goal_<id>/)");
        if (urls.find(x=>x.url===norm)) return toast("مضاف مسبقًا");
        urls.unshift({url:norm, data:null});
        save(code, urls);
        document.getElementById("g_url").value="";
        await refreshOne(0);
      }},["إضافة"])
    ]),
    el("div",{class:"btnrow"},[
      el("button",{class:"btn", onclick: async ()=>{
        if (!urls.length) return toast("لا يوجد روابط");
        await refreshAll();
      }},["تحديث الكل"]),
      el("button",{class:"btn", onclick: ()=>{
        navigator.clipboard.writeText(JSON.stringify(urls, null, 2)).then(()=>toast("تم نسخ البيانات"));
      }},["نسخ بيانات الصناديق (JSON)"]),
    ]),
  ]);

  async function refreshOne(idx){
    const item = urls[idx];
    if (!item) return;
    toast("جاري التحديث…");
    try{
      const data = await fetchGoal(item.url);
      urls[idx] = {url:item.url, data};
      save(code, urls);
      render();
      toast("تم التحديث ✅");
    }catch(e){
      toast("تعذّر الجلب (قد يكون تغيّر شكل الصفحة)");
      console.error(e);
    }
  }

  async function refreshAll(){
    for (let i=0;i<urls.length;i++){
      await refreshOne(i);
    }
  }

  function removeIdx(idx){
    urls.splice(idx,1);
    save(code, urls);
    render();
    toast("تم الحذف");
  }

  function totals(){
    let raised=0, target=0, remaining=0, ok=0;
    for (const it of urls){
      const d = it.data;
      if (d && d.ok){
        if (typeof d.raised==="number") raised += d.raised;
        if (typeof d.target==="number") target += d.target;
        if (typeof d.remaining==="number") remaining += d.remaining;
        ok++;
      }
    }
    return {raised, target, remaining, ok, count: urls.length};
  }

  function render(){
    listWrap.innerHTML = "";
    if (!urls.length){
      listWrap.appendChild(el("div",{class:"kpi"},[
        el("div",{},[
          el("div",{class:"label"},["الصناديق السهمية"]),
          el("div",{class:"value"},["لا يوجد روابط"])
        ]),
        el("div",{style:"opacity:.7;font-weight:800"},["—"])
      ]));
      return;
    }

    const t = totals();
    listWrap.appendChild(el("div",{style:"display:flex;flex-direction:column;gap:10px;margin-bottom:10px;"},[
      el("div",{class:"row"},[
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["إجمالي تم جمع"]), el("div",{class:"value"},[money(t.raised)])]),
          el("div",{style:"opacity:.75;font-weight:800"},[`${t.ok}/${t.count}`])
        ]),
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["إجمالي المتبقي"]), el("div",{class:"value"},[money(t.remaining)])]),
          el("div",{style:"opacity:.75;font-weight:800"},["SAR"])
        ]),
      ])
    ]));

    const container = el("div",{});
    urls.forEach((it, idx)=>{
      const data = it.data || {source_url: it.url, title:"صندوق سهمي"};
      const card = {
        source_url: it.url,
        title: data.title || "صندوق سهمي",
        image_url: data.image_url || "",
        raised: data.raised ?? null,
        target: data.target ?? null,
        remaining: data.remaining ?? null,
        progress_pct: data.progress_pct ?? null,
        fetched_at: data.fetched_at || null
      };
      container.appendChild(goalCard(card, idx, removeIdx, refreshOne));
    });
    listWrap.appendChild(container);
  }

  mount.appendChild(el("div",{},[header, listWrap, controls]));
  render();
}
