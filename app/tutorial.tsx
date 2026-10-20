import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UiCard } from '@/components/ui-card';
import { Brand } from '@/constants/theme';

type TabType = 'ember' | 'ekoenzim' | 'pakan';

export default function TutorialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('ember');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const url = 'https://drive.google.com/file/d/1i7Loa3DjEUn__asOsbJXI8ML_mbzqhnY/view?usp=sharing';
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error(error);
      Alert.alert('Gagal', 'Terjadi kesalahan saat membuka buku pedoman.');
    } finally {
      setDownloading(false);
    }
  };

  // Eko Enzim Calculator State
  const [waterVolume, setWaterVolume] = useState('1000'); // ml
  const calculateIngredients = (volumeMl: number) => {
    const water = volumeMl;
    const sugar = Math.round(volumeMl / 10);
    const organic = Math.round(sugar * 3);
    return { water, sugar, organic };
  };

  const calc = calculateIngredients(parseFloat(waterVolume) || 0);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="flex-row items-center border-b border-gray-100 bg-white px-4 pb-4"
        style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          className="-ml-2 rounded-full p-2 active:bg-gray-100"
          hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Brand.green} />
        </Pressable>
        <Text className="ml-2 text-lg font-bold text-gray-900">Buku Pedoman E-KOMPAK</Text>
      </View>

      {/* Navigation Tabs */}
      <View className="bg-white px-4 py-2 flex-row gap-2 border-b border-gray-100">
        <Pressable
          onPress={() => setActiveTab('ember')}
          className={`flex-1 flex-row items-center justify-center py-2.5 px-1 rounded-xl border ${
            activeTab === 'ember'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-white border-gray-200'
          }`}>
          <MaterialIcons
            name="compost"
            size={18}
            color={activeTab === 'ember' ? Brand.green : Brand.muted}
          />
          <Text
            className={`ml-1 text-base font-bold ${
              activeTab === 'ember' ? 'text-emerald-800' : 'text-gray-600'
            }`}>
            Ember Tumpuk
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('ekoenzim')}
          className={`flex-1 flex-row items-center justify-center py-2.5 px-1 rounded-xl border ${
            activeTab === 'ekoenzim'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-white border-gray-200'
          }`}>
          <MaterialIcons
            name="science"
            size={18}
            color={activeTab === 'ekoenzim' ? Brand.blue.text : Brand.muted}
          />
          <Text
            className={`ml-1 text-base font-bold ${
              activeTab === 'ekoenzim' ? 'text-blue-800' : 'text-gray-600'
            }`}>
            Eko Enzim
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('pakan')}
          className={`flex-1 flex-row items-center justify-center py-2.5 px-1 rounded-xl border ${
            activeTab === 'pakan'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-gray-200'
          }`}>
          <MaterialIcons
            name="pets"
            size={18}
            color={activeTab === 'pakan' ? Brand.amber.text : Brand.muted}
          />
          <Text
            className={`ml-1 text-base font-bold ${
              activeTab === 'pakan' ? 'text-amber-800' : 'text-gray-600'
            }`}>
            Pakan Ternak
          </Text>
        </Pressable>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerClassName="p-4 pb-12" showsVerticalScrollIndicator={false}>
        {/* Download PDF Card */}
        <UiCard className="mb-4 p-4 border-emerald-100 bg-emerald-50/20 flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-bold text-emerald-800">Buku Pedoman Lengkap (PDF)</Text>
            <Text className="text-base text-gray-700 mt-0.5 leading-relaxed">
              Unduh dan pelajari buku panduan lengkap pengelolaan sampah organik E-KOMPAK secara offline.
            </Text>
          </View>
          <Pressable
            onPress={handleDownloadPdf}
            disabled={downloading}
            className="flex-row items-center gap-1.5 bg-emerald-700 px-3.5 py-2.5 rounded-xl active:opacity-90 disabled:opacity-50">
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="file-download" size={18} color="#fff" />
            )}
            <Text className="text-xs font-bold text-white">
              {downloading ? 'Membuka...' : 'Buka PDF'}
            </Text>
          </Pressable>
        </UiCard>
        {/* Tab 1: Ember Tumpuk */}
        {activeTab === 'ember' && (
          <View className="gap-4">
            {/* Info Card */}
            <UiCard className="p-4 border-emerald-100 bg-emerald-50/20">
              <Text className="text-xl font-bold text-emerald-800 mb-1">
                Apa itu Ember Tumpuk?
              </Text>
              <Text className="text-lg leading-relaxed text-gray-800">
                Teknologi praktis mengolah sampah organik rumah tangga menggunakan dua ember bertumpuk. Ember atas menyaring sampah padat (menghasilkan kompos), sedangkan ember bawah menampung cairan hasil pembusukan (menghasilkan lindi cair super subur).
              </Text>
            </UiCard>

            {/* Alat & Bahan */}
            <UiCard className="p-4 border-gray-200">
              <Text className="text-xl font-bold text-gray-900 mb-3">
                🛠️ Alat & Bahan yang Diperlukan
              </Text>
              <View className="gap-2">
                <View className="flex-row items-start">
                  <Text className="text-emerald-600 font-bold mr-2">•</Text>
                  <Text className="text-base text-gray-700 flex-1">
                    <Text className="font-bold text-gray-800">2 Buah Ember Plastik:</Text> Ukuran sama (disarankan ember cat bekas 20-25 kg) lengkap dengan tutupnya.
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-emerald-600 font-bold mr-2">•</Text>
                  <Text className="text-base text-gray-700 flex-1">
                    <Text className="font-bold text-gray-800">Keran Air Kecil:</Text> Tipe dispenser lengkap dengan seal karet agar tidak bocor.
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-emerald-600 font-bold mr-2">•</Text>
                  <Text className="text-base text-gray-700 flex-1">
                    <Text className="font-bold text-gray-800">Bor Listrik/Paku Besar:</Text> Untuk melubangi dasar ember atas.
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-emerald-600 font-bold mr-2">•</Text>
                  <Text className="text-base text-gray-700 flex-1">
                    <Text className="font-bold text-gray-800">Bahan Pendukung:</Text> Sampah organik basah (sisa dapur), sampah kering (daun kering/sekam) sebagai penyeimbang kelembapan.
                  </Text>
                </View>
              </View>
            </UiCard>

            {/* Panduan Perakitan & Proses */}
            <UiCard className="p-4 border-gray-200">
              <Text className="text-xl font-bold text-gray-900 mb-3">
                📖 Langkah Pembuatan & Operasional
              </Text>

              <View className="gap-4">
                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-emerald-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Melubangi Ember Atas</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Buatlah 15-20 lubang kecil (diameter 2-5mm) pada bagian dasar ember pertama. Lubang ini berfungsi mengalirkan air lindi ke ember bawah serta menyaring sampah padat agar tidak ikut jatuh.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-emerald-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Memasang Keran Ember Bawah</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Lubangi bagian samping ember kedua (bawah) setinggi 5cm dari dasar ember. Pasang keran air dispenser secara presisi dengan seal karet di sisi dalam dan luar agar air lindi tidak merembes.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-emerald-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">3</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Penyusunan & Pengisian Awal</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Tumpuk ember atas ke dalam ember bawah secara rapat. Sebelum memasukkan sampah organik harian, sebarkan daun kering atau sekam padi setebal 5cm di dasar ember atas untuk membantu penyerapan dan saringan awal.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-emerald-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">4</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Pemeliharaan Rutin</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Masukkan sampah dapur organik secara bertahap. Setiap memasukkan sampah baru, semprotkan bioaktivator (seperti cairan EM4 encer) lalu taburkan sejumput bahan kering. Pastikan tutup ember selalu terpasang sangat rapat.
                    </Text>
                  </View>
                </View>
              </View>
            </UiCard>

            {/* Tips & Pemecahan Masalah */}
            <UiCard className="p-4 border-amber-100 bg-amber-50/20">
              <Text className="text-xl font-bold text-amber-800 mb-2">
                ⚠️ Masalah Umum & Solusi
              </Text>
              <View className="gap-2">
                <Text className="text-lg text-gray-800 leading-relaxed">
                  • <Text className="font-bold text-amber-900">Bau busuk menyengat / belatung berlebih:</Text> Berarti kondisi terlalu basah (kelembaban berlebih). Taburkan daun kering, sekam, atau sedikit serbuk kayu untuk menyerap kelebihan air lalu aduk perlahan.
                </Text>
                <Text className="text-lg text-gray-800 leading-relaxed">
                  • <Text className="font-bold text-amber-900">Lindi macet:</Text> Cek apakah lubang filter tersumbat endapan padat. Gunakan kayu kecil secara hati-hati dari atas untuk melonggarkan sumbatan.
                </Text>
              </View>
            </UiCard>

            {/* Panen */}
            <UiCard className="p-4 border-emerald-200">
              <Text className="text-xl font-bold text-emerald-800 mb-2">
                🌱 Cara Panen & Penggunaan Hasil
              </Text>
              <View className="gap-3">
                <View>
                  <Text className="text-lg font-bold text-gray-950">1. Pupuk Organik Cair (Lindi):</Text>
                  <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                    Dapat dipanen berkala lewat keran bawah setelah 2-3 minggu. Encerkan cairan lindi dengan air bersih menggunakan rasio 1:20 (1 bagian lindi dengan 20 bagian air) sebelum disiramkan langsung ke tanah dekat akar tanaman.
                  </Text>
                </View>
                <View>
                  <Text className="text-lg font-bold text-gray-950">2. Kompos Padat:</Text>
                  <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                    Bila ember atas sudah penuh, biarkan mengendap selama 2-4 minggu. Kompos dinyatakan matang bila berwarna kehitaman seperti tanah, remah (remuk jika diremas), dingin, dan tidak berbau busuk.
                  </Text>
                </View>
              </View>
            </UiCard>
          </View>
        )}

        {/* Tab 2: Eko Enzim */}
        {activeTab === 'ekoenzim' && (
          <View className="gap-4">
            {/* Info Card */}
            <UiCard className="p-4 border-blue-100 bg-blue-50/20">
              <Text className="text-xl font-bold text-blue-800 mb-1">
                Apa itu Eko Enzim?
              </Text>
              <Text className="text-lg leading-relaxed text-gray-800">
                Cairan serbaguna hasil fermentasi limbah kulit buah dan sayur segar dengan campuran gula merah/molase dan air bersih. Proses pematangan membutuhkan waktu minimal 3 bulan di bawah kondisi anaerob.
              </Text>
            </UiCard>

            {/* Golden Ratio */}
            <UiCard className="p-4 border-blue-200 bg-blue-50/10">
              <Text className="text-xl font-bold text-blue-800 mb-2">
                ⚖️ Rasio Emas Eko Enzim
              </Text>
              <View className="flex-row justify-around items-center bg-white p-3 rounded-xl border border-blue-100">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-blue-600">1</Text>
                  <Text className="text-base text-gray-800 font-bold">Gula Aren / Molase</Text>
                </View>
                <Text className="text-gray-400 font-bold text-lg">:</Text>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-blue-600">3</Text>
                  <Text className="text-base text-gray-800 font-bold">Bahan Organik</Text>
                </View>
                <Text className="text-gray-400 font-bold text-lg">:</Text>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-blue-600">10</Text>
                  <Text className="text-base text-gray-800 font-bold">Air Bersih</Text>
                </View>
              </View>
              <Text className="text-[11px] text-gray-500 mt-2 text-center">
                *Hindari gula pasir putih. Gunakan hanya kulit buah/sayur segar dan tidak berjamur.
              </Text>
            </UiCard>

            {/* Interactive Calculator */}
            <UiCard className="p-4 border-blue-100">
              <Text className="text-xl font-bold text-gray-900 mb-2">
                🧮 Kalkulator Resep Praktis
              </Text>
              <Text className="text-base text-gray-700 mb-3">
                Masukkan perkiraan volume air bersih untuk menghitung porsi gula dan bahan organik.
              </Text>
              <View className="flex-row items-center gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-800 mb-1">Volume Air (ml):</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={waterVolume}
                    onChangeText={setWaterVolume}
                    className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-lg font-bold text-gray-950"
                    placeholder="Contoh: 1000"
                  />
                </View>
              </View>
              <View className="bg-gray-50 rounded-xl p-3 gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-base text-gray-700">Gula Aren/Molase:</Text>
                  <Text className="text-lg font-bold text-gray-950">{calc.sugar} gram</Text>
                </View>
                <View className="flex-row justify-between items-center border-t border-gray-200/60 pt-2">
                  <Text className="text-base text-gray-700">Bahan Organik (Kulit Buah/Sayur):</Text>
                  <Text className="text-lg font-bold text-gray-950">{calc.organic} gram</Text>
                </View>
                <View className="flex-row justify-between items-center border-t border-gray-200/60 pt-2">
                  <Text className="text-base text-gray-700">Air Bersih:</Text>
                  <Text className="text-sm font-bold text-blue-600">{calc.water} ml</Text>
                </View>
              </View>
            </UiCard>

            {/* Langkah Pembuatan */}
            <UiCard className="p-4 border-gray-200">
              <Text className="text-xl font-bold text-gray-900 mb-3">
                📖 Langkah-Langkah Pembuatan
              </Text>
              <View className="gap-4">
                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Persiapan Wadah Plastik</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Gunakan wadah bermulut lebar dari bahan plastik elastis. Jangan gunakan kaca karena rawan retak/pecah akibat tekanan gas tinggi di dalam botol/ember.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Melarutkan Gula</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Masukkan air bersih ke dalam wadah, lalu masukkan gula aren/molase sesuai takaran kalkulator. Aduk perlahan hingga larut sempurna.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">3</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Menambahkan Bahan Organik</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Potong kecil kulit buah dan sayuran agar luas permukaan reaksi bertambah. Masukkan potongan kulit buah ke larutan gula. Sisakan minimal 20-30% ruang kosong di bagian atas wadah untuk kantong gas.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">4</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Fermentasi & Pelepasan Gas</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Tutup wadah dengan sangat rapat dan tempelkan label tanggal pembuatan. Selama satu bulan pertama, buka tutup botol secara perlahan setiap pagi untuk membuang gas CO2, lalu tutup rapat kembali. Simpan di tempat teduh.
                    </Text>
                  </View>
                </View>
              </View>
            </UiCard>

            {/* Indikator Keberhasilan */}
            <UiCard className="p-4 border-emerald-100 bg-emerald-50/20">
              <Text className="text-xl font-bold text-emerald-800 mb-2">
                ✨ Indikator Eko Enzim Sukses
              </Text>
              <View className="gap-2">
                <Text className="text-lg text-gray-800 leading-relaxed">
                  ✔ <Text className="font-bold">Aroma Segar:</Text> Memiliki aroma asam segar khas fermentasi buah, bukan aroma busuk got.
                </Text>
                <Text className="text-lg text-gray-800 leading-relaxed">
                  ✔ <Text className="font-bold">Warna Cokelat Cerah:</Text> Cairan berwarna cokelat tua kemerahan atau cokelat muda cerah.
                </Text>
                <Text className="text-lg text-gray-800 leading-relaxed">
                  ✔ <Text className="font-bold">Jamur Pitera:</Text> Terkadang ada lapisan putih halus di permukaan, ini merupakan tanda yang sangat bagus.
                </Text>
              </View>
            </UiCard>
          </View>
        )}

        {/* Tab 3: Pakan Ternak */}
        {activeTab === 'pakan' && (
          <View className="gap-4">
            {/* Info Card */}
            <UiCard className="p-4 border-amber-100 bg-amber-50/20">
              <Text className="text-xl font-bold text-amber-800 mb-1">
                Apa itu Pakan Ayam Tambahan?
              </Text>
              <Text className="text-lg leading-relaxed text-gray-800">
                Inovasi pakan bernutrisi hemat biaya dengan memadukan sisa sayuran pasar/dapur yang masih bersih dengan roti afkir (reject pabrik/toko) dan dedak katul.
              </Text>
            </UiCard>

            {/* Bahan Utama */}
            <UiCard className="p-4 border-gray-200">
              <Text className="text-xl font-bold text-gray-900 mb-3">
                🥦 Komposisi Bahan Utama
              </Text>
              <View className="gap-3">
                <View className="flex-row items-center justify-between bg-gray-50 p-2.5 rounded-xl">
                  <Text className="text-base font-bold text-gray-800">Sayuran Hijau Segar</Text>
                  <Text className="text-base font-bold text-amber-900">Kangkung, Sawi, Bayam</Text>
                </View>
                <View className="flex-row items-center justify-between bg-gray-50 p-2.5 rounded-xl">
                  <Text className="text-base font-bold text-gray-800">Roti Afkir</Text>
                  <Text className="text-base font-bold text-amber-900">Tanpa bumbu/tanpa isi selai</Text>
                </View>
                <View className="flex-row items-center justify-between bg-gray-50 p-2.5 rounded-xl">
                  <Text className="text-base font-bold text-gray-800">Bahan Pengikat</Text>
                  <Text className="text-base font-bold text-amber-900">Dedak Padi / Katul Halus</Text>
                </View>
              </View>
            </UiCard>

            {/* Panduan Pembuatan */}
            <UiCard className="p-4 border-gray-200">
              <Text className="text-xl font-bold text-gray-900 mb-3">
                📖 Langkah-Langkah Pembuatan
              </Text>
              <View className="gap-4">
                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-amber-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Sterilisasi & Pencucian</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Cuci bersih sayuran sisa di bawah air mengalir untuk meluruhkan kotoran tanah atau residu pestisida kimia. Tiriskan airnya.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-amber-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Pencacahan Halus</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Cacah sayuran sekecil mungkin (sekitar 0.5 - 1 cm) agar mudah dikonsumsi ayam. Sobek-sobek roti afkir menjadi serpihan kecil-kecil.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-amber-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">3</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Penyeduhan & Pengukusan</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Campurkan cacahan sayuran, roti sobek, dan dedak padi dengan perbandingan 2:2:1 dalam ember tahan panas. Siram air mendidih secukupnya lalu aduk hingga lembap agar sayur menjadi lunak dan steril.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-amber-600 items-center justify-center">
                    <Text className="text-white text-sm font-bold">4</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-950">Pemberian Pakan Segar</Text>
                    <Text className="text-lg text-gray-800 mt-1.5 leading-relaxed">
                      Setelah adonan dingin, pakan siap disajikan ke ayam ternak. Anda bisa menambahkan 1 tetes eko enzim yang dilarutkan ke air minum ayam untuk melancarkan pencernaan.
                    </Text>
                  </View>
                </View>
              </View>
            </UiCard>

            {/* Catatan Penting */}
            <UiCard className="p-4 border-rose-100 bg-rose-50/20">
              <Text className="text-xl font-bold text-red-800 mb-2">
                🚨 Aturan Keamanan Pakan
              </Text>
              <View className="gap-2">
                <Text className="text-lg text-gray-800 leading-relaxed">
                  • <Text className="font-bold text-red-900">Jangan simpan pakan basah:</Text> Pakan basah ini harus langsung dihabiskan oleh ayam dalam waktu 2-3 jam. Jika tersisa, segera buang ke ember tumpuk agar tidak basi dan menimbulkan lalat pembawa kuman.
                </Text>
                <Text className="text-lg text-gray-800 leading-relaxed">
                  • <Text className="font-bold text-red-900">Hindari Roti Berjamur:</Text> Jangan sekali-kali memberikan roti yang sudah tumbuh jamur hitam/hijau karena beracun bagi pencernaan unggas.
                </Text>
              </View>
            </UiCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
