# 🎨 PHIXO - AI-Powered Photo Editing Platform

PHIXO is een geavanceerde AI-gedreven foto-editing platform gebouwd met React, Firebase, en verschillende AI-services voor professionele beeldbewerking.

## 🚀 Features

- **AI Photo Generation** - Genereer unieke foto's met Seedream-4 AI
- **Smart Photo Editing** - Bewerk foto's met Nano Banana AI
- **Mockup Creator** - Creëer professionele mockups voor vastgoed en producten
- **Firebase Integration** - Veilige opslag en authenticatie
- **Real-time Collaboration** - Live updates en synchronisatie
- **Credit System** - Geïntegreerd creditsysteem met Stripe
- **Responsive Design** - Werkt perfect op alle apparaten

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express (Proxy Server)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **AI Services**: Replicate (Nano Banana, Seedream-4)
- **Payments**: Stripe
- **Deployment**: Ready for Vercel/Netlify

## 🔧 Installation & Setup

### 1. Clone het Repository

```bash
git clone https://github.com/revelinorebel-art/phixo.git
cd phixo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Kopieer het `.env.example` bestand naar `.env`:

```bash
cp .env.example .env
```

Vul de volgende environment variables in je `.env` bestand:

```env
# Replicate API Configuration
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 4. Firebase Setup

1. Ga naar [Firebase Console](https://console.firebase.google.com/)
2. Maak een nieuw project aan
3. Activeer Authentication, Firestore Database, en Storage
4. Kopieer je Firebase config naar de environment variables
5. Stel Firestore rules in (zie `firestore.rules`)
6. Stel Storage rules in (zie `storage.rules`)

### 5. Replicate API Setup

1. Ga naar [Replicate](https://replicate.com/)
2. Maak een account aan
3. Genereer een API token
4. Voeg de token toe aan je `.env` bestand

### 6. Start de Development Servers

Start de proxy server (in een terminal):
```bash
node proxy-server.js
```

Start de React app (in een andere terminal):
```bash
npm run dev
```

De applicatie is nu beschikbaar op `http://localhost:5173`

## 🔒 Security & Best Practices

### Environment Variables
- **NOOIT** commit je `.env` bestand naar git
- Gebruik altijd environment variables voor API keys
- Controleer regelmatig of er geen hardcoded secrets in de code staan

### Firebase Security
- Firestore rules zijn ingesteld voor authenticated users only
- Storage rules beperken toegang tot eigen bestanden
- Authentication is verplicht voor alle protected routes

### API Security
- Alle AI API calls gaan via de proxy server
- Rate limiting is geïmplementeerd
- Input validation op alle endpoints

## 📁 Project Structure

```
phixo/
├── src/
│   ├── components/          # Herbruikbare UI componenten
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── pages/              # Route componenten
│   ├── services/           # API en service layers
│   └── utils/              # Helper functies
├── public/                 # Statische bestanden
├── proxy-server.js         # Express proxy server
├── firebase.json           # Firebase configuratie
├── firestore.rules         # Firestore security rules
└── storage.rules           # Storage security rules
```

## 🚀 Deployment

### Vercel Deployment

1. Push je code naar GitHub
2. Verbind je repository met Vercel
3. Voeg environment variables toe in Vercel dashboard
4. Deploy de proxy server apart (bijv. op Railway of Heroku)
5. Update de API endpoints in je frontend code

### Environment Variables voor Production

Zorg ervoor dat alle environment variables zijn ingesteld in je deployment platform:

- `REPLICATE_API_TOKEN`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_STRIPE_PUBLISHABLE_KEY`

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📝 API Documentation

### Proxy Server Endpoints

- `POST /api/nano-banana` - Nano Banana AI editing
- `POST /api/seedream` - Seedream-4 AI generation
- `GET /api/fetch-image` - Image proxy voor CORS

### Firebase Collections

- `users` - User profiles en credits
- `projects` - Opgeslagen projecten
- `images` - Image metadata

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 License

Dit project is gelicenseerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.

## 🆘 Support

Voor vragen of problemen:

1. Check de [Issues](https://github.com/revelinorebel-art/phixo/issues) pagina
2. Maak een nieuwe issue aan als je probleem er niet bij staat
3. Voor directe support, contacteer het development team

## 🔄 Changelog

### v1.0.0 (Latest)
- ✅ Volledige authenticatie en route protection
- ✅ AI-powered photo editing met Nano Banana
- ✅ Photo generation met Seedream-4
- ✅ Mockup creator functionaliteit
- ✅ Firebase integratie voor storage en database
- ✅ Credit systeem met Stripe integratie
- ✅ Responsive design en mobile support
- ✅ Comprehensive error handling
- ✅ Security hardening en API protection

---

**Gemaakt met ❤️ door het PHIXO team**