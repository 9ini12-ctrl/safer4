import { el, safeCode, toast } from "../scripts/lib.js";

function quickAccess(){
  const input = el("input",{
    class:"input",
    placeholder:"أدخل كود السفير (مثال 83923)",
    inputmode:"numeric",
    id:"quick_code"
  });

  const go = ()=>{
    const code = safeCode(input.value);
    if (!code) return toast("أدخل كود السفير أولًا");
    location.href = `/s/${code}`;
  };

  input.addEventListener("keydown", e=>{
    if (e.key === "Enter") go();
  });

  return el("div",{class:"quick-access"},[
    el("p",{class:"small", style:"margin:0 0 8px;"},["فتح صفحة السفير مباشرة"]),
    el("div",{class:"row"},[
      input,
      el("button",{class:"btn primary quick-btn", onclick:go},["دخول"])
    ])
  ]);
}

export function renderHome({ambassadors}){
  const totalAmbassadors = (ambassadors || []).length;
  return el("div",{},[
    el("div",{class:"topbar"},[
      el("div",{class:"brand"},[
        el("div",{class:"kicker"},["منصة السفراء"]),
        el("div",{class:"title"},["النسخة النهائية v2"]),
      ]),
      el("a",{class:"pill", href:"/admin"},["الإدارة"])
    ]),

    el("div",{class:"hero"},[
      el("h1",{},["أرسل لكل سفير رابطًا مباشرًا"]),
      el("p",{},["الرابط يكون بهذا الشكل: ", el("span",{style:"color:rgba(255,255,255,.92);font-weight:700"},["/s/<code>"]), " — ويفتح صفحة السفير فورًا."]),
      el("div",{class:"sep"}),
      el("div",{class:"kpi"},[
        el("div",{class:"label"},["عدد السفراء المسجلين"]),
        el("div",{class:"value"},[String(totalAmbassadors)])
      ]),
      el("div",{style:"height:10px;"}),
      quickAccess(),
      el("div",{class:"sep"}),

      el("div",{class:"small"},[
        "أمثلة (للاختبار): ",
        ...(ambassadors||[]).slice(0,2).flatMap((a,i)=>[
          el("a",{href:`/s/${a.code}`, style:"text-decoration:underline;margin:0 6px;"},[a.name]),
          i===0 ? " · " : ""
        ])
      ])
    ])
  ]);
}
