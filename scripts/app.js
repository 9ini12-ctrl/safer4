import { el, qs, getJSON, safeCode } from "./lib.js";
import { renderAmbassador } from "../views/ambassador.js";
import { renderHome } from "../views/home.js";
import { renderAdmin } from "../views/admin.js";

const app = qs("#app");

async function boot(){
  const path = location.pathname || "/";
  const seg = path.split("/").filter(Boolean);

  // routes:
  // /s/<code>  => ambassador
  // /admin     => admin (token optional)
  let view = null;

  if (seg[0] === "s" && seg[1]){
    view = {name:"ambassador", code: safeCode(seg[1])};
  } else if (seg[0] === "admin"){
    view = {name:"admin"};
  } else {
    view = {name:"home"};
  }

  // load shared content
  const [content, additions, ambassadors] = await Promise.all([
    getJSON("/data/content.json"),
    getJSON("/data/additions.json"),
    getJSON("/data/ambassadors.json"),
  ]);

  document.documentElement.style.setProperty("--accent", content?.brand?.accent || "#443129");

  app.innerHTML = "";
  const shell = el("div", {class:"shell"});
  app.appendChild(shell);

  if (view.name === "ambassador"){
    const amb = ambassadors.find(a => (a.code||"").toString() === view.code);
    shell.appendChild(await renderAmbassador({ambassador: amb, content, additions}));
  } else if (view.name === "admin"){
    shell.appendChild(await renderAdmin({ambassadors, additions, content}));
  } else {
    shell.appendChild(renderHome({ambassadors}));
  }
}

window.addEventListener("popstate", boot);
boot().catch(err=>{
  console.error(err);
  app.innerHTML = "";
  app.appendChild(el("div",{class:"shell"},[
    el("div",{class:"card pad"},[
      el("h2",{class:"cardtitle"},["حدث خطأ"]),
      el("p",{class:"cardsub"},["تأكد من وجود ملفات البيانات داخل مجلد data."]),
      el("pre",{style:"white-space:pre-wrap;color:rgba(255,255,255,.7);font-size:12px;margin:12px 0 0;"},[String(err)])
    ])
  ]));
});
