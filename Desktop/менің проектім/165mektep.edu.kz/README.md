# 165 MEKTEP — мектеп порталы және ҰБТ платформасы

React 18 + TypeScript + Vite + Supabase. Домен: https://165mektep.edu.kz

## Іске қосу

```bash
npm install
cp .env.example .env      # VITE_SUPABASE_URL және VITE_SUPABASE_ANON_KEY толтырыңыз (тек anon кілті!)
npm run dev               # әзірлеу
npm run build             # production (tsc + vite build) -> dist/
```

## Supabase баптау (бір рет)

1. Supabase жобасын ашыңыз -> **Authentication -> Providers -> Email**: "Confirm email" **өшірулі** болсын
   (сайт телефон нөмірінен жасалған ішкі email арқылы кіреді: `7XXXXXXXXXX@phone.165mektep.edu.kz`).
2. **SQL Editor** -> `supabase/schema.sql` файлының мазмұнын толық іске қосыңыз
   (кестелер, RLS, серверлік функциялар, Storage, Realtime). Қайта іске қосуға болады.
3. Сайтта өзіңіз тіркеліңіз, сосын SQL Editor-де өзіңізді админ етіңіз:
   ```sql
   update public.profiles set role = 'admin' where phone = '+77771234567';
   ```
4. `/admin` -> **Сайт баптаулары**: мекенжай, телефон, email, әлеуметтік желі және Google Play / App Store
   сілтемелерін енгізіңіз. Сол бетте **Мұғалімдер**, **Мектеп жетістіктері**, **Оқушылар жетістіктері** және
   **Фотогалерея** бөлімдері бөлек басқарылады. Бос өрістер сайтта "Жақында" болып көрсетіледі (жалған сілтеме жоқ).

## Қауіпсіздік моделі

| Талап | Қалай орындалады |
|---|---|
| ADMIN рөлі | `profiles.role`; әр admin әрекеті RLS/`is_admin()` арқылы **сервер** тексереді. Тіркелгенде рөл тек `student`/`parent` бола алады |
| Видео прогресі | `report_video_progress` RPC: сервер нақты өткен уақытпен есептейді (шығыс ≤ нақты уақыт × 1.3). Клиент "100%" жібере алмайды. Аяқталу шегі — ұзақтықтың 97%-ы |
| Сабақтың ашылуы | `can_view_lesson` / `get_lesson`: алдыңғы сабақ аяқталмаса `LESSON_LOCKED`. ID өзгерту көмектеспейді |
| Жүктелген видео | Private bucket; signed URL тек сабағы ашық пайдаланушыға беріледі (storage RLS) |
| Тест | `get_test` дұрыс жауапты (`is_correct`) **жібермейді**; `submit_test` нәтижені серверде есептейді |
| Ата-ана -> оқушы | `parent_student_links`: ата-ана сұратады, оқушы (немесе admin) бекітеді. `student_overview` тек бекітілген байланысқа береді |
| Құпиясөз | Supabase Auth (bcrypt). Service Role Key frontend-те **жоқ** |
| Көшіруден қорғау | CSS `user-select:none`, контекстік мәзір, Ctrl+C/U/S/P/A, drag&drop, сурет pointer-events. Бұл тек интерфейстік тосқауыл — 100% қорғау браузерде мүмкін емес. Енгізу өрістері мен админ кестелері (`.allow-copy`) бұған жатпайды |

## Белгілі шектеулер

- Телефон нөмірі SMS арқылы **расталмайды** (SMS провайдері қосылмаған). Болашақта Supabase Phone Auth + SMS
  провайдерін қосуға болады — `AuthContext.tsx` ішінде өзгерту аз.
- Видео "көрілді" есебі — қарап отырған нақты уақыт. Бірақ оқушы видеоны ойнатып қойып өзге іспен айналыса алады
  (бұл технически кез келген платформада бар).
- Supabase Free жоспарында бір файл өлшемі 50 МБ-пен шектелген; үлкен видеоны YouTube (unlisted) URL арқылы қосыңыз.
- Тілдер: қазақ тілі негізгі. Орыс/ағылшын қосу үшін `src/i18n/kk.ts` кілттерін көшіріп (`ru.ts`, `en.ts`),
  `src/i18n/index.tsx` ішіндегі `DICTS`-ке тіркеңіз. Ұзақ бет мәтіндері `src/content/kk.ts` ішінде.

## Құрылым

```
supabase/schema.sql     — барлық DB, RLS, RPC, Storage
src/context             — Auth, Theme (Dark/Light), Toast, Settings
src/components          — Header, Footer, PhoneInput (+7 маска), VideoPlayer, TestRunner, CopyGuard ...
src/pages               — Home, News, About, Login, Register, Ubt, Lesson, Cabinet, Legal
src/pages/admin         — Dashboard, News, ҰБТ (пән/сабақ/тест), Users, Сайт баптаулары
```

## Деплой

`dist/` қалтасын кез келген static hosting-ке (Vercel: `vercel.json`, Netlify: `public/_redirects`) жүктеңіз.
SPA маршруттары `index.html`-ге бағытталады. Environment variables-ке `VITE_SUPABASE_URL` және
`VITE_SUPABASE_ANON_KEY` қосуды ұмытпаңыз.
