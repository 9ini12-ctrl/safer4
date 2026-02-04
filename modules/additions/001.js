import { el } from "../../scripts/lib.js";

export async function mount({mount, ambassador, content, helpers}){
  const imgUrl = content?.share?.image_url || "";
  const refLink = helpers.makeRefLink();
  const msg = (content?.share?.message || "")
    .replaceAll("{REF_LINK}", refLink)
    .replaceAll("#كود-الإحالة", ambassador.referral_code || "");

  const wrap = el("div",{},[
    el("div",{class:"thumb"},[
      el("img",{src: imgUrl, alt:"صورة النشر"})
    ]),
    el("div",{style:"margin-top:10px;"},[
      el("div",{class:"kpi"},[
        el("div",{},[
          el("div",{class:"label"},["رابطك"]),
          el("div",{style:"font-weight:800;direction:ltr;text-align:left;"},[refLink])
        ]),
        el("button",{class:"btn", style:"width:auto;padding:10px 12px;border-radius:999px;",
          onclick: async ()=>{
            await navigator.clipboard.writeText(refLink);
            helpers.toast("تم نسخ الرابط ✅");
          }},["نسخ"])
      ])
    ]),
    el("div",{style:"margin-top:10px;"},[
      el("textarea",{class:"input", style:"min-height:140px;resize:none;line-height:1.6;", readonly:"", },[msg])
    ]),
    el("div",{class:"btnrow"},[
      el("button",{class:"btn primary", onclick:()=>helpers.shareText({
        title:"رسالة تبرع",
        text: msg,
        url: refLink
      })},["مشاركة"]),
      el("button",{class:"btn", onclick: async ()=>{
        await navigator.clipboard.writeText(msg);
        helpers.toast("تم نسخ الرسالة ✅");
      }},["نسخ الرسالة"]),
    ]),
    el("p",{class:"small", style:"margin:10px 0 0;"},["تلميح: مشاركة الجوال تستخدم Web Share (واتساب/سناب/تلجرام...)."])
  ]);

  mount.appendChild(wrap);
}
