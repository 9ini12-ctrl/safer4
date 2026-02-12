import { el, money, toast, shareText } from "../scripts/lib.js";
import { loadAdditionModule } from "../modules/loader.js";

function topbar({name, code}){
  return el("div",{class:"topbar"},[
    el("div",{class:"brand"},[
      el("div",{class:"kicker"},["أهلًا بك صاحب الأثر"]),
      el("div",{class:"title"},[name || "سفير"])
    ]),
    el("div",{class:"pill", title:"كود السفير"},[
      el("span",{style:"opacity:.7;font-size:12px"},["CODE"]),
      el("span",{style:"font-weight:800"},[code || "—"])
    ])
  ]);
}

function notFound(){
  return el("div",{},[
    el("div",{class:"topbar"},[
      el("div",{class:"brand"},[
        el("div",{class:"kicker"},["منصة السفراء"]),
        el("div",{class:"title"},["لم يتم العثور على السفير"])
      ]),
      el("a",{class:"pill", href:"/"},["العودة"])
    ]),
    el("div",{class:"card pad"},[
      el("h3",{class:"cardtitle"},["الرابط غير صحيح"]),
      el("p",{class:"cardsub"},["تأكد من كود السفير داخل الرابط، أو اطلب من الإدارة رابطًا محدثًا."])
    ])
  ]);
}

function dashboard({ambassador, additions}){
  const activeCount = (ambassador?.additions || []).length;
  const knownCount = Object.keys(additions || {}).length;

  return el("div",{class:"card pad"},[
    el("h3",{class:"cardtitle"},["لوحة الإنجاز السريعة"]),
    el("p",{class:"cardsub"},["هنا كل أدواتك المفعّلة لإدارة النشر والمتابعة اليومية."]),
    el("div",{class:"row", style:"margin-top:10px;"},[
      el("div",{class:"kpi"},[
        el("div",{},[
          el("div",{class:"label"},["الإضافات المفعلة"]),
          el("div",{class:"value"},[String(activeCount)])
        ]),
        el("div",{style:"opacity:.7;font-weight:800"},[`/ ${knownCount}`])
      ]),
      el("div",{class:"kpi"},[
        el("div",{},[
          el("div",{class:"label"},["كود الإحالة"]),
          el("div",{class:"value", style:"font-size:14px;direction:ltr;text-align:left;"},[ambassador?.referral_code || "—"])
        ]),
        el("div",{style:"opacity:.7;font-weight:800"},["REF"])
      ])
    ])
  ]);
}

export async function renderAmbassador({ambassador, content, additions}){
  if (!ambassador) return notFound();

  const root = el("div",{},[
    topbar({name: ambassador.name, code: ambassador.code}),
    dashboard({ambassador, additions})
  ]);

  const list = el("div",{class:"grid"});
  root.appendChild(list);

  const allowed = (ambassador.additions || []).map(String);

  for (const addId of allowed){
    const meta = additions?.[addId] || {title:`الإضافة ${addId}`, subtitle:""};
    const card = el("div",{class:"card pad"});
    const head = el("div",{class:"cardhead"},[
      el("div",{},[
        el("h3",{class:"cardtitle"},[meta.title]),
        el("p",{class:"cardsub"},[meta.subtitle||""])
      ]),
      el("div",{class:"tag"},[addId])
    ]);
    card.appendChild(head);

    const mount = el("div",{});
    card.appendChild(mount);
    list.appendChild(card);

    try{
      const mod = await loadAdditionModule(addId);
      await mod.mount({
        mount,
        ambassador,
        content,
        additions,
        helpers:{
          money, toast, shareText,
          makeRefLink: () => {
            const base = `${location.origin}/s/${ambassador.code}`;
            const ref = ambassador.referral_code ? `?ref=${encodeURIComponent(ambassador.referral_code)}` : "";
            return base + ref;
          }
        }
      });
    }catch(e){
      console.error(e);
      mount.appendChild(el("p",{class:"small"},["تعذّر تحميل الإضافة ", addId]));
    }
  }

  root.appendChild(el("div",{style:"margin-top:14px;"},[
    el("button",{class:"btn ghost", onclick:()=>location.href="/"},["تسجيل خروج"])
  ]));

  return root;
}
