# Swiss Unihockey Sync Script

Dieses Script synchronisiert automatisch Teams und Spieler von der Swiss Unihockey API mit der lokalen Datenbank.

## 🎯 Funktionen

- **Teams synchronisieren**: Holt alle Teams von Swiss Unihockey und aktualisiert die Datenbank
- **Spieler synchronisieren**: Holt Spieler für jedes Team und synchronisiert diese
- **Intelligente Updates**: Aktualisiert nur existierende Einträge mit `swiss_id`
- **Automatisches Löschen**: Entfernt Teams/Spieler die nicht mehr in der API existieren
- **Schutz vor Datenverlust**: Nur Einträge mit `swiss_id` werden modifiziert

## ⚙️ Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Environment Variables setzen

Erstelle eine `.env` Datei mit folgenden Variablen:

```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

**Wichtig:** Du brauchst den **Service Role Key** (nicht den anon key), da das Script direkt auf die Datenbank zugreift ohne RLS.

## 🚀 Ausführung

### Sync ausführen

```bash
npm run sync
```

### Was passiert beim Sync?

1. **Teams synchronisieren**
   - Holt alle Teams für Club ID 805
   - Erstellt neue Teams mit `swiss_id`
   - Aktualisiert existierende Teams (Name, Banner, etc.)
   - Löscht Teams die nicht mehr existieren

2. **Spieler synchronisieren**
   - Für jedes Team werden die Spieler geholt
   - Erstellt neue Spieler mit `swiss_id`
   - Aktualisiert existierende Spieler
   - Verwaltet `team_players` Zuordnungen mit:
     - Trikotnummer
     - Position
     - Foto (pro Team!)
   - Entfernt Spieler die nicht mehr im Team sind

## 📋 Datenbank-Voraussetzungen

Das Script erwartet folgende Struktur:

### Teams Tabelle
```sql
- id (uuid)
- swiss_id (integer, nullable)
- name (text)
- slug (text)
- banner_url (text, nullable)
- is_active (boolean)
```

### Players Tabelle
```sql
- id (uuid)
- swiss_id (integer, nullable)
- first_name (text)
- last_name (text)
- birth_date (date, nullable)
- is_active (boolean)
```

### Team_Players Tabelle
```sql
- player_id (uuid, FK zu players)
- team_id (uuid, FK zu teams)
- jersey_number (integer, nullable)
- position (text, nullable) -- 'goalkeeper', 'defender', 'forward'
- photo_url (text, nullable)
```

## ⚠️ Wichtige Hinweise

### Sicherheit

- **Manuell erstellte Daten bleiben unberührt**: Das Script modifiziert nur Einträge mit `swiss_id`
- **Keine versehentlichen Löschungen**: Nur Teams/Spieler mit `swiss_id` können gelöscht werden
- **Service Key schützen**: Der Service Key hat volle Rechte - niemals committen!

### Best Practices

1. **Teste zuerst lokal**: Führe das Script zuerst gegen eine Test-Datenbank aus
2. **Backup vor Sync**: Mache ein Backup vor dem ersten produktiven Sync
3. **Regelmäßige Ausführung**: Richte einen Cron-Job oder GitHub Action ein für automatische Syncs
4. **Logs beachten**: Das Script gibt detaillierte Logs aus - prüfe diese nach jedem Sync

### Foto-URLs

- Das Script speichert Spieler-Fotos **pro Team** in `team_players.photo_url`
- Default-Avatars werden als `null` gespeichert (erkannt an "defaultplayeravatar" in der URL)
- Jeder Spieler kann pro Team ein unterschiedliches Foto haben

## 🔧 Anpassungen

### Club ID ändern

In `sync-swiss-unihockey.ts`:

```typescript
const CLUB_ID = 805; // Ändere diese Zahl
```

### Position Mapping anpassen

Standardmäßig werden nur 'goalkeeper', 'defender', 'forward' unterstützt.
Falls andere Positionen benötigt werden, passe die Position-Mapping-Logik an:

```typescript
const position = apiPlayer.Position?.toLowerCase() === 'goalkeeper' ? 'goalkeeper' 
                : apiPlayer.Position?.toLowerCase() === 'defender' ? 'defender'
                : apiPlayer.Position?.toLowerCase() === 'forward' ? 'forward'
                : null;
```

## 📊 Beispiel-Output

```
🚀 Starte Swiss Unihockey Synchronisation...

📍 Club ID: 805

📥 Hole Teams von Swiss Unihockey API...
✅ 12 Teams gefunden

➕ Team erstellt: U14 II
🔄 Team aktualisiert: Herren GF
🗑️  Team gelöscht: White Wings

📊 Teams: 1 erstellt, 10 aktualisiert, 1 gelöscht

🔄 Synchronisiere Spieler...

📥 Hole Spieler für Team 561...
✅ 30 Spieler gefunden

➕ Spieler erstellt: Vanessa Arnold
🔄 Spieler aktualisiert: Jasmine Gerber
🗑️  Team-Zuordnung entfernt für Spieler-ID: abc123

📊 Spieler: 5 erstellt, 23 aktualisiert, 2 entfernt

✅ Synchronisation erfolgreich abgeschlossen!
```

## 🐛 Troubleshooting

### Fehler: "SUPABASE_SERVICE_KEY is not defined"

→ Stelle sicher, dass die `.env` Datei korrekt ist und `SUPABASE_SERVICE_KEY` gesetzt ist.

### Fehler: "Cannot find module '@supabase/supabase-js'"

→ Führe `npm install` aus.

### Keine Updates trotz Änderungen in der API

→ Prüfe, ob die Einträge eine `swiss_id` haben. Nur diese werden synchronisiert.

### Spieler werden nicht gelöscht

→ Das ist gewollt! Das Script entfernt nur die `team_players` Zuordnung.
   Der Spieler selbst wird nur gelöscht, wenn er in keinem Team mehr ist.

## 📝 Lizenz

Dieses Script ist Teil des WWSB Projekts.
