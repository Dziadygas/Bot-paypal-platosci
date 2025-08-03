# 🤖 Discord PayPal Bot

Bot umożliwiający bezpieczne przyjmowanie płatności PayPal z poziomu Discorda z automatyczną weryfikacją.

## 🌟 Funkcje
- 🔒 Ograniczenie komendy `!pay` do wybranych ról
- 💰 Generowanie linków płatności PayPal
- ✅ Automatyczna weryfikacja płatności (IPN)
- 📊 Profesjonalne embedy z przyciskami
- ⏳ Automatyczne wygaszanie linków (24h)
- 📝 Pełne logowanie zdarzeń

## 🛠 Wymagania
- Node.js 18+
- Konto PayPal Business
- Serwer VPS (dla IPN)
- Uprawnienia bota: `Manage Messages`, `View Channels`, `Send Messages`

## 🚀 Instalacja
1. Sklonuj repozytorium:
```bash
git clone https://github.com/twoj-repo/paypal-bot.git
cd paypal-bot
Zainstaluj zależności:

bash
npm install
Skonfiguruj plik .env (patrz przykład poniżej)

Uruchom bota:

bash
node index.js
⚙️ Konfiguracja .env
env
# DISCORD
DISCORD_TOKEN=your_bot_token_here
DISCORD_PREFIX=!
ALLOWED_ROLE_IDS=123456789,987654321  # ID ról oddzielone przecinkami

# PAYPAL
PAYPAL_MODE=live                       # lub 'sandbox' dla testów
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_EMAIL=your@paypal.email
PAYPAL_CURRENCY=PLN                    # EUR, USD itp.

# SERVER
IPN_LISTENER_PORT=5000
IPN_LISTENER_URL=http://your.ip:5000/ipn
📋 Użycie
Użytkownik z uprawnieniami używa:

text
!pay 50.00 Skórka VIP
Bot generuje link płatności

Po opłaceniu, automatycznie weryfikuje transakcję

🔧 Konfiguracja PayPal
Włącz IPN w ustawieniach konta PayPal

Ustaw URL IPN na: http://twoj.ip:5000/ipn

Zweryfikuj konto biznesowe

📜 Licencja
MIT

📌 Uwagi
W trybie sandbox używaj kont testowych z PayPal Developer

Do działania IPN potrzebny jest publiczny adres IP

Zalecane użycie HTTPS (np. z certyfikatem Let's Encrypt)

text

### 🎯 Kluczowe elementy README:
1. **Instrukcje krok po kroku** dla łatwej instalacji
2. **Przykładowa konfiguracja** `.env`
3. **Wymagania techniczne** (Node.js, uprawnienia)
4. **Uwagi dot. bezpieczeństwa** (HTTPS, IPN)
5. **Linki do dokumentacji** PayPal
