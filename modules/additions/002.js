import { el, money } from "../../scripts/lib.js";

function calcProgress(){
  // نسخة Static: نخزن إنجاز اليوم محليًا على جهاز السفير (يمكن لاحقاً ربطه بملف CSV/مصدر مركزي)
  const key = `daily_progress_v1`;
  let data = {};
  try{ data = JSON.parse(localStorage.getItem(key)||"{}"); }catch{}
  const today = new Date().toISOString().slice(0,10);
  if (!data[today]) data[today] = {boxes:0, amount:0};
  const save = () => localStorage.setItem(key, JSON.stringify(data));
  return {today, data, save};
}

export async function mount({mount, content}){
  const targetBoxes = Number(content?.goals?.daily?.boxes_target || 10);
  const targetAmount = Number(content?.goals?.daily?.amount_target || 2000);

  const {today, data, save} = calcProgress();

  const state = data[today];

  const kpis = el("div",{},[
    el("div",{class:"row"},[
      el("div",{class:"kpi"},[
        el("div",{},[
          el("div",{class:"label"},["هدف الصناديق"]),
          el("div",{class:"value"},[String(targetBoxes)])
        ]),
        el("div",{style:"opacity:.75;font-weight:800"},["/ يوم"])
      ]),
      el("div",{class:"kpi"},[
        el("div",{},[
          el("div",{class:"label"},["هدف المبلغ"]),
          el("div",{class:"value"},[money(targetAmount)])
        ]),
        el("div",{style:"opacity:.75;font-weight:800"},["/ يوم"])
      ]),
    ]),
    el("div",{style:"margin-top:10px;"},[
      el("div",{class:"row"},[
        el("div",{class:"kpi"},[
          el("div",{},[
            el("div",{class:"label"},["المحقق اليوم"]),
            el("div",{class:"value", id:"p_boxes"},[String(state.boxes||0)])
          ]),
          el("div",{style:"opacity:.75;font-weight:800"},["صندوق"])
        ]),
        el("div",{class:"kpi"},[
          el("div",{},[
            el("div",{class:"label"},["المبلغ اليوم"]),
            el("div",{class:"value", id:"p_amount"},[money(state.amount||0)])
          ]),
          el("div",{style:"opacity:.75;font-weight:800"},["SAR"])
        ]),
      ])
    ])
  ]);

  const form = el("div",{style:"margin-top:12px;"},[
    el("div",{class:"row"},[
      el("input",{class:"input", id:"in_boxes", placeholder:"أضف صناديق (مثال 1)", inputmode:"numeric"}),
      el("input",{class:"input", id:"in_amount", placeholder:"أضف مبلغ (مثال 200)", inputmode:"numeric"}),
    ]),
    el("div",{class:"btnrow"},[
      el("button",{class:"btn primary", onclick:()=>{
        const b = Number(document.getElementById("in_boxes").value||0);
        const a = Number(document.getElementById("in_amount").value||0);
        state.boxes = Number(state.boxes||0) + (isFinite(b)?b:0);
        state.amount = Number(state.amount||0) + (isFinite(a)?a:0);
        save();
        document.getElementById("p_boxes").textContent = String(state.boxes);
        document.getElementById("p_amount").textContent = money(state.amount);
        document.getElementById("in_boxes").value = "";
        document.getElementById("in_amount").value = "";
      }},["تحديث إنجاز اليوم"]),
      el("button",{class:"btn", onclick:()=>{
        state.boxes = 0; state.amount = 0; save();
        document.getElementById("p_boxes").textContent = "0";
        document.getElementById("p_amount").textContent = money(0);
      }},["تصفير اليوم"]),
    ]),
    el("p",{class:"small", style:"margin:10px 0 0;"},[
      "ملاحظة: هذا التتبع محلي على الجهاز (بدون سيرفر). لو تبي التتبع مركزي لكل السفراء نربطه بملف CSV/Google Sheet/Netlify Function."
    ])
  ]);

  mount.appendChild(el("div",{},[kpis, form]));
}
