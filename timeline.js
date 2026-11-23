// LINEA DEL TEMPO 
let annoInizio = 2000;
let annoFine = 2026;
let annoSelezionato = 2026; //all'apertura si vedono tutti i libri
let ruota = 2026;           //anno che sta davanti all'anello in questo momento (con la virgola durante l'animazione)

let passo = 0.30;           //distanza tra un anno e l'altro sul cerchio (in radianti): più è grande, più sono distanti
let scrollAccumulo = 0;     //serve per scorrere 

//cerchio e anello aggiornati ogni frame da drawTimeline
let tlCx, tlCy, tlR; //tl = timeline
let xAnello;

function drawTimeline() {
  let top = headerHeight + margin;
  let bottom = height - margin;

  tlR = (bottom - top) * 0.4;           //raggio: più è grande, meno è curva
  xAnello = width - margin - 50;        //l'anello sta vicino al bordo destro
  tlCx = xAnello + tlR;                 //il centro del cerchio è fuori dallo schermo
  tlCy = top + (bottom - top) * 0.7;    //altezza dell'anello (0.5 = a metà)

  //la rotella si avvicina piano piano all'anno scelto (animazione)
  ruota = lerp(ruota, annoSelezionato, 0.15);

  push();
  //cerchio
  noFill();
  stroke(255);
  strokeWeight(1);
  circle(tlCx, tlCy, tlR * 2);

  //anni sul cerchio
  for (let anno = annoInizio; anno <= annoFine; anno++) {
    if (abs(anno - ruota) < 0.5) continue; //quello davanti all'anello lo scrivo dopo

    let a = annoAngolo(anno);
    if (abs(a - PI) > HALF_PI) continue;   //troppo lontano: sarebbe fuori dallo schermo

    let x = tlCx + tlR * cos(a);
    let y = tlCy + tlR * sin(a);

    //pallino
    noStroke();
    fill(255);
    circle(x, y, 7);

    //anno a sinistra del pallino
    fill(180);
    textStyle(NORMAL);
    textSize(12);
    textAlign(RIGHT, CENTER);
    text(anno, x - 12, y);
  }

  //anello fermo (riempito col colore di sfondo, così il cerchio non ci passa dentro)
  stroke(255);
  strokeWeight(1);
  fill(green2);
  circle(xAnello, tlCy, 18);

  //anno scelto a sinistra dell'anello
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(15);
  textAlign(RIGHT, CENTER);
  text(annoSelezionato, xAnello - 20, tlCy);
  pop();
}

//anno -> angolo sul cerchio
//l'anno davanti all'anello sta a PI (a sinistra del centro), quelli dopo scendono, quelli prima salgono
function annoAngolo(anno) {
  return PI - (anno - ruota) * passo;
}

//restituisce l'anno sotto il mouse (pallino o scritta), oppure null
function annoSottoMouse() {
  for (let anno = annoInizio; anno <= annoFine; anno++) {
    let a = annoAngolo(anno);
    if (abs(a - PI) > HALF_PI) continue;

    let x = tlCx + tlR * cos(a);
    let y = tlCy + tlR * sin(a);
    if (mouseX > x - 50 && mouseX < x + 10 && abs(mouseY - y) < 10) return anno;
  }
  return null;
}

//true se il mouse è sopra un anno (usata da sketch.js per la manina e il click)
function sopraTimeline() {
  return annoSottoMouse() !== null;
}

//click su un anno: diventa quello scelto e la rotella gira fino a portarlo all'anello
function updateTimeline() {
  let anno = annoSottoMouse();
  if (anno !== null && anno !== annoSelezionato) {
    annoSelezionato = anno;
    buildScaffali(); //ricalcola i conteggi solo quando l'anno cambia
  }
}

//true se il mouse è nella colonna della linea del tempo (per la rotellina)
function vicinoRuota() {
  return mouseX > width - margin - timeline && mouseY > headerHeight;
}

//rotellina: giù = anno dopo, su = anno prima
function scrollTimeline(delta) {
  scrollAccumulo += delta;
  if (abs(scrollAccumulo) < 60) return; //i trackpad mandano tanti scatti piccoli: ne sommo un po' prima di cambiare anno

  let anno = constrain(annoSelezionato + (scrollAccumulo > 0 ? 1 : -1), annoInizio, annoFine);
  scrollAccumulo = 0;
  if (anno !== annoSelezionato) {
    annoSelezionato = anno;
    buildScaffali();
  }
}