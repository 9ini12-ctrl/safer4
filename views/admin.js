import { el, toast } from "../scripts/lib.js";

function areaTitle(txt){
  return el("div",{style:"display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;"},[
    el("h3",{class:"cardtitle", style:"margin:0;"},[txt]),
    el("a",{class:"pill", href:"/"},["الرئيسية"])
  ]);
}

function downloadJSON(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

export async function renderAdmin({ambassadors, additions, content}){
  const root = el("div",{},[
    el("div",{class:"topbar"},[
      el("div",{class:"brand"},[
        el("div",{class:"kicker"},["لوحة الإدارة (Static)"]),
        el("div",{class:"title"},["تحديث البيانات عبر JSON"]),
      ]),
      el("div",{class:"pill"},["v1"])
    ]),
  ]);

  root.appendChild(el("div",{class:"card pad"},[
    el("h3",{class:"cardtitle"},["كيف تحدث البيانات؟"]),
    el("p",{class:"cardsub"},[
      "هذه النسخة تعمل بدون سيرفر. لتحديث الصلاحيات/المحتوى: عدّل ملفات JSON داخل مجلد ",
      el("span",{style:"font-weight:700;color:rgba(255,255,255,.9)"},["data/"]),
      " ثم ارفعها على GitHub (Netlify يتحدث تلقائيًا)."
    ])
  ]));

  // Export current JSON
  root.appendChild(el("div",{class:"card pad", style:"margin-top:12px;"},[
    areaTitle("تصدير الملفات الحالية"),
    el("div",{class:"btnrow"},[
      el("button",{class:"btn", onclick:()=>downloadJSON("ambassadors.json", ambassadors)},["تصدير ambassadors.json"]),
      el("button",{class:"btn", onclick:()=>downloadJSON("additions.json", additions)},["تصدير additions.json"]),
      el("button",{class:"btn", onclick:()=>downloadJSON("content.json", content)},["تصدير content.json"]),
    ]),
    el("p",{class:"small", style:"margin:10px 0 0;"},["تقدر تعدّلها ثم تستبدلها داخل الريبو."])
  ]));

  // Quick help: add ambassador
  const form = el("div",{class:"card pad", style:"margin-top:12px;"},[
    areaTitle("مولّد سفير جديد (سريع)"),
    el("div",{class:"row"},[
      el("input",{class:"input", placeholder:"اسم السفير", id:"a_name"}),
      el("input",{class:"input", placeholder:"الكود (مثال 83923)", inputmode:"numeric", id:"a_code"}),
    ]),
    el("div",{class:"row", style:"margin-top:10px;"},[
      el("input",{class:"input", placeholder:"كود الإحالة (اختياري)", id:"a_ref"}),
      el("input",{class:"input", placeholder:"الإضافات (001,002)", id:"a_add"}),
    ]),
    el("div",{class:"btnrow"},[
      el("button",{class:"btn primary", onclick:()=>{
        const name = document.getElementById("a_name").value.trim();
        const code = document.getElementById("a_code").value.trim();
        if (!name || !code) return toast("الاسم والكود مطلوبين");
        const ref = document.getElementById("a_ref").value.trim();
        const adds = document.getElementById("a_add").value.trim().split(",").map(s=>s.trim()).filter(Boolean);
        const row = {name, code, referral_code: ref || undefined, additions: adds};
        downloadJSON(`new-ambassador-${code}.json`, row);
        toast("تم توليد ملف السفير ✅");
      }} ,["توليد ملف JSON للسفير"]),
    ]),
    el("p",{class:"small", style:"margin:10px 0 0;"},["ادمج السفير الجديد داخل data/ambassadors.json في الريبو."])
  ]);
  root.appendChild(form);

  return root;
}
