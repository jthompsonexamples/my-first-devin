# Devin Counter

A locally hosted, web-based countdown timer written in Python (Flask).

- Set hours / minutes / seconds on a seven-segment digital clock interface
- Watch the countdown on an animated analog stopwatch: seconds and minute hands on the main dial,
  an hours sub-dial, and a ring showing total time remaining. Hands start at the set time and sweep back to zero.
- Mute button for the alarm chime (remembered between visits)
- "TIME'S UP!!" appears centered in large red letters when the countdown ends

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000

Set `HOST` / `PORT` environment variables to change the bind address.

## Controls

| Action | Mouse | Keyboard |
| --- | --- | --- |
| Select a field (HH / MM / SS) | click the digits | Left / Right arrows |
| Adjust value | chevrons or scroll wheel | Up / Down arrows |
| Type a value | — | digits 0-9 |
| Start / Pause / Resume | START button | Space or Enter |
| Reset | RESET button | Esc or R |
| Mute / unmute alarm | SOUND ON / MUTED button | M |
| Full screen watch (hides duration panel) | FULL SCREEN button | F (Esc exits) |
