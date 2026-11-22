// Tempo attesa tra una lettera e l'altra (millisecondi)
let introVelocita = 80;

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
}
// 1) legge dall'HTML i testi  2)svuota gli elementi 3)li scrive in sequenza
introAvvia();