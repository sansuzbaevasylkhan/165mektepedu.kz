# 🎬 MansurDrama.kz — Қысқа Дорамалар Платформасы

> **Қазақстандағы қысқа дорамаларды HD сапада көруге арналған заманауи streaming платформа.**
> Netflix стиліндегі премиум қара дизайн, толық адаптивті және админ-панелімен бірге.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-5.20-2D3748?logo=prisma)](https://www.prisma.io)
[![License](https://img.shields.io/badge/License-Educational-yellow)]()

---

## 📋 Мазмұны

1. [Жоба туралы](#-жоба-туралы)
2. [Мүмкіндіктер](#-мүмкіндіктер)
3. [Технологиялар стегі](#-технологиялар-стегі)
4. [Алғашқы іске қосу](#-алғашқы-іске-қосу)
5. [Конфигурация (.env)](#-конфигурация-env)
6. [Скрипттер](#-скрипттер)
7. [Дерекқор (Prisma)](#-дерекқор-prisma)
8. [Жоба құрылымы](#-жоба-құрылымы)
9. [API маршруттары](#-api-маршруттары)
10. [Админ-панель](#-админ-панель)
11. [Дизайн жүйесі](#-дизайн-жүйесі)
12. [Деплой (Vercel)](#-деплой-vercel)
13. [Жиі кездесетін қателіктер](#-жиі-кездесетін-қателіктер)
14. [Лицензия](#-лицензия)

---

## 🎯 Жоба туралы

**MansurDrama.kz** — бұл қазақ тіліндегі дорамалар мен қысқа метражды фильмдерді онлайн көруге арналған толық функционалды streaming платформа.

Платформа келесі мақсаттарды көздейді:
- 🎞️ Дорама каталогын ыңғайлы шолу (2/3/4/5 бағанды тор)
- 🔍 Жылдам іздеу (debounce-пен)
- ▶️ HTML5 видео-плеер эпизодтармен
- 🔐 Қарапайым админ-кіру (бір пароль арқылы)
- 🛠️ Дорамалар мен қолданушыларды толық басқару (CRUD)
- 📱 Барлық құрылғыларда жұмыс істейтін адаптивті дизайн

---

## ✨ Мүмкіндіктер

### Пайдаланушы интерфейсі
- 🎨 **Netflix стиліндегі қара дизайн** — шыны/бұлыңғыр эффекттермен
- 📱 **Толық адаптивті** — мобильді, планшет, десктоп, Smart TV
- 🎬 **Дорама каталогы** — 2 (моб.) / 3 (планшет) / 4-5 (десктоп) баған
- 🎥 **Дорама беті** — эпизодтар тізімі + HTML5 видео-плеер
- 🔎 **Іздеу** — debounce (200ms) арқылы серверге сұрау
- 💀 **Skeleton loading** — жүктелу кезінде әдемі орынбасу
- 🎞️ **Framer Motion анимациялары** — жұмсақ өтулер
- 🔔 **Toast хабарламалар** — пайдаланушы әрекеттері үшін
- 🌐 **SEO оңтайландырылған** — meta, sitemap, robots, OpenGraph, Twitter Card
- 🍎 **Apple touch icon**, favicon SVG, OG-image — әлеуметтік желілерде көріну үшін

### Админ-панель
- 🔐 **Құпия сөзбен кіру** (`.env` ішіндегі `ADMIN_PASSWORD`)
- 📊 **Дашборд** — жалпы статистика
- 🎬 **Дорамаларды басқару** — қосу/өңдеу/жою, постер мен бейне жүктеу (2GB-қа дейін)
- 👥 **Пайдаланушыларды басқару** — ADMIN/USER рөлдері
- 🔒 **JWT сессия** (HS256, 7 күндік cookie, `httpOnly`)

### Техникалық
- ⚡ **Next.js 15 App Router** — серверлік компоненттер мен server actions
- 🗄️ **Prisma ORM** — SQLite (dev) / PostgreSQL (prod) қолдауы
- 🎯 **TypeScript strict** — қатесіз код
- 🎨 **Tailwind CSS** — утилита-кластар жүйесі
- 🔒 **bcryptjs** — парольдерді хэштеу
- 🪶 **Sharp** — суреттерді оңтайландыру

---

## 🛠 Технологиялар стегі

| Санат | Технология | Мақсаты |
|-------|------------|---------|
| Framework | **Next.js 15** | App Router, SSR/CSR |
| Тіл | **TypeScript 5.6** | тип қауіпсіздігі |
| Стиль | **Tailwind CSS 3.4** | утилита-стильдер |
| Анимация | **Framer Motion 11** | өту эффекттері |
| Дерекқор | **Prisma 5** | ORM + миграциялар |
| Дерекқор (dev) | **SQLite** | файлдық дерекқор |
| Дерекқор (prod) | **PostgreSQL** | өндірістік |
| Авторизация | **jose (JWT)** | сессия токендері |
| Хэштеу | **bcryptjs** | парольдер |
| Формалар | **React Hook Form + Zod** | валидация |
| Иконкалар | **Lucide React** | иконочкалар |
| Суреттер | **Sharp** | оңтайландыру |

---

## 🚀 Алғашқы іске қосу

### Талаптар
- **Node.js 18.17+** (ұсынылады 20+)
- **npm 9+** / **pnpm** / **yarn**
- **Git**

### Қадамдық нұсқау

#### 1️⃣ Репозиторийді клондау
```bash
git clone <repository-url>
cd "Mansurdrama.kz website"
```

#### 2️⃣ Тәуелділіктерді орнату
```bash
npm install
# немесе
pnpm install
```
> `postinstall` автоматты түрде `prisma generate` іске қосады.

#### 3️⃣ Қоршаған орта айнымалыларын баптау

`.env` файлын жасаңыз (түбірлік каталогта):

```env
# Дерекқор
DATABASE_URL="file:./dev.db"

# Админ-панельге кіру құпия сөзі
ADMIN_PASSWORD="mansurdrama"

# JWT сессия кілті (міндетті түрде ауыстырыңыз!)
JWT_SECRET="mansurdrama-super-secret-jwt-key-change-this-in-production-2026"

# Сайт
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="Mansur Drama"
```

📌 `.env.example` файлын үлгі ретінде қолдануға болады.

#### 4️⃣ Дерекқорды инициализациялау

```bash
# Миграцияларды қолдану (development)
npx prisma migrate dev --name init

# Тек Prisma client генерациялау
npx prisma generate
```

Бұл `prisma/dev.db` файлын жасайды және `Drama`, `Episode`, `User` кестелерін құрады.

#### 5️⃣ Дамуды іске қосу
```bash
npm run dev
```

Сайт мына мекенжайда ашылады: **http://localhost:3000**

Админ-панель: **http://localhost:3000/admin/login**

---

## ⚙️ Конфигурация (.env)

| Айнымалы | Сипаттама | Міндетті | Мысал |
|----------|-----------|----------|-------|
| `DATABASE_URL` | Дерекқор қосылымы | ✅ | `file:./dev.db` (SQLite) |
| `ADMIN_PASSWORD` | Админ-кіру паролі | ✅ | `mansurdrama` |
| `JWT_SECRET` | JWT қолтаңба кілті (≥16 символ) | ✅ | ұзын кездейсоқ жол |
| `NEXT_PUBLIC_SITE_URL` | Сайттың жалпыға қолжетімді URL | ✅ | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_NAME` | Сайт атауы (SEO) | — | `Mansur Drama` |

> ⚠️ **Маңызды:** Өндірісте `JWT_SECRET` және `ADMIN_PASSWORD` мәндерін міндетті түрде күшті бірегей мәндерге ауыстырыңыз!

---

## 📜 Скрипттер

`package.json` ішінде қол жетімді:

| Команда | Сипаттама |
|---------|-----------|
| `npm run dev` | Дамуды іске қосу (http://localhost:3000) |
| `npm run build` | Өндірістік жинау |
| `npm start` | Өндірістік серверді іске қосу |
| `npm run lint` | ESLint тексеру |
| `npm run prisma:generate` | Prisma client генерациялау |
| `npm run prisma:migrate` | Миграция жасау (dev) |
| `npm run prisma:push` | Схеманы дерекқорға тікелей қолдану |
| `npm run prisma:studio` | Prisma Studio ашу (дерекқор GUI) |

---

## 🗄 Дерекқор (Prisma)

### Модельдер

#### `Drama` — дорама
| Өріс | Тип | Сипаттама |
|------|-----|-----------|
| `id` | String (cuid) | Бірегей идентификатор |
| `title` | String | Атауы |
| `slug` | String (unique) | URL-ға арналған slug |
| `description` | String? | Сипаттама |
| `posterUrl` | String | Постер URL |
| `totalEpisodes` | Int | Эпизодтар саны |
| `views` | Int | Қарау саны |
| `rating` | Float | Рейтинг (0-5) |
| `isPublished` | Boolean | Жарияланды ма |
| `createdAt` | DateTime | Жасалған күні |
| `updatedAt` | DateTime | Өзгертілген күні |

#### `Episode` — эпизод
| Өріс | Тип | Сипаттама |
|------|-----|-----------|
| `id` | String (cuid) | Бірегей ID |
| `episodeNumber` | Int | Эпизод нөмірі |
| `title` | String | Атауы |
| `videoUrl` | String | Бейне URL |
| `duration` | Int | Ұзақтығы (секунд) |
| `thumbnail` | String? | Алдын ала қарау суреті |
| `views` | Int | Қарау саны |
| `dramaId` | String | Дорамаға сілтеме |

#### `User` — пайдаланушы
| Өріс | Тип | Сипаттама |
|------|-----|-----------|
| `id` | String (cuid) | Бірегей ID |
| `name` | String | Аты |
| `email` | String (unique) | Email |
| `avatar` | String? | Аватар URL |
| `password` | String | Хэштелген пароль |
| `role` | String | `USER` немесе `ADMIN` |

### Prisma Studio (GUI)
```bash
npm run prisma:studio
```
`http://localhost:5555` мекенжайында ашылады.

---

## 📂 Жоба құрылымы

```
Mansurdrama.kz website/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Түбірлік layout (theme, toast)
│   ├── page.tsx                      # Басты бет (каталог + іздеу)
│   ├── globals.css                   # Tailwind базалық стильдер
│   ├── error.tsx                     # 500 қате беті
│   ├── not-found.tsx                 # 404 беті
│   ├── robots.ts                     # SEO robots.txt
│   ├── sitemap.ts                    # SEO sitemap.xml
│   ├── opengraph-image.tsx           # OG суреті (динамикалық)
│   ├── apple-icon.tsx                # iOS иконкасы
│   ├── favicon.svg                   # Сайт иконкасы
│   ├── admin/
│   │   ├── page.tsx                  # Админ дашборд (қорғалған)
│   │   └── login/
│   │       └── page.tsx              # Админ кіру беті
│   ├── drama/
│   │   └── [slug]/
│   │       └── page.tsx              # Дорама беті (эпизодтар + плеер)
│   └── api/                          # API маршруттары
│       ├── auth/                     # Аутентификация
│       ├── dramas/                   # Дорамалар CRUD
│       ├── episodes/                 # Эпизодтар CRUD
│       ├── users/                    # Пайдаланушылар CRUD
│       ├── upload/                   # Файл жүктеу
│       └── slug/                     # Slug генерациялау
│
├── components/                       # React компоненттер
│   ├── SiteHeader.tsx                # Сайт тақырыбы
│   ├── SiteFooter.tsx                # Сайт түбі
│   ├── HeroSection.tsx               # Басты бет герой-бөлімі
│   ├── SearchBar.tsx                 # Іздеу жолағы (debounce)
│   ├── DramaCard.tsx                 # Дорама карточкасы
│   ├── VideoPlayer.tsx               # HTML5 видео-плеер
│   ├── admin/
│   │   ├── DashboardHome.tsx         # Дашборд басты беті
│   │   ├── DramaManagement.tsx       # Дорамаларды басқару UI
│   │   ├── UserManagement.tsx        # Пайдаланушыларды басқару UI
│   │   └── Sidebar.tsx               # Админ бүйірлік мәзірі
│   └── ui/                           # Қайта қолданылатын UI
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── empty-state.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── select.tsx
│       ├── skeleton.tsx
│       └── toast.tsx
│
├── lib/                              # Утилиталар мен кітапханалар
│   ├── prisma.ts                     # Prisma client (singleton)
│   ├── db.ts                         # Дерекқор функциялары
│   ├── auth.ts                       # JWT + bcrypt сессия
│   ├── api-guards.ts                 # API рұқсат тексерулері
│   ├── middleware.ts                 # Аралық деңгей қорғау
│   ├── slug.ts                       # URL slug генерациясы
│   ├── theme-provider.tsx            # Тақырыпа провайдері
│   ├── upload.ts                     # Файл жүктеу логикасы
│   └── utils.ts                      # Көмекші функциялар
│
├── prisma/
│   ├── schema.prisma                 # Prisma схемасы
│   ├── migrations/                   # Миграциялар тарихы
│   └── dev.db                        # SQLite дерекқоры (dev)
│
├── public/                           # Статикалық файлдар
│   ├── favicon.svg
│   └── .gitkeep
│
├── types/                            # TypeScript типтері
├── styles/                           # Қосымша стильдер
├── utils/                            # Жалпы утилиталар
│
├── uploads/                          # Жүктелген файлдар
│   ├── posters/                      # Дорама постерлері
│   └── videos/                       # Бейнелер
│
├── .env                              # Жергілікті айнымалылар (git-те жоқ)
├── .env.example                      # Айнымалылар үлгісі
├── .gitignore
├── next.config.mjs                   # Next.js конфигурация
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md                         # 📍 Сіз осы жердесіз
```

---

## 🌐 API маршруттары

| Маршрут | Әдіс | Сипаттама | Қорғалған |
|---------|------|-----------|-----------|
| `/api/dramas` | `GET` | Дорамалар тізімі (`?q=` іздеу) | — |
| `/api/dramas` | `POST` | Жаңа дорама қосу | ✅ |
| `/api/dramas/[id]` | `PUT/DELETE` | Дораманы жаңарту/жою | ✅ |
| `/api/episodes` | `POST` | Эпизод қосу | ✅ |
| `/api/episodes/[id]` | `PUT/DELETE` | Эпизодты жаңарту/жою | ✅ |
| `/api/users` | `GET/POST` | Пайдаланушылар | ✅ |
| `/api/users/[id]` | `PUT/DELETE` | Пайдаланушыны жаңарту/жою | ✅ |
| `/api/auth/login` | `POST` | Админ кіру | — |
| `/api/auth/logout` | `POST` | Админ шығу | ✅ |
| `/api/upload` | `POST` | Файл жүктеу (≤2GB) | ✅ |
| `/api/slug` | `GET` | Уникалды slug генерациялау | ✅ |

### API-ға мысал сұрау
```bash
# Дорамаларды іздеу
curl "http://localhost:3000/api/dramas?q=любовь"

# Жаңа дорама қосу (cookie-мен авторизация қажет)
curl -X POST http://localhost:3000/api/dramas \
  -H "Content-Type: application/json" \
  -H "Cookie: mansur_admin_session=..." \
  -d '{"title":"Жаңа дорама","slug":"zhana-dorama","posterUrl":"/uploads/posters/x.jpg","totalEpisodes":10}'
```

---

## 🔐 Админ-панель

### Кіру
1. `http://localhost:3000/admin/login` мекенжайына өтіңіз
2. Парольді енгізіңіз (`ADMIN_PASSWORD` `.env` ішінде, әдепкіде `mansurdrama`)
3. Сіз админ-дашбордқа бағытталасыз

### Мүмкіндіктер
- 📊 **Дашборд** — жалпы дорамалар, эпизодтар, пайдаланушылар статистикасы
- 🎬 **Дорамалар** — CRUD + постер/бейне жүктеу
- 👥 **Пайдаланушылар** — ADMIN/USER рөлін тағайындау

### Сессия
- JWT токен (HS256) → `mansur_admin_session` cookie
- `httpOnly`, `sameSite=lax`, 7 күнге
- Өндірісте `secure: true` (тек HTTPS)

---

## 🎨 Дизайн жүйесі

### Түстер
| Атау | HEX | Қолданылуы |
|------|-----|------------|
| `dark-950` | `#0a0a10` | Фон (ең қара) |
| `dark-900` | `#131316` | Негізгі фон |
| `dark-800` | `#1c1c1e` | Карточкалар |
| `dark-700` | `#2c2c2e` | Шектеулер |
| `primary` | `#ec4899` | Негізгі (қызғылт) |
| `accent` | `#8b5cf6` | Акцент (күлгін) |
| `destructive` | `#ef4444` | Қате/жою |

### Анимациялар
- `shimmer` — шример эффекті
- `float` — қалқыма эффект
- `fade-in` — пайда болу
- `slide-up` — жоғары сырғу

### Шрифт
- **Inter** (Google Fonts) — `var(--font-inter)`

### Қара/Ақ тақырып
- `darkMode: 'class'` — class-қа негізделген
- Әдепкі: `dark`

---

## ☁️ Деплой (Vercel + Neon + Firebase)

### Архитектура
- **Vercel** — Next.js хостинг (Edge Functions, CDN)
- **Neon** — PostgreSQL дерекқор (тегтік план, Vercel-мен интеграция)
- **Firebase** — Storage (видео/постер) + Authentication (қажет болса)

### Қадам 1 — Дайындық

```bash
# 1) Жоба түбірінде
cp prisma/schema.sqlite.prisma prisma/schema.prisma  # жергілікті dev үшін
# (немесе өзгеріссіз қалдырыңыз — postgresql-де әлдеқашан жұмыс істейді)
```

### Қадам 2 — Neon PostgreSQL жасау

1. [neon.tech](https://neon.tech) сайтына GitHub арқылы кіріңіз
2. **Create project** → аты: `mansurdrama` → аймақ: **AWS US East (Ohio)**
3. **Connection Details** → **Connection string** көшіріңіз
4. Формат:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/mansurdrama?sslmode=require
   ```

### Қадам 3 — Vercel-де жоба жасау

1. [vercel.com](https://vercel.com) — GitHub арқылы кіріңіз
2. **Add New → Project** → репозиторийді таңдаңыз
3. Framework: **Next.js** (автоматты анықталады)
4. **Environment Variables** бөлімінде мынаны қосыңыз:

| Айнымалы | Мән | Орта |
|----------|-----|------|
| `DATABASE_URL` | Neon connection string | Production, Preview, Development |
| `ADMIN_PASSWORD` | күшті пароль | Production |
| `JWT_SECRET` | 32+ символ кездейсоқ | Production |
| `NEXTAUTH_SECRET` | 32+ символ кездейсоқ | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://mansurdrama.vercel.app` | Production |
| `NEXT_PUBLIC_SITE_NAME` | `Mansur Drama` | Production |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web config | Production, Preview, Development |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Production |
| `FIREBASE_CLIENT_EMAIL` | service account email | Production |
| `FIREBASE_PRIVATE_KEY` | service account private key | Production |

> ⚠️ **Құпия кілттер генерациялау:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Қадам 4 — Алғашқы деплой

1. **Deploy** басыңыз
2. Vercel автоматты түрде:
   - `npm install` (postinstall: `prisma generate`)
   - `prisma generate && next build` (vercel.json арқылы)
3. **Build логтарды** қадағалаңыз

### Қадам 5 — Дерекқорды инициализациялау

Алғашқы деплойдан кейін Vercel Terminal (немесе жергілікті):

```bash
# Локалды терминалда (DATABASE_URL-ді Neon-нікіне ауыстыру)
DATABASE_URL="postgresql://..." npx prisma db push
```

Немесе Vercel Dashboard → **Storage** → **Connect** арқылы Neon-ді тікелей қосу.

### Қадам 6 — Домен қосу (қажет болса)

1. Vercel Dashboard → **Settings** → **Domains**
2. `mansurdrama.vercel.app` — автоматты беріледі
3. Өз доменіңізді қосу: `mansurdrama.kz` → DNS жазбаларын баптау

### Файл жүктеу (Firebase Storage)

Локалды `/uploads/` Vercel-де **жұмыс істемейді** (read-only). Жоба автоматты түрде Firebase Storage-қа ауысады.

**Firebase Storage-ты конфигурациялау:**

1. Firebase Console → **Storage** → **Get started**
2. Production mode-та бастаңыз (кейін Rules-ті реттейміз)
3. **Storage Rules** қойыңыз:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Постер/видео/аватар — public read (браузерден ойнату үшін)
    match /{allPaths=**} {
      allow read: if true;  // public — көрушілер ойната алады
      allow write: if false; // тек сервер жазады (Admin SDK арқылы)
    }
  }
}
```

**Неліктен `allow write: false`?**
- Admin SDK сервис-аккаунт арқылы жазады — ережелерді bypass етеді
- Бұл API key-ді қорғайды — біреу сіздің атыңыздан файл жүктей алмайды
- Барлық upload тек админ-панель арқылы (JWT-сессиямен)

**Vercel Environment Variables-қа қосу:**

```
FIREBASE_STORAGE_BUCKET = your-project.appspot.com
```

**Тестілеу:**

```bash
# Локалды .env файлында
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
# (Бір жолда, \n escape-терімен)

npm run dev
# Админ-панельден файл жүктеп көріңіз
```

**Шығыс форматы:** Firebase Storage-тан public URL қайтарылады:
```
https://storage.googleapis.com/your-project.appspot.com/posters/1700000000-abc123.jpg
```

### Build конфигурациясы (vercel.json)

```json
{
  "buildCommand": "prisma generate && next build",
  "regions": ["fra1"]
}
```

---

## 🐛 Жиі кездесетін қателіктер

### 1. `JWT_SECRET environment variable must be set`
**Себебі:** `.env` файлында `JWT_SECRET` жоқ немесе 16 символдан қысқа.
**Шешім:**
```env
JWT_SECRET="minimum-16-characters-long-secret-key-here"
```

### 2. `prisma/dev.db does not exist`
**Себебі:** Дерекқор әлі инициализацияланбаған.
**Шешім:**
```bash
npx prisma migrate dev --name init
```

### 3. Админ-кіру жұмыс істемейді
**Себебі:** Cookie тазаланған немесе `JWT_SECRET` өзгерді.
**Шешім:**
- Шығып, қайта кіріңіз
- Өндірісте `secure: true` — тек HTTPS арқылы

### 4. Видео ойнамайды
**Себебі:** `/uploads/videos/` қалтасында файл жоқ немесе CORS қатесі.
**Шешім:**
- Дораманың `videoUrl` дұрыстығын тексеріңіз
- MP4/HLS форматын қолданыңыз
- Өндірісте CDN-ді пайдаланыңыз

### 5. TypeScript қателіктері
```bash
npx prisma generate   # Prisma типтерін жаңарту
rm -rf .next          # Build кэшін тазалау
npm run dev
```

---

## 📝 Ескертпелер

- 🔒 Өндірісте `JWT_SECRET` пен `ADMIN_PASSWORD` мәндерін міндетті түрде күшті бірегей мәндерге ауыстырыңыз.
- 📁 Локалды `uploads/` өндірісте сақталмайды — CDN/S3 пайдаланыңыз.
- 🍪 Cookie-лер `httpOnly`, JS-тен қол жеткізу мүмкін емес — XSS-тен қорғалған.
- 🌍 Сайт қазақ тілінде (`<html lang="kk">`), бірақ оңай орыс/ағылшынға аударылады.

---

## 🤝 Үлес қосу

Pull request-тер қош келдіңіз! Үлкен өзгерістер алдында мәселені ашыңыз.

1. Fork жасаңыз
2. Feature branch жасаңыз (`git checkout -b feature/amazing-feature`)
3. Commit жасаңыз (`git commit -m 'Add amazing feature'`)
4. Push жасаңыз (`git push origin feature/amazing-feature`)
5. Pull Request ашыңыз

---

## 📄 Лицензия

Бұл жоба **білім беру мақсатында** таратылады. Жүктелетін кез-келген контенттің авторлық құқықтарын тексеріңіз.

---

<div align="center">

**🎬 MansurDrama.kz** — Қазақстанның сандық контент болашағы

⭐ Жоба пайдалы болса — жұлдыз қойыңыз!

</div>
