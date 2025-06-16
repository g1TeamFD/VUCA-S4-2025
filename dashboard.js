// VUCA Venture – Real-time Leaderboard (Admin/Host Side)

const firebaseConfig = {
  apiKey: "AIzaSyAbDd63-21CmoQYqjlkmefXs0IFmfPvzgU",
  authDomain: "vuca-venture.firebaseapp.com",
  projectId: "vuca-venture",
  storageBucket: "vuca-venture.firebasestorage.app",
  messagingSenderId: "433007022401",
  appId: "1:433007022401:web:3eddc54d81161294b4d1c0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ───────── constants ───────── */
const GAME_ID = "defaultGame";
const TOTAL_Q = 3;                 // update if you add questions
const playersCol = db.collection("games").doc(GAME_ID).collection("players");
const tbody = document.querySelector('#scoreTable tbody');
const resetBtn = document.getElementById('resetBtn');

/* ───────── live table ───────── */
playersCol.orderBy("score","desc").onSnapshot(snap=>{
  tbody.innerHTML="";
  snap.forEach(doc=>{
    const p=doc.data();
    const progPct=Math.min(100,Math.floor((p.answered||0)/TOTAL_Q*100));

    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${p.name}</td>
      <td>
        <div class="progressRow">
          <div class="progressInner" style="width:${progPct}%"></div>
        </div>
      </td>
      <td>${p.score ?? 0}</td>`;
    tbody.appendChild(tr);
  });
});

/* ───────── reset game ───────── */
resetBtn.onclick = async () => {
  if (!confirm("Reset game? This will delete all players and scores.")) return;
  const batch = db.batch();
  const snap = await playersCol.get();
  snap.forEach(doc=>batch.delete(doc.ref));
  await batch.commit();
  alert("Game reset. Players can join again.");
};