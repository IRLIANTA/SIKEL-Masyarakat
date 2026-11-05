import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { Ico } from "./Icons.jsx";

const LABEL = { internal: "Konsultasi dengan petugas", eksternal: "Rujukan ke fasilitas kesehatan" };

export default function Alur() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [jejak, setJejak] = useState(["mulai"]);

  useEffect(() => {
    (async () => {
      const [n, o] = await Promise.all([supabase.from("alur_node").select("*"), supabase.from("alur_opsi").select("*").order("urutan")]);
      if (n.error || o.error) return setErr((n.error || o.error).message);
      setD({ nodes: n.data, opsi: o.data });
    })();
  }, []);

  if (err) return <div className="alert">Alur konseling gagal dimuat. {err}</div>;
  if (!d) return <div className="spin" role="status" aria-label="Memuat" />;
  const node = d.nodes.find((x) => x.kode === jejak[jejak.length - 1]);
  if (!node) return <div className="alert">Alur konseling belum tersedia.</div>;
  const pilihan = d.opsi.filter((o) => o.dari === node.kode);
  const riwayat = jejak.slice(1).map((k, i) => d.opsi.find((o) => o.dari === jejak[i] && o.ke === k)?.teks).filter(Boolean);

  return (
    <div className="alur">
      {riwayat.length > 0 && <ol className="riwayat" aria-label="Pilihan Anda">{riwayat.map((t, i) => <li key={i}>{t}</li>)}</ol>}
      {node.tipe === "tanya" ? (
        <div className="card">
          <h3 className="tanya">{node.judul}</h3>
          <div className="opts">
            {pilihan.map((o) => <button key={o.id} className="opt" onClick={() => setJejak([...jejak, o.ke])}><span>{o.teks}</span><Ico n="arrow" size={18} /></button>)}
            {!pilihan.length && <p className="muted">Belum ada pilihan untuk langkah ini.</p>}
          </div>
        </div>
      ) : (
        <div className={"card hasil " + (node.tingkat || "internal")}>
          <span className={"pill " + (node.tingkat === "eksternal" ? "gelap" : "")}>{LABEL[node.tingkat] || "Saran"}</span>
          <h3 className="tanya">{node.judul}</h3>
          <p>{node.isi}</p>
          <p className="muted small">Panduan ini bersifat edukasi dan bukan pengganti pemeriksaan tenaga kesehatan. Dalam keadaan darurat, segera ke fasilitas kesehatan terdekat.</p>
        </div>
      )}
      <div className="actions">
        {jejak.length > 1 && <button className="btn ghost" onClick={() => setJejak(jejak.slice(0, -1))}><Ico n="back" size={18} />Kembali</button>}
        {jejak.length > 1 && <button className="btn ghost" onClick={() => setJejak(["mulai"])}><Ico n="refresh" size={18} />Mulai ulang</button>}
      </div>
    </div>
  );
}
