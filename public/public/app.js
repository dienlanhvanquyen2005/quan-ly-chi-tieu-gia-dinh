let data=[];
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("vi-VN").format(n)+" đ";
const today=new Date().toISOString().slice(0,10);
$("incomeDate").value=today;$("expenseDate").value=today;

async function api(url,options={}){
 const headers={"Content-Type":"application/json","x-family-token":sessionStorage.getItem("familyToken")||""};
 const r=await fetch(url,{headers:{...headers,...(options.headers||{})},...options});
 if(r.status===401){sessionStorage.removeItem("familyToken");location.href="/login";throw Error("Phiên đăng nhập đã hết.");}if(!r.ok){let m="Có lỗi xảy ra.";try{m=(await r.json()).error||m}catch{}throw Error(m)}return r.json()}
async function load(){try{data=await api("/api/transactions");render();$("status").textContent="Đã đồng bộ"}catch(e){$("status").textContent="Lỗi kết nối";alert(e.message)}}

$("incomeForm").addEventListener("submit",async e=>{e.preventDefault();try{await api("/api/transactions",{method:"POST",body:JSON.stringify({
 type:"income",date:$("incomeDate").value,name:$("incomePerson").value==="husband"?"Lương chồng":"Lương vợ",
 amount:Number($("incomeAmount").value),category:$("incomePerson").value==="husband"?"Lương chồng":"Lương vợ",note:$("incomeNote").value
})});e.target.reset();$("incomeDate").value=today;await load()}catch(e){alert(e.message)}});

$("expenseForm").addEventListener("submit",async e=>{e.preventDefault();try{await api("/api/transactions",{method:"POST",body:JSON.stringify({
 type:"expense",date:$("expenseDate").value,name:$("expenseCategory").value,amount:Number($("expenseAmount").value),
 category:$("expenseCategory").value,note:$("expenseNote").value
})});e.target.reset();$("expenseDate").value=today;await load()}catch(e){alert(e.message)}});

async function remove(id){if(!confirm("Bạn có chắc muốn xóa khoản này?"))return;try{await api("/api/transactions/"+encodeURIComponent(id),{method:"DELETE"});await load()}catch(e){alert(e.message)}}
function filtered(){const q=$("search").value.trim().toLowerCase(),f=$("fromDate").value,t=$("toDate").value,type=$("typeFilter").value;return data.filter(x=>
(!q||(x.name+" "+x.category+" "+(x.note||"")).toLowerCase().includes(q))&&(!f||x.date>=f)&&(!t||x.date<=t)&&(type==="all"||x.type===type)).sort((a,b)=>b.date.localeCompare(a.date))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function monthData(){const f=$("fromDate").value,t=$("toDate").value;if(f&&f.slice(0,7)===t.slice(0,7)){return data.filter(x=>x.date>=f&&x.date<=t)}const now=new Date();const m=now.toISOString().slice(0,7);return data.filter(x=>x.date.startsWith(m))}
function render(){
 const inc=data.filter(x=>x.type==="income"),exp=data.filter(x=>x.type==="expense");
 const husband=inc.filter(x=>x.category==="Lương chồng").reduce((s,x)=>s+x.amount,0),wife=inc.filter(x=>x.category==="Lương vợ").reduce((s,x)=>s+x.amount,0),ti=inc.reduce((s,x)=>s+x.amount,0),te=exp.reduce((s,x)=>s+x.amount,0);
 $("husbandSalary").textContent=money(husband);$("wifeSalary").textContent=money(wife);$("familySalary").textContent=money(husband+wife);
 $("totalIncome").textContent=money(ti);$("totalExpense").textContent=money(te);$("balance").textContent=money(ti-te);$("expenseCount").textContent=exp.length;
 const list=filtered();let fi=0,fe=0;$("rows").innerHTML="";
 list.forEach(x=>{if(x.type==="income")fi+=x.amount;else fe+=x.amount;const tr=document.createElement("tr");tr.innerHTML=`<td>${new Date(x.date+"T00:00:00").toLocaleDateString("vi-VN")}</td><td><span class="tag">${x.type==="income"?"Lương":"Chi tiêu"}</span></td><td><b>${esc(x.name)}</b></td><td>${esc(x.note||x.category)}</td><td class="right ${x.type==="income"?"income":"expense"}"><b>${x.type==="income"?"+":"-"}${money(x.amount)}</b></td><td><button class="delete" data-id="${esc(x.id)}">Xóa</button></td>`;$("rows").appendChild(tr)});
 $("empty").style.display=list.length?"none":"block";$("filterIncome").textContent=money(fi);$("filterExpense").textContent=money(fe);
 const md=monthData(),mi=md.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0),me=md.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);
 $("monthIncome").textContent=money(mi);$("monthExpense").textContent=money(me);$("monthBalance").textContent=money(mi-me);
 const cats=["Tiền ăn","Tiền học","Tiền trả góp","Tiền điện","Tiền bỉm","Tiền sữa","Tiền nước","Tiền xăng xe","Mua sắm","Y tế","Khác"];
 const totals=cats.map(c=>[c,exp.filter(x=>x.category===c).reduce((s,x)=>s+x.amount,0)]).filter(x=>x[1]>0);
 $("categoryTotals").innerHTML=totals.length?totals.map(x=>`<div class="category"><span>${esc(x[0])}</span><b>${money(x[1])}</b></div>`).join(""):'<div class="empty">Chưa có khoản chi.</div>';
 document.querySelectorAll(".delete").forEach(b=>b.addEventListener("click",()=>remove(b.dataset.id)));
}
["search","fromDate","toDate","typeFilter"].forEach(id=>$(id).addEventListener("input",render));
$("clearFilters").addEventListener("click",()=>{["search","fromDate","toDate"].forEach(id=>$(id).value="");$("typeFilter").value="all";render()});
$("backupBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),transactions:data},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sao-luu-chi-tieu-gia-dinh.json";a.click();URL.revokeObjectURL(a.href)});
$("restoreInput").addEventListener("change",e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=async()=>{try{const p=JSON.parse(r.result),tx=Array.isArray(p)?p:p.transactions;if(!Array.isArray(tx))throw Error("File không đúng định dạng.");if(!confirm("Khôi phục sẽ thay thế toàn bộ dữ liệu hiện tại. Tiếp tục?"))return;await api("/api/backup/restore",{method:"POST",body:JSON.stringify({transactions:tx})});await load();alert("Khôi phục thành công.")}catch(err){alert(err.message||"Không thể khôi phục.")}e.target.value=""};r.readAsText(file)});
load();