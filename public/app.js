let data = [];
const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("vi-VN").format(n) + " đ";
const today = new Date().toISOString().slice(0,10);

$("incomeDate").value = today;
$("expenseDate").value = today;

async function api(url, options={}) {
  const r = await fetch(url, {headers: {"Content-Type":"application/json"}, ...options});
  if (!r.ok) {
    let msg = "Có lỗi xảy ra.";
    try { msg = (await r.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

async function load() {
  $("status").textContent = "Đang tải...";
  try {
    data = await api("/api/transactions");
    render();
    $("status").textContent = "Đã đồng bộ";
  } catch(e) {
    $("status").textContent = "Lỗi kết nối";
    alert(e.message);
  }
}

$("incomeForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await api("/api/transactions", {method:"POST", body:JSON.stringify({
      type:"income", date:$("incomeDate").value, name:$("incomeName").value,
      amount:Number($("incomeAmount").value), category:"Thu nhập", note:$("incomeNote").value
    })});
    e.target.reset(); $("incomeDate").value=today; await load();
  } catch(e){ alert(e.message); }
});

$("expenseForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await api("/api/transactions", {method:"POST", body:JSON.stringify({
      type:"expense", date:$("expenseDate").value, name:$("expenseName").value,
      amount:Number($("expenseAmount").value), category:$("expenseCategory").value
    })});
    e.target.reset(); $("expenseDate").value=today; await load();
  } catch(e){ alert(e.message); }
});

async function remove(id) {
  if (!confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
  try { await api("/api/transactions/"+encodeURIComponent(id), {method:"DELETE"}); await load(); }
  catch(e){ alert(e.message); }
}

function filtered() {
  const q=$("search").value.trim().toLowerCase(), f=$("fromDate").value, t=$("toDate").value, type=$("typeFilter").value;
  return data.filter(x =>
    (!q || (x.name+" "+x.category+" "+(x.note||"")).toLowerCase().includes(q)) &&
    (!f || x.date>=f) && (!t || x.date<=t) &&
    (type==="all" || x.type===type)
  ).sort((a,b)=>b.date.localeCompare(a.date));
}

function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

function render(){
  const totalI=data.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0);
  const totalE=data.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);
  $("totalIncome").textContent=money(totalI);
  $("totalExpense").textContent=money(totalE);
  $("balance").textContent=money(totalI-totalE);
  $("expenseCount").textContent=data.filter(x=>x.type==="expense").length;

  const list=filtered(); let fi=0,fe=0;
  $("rows").innerHTML="";
  for(const x of list){
    if(x.type==="income") fi+=x.amount; else fe+=x.amount;
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${new Date(x.date+"T00:00:00").toLocaleDateString("vi-VN")}</td>
      <td><span class="tag">${x.type==="income"?"Thu nhập":"Chi tiêu"}</span></td>
      <td><b>${esc(x.name)}</b>${x.note?`<br><small>${esc(x.note)}</small>`:""}</td>
      <td>${esc(x.category)}</td>
      <td class="right ${x.type==="income"?"income":"expense"}"><b>${x.type==="income"?"+":"-"}${money(x.amount)}</b></td>
      <td><button class="delete" data-id="${esc(x.id)}">Xóa</button></td>`;
    $("rows").appendChild(tr);
  }
  $("empty").style.display=list.length?"none":"block";
  $("filterIncome").textContent=money(fi); $("filterExpense").textContent=money(fe);
  document.querySelectorAll(".delete").forEach(b=>b.addEventListener("click",()=>remove(b.dataset.id)));
}

["search","fromDate","toDate","typeFilter"].forEach(id=>$(id).addEventListener("input",render));
$("clearFilters").addEventListener("click",()=>{["search","fromDate","toDate"].forEach(id=>$(id).value="");$("typeFilter").value="all";render();});

$("backupBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),transactions:data},null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="sao-luu-chi-tieu-gia-dinh.json"; a.click(); URL.revokeObjectURL(a.href);
});

$("restoreInput").addEventListener("change",e=>{
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=async()=>{
    try{
      const parsed=JSON.parse(reader.result), tx=Array.isArray(parsed)?parsed:parsed.transactions;
      if(!Array.isArray(tx)) throw new Error("File không đúng định dạng.");
      if(!confirm("Khôi phục sẽ thay thế toàn bộ dữ liệu hiện tại. Tiếp tục?")) return;
      await api("/api/backup/restore",{method:"POST",body:JSON.stringify({transactions:tx})});
      await load(); alert("Khôi phục dữ liệu thành công.");
    }catch(err){alert(err.message||"Không thể khôi phục.");}
    e.target.value="";
  };
  reader.readAsText(file);
});

load();