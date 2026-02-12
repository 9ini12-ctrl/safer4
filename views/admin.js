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

function runDataChecks(ambassadors, additions){
  const issues = [];
  const seenCodes = new Set();

  for (const amb of (ambassadors || [])){
    const code = (amb?.code || "").toString().trim();
    if (!amb?.name) issues.push(`السفير بدون اسم (code: ${code || "غير محدد"})`);
    if (!code) issues.push(`السفير ${amb?.name || "غير معروف"} بدون كود.`);
    if (code && seenCodes.has(code)) issues.push(`تكرار كود السفير: ${code}`);
    seenCodes.add(code);

    const invalidAdds = (amb?.additions || []).filter(id => !additions?.[String(id)]);
    if (invalidAdds.length) issues.push(`السفير ${amb?.name || code}: إضافات غير معرفة (${invalidAdds.join(", ")}).`);
  }

  return issues;
}

export async function renderAdmin({ambassadors, additions, content}){
  const root = el("div",{},[
    el("div",{class:"topbar"},[
      el("div",{class:"brand"},[
        el("div",{class:"kicker"},["لوحة الإدارة (Static)"]),
        el("div",{class:"title"},["مركز التحكم النهائي v3"])
      ]),
      el("div",{class:"pill"},["v3"])
    ])
  ]);

  const checks = runDataChecks(ambassadors, additions);
  root.appendChild(el("div",{class:"card pad"},[
    el("h3",{class:"cardtitle"},["حالة البيانات"]),
    el("p",{class:"cardsub"},[
      checks.length
        ? `تم العثور على ${checks.length} ملاحظة تحتاج مراجعة قبل النشر.`
        : "البيانات سليمة وجاهزة للنشر ✅"
    ]),
    ...(checks.length
      ? [el("ul",{class:"small", style:"margin:8px 0 0;padding-inline-start:18px;line-height:1.8;"}, checks.map(item=>el("li",{},[item])))]
      : [])
  ]));

  root.appendChild(el("div",{class:"card pad", style:"margin-top:12px;"},[
    el("h3",{class:"cardtitle"},["كيف تحدث البيانات؟"]),
    el("p",{class:"cardsub"},[
      "هذه النسخة تعمل بدون سيرفر. لتحديث الصلاحيات/المحتوى: عدّل ملفات JSON داخل مجلد ",
      el("span",{style:"font-weight:700;color:rgba(255,255,255,.9)"},["data/"]),
      " ثم ارفعها على GitHub (Netlify يتحدث تلقائيًا)."
    ])
  ]));

  root.appendChild(el("div",{class:"card pad", style:"margin-top:12px;"},[
    areaTitle("تصدير الملفات الحالية"),
    el("div",{class:"btnrow"},[
      el("button",{class:"btn", onclick:()=>downloadJSON("ambassadors.json", ambassadors)},["تصدير ambassadors.json"]),
      el("button",{class:"btn", onclick:()=>downloadJSON("additions.json", additions)},["تصدير additions.json"]),
      el("button",{class:"btn", onclick:()=>downloadJSON("content.json", content)},["تصدير content.json"])
    ]),
    el("p",{class:"small", style:"margin:10px 0 0;"},["تقدر تعدّلها ثم تستبدلها داخل الريبو."])
  ]));

  const draft = [...(ambassadors || [])];

  const listBox = el("div",{class:"admin-list"});
  function renderDraft(){
    listBox.innerHTML = "";
    if (!draft.length){
      listBox.appendChild(el("p",{class:"small"},["لا يوجد سفراء."]));
      return;
    }

    draft.forEach((amb, idx)=>{
      listBox.appendChild(el("div",{class:"admin-item"},[
        el("div",{},[
          el("div",{style:"font-weight:800;"},[amb.name || "بدون اسم"]),
          el("div",{class:"small"},[`/${amb.code} · إضافات: ${(amb.additions || []).join(", ") || "—"}`])
        ]),
        el("button",{class:"btn", style:"width:auto;", onclick:()=>{
          draft.splice(idx, 1);
          renderDraft();
        }},["حذف"])
      ]));
    });
  }

  const form = el("div",{class:"card pad", style:"margin-top:12px;"},[
    areaTitle("مولّد ambassadors.json متكامل"),
    el("div",{class:"row"},[
      el("input",{class:"input", placeholder:"اسم السفير", id:"a_name"}),
      el("input",{class:"input", placeholder:"الكود (مثال 83923)", inputmode:"numeric", id:"a_code"})
    ]),
    el("div",{class:"row", style:"margin-top:10px;"},[
      el("input",{class:"input", placeholder:"كود الإحالة (اختياري)", id:"a_ref"}),
      el("input",{class:"input", placeholder:"الإضافات (001,002)", id:"a_add"})
    ]),
    el("div",{class:"btnrow"},[
      el("button",{class:"btn primary", onclick:()=>{
        const name = document.getElementById("a_name").value.trim();
        const code = document.getElementById("a_code").value.trim();
        const ref = document.getElementById("a_ref").value.trim();
        const adds = document.getElementById("a_add").value.trim().split(",").map(s=>s.trim()).filter(Boolean);

        if (!name || !code) return toast("الاسم والكود مطلوبين");
        if (draft.some(a => (a.code || "").toString() === code)) return toast("الكود موجود مسبقًا");

        const invalid = adds.filter(id => !additions?.[id]);
        if (invalid.length) return toast(`إضافات غير موجودة: ${invalid.join(", ")}`);

        draft.push({name, code, referral_code: ref || undefined, additions: adds});
        renderDraft();

        document.getElementById("a_name").value = "";
        document.getElementById("a_code").value = "";
        document.getElementById("a_ref").value = "";
        document.getElementById("a_add").value = "";
        toast("تمت إضافة السفير إلى المسودة ✅");
      }},["إضافة إلى المسودة"]),
      el("button",{class:"btn", onclick:()=>{
        downloadJSON("ambassadors.json", draft);
      }},["تنزيل ambassadors.json كامل"])
    ]),
    el("div",{class:"btnrow"},[
      el("button",{class:"btn", onclick:async ()=>{
        try{
          await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
          toast("تم نسخ ambassadors.json");
        }catch{
          toast("تعذّر النسخ");
        }
      }},["نسخ JSON"])
    ]),
    listBox
  ]);
  root.appendChild(form);
  renderDraft();

  return root;
}
