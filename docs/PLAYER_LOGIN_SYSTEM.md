# Spieler-Login-System - Dokumentation

## 📋 Übersicht

Das Spieler-Login-System ermöglicht es Spielern, sich einzuloggen und auf ihr persönliches Portal zuzugreifen. Admins können Spieler einladen, einen Account zu erstellen.

## 🏗️ Architektur

### Datenbank-Tabellen

#### `players` (erweitert)
- `user_id` (uuid, nullable): Verknüpfung zum User Account
- `swiss_id` (integer, nullable): Swiss Unihockey API ID

#### `player_invitations`
- `id` (uuid): Primärschlüssel
- `player_id` (uuid): Referenz zum Spieler
- `email` (text): E-Mail-Adresse für die Einladung
- `token` (text, unique): Einladungstoken (32 Byte hex)
- `invited_by` (uuid): Admin der die Einladung verschickt hat
- `status` (text): 'pending', 'accepted', 'expired', 'cancelled'
- `expires_at` (timestamptz): Ablaufdatum (7 Tage)
- `accepted_at` (timestamptz, nullable): Zeitpunkt der Annahme

#### `player_profiles`
- `player_id` (uuid): Primärschlüssel, Referenz zum Spieler
- `preferred_language` (text): Bevorzugte Sprache
- `notifications_enabled` (boolean): Benachrichtigungen aktiviert
- `phone` (text): Telefonnummer
- `emergency_contact_name` (text): Notfallkontakt Name
- `emergency_contact_phone` (text): Notfallkontakt Telefon
- `allergies` (text): Allergien
- `medical_notes` (text): Medizinische Notizen
- `bio` (text): Spieler-Biografie

#### `attendance` (optional)
- `id` (uuid): Primärschlüssel
- `player_id` (uuid): Spieler-ID
- `team_id` (uuid): Team-ID
- `event_type` (text): 'training', 'match'
- `event_id` (uuid): Referenz zu Training oder Match
- `event_date` (date): Event-Datum
- `status` (text): 'attending', 'absent', 'maybe', 'unknown'
- `reason` (text, nullable): Absagegrund

### Rollen-System

**Neue Rolle:** `player`

**Berechtigungen:**
- ✅ Eigenes Profil lesen/bearbeiten
- ✅ Team-Infos der eigenen Teams lesen
- ✅ Trainings-/Spielpläne ansehen
- ❌ Andere Spieler bearbeiten
- ❌ Admin-Bereich

## 🔄 Spieler-Registrierung Workflows

### **Workflow 1: Selbst-Registrierung (Neu)** ⭐

1. **Spieler besucht** `/register`
2. **Spieler füllt Formular aus:**
   - Vollständiger Name
   - E-Mail-Adresse
   - Passwort
3. **Account wird automatisch erstellt:**
   - User Account in `auth.users`
   - Profil in `profiles` mit Status `active`
   - **Automatisch** Rolle `player` zugewiesen (via Trigger)
   - `player_profiles` Eintrag wird erstellt
4. **Spieler kann sich sofort einloggen** → Redirect zu `/player/dashboard`

### **Workflow 2: Admin-Einladung (für bestehende Spieler)**

1. **Admin wählt Spieler** in der Player Management Seite
2. **Admin klickt auf "Einladen"** Button (📧 Icon)
3. **Admin gibt E-Mail-Adresse ein** im Modal
4. **System erstellt Einladung:**
   - Generiert 32-Byte-Token
   - Setzt Ablaufdatum (7 Tage)
   - Speichert in `player_invitations`
   - (TODO: Sendet E-Mail)
5. **Spieler klickt auf Einladungslink:** `/invite/{token}`
6. **Spieler sieht Pre-Filled Daten:**
   - Name (aus Spielerprofil)
   - E-Mail (aus Einladung)
7. **Spieler setzt Passwort** und bestätigt
8. **Account wird erstellt:**
   - User Account in `auth.users`
   - Verknüpfung zu `players.user_id`
   - Rolle `player` wird zugewiesen
   - `player_profiles` Eintrag wird erstellt
   - Einladung wird als `accepted` markiert

## 📱 UI-Komponenten

### Admin Panel - Player Management

**Neue Spalte: "Account"**
- ✅ Account aktiv (grün, UserCheck Icon)
- ⏳ Einladung ausstehend (orange, Clock Icon)
- ❌ Kein Account (grau, Mail Icon)

**Neue Buttons:**
- 📧 **Einladen** (nur wenn kein Account & keine Einladung)
- 🕐 **Erneut einladen** (wenn Einladung pending)

**Invitation Modal:**
- Spielername wird angezeigt
- E-Mail Eingabefeld
- "Einladung senden" Button

### Public Routes

#### `/invite/:token` - Invitation Page
- Validiert Token
- Zeigt Spielerdaten
- Passwort-Eingabe (min. 8 Zeichen)
- Passwort bestätigen
- Account erstellen

### Player Portal

#### `/player/dashboard` - Player Dashboard
- **Header:**
  - Spielername & Avatar
  - Abmelden Button
- **Quick Stats:**
  - Status (Aktiv/Inaktiv)
  - Anzahl Teams
  - Nächstes Spiel (coming soon)
  - Dokumente (coming soon)
- **Meine Teams:**
  - Team-Liste mit Foto
  - Trikotnummer & Position
  - Kategorie
- **Coming Soon:**
  - Trainingsplan
  - Spielplan

## 🔒 Sicherheit

### RLS Policies

**`player_invitations`:**
- Admins können alles
- Public kann eigene Einladung per Token lesen

**`player_profiles`:**
- Spieler können nur eigenes Profil lesen/bearbeiten
- Admins können alle Profile lesen

**`players`:**
- Spieler können eigenen Player-Record lesen/bearbeiten

**`attendance`:**
- Spieler können nur eigene Anwesenheit verwalten
- Admins können alle Anwesenheiten lesen

### Token-Sicherheit
- 32 Byte kryptographisch sicher (gen_random_bytes)
- Einmalige Verwendung
- 7 Tage Gültigkeit
- Automatische Ablaufkontrolle

## 📂 Dateien

### Migrations
- `20251007100000_add_swiss_id_columns.sql` - Swiss ID Spalten
- `20251007101000_create_player_login_system.sql` - Player Login System

### Types
- `src/types/player.ts` - TypeScript Typen

### Libraries
- `src/lib/playerInvitations.ts` - Invitation Logic
  - `sendPlayerInvitation()`
  - `getInvitationByToken()`
  - `acceptInvitation()`
  - `cancelInvitation()`
  - `resendInvitation()`

### Pages
- `src/pages/admin/PlayersManagement.tsx` - Erweitert mit Einladungsfunktion
- `src/pages/public/InvitationPage.tsx` - Einladungsannahme
- `src/pages/player/PlayerDashboard.tsx` - Player Portal

### Routes
- `/invite/:token` - Einladung annehmen
- `/player/dashboard` - Player Dashboard

## 🚀 Deployment Schritte

### 1. Datenbank-Migrationen ausführen
```bash
# In Supabase Dashboard -> SQL Editor
# Führe alle Migrations aus:
# 1. 20251007100000_add_swiss_id_columns.sql
# 2. 20251007101000_create_player_login_system.sql
# 3. 20251007102000_auto_assign_player_role.sql ⭐ NEU
```

### 2. E-Mail-Service konfigurieren (Optional)
Aktuell werden Einladungen nur in der DB erstellt. Für E-Mail-Versand:

**Option A: Supabase Auth Emails**
- Konfiguriere Supabase Email Templates
- Implementiere Edge Function für Custom Emails

**Option B: External Service (SendGrid, Mailgun, etc.)**
- Füge API Keys hinzu
- Update `sendPlayerInvitation()` in `playerInvitations.ts`

**Workaround (aktuell):**
- Admin kopiert Einladungslink aus Console
- Manuell per E-Mail/WhatsApp versenden

### 3. Testen

**Als Admin:**
1. Login als Admin
2. Gehe zu Players Management
3. Klicke auf 📧 bei einem Spieler ohne Account
4. Gebe E-Mail ein und sende Einladung
5. Kopiere Token aus Console: `/invite/{token}`

**Als Spieler:**
1. Öffne Einladungslink
2. Setze Passwort
3. Klicke "Account erstellen"
4. Wirst zu `/player/dashboard` weitergeleitet
5. Siehe deine Teams und Infos

## 📝 TODO / Next Steps

### Phase 3: Erweiterte Features (Nice-to-have)

1. **E-Mail-Benachrichtigungen**
   - [ ] E-Mail bei Einladung
   - [ ] E-Mail bei neuen Spielansetzungen
   - [ ] E-Mail bei Trainingsabsagen

2. **Player Profile Page**
   - [ ] `/player/profile` - Profil bearbeiten
   - [ ] Profilfoto hochladen
   - [ ] Notfallkontakt verwalten

3. **Training & Matches**
   - [ ] `/player/trainings` - Trainingsplan
   - [ ] `/player/matches` - Spielplan
   - [ ] Anwesenheit melden

4. **Documents & News**
   - [ ] `/player/documents` - Team-Dokumente
   - [ ] `/player/news` - Team-News

5. **Attendance System**
   - [ ] Admin kann Anwesenheit sehen
   - [ ] Statistiken (Teilnahme-Quote)

6. **Mobile App**
   - [ ] React Native / Flutter
   - [ ] Push-Notifications
   - [ ] QR-Code Check-in

## 🐛 Bekannte Einschränkungen

1. **E-Mail-Versand:** Aktuell nur DB-Speicherung, kein automatischer E-Mail-Versand
2. **Password Recovery:** Nutzt Standard Supabase Auth (funktioniert)
3. **Multi-Language:** UI aktuell nur auf Deutsch
4. **API-Spieler:** Swiss Unihockey Spieler können keine Accounts erstellen (by design)

## 📊 Monitoring

**Check-Liste für Admins:**
- Player Management zeigt Account-Status korrekt an
- Einladungen haben Ablaufdatum
- Token sind unique und secure
- Spieler sehen nur ihre Teams
- RLS Policies funktionieren

**Logs überprüfen:**
- Browser Console bei Invitation Send
- Supabase Logs für Auth Events
- Activity Logs (bereits implementiert)

## 🔗 Links

- **Admin Panel:** `/admin/players`
- **Invitation:** `/invite/:token`
- **Player Portal:** `/player/dashboard`
- **Supabase Dashboard:** [Your Supabase URL]
- **Dokumentation:** Dieser Datei

---

**Erstellt:** 2025-10-07  
**Version:** 1.0  
**Status:** ✅ Phase 1 & 2 Implementiert
