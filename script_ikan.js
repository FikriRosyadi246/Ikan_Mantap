// Managemen state belanja virtual (Keranjang)
let totalItem = 0;
let totalHarga = 0;

const SemuaTombol = document.querySelectorAll(".btn-tambah");
const domTotalItem = document.getElementById("total-item");
const domTotalHarga = document.getElementById("total-harga");
const boxKeranjang = document.getElementById("keranjang-info");

SemuaTombol.forEach(function(tombol) {
    tombol.addEventListener("click", function () {
        // Ambil data harga dari elemen tombol atribut data-*
        const hargaProduk = parseInt(tombol.getAttribute("data-harga"));
        
        // Update data hitungan belanjaan
        totalItem += 1;
        totalHarga += hargaProduk;

        // Render perubahan ke layar HTML
        domTotalItem.textContent = totalItem;
        domTotalHarga.textContent = "Rp " + totalHarga.toLocaleString("id-ID");

        // Tampilkan kotak ringkasan belanjaan kalau item > 0
        if (totalItem > 0) {
            boxKeranjang.style.display = "block";
        }

        // Efek transisi umpan balik visual tombol
        tombol.textContent = "✅ Ditambahkan";
        tombol.style.backgroundColor = "#22c55e"; // Warna Hijau Sukses Sementara
        tombol.style.color = "#ffffff";

        setTimeout(function() {
            tombol.textContent = "+ Tambah";
            tombol.style.backgroundColor = ""; // Reset ke CSS bawaan awal
            tombol.style.color = "";
        }, 1200);
    });
});

// Penanganan submit Formulir Kontak
const formkontak = document.getElementById("form-kontak");
const pesanSukses = document.getElementById("pesan-sukses");

formkontak.addEventListener("submit", function(event) {
    event.preventDefault(); 
    pesanSukses.style.display = "block";
    formkontak.reset();

    setTimeout(function() {
        pesanSukses.style.display = "none";
    }, 6000); // Durasi notifikasi dipercepat jadi 6 detik biar ideal
});