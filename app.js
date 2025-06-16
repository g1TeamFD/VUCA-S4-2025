// VUCA Venture – Player Quiz

const firebaseConfig = {
  apiKey: "AIzaSyAbDd63-21CmoQYqjlkmefXs0IFmfPvzgU",
  authDomain: "vuca-venture.firebaseapp.com",
  projectId: "vuca-venture",
  storageBucket: "vuca-venture.firebasestorage.app",
  messagingSenderId: "433007022401",
  appId: "1:433007022401:web:3eddc54d81161294b4d1c0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

/* ───────── constants ───────── */
const GAME_ID   = "defaultGame";
const MAX_DOUBLE = 1, MAX_ELIM = 1;
const playersCol = db.collection("games").doc(GAME_ID).collection("players");

/* ───────── state ───────── */
let uid, playerDoc, questions = [], curIndex = 0;
let powerUps = { double: MAX_DOUBLE, elim: MAX_ELIM };

/* ───────── DOM ───────── */
const $ = id => document.getElementById(id);
const joinSec=$('joinSection'), quizSec=$('quizSection');
const nameIn=$('nameInput'), joinBtn=$('joinBtn');
const qCat=$('qCategory'), qText=$('qText'), choices=$('choices');
const dblBtn=$('doubleBtn'), elimBtn=$('eliminateBtn');
const feedback=$('feedback'), nextBtn=$('nextBtn');
const progInner=$('progressInner');

/* ───────── load questions ───────── */
fetch('questions.json').then(r=>r.json()).then(d=>{questions=d;});

/* ───────── auth ───────── */
auth.signInAnonymously().then(c=>{ uid=c.user.uid; });

/* ───────── join game ───────── */
joinBtn.onclick = async () => {
  const name = nameIn.value.trim();
  if (!name) return alert("Enter a nickname!");
  playerDoc = playersCol.doc(uid);
  await playerDoc.set({ name, score:0, answered:0 }, { merge:true });

  joinSec.hidden = true; quizSec.hidden = false;
  renderQ();
};

/* ───────── render question ───────── */
function renderQ(){
  const q=questions[curIndex];
  qCat.textContent = `(${q.category}) Question ${curIndex+1}/${questions.length}`;
  qText.textContent = q.question;
  feedback.textContent = ""; nextBtn.hidden = true;

  progInner.style.width = `${Math.floor(curIndex/questions.length*100)}%`;

  choices.innerHTML = "";
  q.options.forEach((opt,i)=>{
    const b=document.createElement('button');
    b.textContent = opt.text;
    b.onclick = () => answer(i);
    choices.appendChild(b);
  });

  dblBtn.disabled  = powerUps.double<=0;
  elimBtn.disabled = powerUps.elim <=0;
}

/* ───────── power-ups ───────── */
dblBtn.onclick = () => { powerUps.double--; pulse(dblBtn); dblBtn.disabled=true; };
elimBtn.onclick = () => {
  powerUps.elim--; pulse(elimBtn); elimBtn.disabled=true;
  const q=questions[curIndex];
  const max=Math.max(...q.options.map(o=>o.score));
  const wrong=q.options.findIndex(o=>o.score<max);
  if (wrong>=0) choices.children[wrong].style.visibility="hidden";
};

/* ───────── answer ───────── */
async function answer(idx){
  const q=questions[curIndex];
  const btn=choices.children[idx];
  Array.from(choices.children).forEach(b=>b.disabled=true);

  let gain=q.options[idx].score;
  if(powerUps.double<MAX_DOUBLE) gain*=2;

  btn.classList.add(gain>0?'correct':'incorrect');
  feedback.textContent = `${gain>=0?'+':''}${gain} pts`;
  nextBtn.hidden=false;

  await playerDoc.update({
    score:    firebase.firestore.FieldValue.increment(gain),
    answered: firebase.firestore.FieldValue.increment(1)
  });
}

/* ───────── next ───────── */
nextBtn.onclick = () => {
  curIndex++;
  if (curIndex >= questions.length){
    progInner.style.width="100%";
    quizSec.innerHTML="<h2 style='margin:2rem'>All done! 🎉<br>Check the leaderboard.</h2>";
  } else renderQ();
};

/* ───────── pulse helper ───────── */
function pulse(el){ el.animate([{transform:'scale(1)'},{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:350}); }
