# NEXUS Arena

אפליקציית טורנירים מקומית, React + TypeScript + Vite. הקוד מנוהל במאגר GitHub, ומוכן לפרסום אוטומטי ב־GitHub Pages.

## הפעלה

נדרש Node.js 20.19+ או 22.12+.

```sh
npm install
npm run dev
```

פתחו את הכתובת ש־Vite מציג (ברירת מחדל: http://127.0.0.1:5173).

לבניית גרסת PWA ובדיקתה:

```sh
npm run build
npm run preview
```

פתחו http://127.0.0.1:4173. לאחר טעינה ראשונה של גרסת הבנייה, האפליקציה זמינה גם במצב לא מקוון. Service worker מופעל בגרסת production בלבד, כדי לא לשבש פיתוח. התקנה תלויה בתמיכת הדפדפן; ב־iOS השתמשו בשיתוף → הוספה למסך הבית. למכשיר חיצוני נדרש HTTPS עבור PWA (localhost מתאים לבדיקות במחשב).

## מה כלול

- ממשק רספונסיבי, ניווט נייד וניווט צדדי במחשב, עיצוב כהה וגרפיקה מקורית בקוד ללא תלות בשרת תמונות.
- עברית RTL ואנגלית LTR, עם בחירת שפה שנשמרת מקומית.
- CS2 / Mobile Legends: טורנירים, ערכת צבע, מפות, דירוגים ותפקידים לפי המשחק.
- דשבורד, קרוסלת אירועים וספירה לאחור, סינון טורנירים, מידע, קבוצות, חוקים, עץ הדגמה וחלוקת פרסים.
- הרשמה וביטול הרשמה, שמירת מקום ומטבעות, הנחת קארמה של 10% לדמי כניסה.
- סימולציית התאמת חמישייה ותפקידי שחקנים, חדר 5v5, וטו מפות בתורות ופרטי שרת להעתקה.
- חנות פרסים עם אישור מימוש, בדיקת יתרה ומניעת מימוש כפול, מלאי פרסים מקומי.
- דירוגי סולו, קבוצות, חודשיים וקארמה, בסינון ארצי ובינלאומי.
- פרופיל הדגמה והתחברות מדומה באמצעות Google / Apple / טלפון. אין איסוף או שליחה של מספר הטלפון.
- manifest, אייקוני PNG בגודל 192/512, service worker, אפליקציה עצמאית והנחיות התקנה.
- שמירת יתרה, פרסים, הרשמות וניצחונות ב־localStorage. רענון שומר התקדמות באותו דפדפן.

## גבולות הגרסה המקומית

זוהי הדגמה מקומית עובדת, ולא מערכת תחרותית מוכנה להפעלה מסחרית. הנתונים, דירוג הקארמה, תוצאות העצים, המשתמשים, השידורים, החיבור לשרת, ההתראות וספירת המחוברים הם דוגמאות. ההתאמה והיריב בווטו הם סימולציה בדפדפן. ספירת הזמן מתחילה מחדש עם פתיחה מחדש של האפליקציה. לכל פרס מותר מימוש הדגמה אחד.

אין חיבור ל־OAuth, SMS, לשרתי CS2/MLBB, תשלומים, Bit/PayPal/PayBox, חלוקת סקינים או יהלומים. הרשמת קבוצה מייצגת חמישיית הדגמה. הקארמה קבועה על 96 לצורך הצגת הטבות. למימוש אמיתי נדרשים backend, אימות משתמשים, אחסון נתונים, סנכרון בזמן אמת, אימות תוצאות ואינטגרציות ספקים. מידע ב־localStorage אינו מאובטח ולא מתאים ליתרות כספיות אמיתיות.

## מבנה

- `src/App.tsx` — מסכים, זרימות ומצב האפליקציה.
- `src/lib/i18n.ts` — מילוני תרגום מלאים לשני הכיוונים.
- `src/lib/data.ts` — נתוני ההדגמה ושמירה מקומית.
- `src/components/Modal.tsx` — חלון נגיש עם Escape ומיקוד מקלדת.
- `src/components/Art.tsx` — גרפיקת הזירה.
- `src/styles.css` — Tailwind CSS 4 וסגנונות מותאמים, רספונסיביות ו־reduced motion.
- `public/` — קובצי PWA ואייקונים.

## בדיקות

```sh
npm run typecheck
npm run build
npm run check:pwa
```

לבדיקה ידנית: החליפו שפה ומשחק; סננו טורנירים; הירשמו ובטלו; התחילו תור; חסמו מפות לסירוגין עד לבחירה; העתיקו פרטי הדגמה; הדמו ניצחון; ממשו פרס ובדקו שהיתרה מתעדכנת. רעננו כדי לוודא שהתקדמות נשמרת. בדקו גם בתצוגת 390 פיקסלים ובאמצעות מקלדת.

## GitHub Pages

- Repository: https://github.com/efitach10/nexus-arena
- App: https://efitach10.github.io/nexus-arena/
- Settings → Pages → Source: GitHub Actions.
- Every push to `main` triggers `.github/workflows/deploy.yml`: install, build, PWA verification, publish.
- The workflow obtains the project base path from GitHub Pages. Local development still uses `/`.
- To verify a project-path build locally: `PAGES_BASE_PATH=/nexus-arena npm run build && npm run check:pwa`.
- Manifest, icons, service worker scope and offline cache use the project path. Caches are isolated from other apps on the same GitHub Pages hostname.
- On iPhone: open the published link in Safari → Share → Add to Home Screen. On Android: browser menu → Install app.
