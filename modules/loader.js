export async function loadAdditionModule(id){
  const safe = String(id).replace(/[^0-9]/g,"");
  return await import(`./additions/${safe}.js`);
}
