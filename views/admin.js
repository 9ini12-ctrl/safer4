import { el, toast } from "../scripts/lib.js";
import { clearOverrides, clearRuntime, getStore, saveOverrides } from "../scripts/state.js";

function blockTitle(title){
  return el("h3",{class:"cardtitle", style:"margin:0 0 8px;"},[title]);
}

function parseJsonInput(id){
  const raw = document.getElementById(id).value;
  return JSON.parse(raw);
}

function healthChecks({ambassadors, branches}){
  const issues = [];
  const codes = new Set();
  const branchIds = new Set((branches || []).map(b=>b.id));

  for (const b of (branches || [])){
    if (!b.id || !b.name || !b.manager) issues.push(`بيانات فرع ناقصة: ${b.id || "غير معروف"}`);
  }

  for (const a of (ambassadors || [])){
    if (!a.name || !a.code) issues.push("سفير بدون اسم/كود.");
    if (codes.has(a.code)) issues.push(`كود سفير مكرر: ${a.code}`);
    codes.add(a.code);
    if (!branchIds.has(a.branch_id)) issues.push(`السفير ${a.name} مرتبط بفرع غير موجود (${a.branch_id}).`);
  }

  return issues;
}

export async function renderAdmin({ambassadors, branches, content}){
  const runtime = getStore();
  const issues = healthChecks({ambassadors, branches});

  const root = el("div",{},[
    el("div",{class:"topbar"},[
      el("div",{class:"brand"},[
        el("div",{class:"kicker"},["لوحة الإدارة المتكاملة"]),
        el("div",{class:"title"},["مركز تشغيل حملة رمضان"])
      ]),
      el("a",{class:"pill", href:"/"},["الرئيسية"])
    ]),

    el("div",{class:"card pad"},[
      blockTitle("مؤشرات مباشرة"),
      el("div",{class:"grid2"},[
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["عدد السفراء"]), el("div",{class:"value"},[String(ambassadors.length)])]),
          el("div",{class:"small"},["يدعم +800 سفير"])
        ]),
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["عدد الفروع"]), el("div",{class:"value"},[String(branches.length)])]),
          el("div",{class:"small"},["إدارة فرعية"])
        ]),
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["فرص اليوم"]), el("div",{class:"value"},[String(runtime.opportunities.length)])]),
          el("div",{class:"small"},["تحديث حي"])
        ]),
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["سلامة البيانات"]), el("div",{class:"value"},[issues.length ? "تنبيه" : "ممتاز"])]),
          el("div",{class:"small"},[issues.length ? `${issues.length} ملاحظات` : "بدون أخطاء"])
        ])
      ])
    ]),

    el("div",{class:"card pad", style:"margin-top:12px;"},[
      blockTitle("نتيجة فحص البيانات"),
      issues.length
        ? el("ul",{class:"small", style:"line-height:1.9;padding-inline-start:18px;"}, issues.map(i=>el("li",{},[i])))
        : el("p",{class:"small"},["كل البيانات الأساسية سليمة للنشر ✅"])
    ]),

    el("div",{class:"card pad", style:"margin-top:12px;"},[
      blockTitle("محرر البيانات (Input / Output)"),
      el("p",{class:"small"},["عدّل JSON ثم اضغط تطبيق محلي لتجربة التغييرات فورًا على المنصة، وبعد المراجعة نزّل الملفات وانشرها على GitHub."]),

      el("label",{class:"small"},["ambassadors.json"]),
      el("textarea",{class:"input", id:"admin_ambs", style:"min-height:170px;resize:vertical;"},[JSON.stringify(ambassadors, null, 2)]),

      el("label",{class:"small", style:"display:block;margin-top:10px;"},["branches.json"]),
      el("textarea",{class:"input", id:"admin_branches", style:"min-height:170px;resize:vertical;"},[JSON.stringify(branches, null, 2)]),

      el("label",{class:"small", style:"display:block;margin-top:10px;"},["content.json"]),
      el("textarea",{class:"input", id:"admin_content", style:"min-height:170px;resize:vertical;"},[JSON.stringify(content, null, 2)]),

      el("div",{class:"btnrow"},[
        el("button",{class:"btn primary", onclick:()=>{
          try{
            const o = {
              ambassadors: parseJsonInput("admin_ambs"),
              branches: parseJsonInput("admin_branches"),
              content: parseJsonInput("admin_content")
            };
            saveOverrides(o);
            toast("تم تطبيق التعديلات محليًا ✅");
            setTimeout(()=>location.reload(), 500);
          }catch(e){
            toast(`JSON غير صالح: ${e.message}`);
          }
        }},["تطبيق محلي"]),
        el("button",{class:"btn", onclick:()=>{
          clearOverrides();
          toast("تم حذف التعديلات المحلية");
          setTimeout(()=>location.reload(), 500);
        }},["إلغاء التعديلات المحلية"]),
        el("button",{class:"btn", onclick:()=>{
          clearRuntime();
          toast("تم تصفير بيانات اليوم");
          setTimeout(()=>location.reload(), 500);
        }},["تصفير مؤشرات اليوم"])
      ])
    ])
  ]);

  return root;
}
