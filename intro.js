// Tempo attesa tra una lettera e l'altra (millisecondi)
let introVelocita = 80;
let introPagine = document.querySelectorAll(".intro-page"); // tutte le pagine, nell'ordine dell'HTML
let introCorrente = 0;     // numero della pagina visibile (0 = titolo)
let introPronto = false;   // diventa true quando titolo e sottotitolo hanno finito di scriversi


// Ferma la sequenza per un certo numero di millisecondi
function introAspetta(ms) {
  return new Promise(function (resolve) { //promise= qualcosa che si completa dopo un po
    setTimeout(resolve, ms);
  });
}

// Scrive un testo dentro un elemento, una lettera alla volta
async function introScrivi(elemento, testo) {
  elemento.classList.add("scrivendo"); // mostra il cursore lampeggiante
  for (let i = 0; i < testo.length; i++) {
    elemento.textContent += testo[i];  // aggiunge una lettera
    await introAspetta(introVelocita); // aspetta prima della prossima
  }
  elemento.classList.remove("scrivendo"); // finito: toglie il cursore
}

// La sequenza dell'intro: titolo, pausa, sottotitolo
async function introAvvia() {
  let titolo = document.getElementById("intro-titolo");
  let sottotitolo = document.getElementById("intro-sottotitolo");

  // Prende i testi scritti nell'HTML e svuota gli elementi
  let testoTitolo = titolo.textContent.trim();
  let testoSottotitolo = sottotitolo.textContent.trim();
  titolo.textContent = "";
  sottotitolo.textContent = "";

  await introAspetta(800);
  await introScrivi(titolo, testoTitolo); //attende 800 ms e scrive il titolo
  await introAspetta(500);
  await introScrivi(sottotitolo, testoSottotitolo); //attende 500 ms e scrive il sottotitolo
  // 1) legge dall'HTML i testi  2)svuota gli elementi 3)li scrive in sequenza

  introPronto = true; // da ora il clic fa avanzare

}

// Passare alla pagina successiva
function introAvanti() {
  if (!introPronto) {
    return; // sta ancora scrivendo: ignora il clic
  }

  if (introCorrente < introPagine.length - 1) {
    introPagine[introCorrente].classList.add("via"); // nasconde la pagina attuale: sotto c'è la successiva
    introCorrente = introCorrente + 1;
  } else {
    document.getElementById("intro").style.display = "none"; // ultima pagina: chiude l'intro
  }
}

// Un clic in un punto qualsiasi dell'intro fa avanzare
document.getElementById("intro").addEventListener("click", introAvanti);

introAvvia();
