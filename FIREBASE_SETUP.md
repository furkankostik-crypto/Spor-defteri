# 🚀 Vercel & Firebase Bulut Yedekleme Kurulum Kılavuzu

Bu uygulama, antrenman kayıtlarınızı güvenle bulutta saklamak ve **Google**, **Apple** ya da **E-posta & Şifre** ile oturum açmanızı sağlamak için **Google Firebase (Firestore & Auth)** altyapısını kullanır.

---

## 1. Adım: Ücretsiz Firebase Projesi Oluşturma (2 Dakika)

1. [Firebase Console](https://console.firebase.google.com/) sayfasına gidin ve Google hesabınızla giriş yapın.
2. **"Proje Ekle" (Add Project)** butonuna tıklayın ve bir isim verin (Örn: `spor-defterim`).
3. Google Analytics adımını isteğe bağlı olarak geçebilir veya etkinleştirebilirsiniz. **Projeyi Oluştur**'a basın.

---

## 2. Adım: Giriş Yöntemlerini (Authentication) Açma

1. Sol menüden **Build > Authentication** seçeneğine gidin.
2. **"Get Started" (Başlayın)** butonuna tıklayın.
3. **Sign-in method** sekmesinde şu sağlayıcıları etkinleştirin:
   - **Google**: Tıklayın, "Enable" yapın, destek e-postanızı seçip kaydedin.
   - **Email/Password**: Tıklayın, "Enable" yapıp kaydedin.
   - *(İsteğe Bağlı)* **Apple**: Apple Developer hesabınız varsa ekleyebilirsiniz.

---

## 3. Adım: Firestore Veritabanını Açma

1. Sol menüden **Build > Firestore Database** seçeneğine gidin.
2. **"Create database" (Veritabanı oluştur)** butonuna tıklayın.
3. Konum olarak size en yakın bölgeyi (örn: `eur3 - europe-west`) seçin.
4. Güvenlik kuralları (Rules) sekmesinde kullanıcıların yalnızca kendi antrenmanlarını okuyup yazabilmesi için şu kuralı yapıştırın ve **Publish** deyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 4. Adım: Firebase Yapılandırma Anahtarlarını Alma

1. Sol üstteki **Proje Ayarları (Project Settings ⚙️)** simgesine tıklayın.
2. **General** sekmesinde aşağı kaydırıp **"Your apps"** kısmındaki **Web (</>)** simgesine tıklayın.
3. Bir takma ad verin (örn: `spor-web`) ve **Register app** butonuna basın.
4. Ekranda görünen `firebaseConfig` içindeki değerleri kopyalayın.

---

## 5. Adım: Vercel & Yerel Ortama Ekleme

### A) Vercel Üzerinde Yayınlarken:
1. [Vercel Dashboard](https://vercel.com/dashboard) projenize gidin.
2. **Settings > Environment Variables** sekmesini açın.
3. Aşağıdaki değişkenleri Firebase'den aldığınız değerlerle ekleyin:

* `VITE_FIREBASE_API_KEY`
* `VITE_FIREBASE_AUTH_DOMAIN`
* `VITE_FIREBASE_PROJECT_ID`
* `VITE_FIREBASE_STORAGE_BUCKET`
* `VITE_FIREBASE_MESSAGING_SENDER_ID`
* `VITE_FIREBASE_APP_ID`

4. Projenizi yeniden dağıtın (Redeploy).

### B) Yerel Test (Localhost):
Proje ana dizininde `.env` isimli bir dosya oluşturup `.env.example` içeriğini doldurmanız yeterlidir.
