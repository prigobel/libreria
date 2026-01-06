# 🔧 Fix Redirect a Localhost dopo Deploy Vercel

## Problema
Dopo il deploy su Vercel, il login Google funziona ma poi fa redirect a `localhost:3000` invece che rimanere sul dominio Vercel.

## ✅ Soluzione (3 passaggi)

### 1. Configura il Site URL in Supabase

1. Vai nel **Dashboard Supabase**
2. Vai su **Authentication** → **URL Configuration**
3. Trova il campo **Site URL**
4. Cambialo da `http://localhost:3000` a:
   ```
   https://tuo-dominio.vercel.app
   ```
   (sostituisci con il tuo vero dominio Vercel)

5. **IMPORTANTE**: Aggiungi anche il dominio nelle **Redirect URLs** (sotto):
   ```
   https://tuo-dominio.vercel.app/**
   ```
   L'asterisco `**` permette tutte le route sotto quel dominio

6. Se vuoi testare sia in locale che in produzione, aggiungi entrambi:
   ```
   http://localhost:3000/**
   https://tuo-dominio.vercel.app/**
   ```

7. Clicca **Save**

### 2. Aggiorna Google OAuth Redirect URIs

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Vai su **API e servizi** → **Credenziali**
3. Clicca sul tuo OAuth 2.0 Client ID
4. Nella sezione **URI di reindirizzamento autorizzati**, aggiungi:
   ```
   https://[tuo-project-ref].supabase.co/auth/v1/callback
   ```
   (questo dovrebbe già esserci)

5. **NON serve** aggiungere il dominio Vercel qui - Google reindirizza sempre a Supabase, non direttamente alla tua app

6. Clicca **Salva**

### 3. Verifica Variabili Ambiente Vercel

1. Vai nel **Dashboard Vercel**
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Environment Variables**
4. Verifica che ci siano:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://[project-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [tua-anon-key]
   ```

5. Se le hai modificate, fai **Redeploy**:
   - Vai su **Deployments**
   - Clicca sui tre puntini dell'ultimo deployment
   - Clicca **Redeploy**

### 4. Testa di Nuovo

1. Vai su `https://tuo-dominio.vercel.app`
2. Clicca su "Inizia ora" o vai su `/login`
3. Fai login con Google
4. Ora dovrebbe funzionare! ✅

---

## 🐛 Se ancora non funziona

### Debug: Verifica il Redirect URL

Aggiungi questo console.log temporaneo per vedere dove sta cercando di reindirizzare:

Nel file `app/(auth)/login/page.tsx`, modifica la funzione `handleGoogleLogin`:

```tsx
const handleGoogleLogin = async () => {
  setIsLoading(true);

  // 🐛 DEBUG: vedi l'URL
  console.log('Origin:', window.location.origin);
  console.log('Redirect URL:', `${window.location.origin}/auth/callback`);

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // resto del codice...
```

Apri la **Console del browser** (F12) e guarda cosa stampa. Dovrebbe mostrare il dominio Vercel, non localhost.

### Svuota Cache del Browser

A volte il browser cachea i redirect OAuth:

1. Apri DevTools (F12)
2. Vai su **Application** (Chrome) o **Storage** (Firefox)
3. Clicca su **Clear site data** o **Clear storage**
4. Ricarica e riprova

### Usa Modalità Incognito

Prova in una finestra incognita/privata per escludere problemi di cache o cookie.

---

## 📝 Note

- Il **Site URL** in Supabase controlla dove l'utente viene reindirizzato dopo il login
- I **Redirect URLs** limitano da dove può partire l'autenticazione (per sicurezza)
- Google OAuth reindirizza sempre a Supabase, poi Supabase reindirizza alla tua app
- Il `redirectTo` nel codice dice a Supabase dove mandare l'utente dopo l'autenticazione

---

## ✅ Checklist Finale

- [ ] Site URL in Supabase = dominio Vercel
- [ ] Redirect URLs in Supabase include dominio Vercel con `**`
- [ ] Variabili ambiente corrette in Vercel
- [ ] Redeploy fatto (se hai modificato env vars)
- [ ] Cache browser pulita
- [ ] Test in incognito

Se hai seguito tutti questi passi dovrebbe funzionare! 🎉
