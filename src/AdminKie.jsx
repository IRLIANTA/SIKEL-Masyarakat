import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { Ico } from "./Icons.jsx";
import { amanUrl, youtubeEmbed } from "./util.jsx";

const KOSONG = { judul: "", kategori: "", jenis: "artikel", ringkasan: "", isi: "", media_url: "", terbit: true, urutan: 0 };
const KATEGORI_UMUM = ["Stunting", "Remaja", "KB", "Keluarga", "Lansia"];

export default function AdminKie() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);
  const [unggah, setUnggah] = useState(false);

  const muat = async () => {
    const { data: d, error } = await supabase.from("kie_konten").select("*").order("urutan").order("created_at");
    if (error) setPesan("Gagal memuat: " + error.message); else setData(d);
  };
  useEffect(() => { muat(); }, []);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const kategori = [...new Set([...KATEGORI_UMUM, ...(data || []).map((x) => x.kategori)])];

  const simpan = async (e) => {
    e.preventDefault(); setPesan("");
    const f = form;
    if (!f.judul.trim() || !f.kategori.trim()) return setPesan("Judul dan kategori wajib diisi.");
    if (f.jenis === "video" && !youtubeEmbed(f.media_url)) return setPesan("Isi tautan YouTube yang valid (youtube.com atau youtu.be).");
    if (f.jenis === "infografis" && f.media_url && !amanUrl(f.media_url)) return setPesan("Tautan gambar harus diawali https://");
    const body = { judul: f.judul.trim(), kategori: f.kategori.trim(), jenis: f.jenis, ringkasan: f.ringkasan.trim(), isi: f.isi, media_url: f.jenis === "artikel" ? "" : f.media_url.trim(), terbit: !!f.terbit, urutan: Number(f.urutan) || 0 };
    setProses(true);
    const q = f.id ? supabase.from("kie_konten").update(body).eq("id", f.id) : supabase.from("kie_konten").insert(body);
    const { error } = await q;
    setProses(false);
    if (error) return setPesan("Gagal menyimpan: " + error.message);
    setForm(null); muat();
  };
  const hapus = async (x) => {
    if (!confirm(`Hapus "${x.judul}"?`)) return;
    const { error } = await supabase.from("kie_konten").delete().eq("id", x.id);
    if (error) setPesan("Gagal menghapus: " + error.message); else { setPesan(""); muat(); }
  };
  const ubahTerbit = async (x) => {
    const { error } = await supabase.from("kie_konten").update({ terbit: !x.terbit }).eq("id", x.id);
    if (error) setPesan("Gagal mengubah status: " + error.message); else { setPesan(""); muat(); }
  };
  const pilihFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setPesan("Format gambar harus PNG, JPG, atau WEBP.");
    if (file.size > 3 * 1024 * 1024) return setPesan("Ukuran gambar maksimal 3 MB.");
    setUnggah(true); setPesan("");
    const nama = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
    const { error } = await supabase.storage.from("kie").upload(nama, file, { contentType: file.type });
    setUnggah(false);
    if (error) return setPesan("Gagal mengunggah: " + error.message);
    const { data: u } = supabase.storage.from("kie").getPublicUrl(nama);
    setForm((f) => ({ ...f, media_url: u.publicUrl }));
  };

  if (form) return (
    <>
      <div className="head"><h2>{form.id ? "Ubah konten" : "Tambah konten"}</h2></div>
      <form className="card" onSubmit={simpan}>
        <div className="row2">
          <label>Judul<input required value={form.judul} onChange={(e) => set("judul", e.target.value)} /></label>
          <label>Jenis<select value={form.jenis} onChange={(e) => set("jenis", e.target.value)}><option value="artikel">Artikel</option><option value="infografis">Infografis</option><option value="video">Video</option></select></label>
        </div>
        <div className="row2">
          <label>Kategori<input required list="kategori" value={form.kategori} onChange={(e) => set("kategori", e.target.value)} /><datalist id="kategori">{kategori.map((k) => <option key={k} value={k} />)}</datalist></label>
          <label>Urutan tampil<input type="number" value={form.urutan} onChange={(e) => set("urutan", e.target.value)} /></label>
        </div>
        <label>Ringkasan singkat<input value={form.ringkasan} onChange={(e) => set("ringkasan", e.target.value)} /></label>
        {form.jenis === "video" && <label>Tautan YouTube<input placeholder="https://www.youtube.com/watch?v=..." value={form.media_url} onChange={(e) => set("media_url", e.target.value)} /></label>}
        {form.jenis === "infografis" && (
          <fieldset><legend>Gambar infografis (opsional)</legend>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pilihFile} disabled={unggah} />
            <p className="muted small">PNG, JPG, atau WEBP, maksimal 3 MB. {unggah && "Mengunggah..."}</p>
            <label>Atau tempel tautan gambar<input placeholder="https://..." value={form.media_url} onChange={(e) => set("media_url", e.target.value)} /></label>
            {amanUrl(form.media_url) && <img className="pratinjau" src={form.media_url} alt="Pratinjau infografis" />}
            <p className="muted small">Tanpa gambar, isi di bawah ditampilkan sebagai kartu poin.</p>
          </fieldset>
        )}
        <label>Isi
          <textarea rows="12" value={form.isi} onChange={(e) => set("isi", e.target.value)} />
        </label>
        <p className="muted small">Pisahkan paragraf dengan satu baris kosong. Awali baris dengan tanda "- " untuk membuat daftar poin.</p>
        <label className="cek"><input type="checkbox" checked={form.terbit} onChange={(e) => set("terbit", e.target.checked)} />Terbitkan (tampil di website)</label>
        {pesan && <div className="alert" role="alert">{pesan}</div>}
        <div className="actions"><button className="btn" disabled={proses || unggah}>{proses ? "Menyimpan..." : "Simpan"}</button><button type="button" className="btn ghost" onClick={() => { setForm(null); setPesan(""); }}>Batal</button></div>
      </form>
    </>
  );

  return (
    <>
      <div className="head"><div><h2>Konten edukasi</h2><p className="muted">Artikel, infografis, dan video yang tampil di website.</p></div><button className="btn" onClick={() => { setPesan(""); setForm(KOSONG); }}><Ico n="plus" size={18} />Tambah konten</button></div>
      {pesan && <div className="alert" role="alert">{pesan}</div>}
      {!data ? <div className="spin" role="status" aria-label="Memuat" /> : (
        <div className="card tabel"><table>
          <thead><tr><th>Judul</th><th>Jenis</th><th>Kategori</th><th>Status</th><th>Urutan</th><th>Aksi</th></tr></thead>
          <tbody>{data.map((x) => (
            <tr key={x.id}><td>{x.judul}</td><td>{x.jenis}</td><td>{x.kategori}</td>
              <td><span className={"pill " + (x.terbit ? "" : "pudar")}>{x.terbit ? "Terbit" : "Draf"}</span></td><td>{x.urutan}</td>
              <td><div className="actions">
                <button className="btn sm ghost" onClick={() => { setPesan(""); setForm({ ...KOSONG, ...x }); }}><Ico n="edit" size={15} />Ubah</button>
                <button className="btn sm ghost" onClick={() => ubahTerbit(x)}>{x.terbit ? "Sembunyikan" : "Terbitkan"}</button>
                <button className="btn sm del" onClick={() => hapus(x)} aria-label={"Hapus " + x.judul}><Ico n="trash" size={15} /></button>
              </div></td></tr>))}
            {!data.length && <tr><td colSpan="6" className="muted">Belum ada konten.</td></tr>}</tbody>
        </table></div>
      )}
    </>
  );
}
