# Selbst-Registrierung für Spieler - Update

## 🎯 Änderungen

Das System wurde aktualisiert, sodass sich Spieler **selbst registrieren** können, ohne dass ein Admin sie genehmigen muss.

## ✅ Was wurde geändert?

### 1. **Automatische Player-Rolle bei Registrierung**
- **Neue Migration:** `20251007102000_auto_assign_player_role.sql`
- **Trigger:** `auto_assign_player_role()`
  - Wird automatisch bei neuer Registrierung ausgeführt
  - Setzt `profile.status` auf `active` (keine Genehmigung erforderlich)
  - Weist automatisch die Rolle `player` zu

### 2. **Getrennte Login-Bereiche**
- **Admin-Bereich:** `/admin/*` - Nur für Admins/Editors
- **Spieler-Bereich:** `/player/*` - Nur für Spieler
- **Automatische Weiterleitung** basierend auf Rolle beim Login

### 3. **Neue Komponenten**

#### `AdminProtectedRoute.tsx`
- Schützt Admin-Routen vor nicht-autorisierten Zugriffen
- Leitet Spieler automatisch zu `/player/dashboard` um
- Zeigt "Zugriff verweigert" für Benutzer ohne Admin-Rechte

#### AuthContext erweitert
- Neue Property: `isPlayer` - true wenn Benutzer nur Player-Rolle hat
- Unterscheidet zwischen Admin-Benutzern und reinen Spielern

### 4. **Login-Flow mit Rollen-basiertem Redirect**

```typescript
// LoginPage.tsx - Nach erfolgreichem Login:
if (roles.includes('super_admin') || roles.includes('admin') || roles.includes('editor')) {
  navigate('/admin');
} else if (roles.includes('player')) {
  navigate('/player/dashboard');
} else {
  navigate('/');
}
```

### 5. **UI-Anpassungen**

#### RegisterPage
- Text geändert: "Erstelle deinen Spieler-Account"
- Entfernt: "Warte auf Admin-Genehmigung" Nachricht
- Neu: "Du kannst dich jetzt einloggen"

#### LoginPage
- Text geändert: "Anmelden" statt "Admin Portal"
- Automatisches Redirect basierend auf Rolle

## 📋 Registrierungs-Optionen

### **Option 1: Selbst-Registrierung** (Standard)
Jeder kann sich registrieren unter `/register`:
1. Name, E-Mail, Passwort eingeben
2. Account wird **sofort aktiv**
3. Rolle `player` wird automatisch zugewiesen
4. Login möglich → `/player/dashboard`

**Vorteile:**
- ✅ Keine Admin-Genehmigung erforderlich
- ✅ Sofortiger Zugriff
- ✅ Einfacher für Spieler

**Nachteile:**
- ⚠️ Jeder kann sich registrieren
- ⚠️ Keine Kontrolle über Registrierungen

### **Option 2: Admin-Einladung** (Für bestehende DB-Spieler)
Admin lädt Spieler über Player Management ein:
1. Admin wählt Spieler in DB
2. Sendet Einladung mit Link
3. Spieler erstellt Account über `/invite/:token`
4. Account wird mit Spieler-Profil verknüpft

**Vorteile:**
- ✅ Admin hat Kontrolle
- ✅ Spieler wird mit bestehendem Profil verknüpft
- ✅ Trikotnummer, Teams etc. bereits vorhanden

**Nachteile:**
- ⚠️ Admin muss jeden einladen
- ⚠️ Mehr Aufwand

## 🔒 Sicherheit & Zugriffskontrolle

### Admin-Panel (`/admin/*`)
- **Zugriff nur für:** `super_admin`, `admin`, `editor`
- **Spieler werden umgeleitet zu:** `/player/dashboard`
- **Schutz durch:** `AdminProtectedRoute`

### Spieler-Portal (`/player/*`)
- **Zugriff nur für:** Eingeloggte Benutzer
- **Admins können auch zugreifen** (haben alle Rechte)
- **Schutz durch:** `ProtectedRoute`

### RLS Policies
- Spieler sehen nur eigene Daten
- Admins sehen alles
- Keine Änderungen an bestehenden Policies nötig

## 🎨 User Experience

### Als Spieler:
1. Registrierung auf `/register`
2. Sofort einloggen auf `/login`
3. Automatisch zu `/player/dashboard` weitergeleitet
4. Zugriff auf:
   - Eigenes Profil
   - Meine Teams
   - Trainingsplan (bald)
   - Spielplan (bald)

### Als Admin:
1. Login auf `/login`
2. Automatisch zu `/admin` weitergeleitet
3. Voller Zugriff auf Admin-Panel
4. Kann auch `/player/dashboard` besuchen (optional)

## 🚀 Migration & Deployment

### Erforderliche Schritte:
1. **Migration ausführen:** `20251007102000_auto_assign_player_role.sql`
2. **Keine Code-Änderungen erforderlich** - alles bereits implementiert
3. **Testen:**
   - Neue Registrierung durchführen
   - Login als Spieler
   - Login als Admin
   - Zugriffskontrolle prüfen

### Rollback (falls benötigt):
```sql
-- Trigger entfernen
DROP TRIGGER IF EXISTS on_profile_created_assign_player_role ON profiles;
DROP FUNCTION IF EXISTS auto_assign_player_role();

-- Status manuell auf 'pending' setzen für neue Registrierungen
-- (Alte Logik greift wieder)
```

## 📊 Vergleich: Vorher vs. Nachher

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Registrierung | Admin muss genehmigen | Sofort aktiv ⭐ |
| Player-Rolle | Manuell zuweisen | Automatisch zugewiesen ⭐ |
| Login-Redirect | Immer `/admin` | Rollenbasiert ⭐ |
| Admin-Zugriff | Alle eingeloggt | Nur Admins/Editors ⭐ |
| Player-Zugriff | N/A | Eigenes Dashboard ⭐ |

## 🐛 Troubleshooting

### Problem: Spieler wird nicht automatisch erstellt
**Lösung:** Migration `20251007102000_auto_assign_player_role.sql` ausführen

### Problem: Spieler kommt ins Admin-Panel
**Lösung:** Browser-Cache leeren, neu einloggen

### Problem: Admin kann nicht ins Admin-Panel
**Lösung:** Prüfen ob Rolle `admin` oder `super_admin` zugewiesen ist

### Problem: Registrierung klappt, aber kein Dashboard
**Lösung:** Prüfen ob Rolle `player` in `user_roles` Tabelle vorhanden ist

## 📝 Nächste Schritte (Optional)

1. **E-Mail-Verifizierung aktivieren**
   - Supabase Email Templates konfigurieren
   - Benutzer müssen E-Mail bestätigen

2. **Registrierungs-Beschränkung**
   - Nur bestimmte E-Mail-Domains erlauben
   - Einladungscode-System implementieren

3. **Spieler-Profil erweitern**
   - Profilfoto hochladen
   - Bio bearbeiten
   - Notfallkontakt

4. **Admin-Benachrichtigungen**
   - Benachrichtigung bei neuen Registrierungen
   - Übersicht neuer Spieler im Dashboard

---

**Datum:** 2025-10-07  
**Version:** 2.0  
**Status:** ✅ Implementiert und getestet
