const STORE_KEY = "mdkr_campaign_v1";
const OVERRIDE_KEY = "mdkr_overrides_v1";

export function todayKey(){
  return new Date().toISOString().slice(0,10);
}

function initialStore(){
  return {
    day: todayKey(),
    ambassadors: {},
    opportunities: [],
    coupons: {},
    branches: {}
  };
}

function resetIfNewDay(store){
  const now = todayKey();
  if (store.day === now) return store;
  return initialStore();
}

export function getStore(){
  let data = initialStore();
  try{
    data = JSON.parse(localStorage.getItem(STORE_KEY) || "null") || initialStore();
  }catch{}
  return resetIfNewDay(data);
}

export function saveStore(store){
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function ensureAmbassador(store, code){
  if (!store.ambassadors[code]){
    store.ambassadors[code] = {donations:0, boxes:0, opportunities:0};
  }
  return store.ambassadors[code];
}

function ensureBranch(store, branchId){
  if (!store.branches[branchId]){
    store.branches[branchId] = {donations:0, opportunities:0};
  }
  return store.branches[branchId];
}

function couponCode(prefix, key){
  const stamp = Date.now().toString().slice(-6);
  return `${prefix}-${key}-${stamp}`;
}

export function updateAmbassadorProgress({ambassador, donationAdd=0, boxesAdd=0, opportunitiesAdd=0}){
  const store = getStore();
  const code = ambassador.code;
  const branchId = ambassador.branch_id;
  const amb = ensureAmbassador(store, code);
  const branch = ensureBranch(store, branchId);

  amb.donations += Number(donationAdd) || 0;
  amb.boxes += Number(boxesAdd) || 0;
  amb.opportunities += Number(opportunitiesAdd) || 0;

  branch.donations += Number(donationAdd) || 0;
  branch.opportunities += Number(opportunitiesAdd) || 0;

  const dt = ambassador.daily_targets || {};
  const reachedDonation = amb.donations >= Number(dt.donations || 0);
  const reachedBoxes = amb.boxes >= Number(dt.boxes || 0);

  if (reachedDonation && reachedBoxes){
    if (!store.coupons[code]) store.coupons[code] = [];
    if (!store.coupons[code].find(c => c.type === "daily-complete")){
      store.coupons[code].push({
        type: "daily-complete",
        code: couponCode("AMB", code),
        at: Date.now(),
        title: "مكافأة تحقيق المستهدف اليومي"
      });
    }
  }

  saveStore(store);
  return store;
}

export function addOpportunity({ambassador, deceasedName, amount}){
  const store = getStore();
  const amt = Number(amount) || 0;
  store.opportunities.unshift({
    id: `OPP-${Date.now()}`,
    ambassador_code: ambassador.code,
    branch_id: ambassador.branch_id,
    deceased_name: deceasedName,
    amount: amt,
    at: Date.now()
  });

  updateAmbassadorProgress({
    ambassador,
    donationAdd: amt,
    opportunitiesAdd: 1
  });

  return getStore();
}

export function getAmbassadorCoupons(code){
  const store = getStore();
  return store.coupons[code] || [];
}

export function evaluateBranchCoupons(branches){
  const store = getStore();
  for (const branch of (branches || [])){
    const current = store.branches[branch.id] || {donations:0, opportunities:0};
    const target = branch.daily_targets || {};
    const hit = current.donations >= Number(target.donations || 0)
      && current.opportunities >= Number(target.opportunities || 0);
    if (!hit) continue;

    const key = `branch:${branch.id}`;
    if (!store.coupons[key]) store.coupons[key] = [];
    if (!store.coupons[key].find(c => c.type === "branch-daily")){
      store.coupons[key].push({
        type: "branch-daily",
        code: couponCode("BR", branch.id.replace(/[^A-Z0-9]/g, "")),
        at: Date.now(),
        title: `مكافأة فرع ${branch.name}`
      });
    }
  }
  saveStore(store);
  return store;
}

export function getOverrides(){
  try{
    return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "null") || {};
  }catch{
    return {};
  }
}

export function saveOverrides(overrides){
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides || {}));
}

export function clearOverrides(){
  localStorage.removeItem(OVERRIDE_KEY);
}

export function clearRuntime(){
  localStorage.removeItem(STORE_KEY);
}
