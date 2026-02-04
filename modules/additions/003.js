import { el, toast } from "../../scripts/lib.js";

function key(code){ return `coupons_v1_${code}`; }

function load(code){
  try{ return JSON.parse(localStorage.getItem(key(code))||"[]"); }catch{ return []; }
}
function save(code, arr){
  localStorage.setItem(key(code), JSON.stringify(arr||[]));
}

export async function mount({mount, ambassador}){
  const code = ambassador?.code || "x";
  let coupons = load(code);

  const list = el("div",{style:"display:flex;flex-direction:column;gap:10px;"});

  function render(){
    list.innerHTML = "";
    if (!coupons.length){
      list.appendChild(el("div",{class:"kpi"},[
        el("div",{},[
          el("div",{class:"label"},["محفظة الكوبونات"]),
          el("div",{class:"value"},["لا يوجد كوبونات"])
        ]),
        el("div",{style:"opacity:.7;font-weight:800"},["—"])
      ]));
      return;
    }
    coupons.forEach((c, idx)=>{
      list.appendChild(el("div",{class:"kpi"},[
        el("div",{},[
          el("div",{class:"label"},[c.title || "كوبون"]),
          el("div",{style:"font-weight:900;letter-spacing:.4px;direction:ltr;text-align:left;"},[c.code])
        ]),
        el("button",{class:"btn", style:"width:auto;padding:10px 12px;border-radius:999px;",
          onclick:()=>{
            coupons.splice(idx,1);
            save(code, coupons);
            render();
            toast("تم الحذف");
          }},["حذف"])
      ]));
    });
  }

  const add = el("div",{style:"margin-top:12px;"},[
    el("div",{class:"row"},[
      el("input",{class:"input", id:"c_title", placeholder:"اسم الكوبون (اختياري)"}),
      el("input",{class:"input", id:"c_code", placeholder:"CODE-123", style:"direction:ltr;text-align:left;"}),
    ]),
    el("div",{class:"btnrow"},[
      el("button",{class:"btn primary", onclick:()=>{
        const title = document.getElementById("c_title").value.trim();
        const ccode = document.getElementById("c_code").value.trim();
        if (!ccode) return toast("أدخل كود الكوبون");
        coupons.unshift({title, code: ccode, at: Date.now()});
        save(code, coupons);
        document.getElementById("c_title").value="";
        document.getElementById("c_code").value="";
        render();
        toast("تمت الإضافة ✅");
      }},["إضافة كوبون"]),
      el("button",{class:"btn", onclick:()=>{
        navigator.clipboard.writeText(JSON.stringify(coupons, null, 2)).then(()=>toast("تم نسخ JSON"));
      }},["نسخ بيانات الكوبونات"]),
    ]),
    el("p",{class:"small", style:"margin:10px 0 0;"},["كل سفير يشوف كوبوناته فقط (تخزين محلي لكل جهاز)."])
  ]);

  mount.appendChild(el("div",{},[list, add]));
  render();
}
