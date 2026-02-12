import { el, qs, getJSON, safeCode } from "./lib.js";
import { renderAmbassador } from "../views/ambassador.js";
import { renderHome } from "../views/home.js";
import { renderAdmin } from "../views/admin.js";
import { renderBranch } from "../views/branch.js";
import { evaluateBranchCoupons, getOverrides } from "./state.js";

const app = qs("#app");

async function boot(){
  const path = location.pathname || "/";
  const seg = path.split("/").filter(Boolean);

  let view = {name:"home"};
  if (seg[0] === "s" && seg[1]) view = {name:"ambassador", code:safeCode(seg[1])};
  else if (seg[0] === "branch" && seg[1]) view = {name:"branch", id:seg[1]};
  else if (seg[0] === "admin") view = {name:"admin"};

  const [rawContent, rawAmbassadors, additions, rawBranches] = await Promise.all([
    getJSON("/data/content.json"),
    getJSON("/data/ambassadors.json"),
    getJSON("/data/additions.json"),
    getJSON("/data/branches.json")
  ]);

  const overrides = getOverrides();
  const content = overrides.content || rawContent;
  const ambassadors = overrides.ambassadors || rawAmbassadors;
  const branches = overrides.branches || rawBranches;

  evaluateBranchCoupons(branches);

  document.documentElement.style.setProperty("--accent", content?.brand?.accent || "#5a3e2b");

  app.innerHTML = "";
  const shell = el("div", {class:"shell"});
  app.appendChild(shell);

  if (view.name === "ambassador"){
    const ambassador = ambassadors.find(a => (a.code||"").toString() === view.code);
    shell.appendChild(await renderAmbassador({ambassador, ambassadors, branches, content, additions}));
  } else if (view.name === "branch"){
    const branch = branches.find(b => String(b.id) === String(view.id));
    shell.appendChild(await renderBranch({branch, ambassadors, branches, content}));
  } else if (view.name === "admin"){
    shell.appendChild(await renderAdmin({ambassadors, branches, additions, content}));
  } else {
    shell.appendChild(renderHome({ambassadors, branches, content}));
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
