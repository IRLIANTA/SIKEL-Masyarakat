export const amanUrl = (u) => /^https?:\/\//i.test(u || "");

export const youtubeEmbed = (u) => {
  try {
    const x = new URL(u);
    let id = "";
    if (x.hostname.includes("youtu.be")) id = x.pathname.slice(1);
    else if (x.hostname.includes("youtube.com")) id = x.searchParams.get("v") || (/^\/(embed|shorts)\//.test(x.pathname) ? x.pathname.split("/")[2] : "");
    return /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : "";
  } catch { return ""; }
};

// Menampilkan teks biasa: paragraf dipisah baris kosong, baris berawalan "- " menjadi daftar
export function Teks({ isi }) {
  const blok = (isi || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blok.map((b, i) => {
        const grup = [];
        b.split("\n").forEach((l) => {
          const li = l.startsWith("- ");
          const teks = li ? l.slice(2) : l;
          const akhir = grup[grup.length - 1];
          if (akhir && akhir.li === li) akhir.baris.push(teks); else grup.push({ li, baris: [teks] });
        });
        return (
          <div key={i}>
            {grup.map((g, j) => g.li
              ? <ul key={j} className="plain">{g.baris.map((x, k) => <li key={k}>{x}</li>)}</ul>
              : <p key={j}>{g.baris.join(" ")}</p>)}
          </div>
        );
      })}
    </>
  );
}

export const pesanLogin = (e) => {
  const c = e.code || "", m = (e.message || "").toLowerCase();
  if (c === "invalid_credentials" || m.includes("invalid login")) return "Email atau kata sandi salah.";
  if (c === "email_not_confirmed" || m.includes("not confirmed")) return "Email akun ini belum dikonfirmasi. Di Supabase buka Authentication, Users, lalu konfirmasi akunnya.";
  if (c === "over_request_rate_limit" || e.status === 429) return "Terlalu banyak percobaan masuk. Tunggu beberapa menit lalu coba lagi.";
  if (m.includes("fetch") || m.includes("network") || e.status === 0) return "Tidak dapat terhubung ke server. Periksa koneksi internet dan nilai VITE_SUPABASE_URL.";
  return "Gagal masuk: " + e.message;
};

// Pemeriksaan alur konseling: mengembalikan daftar masalah
export const periksaAlur = (nodes, opsi) => {
  const isu = [];
  const kode = new Set(nodes.map((n) => n.kode));
  if (!kode.has("mulai")) isu.push('Belum ada langkah berkode "mulai" sebagai awal alur.');
  nodes.filter((n) => n.tipe === "tanya" && !opsi.some((o) => o.dari === n.kode)).forEach((n) => isu.push(`Langkah "${n.judul}" belum memiliki pilihan.`));
  if (kode.has("mulai")) {
    const lihat = new Set(["mulai"]), antre = ["mulai"];
    while (antre.length) {
      const k = antre.shift();
      opsi.filter((o) => o.dari === k).forEach((o) => { if (!lihat.has(o.ke)) { lihat.add(o.ke); antre.push(o.ke); } });
    }
    nodes.filter((n) => !lihat.has(n.kode)).forEach((n) => isu.push(`Langkah "${n.judul}" tidak dapat dicapai dari awal alur.`));
  }
  return isu;
};
