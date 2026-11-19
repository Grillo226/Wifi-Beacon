const itemVerde = document.getElementById("luz-verde");
const itemAmarillo = document.getElementById("luz-amarilla");
const itemRojo = document.getElementById("luz-roja");

const estadoVerde = itemVerde.querySelector(".estado");
const estadoAmarillo = itemAmarillo.querySelector(".estado");
const estadoRojo = itemRojo.querySelector(".estado");

const lcd1 = document.getElementById("lcd-1");
const lcd2 = document.getElementById("lcd-2");

const promedioTexto = document.getElementById("promedio");

const botonesModo = document.querySelectorAll(".botones button");

const topeVerde = 50;
const topeAmarillo = 150;
const maxHistorial = 5;

let modo = "real";
let historial = [];

function limpiarLuces() {
  estadoVerde.textContent = "APAGADO";
  estadoAmarillo.textContent = "APAGADO";
  estadoRojo.textContent = "APAGADO";

  itemVerde.classList.remove("encendido");
  itemAmarillo.classList.remove("encendido");
  itemRojo.classList.remove("encendido");
  itemRojo.classList.remove("titilando");
}

function encender(color, titilar = false) {
  limpiarLuces();
  if (color === "verde") {
    estadoVerde.textContent = "ENCENDIDO";
    itemVerde.classList.add("encendido");
  } else if (color === "amarillo") {
    estadoAmarillo.textContent = "ENCENDIDO";
    itemAmarillo.classList.add("encendido");
  } else if (color === "rojo") {
    estadoRojo.textContent = "ENCENDIDO";
    itemRojo.classList.add("encendido");
    if (titilar) {
      itemRojo.classList.add("titilando");
    }
  }
}

async function hacerPrueba(url) {
  const inicio = performance.now();
  const controlador = new AbortController();
  const idTiempo = setTimeout(() => controlador.abort(), 3500);
  try {
    await fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(), {
      mode: "no-cors",
      cache: "no-store",
      signal: controlador.signal
    });
    clearTimeout(idTiempo);
    return Math.max(1, Math.round(performance.now() - inicio));
  } catch (e) {
    clearTimeout(idTiempo);
    return null;
  }
}

async function medirLatencia() {
  if (!navigator.onLine) return null;

  const r1 = await hacerPrueba("https://www.google.com/generate_204");
  const r2 = await hacerPrueba("https://1.1.1.1/cdn-cgi/trace");

  if (r1 !== null && r2 !== null) {
    return Math.min(r1, r2);
  }
  if (r1 !== null) return r1;
  if (r2 !== null) return r2;

  return await hacerPrueba("https://www.google.com/generate_204");
}

function calcularPromedioConfiable(valores) {
  if (valores.length === 0) return null;
  if (valores.length >= 4) {
    const ordenados = [...valores].sort((a, b) => a - b);
    ordenados.pop();
    const suma = ordenados.reduce((acc, v) => acc + v, 0);
    return Math.round(suma / ordenados.length);
  }
  const suma = valores.reduce((acc, v) => acc + v, 0);
  return Math.round(suma / valores.length);
}

function simularLatencia() {
  if (modo === "verde") return 25;
  if (modo === "amarillo") return 90;
  if (modo === "rojo") return 220;
  return null;
}

function actualizarPantalla(ms) {
  if (ms === null) {
    promedioTexto.textContent = "-- ms";
    lcd1.textContent = "WiFi Caido!";
    lcd2.textContent = "Sin conexion";
    encender("rojo", true);
    return;
  }

  historial.push(ms);
  if (historial.length > maxHistorial) historial.shift();

  const prom = calcularPromedioConfiable(historial);

  promedioTexto.textContent = prom + " ms";
  lcd1.textContent = "Estado: OK";
  lcd2.textContent = "Ping: " + ms + " ms";

  if (ms < topeVerde) {
    encender("verde");
  } else if (ms <= topeAmarillo) {
    encender("amarillo");
  } else {
    encender("rojo");
  }
}

async function ciclo() {
  const ms = modo === "real" ? await medirLatencia() : simularLatencia();
  actualizarPantalla(ms);
}

function cambiarModo(nuevoModo, botonSeleccionado) {
  modo = nuevoModo;
  historial = [];
  promedioTexto.textContent = "-- ms";
  botonesModo.forEach((btn) => btn.classList.remove("activo"));
  botonSeleccionado.classList.add("activo");
  ciclo();
}

document.getElementById("btn-real").onclick = function () {
  cambiarModo("real", this);
};

document.getElementById("btn-verde").onclick = function () {
  cambiarModo("verde", this);
};

document.getElementById("btn-amarillo").onclick = function () {
  cambiarModo("amarillo", this);
};

document.getElementById("btn-rojo").onclick = function () {
  cambiarModo("rojo", this);
};

document.getElementById("btn-sin-red").onclick = function () {
  cambiarModo("offline", this);
};

ciclo();
setInterval(ciclo, 1500);