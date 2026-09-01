# سوقنا — Souqna Marketplace

واجهة تجارة إلكترونية عربية RTL بطابع SaaS، مع API مبني بـ Node.js وExpress وقاعدة PostgreSQL. لا تُعرض نسبة العمولة في الصفحة الرئيسية؛ ضبطها محصور في API الإدارة.

## ما تم تجهيزه

- صفحة رئيسية متجاوبة مع ثيم فاتح/داكن، حركات بسيطة، بطاقات وواجهة عربية متقنة.
- صفحات نتيجة الدفع: `/payment/success` و`/payment/pending` و`/payment/failed`.
- تسجيل/دخول JWT وأدوار `customer` و`seller` و`admin`، وتجزئة كلمات المرور بـ bcrypt.
- مخطط PostgreSQL الكامل: `users`, `stores`, `products`, `orders`, `order_items`, `payments`, `commissions`, `seller_wallets`, `seller_ledger`, `payouts`, `refunds`, `webhook_events`، إضافة إلى `commission_settings` اللازمة لإدارة الرسوم.
- إنشاء الطلب داخل transaction، خصم المخزون، وإنشاء سجل دفع pending.
- تسوية مالية idempotent عند تأكيد الدفع: رسوم المنصة، رصيد البائع، وسطر Ledger قابل للمراجعة.
- طبقة Fawaterk منفصلة، OAuth من environment variables، ومسارات Webhook لكل من paid/tokenization/cancellation/failed/refund.

## التشغيل محليًا

المتطلبات: Node.js 20+ وPostgreSQL 14+.

```bash
cp .env.example .env
# أنشئ قاعدة باسم souqna ثم عدّل DATABASE_URL في .env
npm install
npm run db:migrate
npm run dev
```

افتح `http://localhost:3000`. في Windows انسخ الملف يدويًا من `.env.example` إلى `.env`.

## إطلاق تجريبي على السحابة (Render)

أضفت [render.yaml](render.yaml) و[Dockerfile](Dockerfile) لتشغيل الموقع والخادم وقاعدة PostgreSQL في خدمة واحدة. ارفع المشروع إلى GitHub ثم من حساب Render اختر **New → Blueprint** واربط المستودع؛ سيقرأ Render الإعدادات ويجهز خدمة الويب وقاعدة البيانات.

بعد أول نشر، شغّل migration مرة واحدة من Shell الخاص بالخدمة:

```bash
npm run db:migrate
```

ثم عيّن `APP_URL` و`CORS_ORIGIN` إلى رابط Render الذي يظهر لك. لا تضف متغيرات Fawaterk قبل الحصول على تفاصيل الـAPI والتوقيع الموثقة. الخطة المجانية مناسبة لتجربة أولى فقط وقد تتوقف الخدمة مؤقتًا عند عدم الاستخدام.

## توثيق API المختصر

| Method | Endpoint | الغرض |
| --- | --- | --- |
| POST | `/api/auth/register` | إنشاء عميل أو تاجر |
| POST | `/api/auth/login` | بدء جلسة JWT |
| GET | `/api/products` | المنتجات العامة |
| POST | `/api/stores` | إنشاء متجر (seller/admin) |
| POST | `/api/products` | إضافة منتج (seller/admin) |
| POST | `/api/orders` | إنشاء طلب العميل |
| GET | `/api/seller/dashboard` | ملخص التاجر |
| GET | `/api/wallet/ledger` | كشف حساب التاجر |
| POST | `/api/payouts` | طلب سحب رصيد |
| POST | `/api/refunds` | تسجيل طلب استرداد |
| GET | `/api/admin/stats` | إحصاءات الإدارة |
| PUT | `/api/admin/commissions/:storeId` | تغيير رسوم متجر (admin فقط) |
| POST | `/api/payments/:orderId/checkout` | بدء Checkout فواتيرك |
| POST | `/api/webhooks/fawaterk/:event` | استقبال أحداث فواتيرك |

المسارات المحمية تستقبل `Authorization: Bearer <token>`.

## تجهيز Fawaterk قبل الإنتاج

لا توجد أي بيانات حساسة في الواجهة أو المستودع. أضف بيانات الحساب في `.env` فقط. نقطتا `CHECKOUT_ENDPOINT_FROM_DOCS` وتحقق التوقيع داخل [src/services/fawaterk.js](src/services/fawaterk.js) مقصودتان كـ placeholders: لا يمكن اعتماد payload أو آلية signature من غير وثائق حساب فواتيرك الحالية. بعد الحصول على الوثائق الرسمية:

1. ضع endpoint الحقيقي وحقول payload الموثقة في `createCheckout`.
2. نفّذ التحقق الحرفي من توقيع الـ webhook في `verifyWebhook`.
3. اختبر في Sandbox أولًا باستخدام endpoint علني HTTPS.
4. اربط روابط النتيجة بالمسارات المذكورة أعلاه.

لا تفعل الإنتاج أو تستقبل Webhooks حقيقية قبل تنفيذ الخطوتين 1 و2.

## ملاحظات تشغيلية

- حوّل قيمة `DEFAULT_COMMISSION_RATE` إلى النسبة التي تناسبك، لكن القيمة الفعلية لكل متجر تضبط من الإدارة.
- ضع `JWT_SECRET` عشوائيًا وطويلًا في الإنتاج، فعّل HTTPS، واضبط `CORS_ORIGIN` على نطاقك فقط.
- آلية الـ payout تسجل وتخصم الرصيد كطلب قيد المراجعة؛ تنفيذ التحويل البنكي/المحفظة يتطلب مزود payout موثّقًا وحسابًا مفعلًا.
