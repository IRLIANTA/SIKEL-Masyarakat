import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { Ico } from "./Icons.jsx";
import { periksaAlur } from "./util.jsx";

const NODE_KOSONG = { kode: "", tipe: "tanya", judul: "", isi: "", tingkat: "internal" };

function BarisOpsi({ o, nodes, onSimpan, onHapus }) {
  const [v, setV] = useState(o);
  const ubah = v.teks !== o.teks || v.ke !== o.ke || Number(v.urutan) !== o.urutan;
  return (
    <div className="opsi-row">
      <input aria-label="Teks pilihan" value={v.teks} onChange={(e) => setV({ ...v, teks: e.target.value })} />
      <select aria-label="Menuju langkah" value={v.ke} onChange={(e) => setV({ ...v, ke: e.target.value })}>{nodes.map((n) => <option key={n.kode} value={n.kode}>{n.kode} · {n.judul}</option>)}</select>
      <input aria-label="Urutan" className="urut" type="number" value={v.urutan} onChange={(e) => setV({ ...v, urutan: e.target.value })} />
      <button className="btn sm" disabled={!ubah} onClick={() => onSimpan(v)}>Simpan</button>
      <button className="btn sm del" onClick={() => onHapus(o.id)} aria-label="Hapus pilihan"><Ico n="trash" size={15} /></button>
    </div>
  );
}

export default function AdminAlur() {
  const [nodes, setNodes] = useState(null);
  const [opsi, setOpsi] = useState([]);
  const [edit, setEdit] = useState(null); // { baru, data }
  const [pesan, setPesan] = useState("");
  const [baru, setBaru] = useState({ teks: "", ke: "", urutan: 0 });

  const muat = async () => {
    const [n, o] = await Promise.all([supabase.from("alur_node").select("*").order("created_at"), supabase.from("alur_opsi").select("*").order("urutan")]);
    if (n.error || o.error) return setPesan("Gagal memuat: " + (n.error || o.error).message);
    setNodes(n.data); setOpsi(o.data);
  };
  useEffect(() => { muat(); }, []);

  const simpanNode = async (e) => {
    e.preventDefault(); setPesan("");
    const f = edit.data;
    if (edit.baru && !/^[a-z0-9_-]+$/.test(f.kode)) return setPesan("Kode hanya boleh huruf kecil, angka, garis bawah, atau tanda hubung (tanpa spasi).");
    if (!f.judul.trim()) return setPesan("Judul wajib diisi.");
    const body = { tipe: f.tipe, judul: f.judul.trim(), isi: f.tipe === "hasil" ? f.isi : "", tingkat: f.tipe === "hasil" ? f.tingkat : "" };
    const q = edit.baru ? supabase.from("alur_node").insert({ kode: f.kode, ...body }) : supabase.from("alur_node").update(body).eq("kode", f.kode);
    const { error } = await q;
    if (error) return setPesan(error.code === "23505" ? "Kode itu sudah dipakai langkah lain." : "Gagal menyimpan: " + error.message);
    await muat();
    setEdit({ baru: false, data: { ...f, ...body } });
    setPesan("Tersimpan.");
  };
  const hapusNode = async (n) => {
    if (!confirm(`Hapus langkah "${n.judul}"? Pilihan yang berasal dari langkah ini ikut terhapus.`)) return;
    const { error } = await supabase.from("alur_node").delete().eq("kode", n.kode);
    if (error) return setPesan(error.code === "23503" ? "Masih ada pilihan dari langkah lain yang menuju langkah ini. Ubah atau hapus pilihan itu dulu." : "Gagal menghapus: " + error.message);
    setPesan(""); muat();
  };
  const simpanOpsi = async (v, dari) => {
    if (!v.teks.trim()) return setPesan("Teks pilihan wajib diisi.");
    if (!v.ke) return setPesan("Pilih langkah tujuan.");
    const body = { teks: v.teks.trim(), ke: v.ke, urutan: Number(v.urutan) || 0 };
    const q = v.id ? supabase.from("alur_opsi").update(body).eq("id", v.id) : supabase.from("alur_opsi").insert({ dari, ...body });
    const { error } = await q;
    if (error) return setPesan("Gagal menyimpan pilihan: " + error.message);
    setPesan(""); if (!v.id) setBaru({ teks: "", ke: "", urutan: 0 }); muat();
  };
  const hapusOpsi = async (id) => {
    const { error } = await supabase.from("alur_opsi").delete().eq("id", id);
    if (error) setPesan("Gagal menghapus pilihan: " + error.message); else { setPesan(""); muat(); }
  };

  if (!nodes) return <>{pesan && <div className="alert" role="alert">{pesan}</div>}<div className="spin" role="status" aria-label="Memuat" /></>;

  if (edit) {
    const f = edit.data, tersimpan = nodes.find((n) => n.kode === f.kode);
    const setF = (k, v) => setEdit({ ...edit, data: { ...f, [k]: v } });
    const pil = opsi.filter((o) => o.dari === f.kode);
    return (
      <>
        <div className="head"><h2>{edit.baru ? "Tambah langkah" : "Ubah langkah"}</h2><button className="btn ghost" onClick={() => { setEdit(null); setPesan(""); }}><Ico n="back" size={18} />Kembali ke daftar</button></div>
        <form className="card" onSubmit={simpanNode}>
          <div className="row2">
            <label>Kode (pengenal unik)<input required readOnly={!edit.baru} value={f.kode} onChange={(e) => setF("kode", e.target.value.trim())} placeholder="contoh: keluhan_berat" /></label>
            <label>Jenis langkah<select value={f.tipe} onChange={(e) => setF("tipe", e.target.value)}><option value="tanya">Pertanyaan (punya pilihan)</option><option value="hasil">Hasil (saran akhir)</option></select></label>
          </div>
          <label>{f.tipe === "tanya" ? "Pertanyaan" : "Judul saran"}<input required value={f.judul} onChange={(e) => setF("judul", e.target.value)} /></label>
          {f.tipe === "hasil" && (
            <>
              <label>Isi saran<textarea rows="6" value={f.isi} onChange={(e) => setF("isi", e.target.value)} /></label>
              <label>Jenis rujukan<select value={f.tingkat} onChange={(e) => setF("tingkat", e.target.value)}><option value="internal">Konsultasi dengan petugas (internal)</option><option value="eksternal">Rujukan ke fasilitas kesehatan (eksternal)</option></select></label>
            </>
          )}
          {pesan && <div className={"alert" + (pesan === "Tersimpan." ? " ok" : "")} role="alert">{pesan}</div>}
          <div className="actions"><button className="btn">Simpan langkah</button></div>
        </form>

        {tersimpan && tersimpan.tipe === "tanya" && (
          <div className="card" style={{ marginTop: 20 }}>
            <h3>Pilihan jawaban</h3>
            <p className="muted small">Setiap pilihan mengarah ke langkah lain. Urutan kecil tampil lebih dulu.</p>
            {pil.map((o) => <BarisOpsi key={`${o.id}-${o.teks}-${o.ke}-${o.urutan}`} o={o} nodes={nodes} onSimpan={(v) => simpanOpsi(v, f.kode)} onHapus={hapusOpsi} />)}
            <div className="opsi-row baru">
              <input aria-label="Teks pilihan baru" placeholder="Teks pilihan baru" value={baru.teks} onChange={(e) => setBaru({ ...baru, teks: e.target.value })} />
              <select aria-label="Menuju langkah" value={baru.ke} onChange={(e) => setBaru({ ...baru, ke: e.target.value })}><option value="">Pilih tujuan...</option>{nodes.map((n) => <option key={n.kode} value={n.kode}>{n.kode} · {n.judul}</option>)}</select>
              <input aria-label="Urutan" className="urut" type="number" value={baru.urutan} onChange={(e) => setBaru({ ...baru, urutan: e.target.value })} />
              <button className="btn sm" onClick={() => simpanOpsi(baru, f.kode)}><Ico n="plus" size={15} />Tambah</button>
            </div>
          </div>
        )}
        {edit.baru && f.tipe === "tanya" && <p className="muted small" style={{ marginTop: 12 }}>Simpan langkah ini dulu, lalu pilihan jawabannya bisa ditambahkan.</p>}
      </>
    );
  }

  const isu = periksaAlur(nodes, opsi);
  return (
    <>
      <div className="head"><div><h2>Alur konseling dan rujukan</h2><p className="muted">Langkah dengan kode "mulai" adalah awal alur yang dilihat pengunjung.</p></div><button className="btn" onClick={() => { setPesan(""); setEdit({ baru: true, data: NODE_KOSONG }); }}><Ico n="plus" size={18} />Tambah langkah</button></div>
      {pesan && <div className="alert" role="alert">{pesan}</div>}
      <div className={"card cek-alur " + (isu.length ? "" : "ok")}>
        <h3>{isu.length ? "Perlu diperbaiki" : "Alur sudah lengkap"}</h3>
        {isu.length ? <ul className="plain">{isu.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="muted" style={{ margin: 0 }}>Semua langkah dapat dicapai dan setiap pertanyaan memiliki pilihan.</p>}
      </div>
      <div className="card tabel" style={{ marginTop: 20 }}><table>
        <thead><tr><th>Kode</th><th>Jenis</th><th>Judul</th><th>Pilihan</th><th>Aksi</th></tr></thead>
        <tbody>{nodes.map((n) => (
          <tr key={n.kode}><td><code>{n.kode}</code></td>
            <td><span className={"pill " + (n.tipe === "hasil" ? (n.tingkat === "eksternal" ? "gelap" : "") : "pudar")}>{n.tipe === "tanya" ? "Pertanyaan" : n.tingkat === "eksternal" ? "Hasil, eksternal" : "Hasil, internal"}</span></td>
            <td>{n.judul}</td><td>{n.tipe === "tanya" ? opsi.filter((o) => o.dari === n.kode).length : "-"}</td>
            <td><div className="actions"><button className="btn sm ghost" onClick={() => { setPesan(""); setEdit({ baru: false, data: n }); }}><Ico n="edit" size={15} />Ubah</button><button className="btn sm del" onClick={() => hapusNode(n)} aria-label={"Hapus " + n.judul}><Ico n="trash" size={15} /></button></div></td></tr>))}
          {!nodes.length && <tr><td colSpan="5" className="muted">Belum ada langkah.</td></tr>}</tbody>
      </table></div>
    </>
  );
}
