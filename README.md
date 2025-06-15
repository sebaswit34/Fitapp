# Fitatu - Aplikacja do Monitorowania Diety i Celów Treningowych

Fitatu to nowoczesna aplikacja webowa pomagająca użytkownikom monitorować swoją dietę, cele treningowe i postępy w osiąganiu wymarzonej sylwetki.

## Funkcjonalności

### 🎯 Cele i Pomiary
- Ustawianie głównego celu (redukcja wagi, utrzymanie, przyrost masy)
- Definiowanie celów cząstkowych (np. waga docelowa, obwód talii)
- Śledzenie postępów poprzez regularne pomiary
- Wizualizacja postępów na wykresach

### 🍽️ Zarządzanie Posiłkami
- Dodawanie i edycja posiłków
- Śledzenie kalorii i makroskładników
- Planowanie posiłków na cały dzień
- Historia posiłków

### 👤 Profil Użytkownika
- Podstawowe dane (wiek, płeć, wzrost)
- Aktualna waga i cele
- Historia pomiarów
- Bezpieczne zarządzanie kontem

## Technologie

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Bootstrap 5, JavaScript
- **Baza danych**: MongoDB
- **Autentykacja**: Express Session
- **Wykresy**: Chart.js

## Wymagania Systemowe

- Node.js (wersja 14 lub wyższa)
- MongoDB
- npm lub yarn

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/twoje-repozytorium/fitatu.git
cd fitatu
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Utwórz plik `.env` w głównym katalogu i dodaj wymagane zmienne środowiskowe:
```env
MONGODB_URI=twoje_polaczenie_mongodb
SESSION_SECRET=twoj_tajny_klucz
NODE_ENV=development
```

4. Uruchom aplikację:
```bash
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

## Struktura Projektu

```
fitatu/
├── controllers/         # Kontrolery aplikacji
├── models/             # Modele MongoDB
├── public/             # Statyczne pliki (CSS, JS, obrazy)
├── views/              # Szablony EJS
│   ├── layouts/        # Układy stron
│   └── partials/       # Częściowe widoki
├── app.js             # Główny plik aplikacji
├── package.json       # Zależności i skrypty
└── README.md          # Dokumentacja
```

## Bezpieczeństwo

- Hasła są hashowane przed zapisem w bazie danych
- Sesje są zabezpieczone i wygasają po 24 godzinach
- Wszystkie endpointy API wymagają autentykacji
- Dane wrażliwe są chronione przed nieautoryzowanym dostępem

