# -*- coding: utf-8 -*-
"""Test akcentu: czy nagranie słowa jest bliżej wymowy brytyjskiej czy amerykańskiej.

Rozpoznawanie głosek: wav2vec2-lv-60-espeak-cv-ft (z projektu OET, lokalnie, GPU).
Wzorce: eSpeak-ng en-gb i en-us (phonemizer). Liczą się tylko słowa, w których
wzorce się różnią (r po samogłosce, BATH, LOT, GOAT, „t” w środku itp.).

Wejście: lista JSON [{"id", "path", "text"}]. Wyjście: JSON z odległościami.
Uruchamiać:  D:\\OET\\OET-fonemy\\.venv\\Scripts\\python.exe -B akcent.py wej.json wyj.json
"""
import json, os, sys, unicodedata

os.environ.setdefault("HF_HOME", r"D:\OET\OET-fonemy\hf-cache")
os.environ["HF_HUB_OFFLINE"] = "1"
import numpy as np
import av
import torch
import espeakng_loader
from phonemizer.backend.espeak.wrapper import EspeakWrapper
from phonemizer import phonemize
from transformers import Wav2Vec2ForCTC, Wav2Vec2FeatureExtractor, Wav2Vec2PhonemeCTCTokenizer

EspeakWrapper.set_library(espeakng_loader.get_library_path())
os.environ["ESPEAK_DATA_PATH"] = espeakng_loader.get_data_path()

SR = 16000
NAME = "facebook/wav2vec2-lv-60-espeak-cv-ft"


def decode(path):
    out = []
    with av.open(path) as c:
        rs = av.AudioResampler(format="flt", layout="mono", rate=SR)
        for fr in c.decode(c.streams.audio[0]):
            for r in rs.resample(fr):
                out.append(r.to_ndarray().reshape(-1))
        for r in rs.resample(None):
            out.append(r.to_ndarray().reshape(-1))
    return np.concatenate(out).astype(np.float32)


def strip_marks(s):
    s = s.replace("ˈ", "").replace("ˌ", "").replace("-", " ")
    return unicodedata.normalize("NFC", s)


items = json.load(open(sys.argv[1], encoding="utf-8"))
texts = sorted({it["text"] for it in items})
gb = phonemize(texts, language="en-gb", backend="espeak", strip=True, with_stress=False, njobs=1)
us = phonemize(texts, language="en-us", backend="espeak", strip=True, with_stress=False, njobs=1)
ref = {t: (strip_marks(g), strip_marks(u)) for t, g, u in zip(texts, gb, us)}

dev = "cuda" if torch.cuda.is_available() else "cpu"
fe = Wav2Vec2FeatureExtractor.from_pretrained(NAME)
tok = Wav2Vec2PhonemeCTCTokenizer.from_pretrained(NAME, do_phonemize=False)
model = Wav2Vec2ForCTC.from_pretrained(NAME).to(dev).eval()
vocab = sorted([v for v in tok.get_vocab().keys() if not v.startswith("<") and v not in ("|", " ")], key=len, reverse=True)


def tokens(ipa):
    """Wzorzec eSpeak → głoski ze słownika modelu (najdłuższe dopasowanie)."""
    out = []
    for word in ipa.split():
        i = 0
        while i < len(word):
            for v in vocab:
                if word.startswith(v, i):
                    out.append(v)
                    i += len(v)
                    break
            else:
                i += 1  # znak spoza słownika (np. ː osobno) — pomijamy
    return out


def dist(a, b):
    d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        d[i][0] = i
    for j in range(len(b) + 1):
        d[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (0 if a[i - 1] == b[j - 1] else 1))
    return d[len(a)][len(b)]


out = []
for it in items:
    g, u = ref[it["text"]]
    tg, tu = tokens(g), tokens(u)
    row = {"id": it["id"], "text": it["text"], "gb": " ".join(tg), "us": " ".join(tu)}
    if tg == tu:
        row["neutral"] = True
        out.append(row)
        continue
    try:
        x = decode(it["path"])
    except Exception as ex:  # noqa
        row["err"] = str(ex)
        out.append(row)
        continue
    inp = fe(x, sampling_rate=SR, return_tensors="pt")
    with torch.no_grad():
        logits = model(inp.input_values.to(dev)).logits
    heard = tok.decode(torch.argmax(logits, dim=-1)[0].cpu().tolist()).split()
    row.update({"heard": " ".join(heard), "dGB": dist(heard, tg), "dUS": dist(heard, tu)})
    # Konkretny znacznik: „r” po samogłosce (brytyjski go nie wymawia).
    row["rGB"] = tg.count("ɹ")
    row["rHeard"] = heard.count("ɹ") + heard.count("ɚ") + heard.count("ɝ")
    out.append(row)

json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=0)
scored = [r for r in out if "dGB" in r]
print(f"słów: {len(out)}, różniących się GB/US: {len(scored)}, urządzenie: {dev}")
