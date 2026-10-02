مراحل الحفظ - نسخة PWA
الملفات: index.html, manifest.json, sw.js, icon-192.png, icon-512.png, icon-maskable-512.png
النشر: ارفع المجلد كاملاً إلى Netlify (سحب وإفلات) أو GitHub Pages. يجب أن يكون الرابط عبر HTTPS.
بعد الفتح على الهاتف: قائمة المتصفح ← "تثبيت التطبيق" / "إضافة إلى الشاشة الرئيسية".
عند تعديل أي ملف، غيّر رقم CACHE في sw.js (hifz-pipeline-v2...) ليتحدّث عند المستخدمين.
لتوليد APK: استخدم PWABuilder.com مع رابط الموقع المنشور.

الإصدار 2: عدّاد التكرار، مؤقت الجلسة، التواريخ وأيام الأسبوع، تذكير الغفلة، شاشة المنهجية، نسخ احتياطي. CACHE الآن hifz-pipeline-v2.
الإصدار 3: تقييم المراجعات، فترات متدرجة، سجل مواضع التردد، السلسلة والإحصاء. CACHE الآن hifz-pipeline-v3.

الإصدار 4: إشعار مضمون من الخادم (Web Push عبر Netlify Functions). CACHE الآن hifz-pipeline-v4.

نشر الإشعار المضمون (مرة واحدة):
1) ارفع المجلد كاملاً إلى مستودع GitHub واربطه بـ Netlify (Add new site ← Import from Git). لا تستخدم السحب والإفلات لأنه لا يثبّت حزم الدوال (package.json).
2) ولّد مفاتيح VAPID:  npx web-push generate-vapid-keys
3) في Netlify: Site settings ← Environment variables، أضف:
   VAPID_PUBLIC_KEY  = المفتاح العام
   VAPID_PRIVATE_KEY = المفتاح الخاص (سرّي، لا يوضع في الكود)
   VAPID_SUBJECT     = mailto:بريدك@example.com
4) أعد النشر (Deploys ← Trigger deploy).
5) افتح التطبيق من الهاتف ← ⚙ ← "تفعيل الإشعار المضمون". على آيفون يجب أولاً إضافة التطبيق إلى الشاشة الرئيسية (iOS 16.4+).

كيف يعمل: يرسل التطبيق للخادم اشتراك الجهاز + مواعيد المراجعة (تواريخ وأسماء سور فقط). دالة مجدولة (netlify/functions/push-send.mjs) تعمل كل 15 دقيقة، وترسل إشعار الغفلة مرة واحدة يومياً بعد وقت التذكير بتوقيت جهازك، ولا ترسل شيئاً إن لم توجد مراجعة مستحقة.
الملفات الجديدة: package.json, netlify.toml, netlify/functions/{vapid,push-sync,push-send}.mjs
