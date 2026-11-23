// 1 glifo (= 1 libro disegnato) rappresenta GLIFO_VALE libri del database
let GLIFO_VALE = 50;

// ---CATEGORIE BAN---
// A sx il valore di "reason_categories" del CSV e a dx il nome che viene sul sito
let reasoncategories = {
  language_profanity:      "LANGUAGE PROFANITY",
  religious_objection:     "RELIGIOUS THEMES",
  drug_or_alcohol_content: "DRUG OR ALCOHOL",
  violence:                "VIOLENCE",
  lgbtq_themes:            "LGBTQ+ THEMES",
  political_content:       "POLITICAL CONTENT",
  racial_themes:           "RACIAL THEMES",
  legal_compliance:        "LEGAL COMPLIANCE",
  unspecified:             "UNSPECIFIED",
  sexual_content:          "SEXUAL CONTENT"
};


// ---STATI---
let state_names = {
  AL: "ALABAMA", AK: "ALASKA", AZ: "ARIZONA", AR: "ARKANSAS", CA: "CALIFORNIA",
  CO: "COLORADO", CT: "CONNECTICUT", DE: "DELAWARE", FL: "FLORIDA", GA: "GEORGIA",
  HI: "HAWAII", ID: "IDAHO", IL: "ILLINOIS", IN: "INDIANA", IA: "IOWA",
  KS: "KANSAS", KY: "KENTUCKY", LA: "LOUISIANA", ME: "MAINE", MD: "MARYLAND",
  MA: "MASSACHUSETTS", MI: "MICHIGAN", MN: "MINNESOTA", MS: "MISSISSIPPI", MO: "MISSOURI",
  MT: "MONTANA", NE: "NEBRASKA", NV: "NEVADA", NH: "NEW HAMPSHIRE", NJ: "NEW JERSEY",
  NM: "NEW MEXICO", NY: "NEW YORK", NC: "NORTH CAROLINA", ND: "NORTH DAKOTA", OH: "OHIO",
  OK: "OKLAHOMA", OR: "OREGON", PA: "PENNSYLVANIA", RI: "RHODE ISLAND", SC: "SOUTH CAROLINA",
  SD: "SOUTH DAKOTA", TN: "TENNESSEE", TX: "TEXAS", UT: "UTAH", VT: "VERMONT",
  VA: "VIRGINIA", WA: "WASHINGTON", WV: "WEST VIRGINIA", WI: "WISCONSIN", WY: "WYOMING"
};

let counts = {}; // Quanti libri ha ogni motivazione

// elementi stile messi in style.css che veongono poi letti da loadStyle
let margin, labelWidth, bookWidth, bookGap, shelfHeight, labelSize;
let backgroundColor, textColor, bookColor, shelfColor, fontFamily;

//dichiarazione
let headerHeight = 100;
let timeline = 200;
let hoveredId = null;

//stato della pagina
let rows = [];                  //una voce per ogni riga valida del CSV {id, reasons, state}
let shelves = [];               //gli scaffali da disegnare {key, label, count}
let activeSort = "MOTIVAZIONE"; //bottone selezionato
let sortButtons = [];           //rettangoli dei pulsanti da cliccare
const VISIBLE_SHELVES = 10;     //altezza di uno scaffale è sempre altezza libreria / 10
let scrollY = 0;                //scorrimento verticale della libreria
let shelfScroll = {};           //scorrimento orizzontale di ogni scaffale {chiave: pixel}
let labelZone = null;           //spazio a destra per i nomi


async function setup() {
  loadStyle();
  //font
  await document.fonts.load("12px 'Roboto Mono'");
  await document.fonts.load("700 30px 'Roboto Mono'"); //grassetto

  let data = await loadTable("assets/banned_index.csv", ",", "header");

  for (let row = 0; row < data.getRowCount(); row++) {
    // solo US
    if (data.getString(row, "country").trim() !== "US") continue;

    // solo dal 2000 al 2026
    let year = parseInt((data.getString(row, "date_reported") || "").substring(0, 4)); //.substring prende i primi quattro caratteri (anno) e parsInt lo trasforma in numero
    if (isNaN(year) || year < 2000 || year > 2026) continue; //se non è un numero o è fuori dal range, salta la riga

    // motivazioni (anche vuote)
    let reasons = (data.getString(row, "reason_categories") || "") //spezza il testo ogni volta che trova un ; o un a capo (\r, \n). Il + tratta più separatori consecutivi come uno solo. Si ottiene una lista: ["sexual_content", "lgbtq_themes"]
      .split(/[;\r\n]+/)
      .map((r) => r.trim()) //toglie gli spazi all'inizio e alla fine di ogni elemento
      .filter((r) => r !== ""); //scarta gli elementi vuoti
    //if (reasons.length === 0) continue; //se dopo la pulizia non resta nessuna motivazione, la riga ha la categoria vuota e viene saltata

    // aggiungo le motivazioni e lo stao
    rows.push({
      id: data.getString(row, "book_id"),
      reasons: reasons,
      state: (data.getString(row, "state_or_province") || "").trim(),
      year: year //serve alla linea del tempo
    });
  }

  buildScaffali();

  createCanvas(windowWidth, windowHeight);
  textFont(fontFamily);
}

function buildScaffali(){
  scrollY = 0;
  shelfScroll = {};
  labelZone = null;
  if (activeSort === "STATO AMERICANO") buildLibreriaStati();
  else buildLibreriaMotivazioni();
}

function buildLibreriaMotivazioni(){
  // book_id -> insieme di tutte le motivazioni di quel libro (su tutte le sue righe)
  let bookReasonsById = new Map();

  for (let r of rows) {
    if (r.year > annoSelezionato) continue; //linea del tempo: solo fino all'anno scelto
    if (r.reasons.length === 0) continue; //i libri senza motivazione non contano
    if (!bookReasonsById.has(r.id)) bookReasonsById.set(r.id, new Set()); //crea un nuovo set
    for (let reason of r.reasons) bookReasonsById.get(r.id).add(reason);
  }

  // Un libro conta una volta per ogni sua motivazione.
  // "unspecified" conta solo se è l'unica motivazione del libro.
  counts = {};
  for (let bookReasons of bookReasonsById.values()) {
    if (bookReasons.size > 1) bookReasons.delete("unspecified");
    for (let reason of bookReasons) counts[reason] = (counts[reason] || 0) + 1;
  }

  shelves = Object.keys(reasoncategories).map((k) => ({
    key: k,
    label: reasoncategories[k],
    count: counts[k] || 0
  }));
}

function buildLibreriaStati(){
  let booksByState = new Map(); // stato -> insieme di book_id
  for (let r of rows) {
    if (r.year > annoSelezionato) continue; //linea del tempo: solo fino all'anno scelto
    if (r.state === "") continue;
    if (!booksByState.has(r.state)) booksByState.set(r.state, new Set());
    booksByState.get(r.state).add(r.id);
  }
  let countOf = (code) => (booksByState.has(code) ? booksByState.get(code).size : 0);

  // tutti i 50 stati, anche senza dati e quindi con scaffali vuoti, sono messi in ordine alfabetico
  shelves = Object.keys(state_names).map((code) => ({
    key: code,
    label: state_names[code],
    count: countOf(code)
  }));
  shelves.sort((a, b) => a.label.localeCompare(b.label)); //ordine alfabetico

  // Federal è la prima categoria sopra gli stati
  shelves.unshift({ key: "Federal", label: "FEDERAL", count: countOf("Federal") });
}

function draw() {
  background(green2);
  textSize(labelSize);
  noStroke();
  textAlign(LEFT, BOTTOM);

  hoveredId = null; //azzera l'hover

  drawIntestazione();
  drawLibreria();
  drawTimeline(); 

  cursor(hoveredId !== null ? HAND : ARROW); //compare la mano quando puoi cliccare
}

//serve a ridimensionare il canvas quando si ridimensiona la finestra del browser
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawIntestazione() {
  let activeSort = "MOTIVAZIONE"; //pulsante attivo

  let headerHeight = 100;
  let midY = margin+10;

  push();
  // ---BARRA SUPERIORE---
  noStroke();
  fill(green1);
  rect(0, 0, width, headerHeight);

  fill(255);

  //titolo e sottotitolo
  textAlign(LEFT, BASELINE);
  textStyle(BOLD);
  textSize(22);
  text("FORBIDDEN PAGES", margin, midY + 8);
  let titleW = textWidth("FORBIDDEN PAGES");

  textStyle(NORMAL);
  textSize(12);
  text("USA banned index archive", margin + titleW + 14, midY + 8);

  //barra di ricerca
  let searchX = width * 0.34;
  let searchW = width * 0.33;
  let searchH = 28;
  fill(green2);
  rect(searchX, midY - searchH / 2, searchW, searchH, 8);

  fill(255);
  textStyle(BOLD);
  textSize(12);
  textAlign(LEFT, CENTER);
  text("SEARCH", searchX + 12, midY);

  //lente d'ingrandimento
  noFill();
  stroke(lineColor);
  strokeWeight(1.3);
  let cx = searchX + searchW - 18;
  let cy = midY - 1;
  circle(cx, cy, 9);
  line(cx + 3.5, cy + 3.5, cx + 7, cy + 7);

  //menu a destra
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(13);
  textAlign(LEFT, CENTER);
  let navItems = ["HOME", "TEAM", "METHODOLOGY"];
  let itemx = width - margin;
  for (let i = navItems.length - 1; i >= 0; i--) {
    itemx -= textWidth(navItems[i]);
    text(navItems[i], itemx, midY);
    itemx -= 45;
  }


  // ---BARRA INFERIORE---
  //linee sopra e sotto la barra
  stroke(lineColor);
  strokeWeight(1);
  line(0, headerHeight/2+5, width, headerHeight/2+5);
  line(0, headerHeight, width, headerHeight);

  //descrizione a sinistra
  noStroke();
  fill(255);
  textStyle(NORMAL);
  textSize(10);
  textAlign(LEFT, CENTER);
  text("Ogni glifo visualizzato rappresenta " + GLIFO_VALE +" libri censurati negli USA. Clicca su un singolo scaffale per visualizzare i numeri reali.",
    margin, midY+48);

  //pulsanti a destra
  let buttons = ["MOTIVAZIONE", "CONTESTO", "STATO AMERICANO"];
  let bHeight = 24;
  let padX = 16;
  let bGap = 10;
  let bx = width - margin;
  textSize(11);
  textAlign(CENTER, CENTER);
  sortButtons = []; //i bottoni vengono ricreati a ogni frame per i clic

  for (let i = buttons.length - 1; i >= 0; i--) {
    textStyle(BOLD);
    let w = textWidth(buttons[i]) + 2 * padX;
    bx -= w;
    sortButtons.push({ label: buttons[i], x: bx, y: midY + 48 - bHeight / 2, w: w, h: bHeight });

    let isActive = buttons[i] === activeSort;
    if (isActive) {
      fill(green1);
      stroke(255);
      strokeWeight(1.5);
    } else {
      noFill();
      stroke(120);
      strokeWeight(1);
    }
    rect(bx, midY+48 - bHeight / 2, w, bHeight, 2);

    noStroke();
    fill(255);
    text(buttons[i], bx + w / 2, midY+48);

    bx -= bGap;
  }

  //scritta a sinistra dei pulsanti
  fill(255);
  textStyle(NORMAL);
  textSize(13);
  textAlign(RIGHT, CENTER);
  text("ORGANIZZA SCAFFALI PER :", bx - 4, midY+48);

  pop();
}

function drawLibreria() {

  let n = Object.keys(reasoncategories).length; //numero categorie

  //area di tutta libreria
  let libTop = headerHeight + margin;
  let libBottom = height - margin;
  let libHeight = libBottom - libTop;

  //ogni scaffale = spazio vuoto sopra + libri + tavola
  let shelfStep = libHeight/n;
  let spazioVuoto = shelfStep * 0.25; //spazio vuoto sopra i libri
  let bookHeight = shelfStep - shelfHeight - spazioVuoto;

  let shelfX = margin + shelfHeight; //dove iniziano gli scaffali
  let shelfRight = width - margin - timeline;  //bordo destro della libreria

  push();

  //bordi della libreria
  stroke(lineColor);
  fill(green1);
  rect(margin, libTop, shelfHeight, libHeight);
  rect(shelfRight - shelfHeight, libTop, shelfHeight, libHeight);
  rect(margin + shelfHeight, libTop, shelfRight - shelfHeight - shelfX, shelfHeight);

  for (let i = 0; i < n; i++) {
    let key = Object.keys(reasoncategories)[i];
    let rowTop = libTop + i * shelfStep;
    let shelfY = rowTop + shelfStep - shelfHeight; //la tavola sta in fondo alla riga
    let bookY = shelfY - bookHeight; //i libri poggiano sulla tavola

    let hover =
      mouseX > shelfX && mouseX < shelfRight &&
      mouseY > rowTop && mouseY < rowTop + shelfStep;

    if (hover) {
      let topOffset = (i === 0) ? shelfHeight : 0; //nel primo scaffale non parte da rowTop ma aggiunge shelfHeight
      noStroke();
      fill(greenHover);
      rect(shelfX, rowTop + topOffset, shelfRight - shelfX - shelfHeight, shelfStep - topOffset);
      hoveredId = key;
    }

    //tavola
    stroke(lineColor);
    fill(green1);
    rect(shelfX, shelfY, shelfRight - shelfHeight - shelfX, shelfHeight);

    // nome della motivazione
    noStroke();
    fill(255);
    textStyle(BOLD);
    textSize(15);
    textAlign(RIGHT, BASELINE);
    text(reasoncategories[key], shelfRight - shelfHeight - 10, shelfY);

    // libri
    fill(255);
    for (let g = 0; g < ceil((counts[key] || 0) / GLIFO_VALE); g++) {
      rect(shelfX + g * (bookWidth + bookGap), bookY, bookWidth, bookHeight); //Quanti libri disegnare. Un glifo vale 50 quindi conta il numero di libri diviso 50 e arrotondato per eccesso. Se ci sono 0 libri, ceil(0) = 0 quindi non disegna nulla. Se ci sono 1-50 libri, ceil(1/50) = 1 quindi disegna un libro
    }
  }
  pop();
}

// Legge da style.css  
function loadStyle() {
  let css = getComputedStyle(document.documentElement);
  let text = (name) => css.getPropertyValue(name).trim();
  let number = (name) => parseFloat(text(name));

  green1 = text('--green1');
  green2 = text('--green2');
  greenHover = text('--greenHover');
  lineColor = text('--lineColor');

  fontFamily = text('--font');
  labelSize = number('--testo-dimensione');

  margin = number('--margine');
  labelWidth = number('--etichetta-larghezza');
  bookWidth = number('--libro-larghezza');
  bookGap = number('--libro-spazio');
  shelfHeight = number('--tavola-spessore');
}

function mousePressed() {

  if (sopraTimeline()) {
    updateTimeline();
    return;
  }

  if (hoveredId === null) return; // se si clicca fuori dagli scaffali non succede nulla

  //nuovo URL
  let newURL = `scaffale.html?reason=${encodeURIComponent(hoveredId)}`;

  console.log(newURL);

  window.location.href = newURL;
}

function mouseWheel(event) {
  scrollTimeline(event.delta);
  return false; //la pagina non scorre
}