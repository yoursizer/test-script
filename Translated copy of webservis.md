# **TICIMAX SERVICE DOCUMENTATION**


1. # **Product** **Service**

   Service address : [**http://www.alanadiniz.com/Servis/UrunServis.svc**](http://www.alanadiniz.com/Servis/UrunServis.svc)

   This service inside methods:

* [Category knowledge to take   (*SelectCategory*)](#selectcategory)  
* [Category to add (*SaveCategory*)](#savecategory)

* [So knowledge to take   (*SelectMarka*)](#selectmarka)  
* [So to add (*SaveMarka*)](#savemarka)

* [Supplier knowledge to take   (*SelectTedarikci*)](#selecttedarikci)  
* [Supplier to add (*SaveTedarikci*)](#savetedarikci)  
* [To unit knowledge to take   (*SelectParaBirimi*)](#selectparabirimi)

* [To unit to add (*SaveParaBirimi*)](#saveparabirimi)  
* [Product knowledge to take   (*SelectUrun*)](#selecturun)  
* [Getting product number information (*SelectUrunCount*)](#selecturuncount)

* [Product to add (*SaveUrun*)](#saveurun)

  1. ## **SelectCategory** {#selectcategory}

  Service Method signature:**SelectKategori(string** **And of course,** **int** **categoryID)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| categoryID | Knowledge desired category singular key(id) |

  If categoryID is sent as "0", it returns information about all categories, the "id" of a particular category.

  if entered the category information returns.

  The data type of the returned information is the list of the "Category" class. Example usage:
  
  ```
    / UrunServis adlı değişken Service Reference olarak eklenmiştir.
    UrunServis.UrunServisClient urunServis = new UrunServis.UrunServisClient();
    // Bütün kategorileri çekmek için
    List<UrunServis.Kategori> kategoriler = urunServis.SelectKategori("U15saQ48dW453X1cA",0); foreach(var kategori in kategoriler)
    {
    Console.WriteLine("Kategori Adı: " + kategori.Tanim);
    }
    // Tek bir kategoriyi çekmek için
    List<UrunServis.Kategori> tekKategori = urunServis.SelectKategori("U15saQ48dW453X1cA",53); Console.WriteLine("Kategori Adı: " + tekKategori[0].Tanim);

```


  2. ## **SaveCategory** {#savecategory}

  Service Method signature:**SaveKategori(string** **And of course,** **Category** **category)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| category | Category information "Category" class carrying |

  Example use:
  ```
  // Kategori alanları. "*" işaretli alanlar zorunludur.
  UrunServis.Kategori eklenecekKategori = new UrunServis.Kategori
  {
   ID = 0, //* 0 ise yeni kategori ekler, sıfırdan büyük ise o id'ye sahip olan kategoriyi
günceller.
PID = 10, //* Üst kategori id si.Ekleyeceğiniz Kategorinin üst kategori yoksa 0 değerini
gönderiniz.
Aktif = true, // * Aktif pasif durumu, aktif olacaksa "true" pasif olacaksa "false" olarak gönderiniz.
Tanim = "Giyim", // * Kategori Adı
Kod = "GYM", // Kategori Kodu
SeoAnahtarKelime = "giysi giyim", // SEO optimizasyonu için kullanılan kelimeler SeoSayfaAciklama = "Açıklama", // SEO optimizasyonu için kullanılan açıklama SeoSayfaBaslik = "Başlık" // SEO   optimizasyonu için kullanılan sayfa başlığı
   };
   urunServis.SaveKategori("U15saQ48dW453X1cA",eklenecekKategori);

```

  3. ## **SelectMarka** {#selectmarka}

  Service Method signature:**SelectMarka(string** **And of course,** **int** **mark\_id)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| markaID | Unique key (id) of the brand whose information is requested |

  If brandID is sent as "0", it returns information for all brands; if the "id" of a specific brand is entered, it returns information for that brand.

  The data type of the returned information is the list of the "Brand" class. Example usage:
  ```
    // Bütün markaları çekmek için
List<UrunServis.Marka> markalar = urunServis.SelectMarka("U15saQ48dW453X1cA", 0); foreach (var marka in markalar)
{
Console.WriteLine("Marka Adı: " + marka.Tanim); Console.WriteLine("Marka id: " + marka.ID);
}
// Tek bir markayı çekmek için
List<UrunServis.Marka> tekMarka = urunServis.SelectMarka("U15saQ48dW453X1cA", 53); Console.WriteLine("Marka Adı: " + tekMarka[0].Tanim); Console.WriteLine("Marka ID: " + tekMarka[0].ID);


  ```

  4. ## **SaveMarka** {#savemarka}

  Service Method signature:**SaveMarka(string** **And of course,** **So** **when)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| when | "Brand" class that carries brand information |

  Example usage:

  ```
    // Marka alanları. "*" işaretli alanlar zorunludur.
UrunServis.Marka eklenecekMarka = new UrunServis.Marka
{
ID = 0, //* 0 ise yeni marka ekler, sıfırdan büyük ise o id'ye sahip olan markayı günceller. Aktif = true, // * Aktif pasif durumu, aktif olacaksa "true" pasif olacaksa "false" olarak gönderiniz.
Tanim = "Giyim", // * Marka Adı
SeoAnahtarKelime = "giysi giyim", // SEO optimizasyonu için kullanılan kelimeler SeoSayfaAciklama = "Açıklama", // SEO optimizasyonu için kullanılan açıklama SeoSayfaBaslik = "Başlık" // SEO optimizasyonu için kullanılan sayfa başlığı
};
urunServis.SaveMarka("U15saQ48dW453X1cA", eklenecekMarka);

  ```

  5. ## **SelectTedarikci** {#selecttedarikci}

  Service Method signature:**SelectTedarikci(string** **And of course,** **int** **supplierID)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| supplierID | Unique key (id) of the supplier whose information is requested |

  If supplierID is sent as "0", it returns the information of all suppliers, the "id" of a particular supplier

  if entered the supplier's information returns.

  The data type of the returned information is the list of the "Supplier" class. Example usage:
  ```
    // Bütün tedarikçileri çekmek için
List<UrunServis.Tedarikci> tedarikciler = urunServis.SelectTedarikci("U15saQ48dW453X1cA", 0); foreach (var tedarikci in tedarikciler)
{
Console.WriteLine("Tedarikçi Adı: " + tedarikci.Tanim); Console.WriteLine("Tedarikçi id: " + tedarikci.ID);
}
// Tek bir tedarikçiyi çekmek için
List<UrunServis.Tedarikci> tekTedarikci = urunServis.SelectTedarikci("U15saQ48dW453X1cA", 3); Console.WriteLine("Tedarikçi Adı: " + tekTedarikci[0].Tanim); Console.WriteLine("Tedarikçi id: " + tekTedarikci[0].ID);

  ```

  6. ## **SaveTedarikci** {#savetedarikci}

  Service Method signature:**SaveTedarikci(string** **And of course,** **Supplier** **supplier)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| supplier | “Supplier” class that carries supplier information |

  Example use:

  ```
  // Tedarikçi alanları. "*" işaretli alanlar zorunludur.
UrunServis.Tedarikci eklenecekTedarikci = new UrunServis.Tedarikci
{
ID = 0, //* 0 ise yeni tedarikçi ekler, sıfırdan büyük ise o id'ye sahip olan tedarikçiyi günceller.
Aktif = true, // * Aktif pasif durumu, aktif olacaksa "true" pasif olacaksa "false" olarak gönderiniz.
Tanim = "Tedarikçi", // * Tedarikçi Adı
Mail = "admin@mail.com", // Tedarikçi mail adresi Not = "Not" // Tedarikçiye yazılan not
};
urunServis.SaveTedarikci("U15saQ48dW453X1cA", eklenecekTedarikci);
```

  7. ## **SelectParaBirimi** {#selectparabirimi}

  Service Method signature:**SelectParaBirimi(string** **And of course,** **int** **ParaBirimiID)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| ParaBirimiID | Knowledge the desired Currency unique key(id) |

  If CurrencyID is sent as "0", it returns information for all currencies; if the "id" of a specific currency is entered, it returns information for that currency.

  The data type of the returned information is the list of the "Currency" class. Example usage:
  ```
  // Bütün parabirimlerini çekmek için
List<UrunServis.ParaBirimi> parabirimleri = urunServis.SelectParaBirimi("U15saQ48dW453X1cA", 0); foreach (var parabirimi in parabirimleri)
{
Console.WriteLine("Parabirimi Adı: " + parabirimi.Tanim); Console.WriteLine("Parabirimi id: " + parabirimi.ID);
}
// Tek bir parabirimini çekmek için
List<UrunServis.ParaBirimi> tekParabirimi = urunServis.SelectParaBirimi("U15saQ48dW453X1cA", 2); Console.WriteLine("Parabirimi Adı: " + tekParabirimi[0].Tanim); Console.WriteLine("Parabirimi id: " + tekParabirimi[0].ID);


  ```

  8. ## **SaveParaBirimi** {#saveparabirimi}

  Service Method signature:**SaveParaBirimi(string** **And of course,** **ParaBirimi** **parasite)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| parapirimi | "Currency" class that carries currency information |

  Example usage:
  ```
  // Parabirimi alanları. "*" işaretli alanlar zorunludur.
UrunServis.ParaBirimi eklenecekParaBirimi = new UrunServis.ParaBirimi
{
ID = 0, //* 0 ise yeni parabirimi ekler, sıfırdan büyük ise o id'ye sahip olan parabirimini günceller.
Aktif = true, // * Aktif pasif durumu, aktif olacaksa "true" pasif olacaksa "false" olarak gönderiniz.
Tanim = "EURO", // * Parabirimi adı DovizKodu = "EUR", // Parabirimi kodu Kur = 2.546, // Döviz Kuru
};
urunServis.SaveParaBirimi("U15saQ48dW453X1cA", eklenecekParaBirimi);


  ```

  9. ## **SelectUrun** {#selecturun}

  Service Method signature:**SelectUrun(string** **And of course,** **UrunFilter** **f,** **DaySayfalama** **s)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| f | “ProductFilter” class that carries product filtering information |
| s | “ProductPagination” class that provides product pagination |

  Example usage:
  ```
  // Ürün çekme
// Filtre değerleri :
// -1 : Filtre yok
// 0 : false
// 1 : true
// Bu değerler 'Aktif','Firsat','indirimli' ve 'Vitrin' için geçerlidir.
UrunServis.UrunFiltre urunFiltre = new UrunServis.UrunFiltre
{
Aktif = -1,
Firsat = -1,
Indirimli = -1,
Vitrin = -1,
KategoriID = 10, // 0 gönderilirse filtre yapılmaz.
MarkaID = 0, // 0 gönderilirse filtre yapılmaz.
UrunKartiID = 0 //0 gönderilirse filtre yapılmaz.
// Entegrasyon koduna göre çekmek isterseniz aşağıdakileri ekleyebilirsiniz.
// EntegrasyonDegerTanim = "Deger",
// EntegrasyonKodu = "kod",
};
// Sayfalama
UrunServis.UrunSayfalama urunSayfalama = new UrunServis.UrunSayfalama
{
BaslangicIndex = 0, // Başlangıç değeri
KayitSayisi = 100, // Bir sayfada görüntülenecek ürün sayısı SiralamaDegeri = "ID", // Hangi sütuna göre sıralanacağı SiralamaYonu = "ASC" // Artan "ASC", azalan "DESC"
};
List<UrunServis.UrunKarti> urunler = urunServis.SelectUrun("U15saQ48dW453X1cA", urunFiltre, urunSayfalama);
foreach (var urun in urunler)
{
Console.WriteLine("Ürün Adı : " + urun.UrunAdi); Console.WriteLine("Ürün Markası : " + urun.Marka);
}

```


  10. ## **SelectUrunCount** {#selecturuncount}

  Service Method signature:**SelectUrunCount(string** **And of course,** **UrunFilter** **f)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| f | “ProductFilter” class that carries product filtering information |

  Example use:

  ```
// Ürün sayısını çekme
// Filtre değerleri :
// -1 : Filtre yok
// 0 : false
// 1 : true
// Bu değerler 'Aktif','Firsat','indirimli' ve 'Vitrin' için geçerlidir.
UrunServis.UrunFiltre urunFiltreCount = new UrunServis.UrunFiltre
{
Aktif = -1,
Firsat = -1,
Indirimli = -1,
Vitrin = -1,
KategoriID = 10, // 0 gönderilirse filtre yapılmaz.
MarkaID = 0, // 0 gönderilirse filtre yapılmaz.
UrunKartiID = 0 //0 gönderilirse filtre yapılmaz.
// Entegrasyon koduna göre çekmek isterseniz aşağıdakileri ekleyebilirsiniz.
// EntegrasyonDegerTanim = "Deger",
// EntegrasyonKodu = "kod",
};
int urunSayisi = urunServis.SelectUrunCount("U15saQ48dW453X1cA", urunFiltreCount);

  ```

  11. ## **SaveUrun** {#saveurun}

  **SaveUrun(string** **And of course,** **ref** **UrunCards** **product cards,** **UrunKartiAyar** **uk Verse,** **VariationSetting** **vAyar)**

|  | Parameter Descriptions |  |  |
| :---- | ----- | :---- | :---- |
|  | **Parameters** | **Explanation** |  |
|  | And Kodu | Password provided by the service provider |  |
|  | ref UrunCards | "ProductCards" class, which contains product card information |  |
|  | uk Verse | "ProductCardSetting" class that contains product card setting information |  |
|  | vAyar | The "VariationSetting" class, which contains the variation setting information |  |
```
// Product Adding
// Category IDs to which the product belongsList<int> categoryIDS = new List<int>(); categoryIDS.Add(15); categoryIDS.Add(65); categoryIDS.Add(50);
// The product picture links
List<string> Picture Links = new List<string>(); imageLinks.Add("http://www.siteniz.com/resim1.png"); imageLinks.Add("http://www.siteniz.com/resim2.png");
// Product variations features specification
List<UrunServis.Variation Feature> features = new List<UrunServis.Variation Feature>(); properties.Add(new UrunServis.Variation Feature{ Plant = "Number", Value = "38"}); properties.Add(new UrunServis.Variation Feature{ Plant = "Colour", Value = "Blue"});
// Product variations picture links
List<string> variationPictures = new List<string>(); variationImages.Add("http://www.siteniz.com/varyasyonluResim.png"); variationImages.Add("http://www.siteniz.com/varyasyonluResim2.png"); variationImages.Add("http://www.siteniz.com/varyasyonluResim3.png");
// Specify product variations. At least one variation is required!
UrunServis.Variation variation1 = new UrunServis.Variation
{
ID = 0, //* 0 whereas new variations adds, if greater than zero the id'ye owner which is variation updates.

 

Active = true, AlisFiyati = 10, Barkod = "BARKOD", Although = 1,
KargoUcreti = 0, KdvDahil = false, KdvOrani = 18, Features = features, ParaBirimiID = 1, // *
Pictures = variationPictures, Satisfiyati = 100,
StockAdded = 15, StockCode = "CODE"
};
List<UrunServis.Variation> variations = new List<UrunServis.Variation>(); variations.Add(variation1);
// Product Card fields. Fields marked "*" are required.
UrunServis.UrunKarti urunKarti1 = new UrunServis.UrunKarti
{
ID = 0, // 0 whereas new Adds a product card, if it is greater than zero, the product card with that id
updates.
Active = true, // *
UrunAdi = "Product Name", // * Explanation = "Explanation", // *
AnaKategori = "Main Category name", // * Breadcrumbs will also be used
AnaCategoryID = 50, // * Breadcrumbs will also be used
Categories = categoryIDS, // * MarkaID = 12, // *
SupplierID = 1, // *
Pictures = image links, // * SatisOne = "Piece", // * Free Shipping = true, // * OnYazi = "Preface",
PuanDeger = 12,
SeoAnahtarKelime = "word word2", SeoSayfaAciklama = "Explanation", SeoSayfaBaslik = "Title", Variations = variations, // * Showcase = true,
YeniUrun = true
};
// Adding the Product Card to the list
List<UrunServis.UrunKarti> Product Cards = new List<UrunServis.UrunKarti>(); urunKartlari.Add(urunKarti1);
// Product Card settings.
UrunServis.UrunKartiAyar uk Verse = new UrunServis.UrunKartiAyar
{
DescriptionUpdate = true, ActiveUpdate = true, FBStoreGosterGuncelle = false, OpportunityProductUpdate = true, CategoryGuncell = false, MaksTaksitSayisiGuncelle = false, Brand Guncell = false, OnYaziGüncel = false, ParaPuanGuncelle = true, SatisBirimiGuncelle = false, SeoAnahtarKelimeGunce = false, SeoSayfaAciklamaGuncelle = false, SeoSayfaBaslikGuncelle = false, Supplier Update = false, Free Shipping Update = true, Product Name Current = true, UrunResimGuncelle = false, VitrinGuncelle = false, YeniUrunGuncelle = true
};

// Varyasyon ayarları.
UrunServis.VaryasyonAyar varyasyonAyar = new UrunServis.VaryasyonAyar
{
AktifGuncelle = false, AlisFiyatiGuncelle = true, BarkodGuncelle = false, IndirimliFiyatiGuncelle = true, KargoUcretiGuncelle = false, KargoAgirligiGuncelle = true, ParaBirimiGuncelle = false, PiyasaFiyatiGuncelle = true, SatisFiyatiGuncelle = false, StokAdediGuncelle = true, UyeTipiFiyat1Guncelle = false, UyeTipiFiyat2Guncelle = true, UyeTipiFiyat3Guncelle = false, UyeTipiFiyat4Guncelle = true, UyeTipiFiyat5Guncelle = false TedarikciKodunaGoreGuncelle = false
};
// Ürünü ekliyoruz.
urunServis.SaveUrun("U15saQ48dW453X1cA", ref urunKartlari, ukAyar, varyasyonAyar);


```

2. # **Order Service**

   Service address : [**http://www.alanadiniz.com/Servis/SiparisServis**](http://www.alanadiniz.com/Servis/SiparisServis)**.svc**

   This service inside methods:

* [Receiving order information (*SelectSiparis*)](#selectsiparis)

* [Receiving order payment information (*SelectSiparisOdeme*)](#selectsiparisodeme)  
* [Receiving order product information (*SelectSiparisUrun*)](#selectsiparisurun)  
* [Save an order (SavePayment)](#savesiparis)

  1. **SelectSiparis**

  Service Method signature:**SelectSiparis(string** **And of course,** **WebSiparisFiltre** **f,** **WebSiparisSayfalama** **s)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| f | The "WebSiparisFiltre" class, which contains the order filter information |
| s | "WebOrderPaging" class that contains order pagination information |

| Payment Status Variables |  |
| ----- | :---- |
| **Value** | **Meaning** |
| 0 | Approval Waiting |
| 1 | Approved |
| 2 | Incorrect |
| 3 | Returned |
| 4 | Cancelled |

| Payment Type Variables |  |
| ----- | :---- |
| **Value** | **Meaning** |
| 0 | Credit card |
| 1 | Transfer |
| 2 | Cash on Delivery |

| 3 | Payment at the Door Credit Card |
| :---: | :---- |
| 4 | Car Payment |
| 6 | PayPal |
| 7 | Search |
| 8 | Mail Order |
| 9 | cream |
| 10 | found |

| Order Status Variables |  |
| ----- | :---- |
| **Value** | **Meaning** |
| 0 | Pre-order |
| 1 | Approval Waiting |
| 2 | Approved |
| 3 | Payment Waiting |
| 4 | Packing |
| 5 | Supply It is being done |
| 6 | To the cargo Given |
| 7 | Delivery It was done |
| 8 | Cancelled |
| 9 | Returned |

Example usage:

```
// SiparisServis adlı değişken Service Reference olarak eklenmiştir.
SiparisServis.SiparisServisClient siparisServis = new SiparisServis.SiparisServisClient();
// Sipariş filtresini belirliyoruz.
// Filtre değerleri için yukardaki tablolara bakınız.
SiparisServis.WebSiparisFiltre siparisFiltre = new SiparisServis.WebSiparisFiltre
{
EntegrasyonAktarildi = -1,
EntegrasyonParams = new SiparisServis.WebSiparisEntegrasyon
{
EntegrasyonKodu = "Kod", Tanim = "Tanim"
},
OdemeDurumu = 1,
OdemeTipi = 2,
SiparisDurumu = 9,
SiparisID = 33,
SiparisTarihiBas = new DateTime(2014,3,18), SiparisTarihiSon = new DateTime(2014,10,1), UyeID = 11
};
// Sipariş sayfalamasını belirliyoruz
SiparisServis.WebSiparisSayfalama siparisSayfalama = new SiparisServis.WebSiparisSayfalama
{
BaslangicIndex = 0, // Başlangıç değeri
KayitSayisi = 100, // Bir sayfada görüntülenecek ürün sayısı SiralamaDegeri = "ID", // Hangi sütuna göre sıralanacağı SiralamaYonu = "ASC" // Artan "ASC", azalan "DESC"
};
// Siparişleri çekiyoruz
List<SiparisServis.WebSiparis> siparisler = siparisServis.SelectSiparis("U15saQ48dW453X1cA", siparisFiltre, siparisSayfalama);
foreach (var siparis in siparisler)
{
Console.WriteLine("Durum = " + siparis.Durum); Console.WriteLine("Fatura Adresi = " + siparis.FaturaAdresi);
}


```

2. ## **SelectSiparisOdeme** {#selectsiparisodeme}

   Service Method signature:**SelectSiparisOdeme(string** **And of course,** **int** **siparisId,** **int** **odemeId)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| siparisId | Order unique key “id” |
| odemeId | Payment unique key “id” |

   The "paymentId" parameter is not required. It is sent as 0\. Example usage:
   ```
   List<SiparisServis.WebSiparisOdeme> siparisOdemeleri = siparisServis.SelectSiparisOdeme("U15saQ48dW453X1cA", 22, 0); foreach (var siparisOdemesi in siparisOdemeleri)
{
Console.WriteLine("Komisyon : " + siparisOdemesi.BankaKomisyonu); Console.WriteLine("Kapıda Ödeme Tutarı : " + siparisOdemesi.KapidaOdemeTutari); Console.WriteLine("Ödeme Tarihi : " + siparisOdemesi.Tarih);
}

```

   3. ## **SelectSiparisUrun** {#selectsiparisurun}

   Service Method signature:**SelectSiparisUrun(string** **And of course,** **int** **siparisId)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| siparisId | Order unique key “id” |

   Example usage:
```
// Sipariş ürünlerini çekiyoruz List<SiparisServis.WebSiparisUrun> siparisUrunleri = siparisServis.SelectSiparisUrun("U15saQ48dW453X1cA", 22); foreach (var siparisUrun in siparisUrunleri)
{
Console.WriteLine("Adet : " + siparisUrun.Adet); Console.WriteLine("Kdv Oranı : " + siparisUrun.KdvOrani); Console.WriteLine("Ürün ID : " + siparisUrun.UrunID);
}

```
4. ## **SaveSiparis** {#savesiparis}

   Service Method signature:**SaveSiparis** **(string** **And of course,** **WebSiparisSaveRequest** **req)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| req | The "WebSiparisSaveRequest" class that contains the order information |

   Example usage:
   ```
   WebSiparisSaveRequest req = new WebSiparisSaveRequest();
req.UyeId = 1; // Sipariş veren kullanıcının üye id’si. Üyenin maili ile SelectUyeler metodundan üye id’si bulunabilir.
req.FaturaAdresId = 1; // SaveUyeAdres metodu ile üyenin adresi kayıt edilip dönen id numarası bu kısma yazılabilir.
req.KargoAdresId = 1; // SaveUyeAdres metodu ile üyenin adresi kayıt edilip dönen id numarası bu kısma yazılabilir.
// Fatura ve teslimat adresi aynı ise kargo adres id ve fatura adres id aynı olabilir. req.KargoFirmaId = 1; // Ticimax site yönetim panelindenki kargo yönetiminden kargo id’sini öğrenebilirsiniz.
req.SiparisKaynagi = "Entegrasyon"; // Siparişin geldiği yer
req.Urunler = new List<WebSiparisSaveUrun>();

// Ürün bilgisi
WebSiparisSaveUrun reqUrun = new WebSiparisSaveUrun(); reqUrun.Adet = 2; // Ürün adedi
reqUrun.KdvTutari = 1.72; // Ürün kdv tutarı reqUrun.Tutar = 18.28; // Kdv hariç ürün tutarı reqUrun.UrunID = 325; // Sitedeki varyasyon id’si req.Urunler.Add(reqUrun);
// Sipariş tutar bilgileri
req.UrunTutari = req.Urunler.Sum(u => u.Tutar *	u.Adet); req.UrunTutariKdv = req.Urunler.Sum(u => u.KdvTutari * u.Adet);

// Ödeme bilgileri
req.Odeme = new WebSiparisSaveOdeme(); req.Odeme.OdemeDurumu = 1;
req.Odeme.OdemeTipi = 10;
req.Odeme.Tarih = new DateTime(2015,6,10); req.Odeme.Tutar = req.UrunTutari + req.UrunTutariKdv;

var resp = siparisServis.SaveSiparis("U15saQ48dW453X1cA", req); if (!resp.IsError)
Console.WriteLine("Sipariş kaydedildi.");
else
Console.WriteLine("Siparişi kaydedilemedi. Hata mesajı : " + resp.ErrorMessage);
```

3. # **Member** **Service**

   Service address : [**http://www.alanadiniz.com/Servis/UyeServis**](http://www.alanadiniz.com/Servis/UyeServis)**.svc**

   This service inside methods:

* Member login method (Login)

* Member listing method (SelectUyeler)  
* Member save method (SaveUye)

* Member address save (SaveUyeAdres)

  1. ## **GirisYap**

  Service Method signature:**GreeceYap (And Greece** **and)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| and | The "UyeGirisi" class, which contains the member login information |

  Example usage:
  ```
  // UyeServis adlı değişken Service Reference olarak eklenmiştir.
UyeServis.UyeServisClient uyeServis = new UyeServis.UyeServisClient();
// Giriş bilgilerini oluşturuyoruz
UyeServis.UyeGirisi giris = new UyeServis.UyeGirisi
{
Mail = "admin@ticimax.net", Sifre = "11111111111"
};
// Giriş yapıyoruz
UyeServis.UyeGirisiSonuc sonuc = uyeServis.GirisYap(giris); if (sonuc.Basarili)
{
Console.WriteLine("Ad : " + sonuc.Isim); Console.WriteLine("ID : " + sonuc.KullaniciID);
}

```

  2. ## **SelectUyeler**

  Service Method signature:**SelectUyeler** **(string** **And of course,** **WebUye** **and)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| filtered | Filtered knowledge "UyeFilter" class that carries |
| pagination | "UserPaging" class that carries the pagination information |

  Example usage:
  ```
  // Filtre
UyeFiltre uf = new UyeFiltre(); uf.Aktif = -1;
uf.AlisverisYapti = -1;
uf.Cinsiyet = -1;
uf.MailIzin = -1;
uf.SmsIzin = -1;
uf.Mail = "admin@admin.com";
var uye = uyeServis.SelectUyeler("U15saQ48dW453X1cA", uf, null).FirstOrDefault();

```

  3. ## **SaveUye**

  Service Method signature:**SaveUye** **(string** **And of course,** **And** **and,** **UyeAyar** **adjustment)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| and | "WebUye" class that carries member information |
| UyeAyar | Member registration setting |

  Example usage:
  ```
    // Üye bilgileri
Uye uye = new Uye();
uye.Mail = "admin@ticimax.net"; uye.Sifre = "123456";
uye.Isim = "Admin"; uye.Soyisim = "Ticimax";
uye.DogumTarihi = new DateTime(1990, 10, 21);
uye.Telefon = "2122587892";
uye.CepTelefonu = "587953211";
uye.CinsiyetID = 1; // 1: Erkek, 0: Kadın
uye.MailIzin = 1; // 1: İzin verildi, 0: İzin verilmedi uye.SmsIzin = 1; // 1: İzin verildi, 0: İzin verilmedi uyeServis.SaveUye("U15saQ48dW453X1cA", uye, new UyeAyar());

  ```

  4. ## **SaveUyeAdres**

  Service Method signature:**SaveUyeAdres** **(string** **And of course,** **UyeAdres** **address)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| address | The "UserAddress" class that carries the address information |

  Example usage:
  ```
  UyeAdres fAdres = new UyeAdres(); adres.Adres = "Adres mah."; adres.Aktif = true; adres.AliciAdi = "Ad soyad";
adres.AliciTelefon = "2245551648"; adres.FirmaAdi = adres.AliciAdi; adres.Ilce = "Ataşehir"; adres.Sehir = "İstanbul"; adres.Tanim = "Adres";
adres.Ulke = "Türkiye"; adres.UyeId = 1;
int adresID = uyeServis.SaveUyeAdres("U15saQ48dW453X1cA", adres);
  ```

4. # **CustomServis**

   Service address : [**http://www.alanadiniz.com/Servis/CustomServis**](http://www.alanadiniz.com/Servis/CustomServis)**.svc**

   This service inside methods:

* Integration save (*SaveEntegrasyonId*)  
* Integration knowledge to take   (*SelectEntegrasyonId*)

  1. ## **SaveEntegrasyonId**

  Service Method signature:**SaveEntegrasyonId(string** **And of course,** **Integration** **integration)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| integration | “Integration” class that carries the integration information |

  Example Usage:
  ```
// CustomServis adlı değişken Service Reference olarak eklenmiştir.
CustomServis.CustomServisClient customClient = new CustomServis.CustomServisClient();
// Entegrasyon bilgilerini oluşturuyoruz
CustomServis.Entegrasyon entegrasyon = new CustomServis.Entegrasyon
{
EntegrasyonKodu = "ERP", // Entegrasyon yapılacak program adı TabloAlan = "TICIMAXURUNID", // Ticimax tarafındaki sütun adı AlanDeger = "53", // Ticimax tarafındaki sütun değeri
Tanim = "ERPSTOKID", // Program tarafındaki sütun adı
Deger = "101298", // Program tarafındaki sütun değeri
};
// Entegrasyonu kaydediyoruz customClient.SaveEntegrasyonId("U15saQ48dW453X1cA", entegrasyon);

  ```

  2. ## **SelectEntegrasyonId**

  Service Method signature:**SelectEntegrasyonId(string** **And of course,** **Integration** **integration)**

| Parameter Descriptions |  |
| ----- | :---- |
| **Parameters** | **Explanation** |
| And Kodu | Password provided by the service provider |
| integration | “Integration” class that carries the integration information |

  Example Use:
  ```
// Çekmek istediğimiz “Deger” alanına göre Entegrasyon oluşturuyoruz.
CustomServis.Entegrasyon entegrasyon = new CustomServis.Entegrasyon
{
EntegrasyonKodu = "ERP", // Entegrasyon yapılacak program adı TabloAlan = "TICIMAXURUNID", // Ticimax tarafındaki sütun adı AlanDeger = "53", // Ticimax tarafındaki sütun değeri
Tanim = "ERPSTOKID", // Program tarafındaki sütun adı
};
// Değeri çekiyoruz
String erpStokId = customClient.SelectEntegrasyonId("U15saQ48dW453X1cA", entegrasyon); Console.WriteLine(erpStokId); // erpStokId = 101298

  ```

Ticimax Bilişim Teknolojileri A.Ş. reserves the right to make changes in the services.