import { el, money } from "../scripts/lib.js";
import { getAmbassadorCoupons, getStore } from "../scripts/state.js";

function notFound(){
  return el("div",{class:"card pad"},[
    el("h3",{class:"cardtitle"},["الفرع غير موجود"]),
    el("p",{class:"cardsub"},["تحقق من معرّف الفرع."])
  ]);
}

export async function renderBranch({branch, ambassadors}){
  if (!branch) return notFound();

  const store = getStore();
  const ambs = ambassadors.filter(a => a.branch_id === branch.id);
  const current = store.branches[branch.id] || {donations:0, opportunities:0};
  const target = branch.daily_targets || {donations:0, opportunities:0};
  const branchCoupon = getAmbassadorCoupons(`branch:${branch.id}`)[0];

  const sorted = [...ambs].sort((a,b)=>{
    const aa = store.ambassadors[a.code]?.donations || 0;
    const bb = store.ambassadors[b.code]?.donations || 0;
    return bb - aa;
  });

  return el("div",{},[
    el("div",{class:"topbar"},[
      el("div",{class:"brand"},[
        el("div",{class:"kicker"},["صفحة الفرع"]),
        el("div",{class:"title"},[branch.name])
      ]),
      el("a",{class:"pill", href:"/"},["الرئيسية"])
    ]),

    el("div",{class:"card pad"},[
      el("h3",{class:"cardtitle"},["قيادة الفرع"]),
      el("p",{class:"cardsub"},[`مدير الفرع: ${branch.manager}`]),
      el("div",{class:"grid2", style:"margin-top:10px;"},[
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["تبرعات الفرع"]), el("div",{class:"value"},[money(current.donations)])]),
          el("div",{class:"small"},[`المستهدف ${money(target.donations)}`])
        ]),
        el("div",{class:"kpi"},[
          el("div",{},[el("div",{class:"label"},["فرص التبرع"]), el("div",{class:"value"},[String(current.opportunities)])]),
          el("div",{class:"small"},[`المستهدف ${target.opportunities}`])
        ])
      ]),
      branchCoupon
        ? el("div",{class:"tag", style:"margin-top:10px;display:inline-flex;"},[`كوبون الفرع: ${branchCoupon.code}`])
        : el("p",{class:"small", style:"margin-top:10px;"},["عند تحقيق مستهدف الفرع اليومي يظهر كوبون الفرع هنا."])
    ]),

    el("div",{class:"card pad", style:"margin-top:12px;"},[
      el("h3",{class:"cardtitle"},["أداء سفراء الفرع"]),
      el("div",{class:"admin-list", style:"margin-top:10px;"},
        sorted.map((a, idx)=>{
          const p = store.ambassadors[a.code] || {donations:0, opportunities:0};
          return el("a",{class:"admin-item", href:`/s/${a.code}`},[
            el("div",{},[
              el("div",{style:"font-weight:800;"},[`#${idx+1} ${a.name}`]),
              el("div",{class:"small"},[`تبرعات: ${money(p.donations)} · فرص: ${p.opportunities}`])
            ]),
            el("div",{class:"tag"},[a.code])
          ]);
        })
      )
    ])
  ]);
}
