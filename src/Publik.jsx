import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";
import { Ico } from "./Icons.jsx";
import { Teks, amanUrl, youtubeEmbed } from "./util.jsx";
import Alur from "./Alur.jsx";

const JENIS = [["semua", "Semua"], ["artikel", "Artikel"], ["infografis", "Infografis"], ["video", "Video"]];
const IKON = { artikel: "book", infografis: "image", video: "play" };
const gulir = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

function Detail({ item, onTutup }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (item && !d.open) d.showModal();
    if (!item && d.open) d.close();
  }, [item]);
  const embed = item?.jenis === "video" ? youtubeEmbed(item.media_url) : "";
  return (
    <dialog ref={ref} className="modal" onClose={onTutup} onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      {item && (
        <div className="modal-body">
          <button className="modal-x" onClick={() => ref.current.close()} aria-label="Tutup"><Ico n="x" /></button>
          <div className="meta"><span className="pill">{item.kategori}</span><span className="jenis">{item.jenis}</span></div>
          <h2>{item.judul}</h2>
          {item.ringkasan && <p className="lead">{item.ringkasan}</p>}
          {embed && <div className="video"><iframe src={embed} title={item.judul} allowFullScreen loading="lazy" /></div>}
          {item.jenis === "infografis" && amanUrl(item.media_url) && <img className="info-img" src={item.media_url} alt={item.judul} />}
          {item.jenis === "infografis" && !item.media_url && <div className="info-teks"><Teks isi={item.isi} /></div>}
          {item.jenis !== "infografis" && <Teks isi={item.isi} />}
          {item.jenis === "infografis" && item.media_url && item.isi && <Teks isi={item.isi} />}
        </div>
      )}
    </dialog>
  );
}

export default function Publik() {
  const [konten, setKonten] = useState(null);
  const [sosial, setSosial] = useState([]);
  const [err, setErr] = useState("");
  const [jenis, setJenis] = useState("semua");
  const [kat, setKat] = useState("Semua");
  const [buka, setBuka] = useState(null);

  useEffect(() => {
    (async () => {
      const [k, s] = await Promise.all([
        supabase.from("kie_konten").select("*").eq("terbit", true).order("urutan").order("created_at"),
        supabase.from("tautan_sosial").select("*").order("urutan"),
      ]);
      if (k.error) return setErr(k.error.message);
      setKonten(k.data); setSosial((s.data || []).filter((x) => amanUrl(x.url)));
    })();
  }, []);

  const kategori = ["Semua", ...new Set((konten || []).map((k) => k.kategori))];
  const daftar = (konten || []).filter((k) => (jenis === "semua" || k.jenis === jenis) && (kat === "Semua" || k.kategori === kat));

  return (
    <>
      <header className="top">
        <div className="wadah top-bar">
          <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><span className="logo-mark">S</span>SIKEL Keluarga</button>
          <nav aria-label="Menu utama">
            <button onClick={() => gulir("edukasi")}>Edukasi</button>
            <button onClick={() => gulir("konseling")}>Konseling</button>
            {sosial.length > 0 && <button onClick={() => gulir("kontak")}>Media sosial</button>}
          </nav>
        </div>
      </header>

      <main>
        <section className="wadah">
          <div className="hero">
            <div>
              <span className="badge">Demo portofolio · bukan situs resmi BKKBN</span>
              <h1>Keluarga sehat dan terencana dimulai dari informasi yang tepat</h1>
              <p>Baca edukasi singkat tentang keluarga, kesehatan ibu dan anak, serta keluarga berencana. Bingung harus berbuat apa? Ikuti alur konseling untuk mengetahui langkah berikutnya.</p>
              <div className="actions">
                <button className="btn light" onClick={() => gulir("edukasi")}>Baca edukasi</button>
                <button className="btn outline-light" onClick={() => gulir("konseling")}>Cek alur konseling</button>
              </div>
            </div>
            <ul className="hero-poin">
              <li><Ico n="book" /><span>Artikel dan infografis yang mudah dipahami</span></li>
              <li><Ico n="chat" /><span>Alur konseling langkah demi langkah</span></li>
              <li><Ico n="shield" /><span>Penjelasan kapan perlu ke fasilitas kesehatan</span></li>
            </ul>
          </div>
        </section>

        <section className="wadah sec" id="edukasi">
          <div className="sec-head"><h2>Edukasi keluarga</h2><p className="muted">Pilih topik yang ingin Anda pelajari.</p></div>
          {err && <div className="alert">Konten gagal dimuat. {err}</div>}
          {!konten && !err && <div className="spin" role="status" aria-label="Memuat" />}
          {konten && (
            <>
              <div className="tabs" role="group" aria-label="Jenis konten">{JENIS.map(([k, n]) => <button key={k} className="tab" aria-pressed={jenis === k} onClick={() => setJenis(k)}>{n}</button>)}</div>
              <div className="tabs kecil" role="group" aria-label="Kategori">{kategori.map((k) => <button key={k} className="tab" aria-pressed={kat === k} onClick={() => setKat(k)}>{k}</button>)}</div>
              <div className="grid">
                {daftar.map((k) => (
                  <article className="kartu" key={k.id}>
                    <div className="thumb">{k.jenis === "infografis" && amanUrl(k.media_url) ? <img src={k.media_url} alt="" loading="lazy" /> : <Ico n={IKON[k.jenis]} size={34} />}</div>
                    <div className="kartu-body">
                      <div className="meta"><span className="pill">{k.kategori}</span><span className="jenis">{k.jenis}</span></div>
                      <h3><button className="judul-btn" onClick={() => setBuka(k)}>{k.judul}</button></h3>
                      <p className="muted">{k.ringkasan}</p>
                      <span className="baca">Baca selengkapnya <Ico n="arrow" size={16} /></span>
                    </div>
                  </article>
                ))}
              </div>
              {!daftar.length && <p className="muted">Belum ada konten pada pilihan ini.</p>}
            </>
          )}
        </section>

        <section className="wadah sec" id="konseling">
          <div className="sec-head"><h2>Alur konseling dan rujukan</h2><p className="muted">Jawab pertanyaan satu per satu untuk melihat langkah yang disarankan.</p></div>
          <Alur />
        </section>

        {sosial.length > 0 && (
          <section className="wadah sec" id="kontak">
            <div className="sec-head"><h2>Ikuti kami di media sosial</h2></div>
            <div className="actions">{sosial.map((s) => <a key={s.id} className="btn ghost" href={s.url} target="_blank" rel="noopener noreferrer"><Ico n="link" size={18} />{s.nama}</a>)}</div>
          </section>
        )}
      </main>

      <footer className="foot">
        <div className="wadah">
          <p>Informasi di website ini bersifat edukasi dan bukan pengganti pemeriksaan atau saran tenaga kesehatan.</p>
          <p className="muted">© 2026 Irlianta · Demo portofolio, bukan situs resmi BKKBN · <a href="#admin">Admin</a></p>
        </div>
      </footer>
      <Detail item={buka} onTutup={() => setBuka(null)} />
    </>
  );
}
