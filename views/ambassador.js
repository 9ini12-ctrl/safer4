import { el, money, toast, shareText } from "../scripts/lib.js";
import { addOpportunity, getAmbassadorCoupons, getStore, updateAmbassadorProgress } from "../scripts/state.js";

function topbar(ambassador, branch){
  return el("div",{class:"topbar"},[
    el("div",{class:"brand"},[
      el("div",{class:"kicker"},[branch?.name || "فرع غير محدد"]),
      el("div",{class:"title"},[ambassador?.name || "سفير"])
    ]),
    el("div",{class:"pill"},[ambassador?.code || "—"])
  ]);
}

function notFound(){
  return el("div",{class:"card pad"},[
    el("h3",{class:"cardtitle"},["السفير غير موجود"]),
    el("p",{class:"cardsub"},["تحقق من الرابط أو راجع الإدارة."])
  ]);
}

function rankBlock(ambassador, ambassadors, store){
  const sorted = [...ambassadors].sort((a,b)=>{
    const aa = store.ambassadors[a.code]?.donations || 0;
    const bb = store.ambassadors[b.code]?.donations || 0;
    return bb - aa;
  });
  const rank = sorted.findIndex(x=>x.code===ambassador.code) + 1;
  const top = sorted.slice(0,5);

  return el("div",{class:"card pad", style:"margin-top:12px;"},[
    el("h3",{class:"cardtitle"},["لوحة الترتيب"]),
    el("p",{class:"small"},[`ترتيبك العام اليوم: ${rank} من ${sorted.length}`]),
    el("div",{class:"admin-list"}, top.map((a, idx)=>el("div",{class:"admin-item"},[
      el("div",{},[
        el("div",{style:"font-weight:800;"},[`#${idx+1} ${a.name}`]),
        el("div",{class:"small"},[money(store.ambassadors[a.code]?.donations || 0)])
      ]),
      el("div",{class:"tag"},[a.code])
    ])))
  ]);
}

export async function renderAmbassador({ambassador, ambassadors, branches, content}){
  if (!ambassador) return notFound();

  const branch = branches.find(b=>b.id===ambassador.branch_id);
  const store = getStore();
  const progress = store.ambassadors[ambassador.code] || {donations:0, boxes:0, opportunities:0};
  const targets = ambassador.daily_targets || {donations:0, boxes:0};
  const coupons = getAmbassadorCoupons(ambassador.code);

  const refLink = `${location.origin}/s/${ambassador.code}?ref=${encodeURIComponent(ambassador.referral_code || ambassador.code)}`;

  const root = el("div",{},[
    topbar(ambassador, branch),
    el("div",{class:"card pad"},[
      el("h3",{class:"cardtitle"},["مستهدفات اليوم"]),
      el("div",{class:"grid2", style:"margin-top:10px;"},[
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["التبرعات"]), el("div",{class:"value"},[money(progress.donations)])]),
          el("div",{class:"small"},[`المستهدف ${money(targets.donations)}`])
        ]),
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["الصناديق المفتوحة"]), el("div",{class:"value"},[String(progress.boxes)])]),
          el("div",{class:"small"},[`المستهدف ${targets.boxes}`])
        ]),
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["فرص التبرع"]), el("div",{class:"value"},[String(progress.opportunities)])]),
          el("div",{class:"small"},["اليوم"]) 
        ]),
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["رابط الإحالة"]), el("div",{class:"value", style:"font-size:12px;direction:ltr;text-align:left;"},[ambassador.referral_code || ambassador.code])]),
          el("button",{class:"btn", style:"width:auto;", onclick:()=>shareText({title:"رابط السفير", text:content?.share?.message?.replaceAll("{REF_LINK}", refLink), url:refLink})},["مشاركة"])
        ])
      ])
    ]),

    el("div",{class:"card pad", style:"margin-top:12px;"},[
      el("h3",{class:"cardtitle"},["تسجيل إنجاز مباشر"]),
      el("div",{class:"row", style:"margin-top:10px;"},[
        el("input",{class:"input", id:"d_add", placeholder:"إضافة تبرعات (ر.س)", inputmode:"numeric"}),
        el("input",{class:"input", id:"b_add", placeholder:"إضافة صناديق", inputmode:"numeric"})
      ]),
      el("button",{class:"btn primary", style:"margin-top:10px;", onclick:()=>{
        const d = Number(document.getElementById("d_add").value || 0);
        const b = Number(document.getElementById("b_add").value || 0);
        updateAmbassadorProgress({ambassador, donationAdd:d, boxesAdd:b});
        location.reload();
      }},["حفظ التحديث"])
    ]),

    el("div",{class:"card pad", style:"margin-top:12px;"},[
      el("h3",{class:"cardtitle"},["إنشاء فرصة تبرع باسم متوفى"]),
      el("div",{class:"row", style:"margin-top:10px;"},[
        el("input",{class:"input", id:"dec_name", placeholder:"اسم المتوفى"}),
        el("input",{class:"input", id:"dec_amt", placeholder:"قيمة الفرصة", inputmode:"numeric"})
      ]),
      el("button",{class:"btn", style:"margin-top:10px;", onclick:()=>{
        const name = document.getElementById("dec_name").value.trim();
        const amt = Number(document.getElementById("dec_amt").value || 0);
        if (!name || !amt) return toast("أدخل الاسم والقيمة");
        addOpportunity({ambassador, deceasedName:name, amount:amt});
        location.reload();
      }},["إضافة الفرصة"])
    ]),

    el("div",{class:"card pad", style:"margin-top:12px;"},[
      el("h3",{class:"cardtitle"},["كوبونات المكافآت"]),
      coupons.length
        ? el("div",{class:"admin-list", style:"margin-top:10px;"}, coupons.map(c=>el("div",{class:"admin-item"},[
          el("div",{},[
            el("div",{style:"font-weight:800;"},[c.title]),
            el("div",{class:"small"},[new Date(c.at).toLocaleString("ar-SA")])
          ]),
          el("div",{class:"tag"},[c.code])
        ])))
        : el("p",{class:"small"},["عند تحقيق مستهدف التبرعات + الصناديق سيظهر كوبونك هنا مباشرة."])
    ]),

    rankBlock(ambassador, ambassadors, getStore()),

    el("div",{style:"margin-top:12px"},[
      el("button",{class:"btn ghost", onclick:()=>location.href="/"},["العودة للرئيسية"])
    ])
  ]);

  return root;
}
