import { el, money, safeCode, toast } from "../scripts/lib.js";
import { getStore } from "../scripts/state.js";

function statCard(label, value, note=""){
  return el("div",{class:"kpi"},[
    el("div",{},[
      el("div",{class:"label"},[label]),
      el("div",{class:"value"},[value])
    ]),
    el("div",{class:"small"},[note])
  ]);
}

function quickNav(){
  const ambInput = el("input",{class:"input", placeholder:"كود السفير", id:"q_amb"});
  const branchInput = el("input",{class:"input", placeholder:"معرّف الفرع (BR-RYD)", id:"q_branch"});

  return el("div",{class:"card pad"},[
    el("h3",{class:"cardtitle"},["دخول سريع"]),
    el("div",{class:"row", style:"margin-top:10px;"},[
      ambInput,
      el("button",{class:"btn primary", onclick:()=>{
        const code = safeCode(ambInput.value);
        if (!code) return toast("أدخل كود السفير");
        location.href = `/s/${code}`;
      }},["صفحة السفير"])
    ]),
    el("div",{class:"row", style:"margin-top:10px;"},[
      branchInput,
      el("button",{class:"btn", onclick:()=>{
        const id = branchInput.value.trim();
        if (!id) return toast("أدخل معرّف الفرع");
        location.href = `/branch/${encodeURIComponent(id)}`;
      }},["صفحة الفرع"])
    ])
  ]);
}

export function renderHome({ambassadors, branches, content}){
  const store = getStore();
  const totalDonations = Object.values(store.ambassadors || {}).reduce((s, a)=>s + Number(a.donations || 0), 0);
  const totalOpps = store.opportunities.length;
  const achievers = ambassadors.filter(a=>{
    const p = store.ambassadors[a.code] || {donations:0, boxes:0};
    const t = a.daily_targets || {};
    return p.donations >= Number(t.donations || 0) && p.boxes >= Number(t.boxes || 0);
  }).length;

  return el("div",{},[
    el("div",{class:"topbar"},[
      el("div",{class:"brand"},[
        el("div",{class:"kicker"},[content?.campaign?.season || "رمضان"]),
        el("div",{class:"title"},[content?.brand?.name || "جمعية مدكر"])
      ]),
      el("a",{class:"pill", href:"/admin"},["إدارة المنصة"])
    ]),

    el("div",{class:"hero"},[
      el("h1",{},[content?.campaign?.name || "لوحة قيادة الحملة"]),
      el("p",{},[content?.campaign?.description || "متابعة حية لإنجازات الحملة عبر السفراء والفروع."]),
      el("div",{class:"sep"}),
      el("div",{class:"grid2"},[
        statCard("إجمالي التبرعات اليوم", money(totalDonations), "تحديث مباشر"),
        statCard("فرص التبرع المنشأة", String(totalOpps), "أسماء متوفين"),
        statCard("السفراء المحققون لمستهدفهم", String(achievers), `من ${ambassadors.length}`),
        statCard("الفروع المشاركة", String(branches.length), "متابعة يومية")
      ])
    ]),

    quickNav(),

    el("div",{class:"card pad", style:"margin-top:12px;"},[
      el("h3",{class:"cardtitle"},["الفروع"]),
      el("div",{class:"admin-list", style:"margin-top:10px;"},
        branches.map(b=>el("a",{class:"admin-item", href:`/branch/${b.id}`},[
          el("div",{},[
            el("div",{style:"font-weight:800;"},[b.name]),
            el("div",{class:"small"},[`المدير: ${b.manager}`])
          ]),
          el("div",{class:"tag"},[b.id])
        ]))
      )
    ])
  ]);
}
