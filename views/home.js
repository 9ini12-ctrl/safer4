import { el } from "../scripts/lib.js";

export function renderHome({ambassadors}){
  return el("div",{},[
    el("div",{class:"topbar"},[
      el("div",{class:"brand"},[
        el("div",{class:"kicker"},["منصة السفراء"]),
        el("div",{class:"title"},["روابط مباشرة بدون تسجيل دخول"]),
      ]),
      el("a",{class:"pill", href:"/admin"},["الإدارة"])
    ]),

    el("div",{class:"hero"},[
      el("h1",{},["أرسل لكل سفير رابطًا مباشرًا"]),
      el("p",{},["الرابط يكون بهذا الشكل: ", el("span",{style:"color:rgba(255,255,255,.92);font-weight:700"},["/s/<code>"]), " — ويفتح صفحة السفير فورًا."]),
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
