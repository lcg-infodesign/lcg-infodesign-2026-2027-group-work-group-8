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

let counts = {}; // Quanti libri ha ogni motivazione

// elementi stile messi in style.css che veongono poi letti da loadStyle
let margin, labelWidth, bookWidth, bookGap, shelfHeight, labelSize;
let backgroundColor, textColor, bookColor, shelfColor, fontFamily;

//dichiarazione
let headerHeight = 100;
let timeline = 200;

let hoveredId = null;
let selectedLibreria;
let selectedName;

async function setup() {
  loadStyle();
  //font
  await document.fonts.load("12px 'Roboto Mono'");
  await document.fonts.load("700 30px 'Roboto Mono'"); //grassetto

  let data = await loadTable("assets/banned_index.csv", ",", "header");

  // book_id -> insieme di tutte le motivazioni di quel libro (su tutte le sue righe)
  let bookReasonsById = new Map();

  for (let row = 0; row < data.getRowCount(); row++) {
    // solo US
    if (data.getString(row, "country").trim() !== "US") continue;

    // solo dal 2000 al 2026
    let year = parseInt((data.getString(row, "date_reported") || "").substring(0, 4)); //.substring prende i primi quattro caratteri (anno) e parsInt lo trasforma in numero
    if (isNaN(year) || year < 2000 || year > 2026) continue; //se non è un numero o è fuori dal range, salta la riga

    // motivazioni non vuote
    let reasons = (data.getString(row, "reason_categories") || "") //spezza il testo ogni volta che trova un ; o un a capo (\r, \n). Il + tartta più separatori consecutivi come uno solo. Si ottiene una lista: ["sexual_content", "lgbtq_themes"]
      .split(/[;\r\n]+/)
      .map((r) => r.trim()) //toglie gli spazi all'inizio e alla fine di ogni elemento
      .filter((r) => r !== ""); //scarta gli elementi vuoti
    if (reasons.length === 0) continue; //se dopo la pulizia non resta nessuna motivazione, la riga ha la categoria vuota e viene saltata

    // aggiungo le motivazioni di questa riga a quelle già note per il libro
    let id = data.getString(row, "book_id");
    if (!bookReasonsById.has(id)) bookReasonsById.set(id, new Set()); //set è un insieme che non può avere duplicati. Se il libro non c'è ancora, lo creo
    for (let r of reasons) bookReasonsById.get(id).add(r); //prende il Set di quel libro e ci aggiunge tutte le motivazioni della riga. Se la motivazione c'era già, il Set la ignora.
  }

  // Un libro conta una volta per ogni sua motivazione.
  // "unspecified" conta solo se è l'unica motivazione del libro.
  for (let bookReasons of bookReasonsById.values()) { //values() restituisce i Set di motivazioni, uno per libro. bookReasons è il Set del libro corrente
    if (bookReasons.size > 1) bookReasons.delete("unspecified");
    for (let reason of bookReasons) {
      counts[reason] = (counts[reason] || 0) + 1; //contatore che aumenta per ogni motivazone del libro. Se counts[reason] non esiste ancora, lo inizializza a 0 e poi aggiunge 1
    }
  }

  createCanvas(windowWidth, windowHeight);
  textFont(fontFamily);

  //categoria passata nell'URL
  selectedLibreria = new URLSearchParams(window.location.search).get("reason");
  //nome da mostrare
  selectedName = reasoncategories[selectedLibreria];
}

function draw() {
  background(green2);
  textSize(labelSize);
  noStroke();
  textAlign(LEFT, BOTTOM);

  drawIntestazione();
}

//serve a ridimensionare il canvas quando si ridimensiona la finestra del browser
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawIntestazione() {
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

  //categoria e descrizione
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(14);
  textAlign(LEFT, CENTER);
  text(selectedName, margin, midY+48);
  let reasonW = textWidth(selectedName);

  textStyle(NORMAL);
  textSize(10);
  text("Ogni glifo visualizzato rappresenta un singolo libro censurato negli USA. Clicca su un libro per visualizzare i dettagli.",
    margin + reasonW + 14, midY+48);

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