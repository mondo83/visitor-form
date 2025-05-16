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
    // 表示ラベル
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

  // ビジター行（最初の1行を追加）
  addVisitorEntry();
  document.getElementById("add-visitor-btn").addEventListener("click",()=>addVisitorEntry());

  // フォーム送信イベント（Netlify FunctionsにPOST）
  document.getElementById("visit-form").addEventListener("submit", async function(e){
    e.preventDefault();

    // ===== バリデーション =====
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
    const checkedPurposes = Array.from(document.querySelectorAll('#purpose-group input[type="checkbox"]')).filter(cb=>cb.checked);
    if(checkedPurposes.length === 0){
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
    if(!ok) return;

    // ===== ここから送信処理 =====

    // 入力値の取得とrecord組み立て
    const company = document.getElementById('company').value.trim();
    const entryDate = document.getElementById('entry-date').value;
    const entryTime = document.getElementById('entry-time').value;
    const exitTime  = document.getElementById('exit-time').value;
    const office    = getOfficeFromURL();
    const purposes = checkedPurposes.map(cb=>cb.value);

    const visitorRows = Array.from(document.querySelectorAll('.visitor-entry')).map(row => ({
      value: {
        visitor_name: { value: row.querySelector('.visitor-name').value.trim() },
        visitor_card: { value: row.querySelector('.visitor-card').value.trim() }
      }
    }));

    // Kintoneのフィールドコードにあわせて
    const record = {
      company:        { value: company },
      entry_datetime: { value: `${entryDate}T${entryTime}:00Z` }, // 形式調整
      exit_time:      { value: exitTime },
      purpose:        { value: purposes },
      office:         { value: office },
      visitorTable:   { value: visitorRows }
    };

    try {
      const recordId = await sendToNetlify(record);
      alert("登録完了！ID: " + recordId);
      location.reload();
    } catch(err) {
      alert("送信に失敗しました: " + err.message);
    }
  });

  // エラー表示用
  function showError(id,msg){const el=document.getElementById(id); el.textContent=msg; el.style.display="";}
  function hideError(id){const el=document.getElementById(id); el.textContent=""; el.style.display="none";}
});

// ビジター行追加
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

// Netlify Functions送信用
async function sendToNetlify(record) {
  const response = await fetch('/.netlify/functions/sendToKintone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record })
  });
  const result = await response.json();

  if (!response.ok) throw new Error("登録失敗: " + JSON.stringify(result.error));
  return result.id;
}
