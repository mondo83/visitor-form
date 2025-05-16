function getOfficeFromURL() {
  const url = new URL(window.location.href);
  return url.searchParams.get("office") || "";
}
document.addEventListener("DOMContentLoaded", function(){
  // 事業所表示とhidden input
  const office = getOfficeFromURL();
  if(office){
    // hidden input
    const hiddenOffice = document.createElement("input");
    hiddenOffice.type = "hidden";
    hiddenOffice.name = "office";
    hiddenOffice.value = office;
    document.getElementById("visit-form").appendChild(hiddenOffice);
    // 表示ラベル（そのまま表示）
    document.getElementById("office-display").textContent = office;
  }
  // 日付・時刻の初期値
  const now = new Date();
  const pad = n => n.toString().padStart(2,'0');
  document.getElementById("entry-date").value = now.getFullYear() + "-" + pad(now.getMonth()+1) + "-" + pad(now.getDate());
  document.getElementById("entry-time").value = pad(now.getHours()) + ":" + pad(now.getMinutes());
  let plus1h = new Date(now.getTime() + 60*60*1000);
  document.getElementById("exit-time").value = pad(plus1h.getHours()) + ":" + pad(plus1h.getMinutes());
  // 来所目的
  const purposes = [
    "施設調査/監査","見学・データ調査（会議）","打合せ（会議）",
    "点検/修理","納品/納入","清掃","その他"
  ];
  const group = document.getElementById("purpose-group");
  purposes.forEach((purpose,i)=>{
    const id = "purpose"+i;
    const cb = document.createElement("input");
    cb.type="checkbox";cb.id=id;cb.name="purpose";cb.value=purpose;
    const label = document.createElement("label");
    label.htmlFor = id;label.className="checkbox-label";
    label.appendChild(cb);label.append(" "+purpose);
    group.appendChild(label);
  });
  // ビジター行
  addVisitorEntry();
  document.getElementById("add-visitor-btn").addEventListener("click",()=>addVisitorEntry());
  // バリデーション
  document.getElementById("visit-form").addEventListener("submit",function(e){
    let ok = true;
    // 会社名
    if(!document.getElementById("company").value.trim()){
      showError("error-company","会社名を入力してください。"); ok=false;
    }else{hideError("error-company");}
    // 入館日
    if(!document.getElementById("entry-date").value){
      showError("error-entry-date","入館日を入力してください。"); ok=false;
    }else{hideError("error-entry-date");}
    // 入館時刻
    if(!document.getElementById("entry-time").value){
      showError("error-entry-time","入館時刻を入力してください。"); ok=false;
    }else{hideError("error-entry-time");}
    // 退館予定時刻
    if(!document.getElementById("exit-time").value){
      showError("error-exit","退館予定時刻を入力してください。"); ok=false;
    }else{hideError("error-exit");}
    // 来所目的
    const purposes = Array.from(document.querySelectorAll('#purpose-group input[type="checkbox"]')).filter(cb=>cb.checked);
    if(purposes.length === 0){
      showError("error-purpose","来所目的を選択してください。"); ok=false;
    }else{hideError("error-purpose");}
    // ビジター番号＆氏名
    let vlist = document.getElementById("visitor-list");
    let visitorOk = false;
    for(const row of vlist.children){
      const card = row.querySelector(".visitor-card").value.trim();
      const name = row.querySelector(".visitor-name").value.trim();
      if(card && name){ visitorOk=true; }
      if(card && !/^\d+$/.test(card)){
        showError("error-visitors","カード番号は半角数字で入力してください。"); ok=false;
      }
    }
    if(!visitorOk){
      showError("error-visitors","少なくとも1名のカード番号と氏名を入力してください。"); ok=false;
    }else if(ok){
      hideError("error-visitors");
    }
    // 注意事項
    let noticeChk = document.getElementById("notice-confirm");
    if(!noticeChk.checked){
      showError("error-notice","注意事項を確認してください。"); ok=false;
    }else{hideError("error-notice");}
    if(!ok) e.preventDefault();
  });
  function showError(id,msg){const el=document.getElementById(id); el.textContent=msg; el.style.display="";}
  function hideError(id){const el=document.getElementById(id); el.textContent=""; el.style.display="none";}
});
function addVisitorEntry() {
  const row = document.createElement("div");
  row.className = "visitor-entry";
  const cardInput = document.createElement("input");
  cardInput.type = "text";
  cardInput.className = "visitor-card";
  cardInput.placeholder = "カード番号";
  cardInput.inputMode = "numeric";
  cardInput.autocomplete = "off";
  cardInput.addEventListener("input",function(){
    this.value = this.value.replace(/[^0-9]/g,"");
  });
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "visitor-name";
  nameInput.placeholder = "氏名";
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "visitor-remove-btn";
  removeBtn.textContent = "削除";
  removeBtn.onclick = function() { row.remove(); };
  row.appendChild(cardInput);
  row.appendChild(nameInput);
  row.appendChild(removeBtn);
  document.getElementById("visitor-list").appendChild(row);
}
