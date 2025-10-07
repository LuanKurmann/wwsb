# User Account Deletion

## Übersicht

Das System unterstützt das vollständige Löschen von Benutzer-Accounts, einschließlich des Auth-Users in Supabase.

## Workflow

### 1. Benutzer deaktivieren
Bevor ein Account gelöscht werden kann, muss dieser zunächst auf "Inactive" oder "Suspended" gesetzt werden.

```
Admin Dashboard → Users → Benutzer auswählen → "Deactivate" Button
```

### 2. Account löschen
Nach der Deaktivierung erscheint der "Löschen" Button.

```
Admin Dashboard → Users → Inaktiver Benutzer → "Löschen" Button
```

## Was wird gelöscht?

### Bei normalen Benutzern:
1. ✅ User Roles (`user_roles`)
2. ✅ Profile (`profiles`)
3. ✅ Auth User (`auth.users`) - via Edge Function

### Bei Spieler-Accounts:
1. ✅ Player Invitations (`player_invitations`) - Alle Einladungen
2. ✅ Player-User Verknüpfung (`players.user_id` → NULL)
3. ✅ Player Profiles (`player_profiles`)
4. ✅ User Roles (`user_roles`)
5. ✅ Profile (`profiles`)
6. ✅ Auth User (`auth.users`) - via Edge Function
7. ❌ Player Record (`players`) - **BLEIBT ERHALTEN**

## Technische Implementierung

### Frontend
- **Datei:** `src/lib/userManagement.ts`
- **Funktion:** `deleteUserAccount(userId: string)`
- **UI:** `src/pages/admin/UsersManagement.tsx`

### Edge Function
- **Name:** `delete-user`
- **Datei:** `supabase/functions/delete-user/index.ts`
- **Zweck:** Löscht den Auth-User mit Service-Role Berechtigung

### Database Policies
- **Migration:** `20251007105000_allow_user_deletion.sql`
- **Policies:**
  - `Super admins can delete profiles`
  - `Super admins can delete player profiles`
  - `Super admins can delete user roles`
  - `Super admins can delete player invitations`

## Sicherheit

### Berechtigungen
- Nur **Super Admins** können Accounts löschen
- Der Account muss **inactive** oder **suspended** sein
- Bestätigungsdialog vor dem Löschen

### Spieler-Schutz
Spieler-Datensätze werden **nie** gelöscht, um die Datenintegrität zu wahren:
- Spielstatistiken bleiben erhalten
- Team-Zuordnungen bleiben erhalten
- Spieler kann später neu eingeladen werden

## Neu-Einladung eines gelöschten Spielers

Nach dem Löschen eines Spieler-Accounts:

1. Der Spieler-Datensatz existiert weiterhin
2. `user_id` ist auf NULL gesetzt
3. Eine neue Einladung kann erstellt werden:
   ```
   Admin Dashboard → Players → Spieler auswählen → "Invite" Button
   ```
4. Spieler erhält neue Einladung
5. Nach Annahme wird neuer Auth-User erstellt und verknüpft

## Testing

### Testschritte:
1. Erstelle Test-User
2. Setze Status auf "Inactive"
3. Lösche Account
4. Verifiziere:
   - ✅ User nicht mehr in User-Liste
   - ✅ Auth-User gelöscht (Supabase Dashboard)
   - ✅ Profile gelöscht
   - ✅ Bei Spielern: Player Record existiert noch mit `user_id = NULL`

## Edge Function Deployment

```bash
# Deploy Edge Function
supabase functions deploy delete-user --project-ref frppdtfjpkvzuoridrwg

# Test Edge Function
curl -X POST https://frppdtfjpkvzuoridrwg.supabase.co/functions/v1/delete-user \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid-here"}'
```

## Fehlerbehebung

### Edge Function antwortet nicht
- Prüfe Deployment-Status im Supabase Dashboard
- Prüfe Edge Function Logs

### Auth-User wird nicht gelöscht
- Prüfe Service-Role Key Konfiguration
- Prüfe Edge Function Logs für Fehler
- Fallback: Manuelles Löschen im Supabase Dashboard

### RLS Policy Error
- Stelle sicher, dass User Super Admin ist
- Prüfe Migration `20251007105000_allow_user_deletion.sql`
