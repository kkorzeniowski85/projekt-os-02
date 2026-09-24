import { BETA_COPIED_KEY } from "./testMode";

/**
 * Skrypt izolacji localStorage — tekst wstawiany do <head> (app/layout.tsx).
 * Celowo stary JavaScript bez składni wymagającej transpilacji: działa przed
 * całym kodem aplikacji, więc nie może polegać na niczym z bundla.
 *
 * Widok aplikacji na localStorage: klucze aplikacji (phonics.*, school.*)
 * czytane i pisane pod „beta.*", pozostałe klucze domeny bez zmian (tylko do
 * odczytu przez key()/length — aplikacja ich nie używa), a clear() czyści
 * wyłącznie kopie beta. Zdarzenia storage z innych kart: zmiany kluczy beta
 * docierają pod nazwą bez „beta.", zmiany prawdziwych kluczy (prawdziwa Liga
 * w innej karcie) są dla wersji testowej niewidoczne.
 */
export const BETA_STORAGE_SCRIPT = `(function () {
  "use strict";
  if (window.__ligaBetaStorage) return;
  window.__ligaBetaStorage = true;
  var ls;
  try { ls = window.localStorage; } catch (e) { ls = null; }
  var P = "beta.";
  function isApp(k) { return typeof k === "string" && (k.indexOf("phonics.") === 0 || k.indexOf("school.") === 0); }
  function isSync(k) { return k.indexOf("phonics.sync.") === 0 || k.indexOf("school.sync.") === 0; }

  function blocked(u) { try { return /textdb\\.dev/i.test(String(u)); } catch (e) { return false; } }
  var why = "Wersja testowa: synchronizacja jest wyłączona";
  if (window.fetch) {
    var realFetch = window.fetch;
    window.fetch = function (input, init) {
      var u = input && typeof input === "object" && "url" in input ? input.url : input;
      if (blocked(u)) return Promise.reject(new TypeError(why));
      return realFetch.apply(window, arguments);
    };
  }
  if (window.XMLHttpRequest) {
    var realOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, u) {
      if (blocked(u)) throw new TypeError(why);
      return realOpen.apply(this, arguments);
    };
  }
  if (navigator.sendBeacon) {
    var realBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function (u) {
      if (blocked(u)) return false;
      return realBeacon.apply(navigator, arguments);
    };
  }

  if (!ls || typeof Storage === "undefined") return;
  var proto = Storage.prototype;
  var getItem = proto.getItem, setItem = proto.setItem, removeItem = proto.removeItem;
  var key = proto.key, clear = proto.clear;
  var lengthDesc = Object.getOwnPropertyDescriptor(proto, "length");
  function realKeys() {
    var out = [], n = lengthDesc.get.call(ls);
    for (var i = 0; i < n; i++) { var k = key.call(ls, i); if (k !== null) out.push(k); }
    return out;
  }

  try {
    if (getItem.call(ls, "${BETA_COPIED_KEY}") === null) {
      var all = realKeys(), ok = true;
      for (var i = 0; i < all.length; i++) {
        var k = all[i];
        if (!isApp(k) || isSync(k) || getItem.call(ls, P + k) !== null) continue;
        try { setItem.call(ls, P + k, getItem.call(ls, k)); } catch (e) { ok = false; }
      }
      if (ok) setItem.call(ls, "${BETA_COPIED_KEY}", String(Date.now()));
    }
  } catch (e) {}

  function virtualKeys() {
    var all = realKeys(), out = [];
    for (var i = 0; i < all.length; i++) {
      var k = all[i];
      if (k.indexOf(P) === 0) { if (isApp(k.slice(P.length))) out.push(k.slice(P.length)); }
      else if (!isApp(k)) out.push(k);
    }
    return out;
  }
  function map(k) { k = String(k); return isApp(k) ? P + k : k; }

  proto.getItem = function (k) { return getItem.call(this, this === ls ? map(k) : k); };
  proto.setItem = function (k, v) { return setItem.call(this, this === ls ? map(k) : k, v); };
  proto.removeItem = function (k) { return removeItem.call(this, this === ls ? map(k) : k); };
  proto.key = function (i) {
    if (this !== ls) return key.call(this, i);
    var ks = virtualKeys();
    return i >= 0 && i < ks.length ? ks[i] : null;
  };
  proto.clear = function () {
    if (this !== ls) return clear.call(this);
    var all = realKeys();
    for (var i = 0; i < all.length; i++) {
      if (all[i].indexOf(P) === 0 && isApp(all[i].slice(P.length))) removeItem.call(ls, all[i]);
    }
  };
  Object.defineProperty(proto, "length", {
    configurable: true,
    enumerable: lengthDesc.enumerable,
    get: function () { return this === ls ? virtualKeys().length : lengthDesc.get.call(this); }
  });

  var dispatching = false;
  window.addEventListener("storage", function (e) {
    if (dispatching || e.storageArea !== ls || e.key === null) return;
    var k = e.key;
    if (isApp(k)) { e.stopImmediatePropagation(); return; }
    if (k.indexOf(P) !== 0 || !isApp(k.slice(P.length))) return;
    e.stopImmediatePropagation();
    var copy;
    try {
      copy = new StorageEvent("storage", { key: k.slice(P.length), oldValue: e.oldValue, newValue: e.newValue, url: e.url, storageArea: ls });
    } catch (err) { return; }
    dispatching = true;
    try { window.dispatchEvent(copy); } finally { dispatching = false; }
  }, true);
})();`;
