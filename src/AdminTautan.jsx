import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { Ico } from "./Icons.jsx";
import { amanUrl } from "./util.jsx";

const KOSONG = { nama: "", url: "", urutan: 0 };

export default function AdminTautan() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [pesan, setPesan] = useState("");
  const muat = async () => {
    const { data: d, error } = await supabase.from("tautan_sosial").select("*").order("urutan");
    if (error) setPesan("Gagal memuat: " + error.message); else setData(d);
  };
  useEffect(() => { muat(); }, []);

  const simpan = async (e) => {
    e.preventDefault(); setPesan("");
    if (!form.nama.trim()) return setPesan("Nama wajib diisi.");
    if (!amanUrl(form.url)) return setPesan("Tautan harus diawali https://");
    const body = { nama: form.nama.trim(), url: form.url.trim(), urutan: Number(form.urutan) || 0 };
    const q = form.id ? supabase.from("tautan_sosial").update(body).eq("id", form.id) : supabase.from("tautan_sosial").insert(body);
    const { error } = await q;
    if (error) return setPesan("Gagal menyimpan: " + error.message);
    setForm(null); muat();
  };
  const hapus = async (x) => {
    if (!confirm(`Hapus tautan ${x.nama}?`)) return;
    const { error } = await supabase.from("tautan_sosial").delete().eq("id", x.id);
    if (error) setPesan("Gagal menghapus: " + error.message); else { setPesan(""); muat(); }
  };

  return (
    <>
      <div className="head"><div><h2>Tautan media sosial</h2><p className="muted">Tampil di bagian bawah website jika sudah ada isinya.</p></div>
        {!form && <button className="btn" onClick={() => { setPesan(""); setForm(KOSONG); }}><Ico n="plus" size={18} />Tambah tautan</button>}</div>
      {pesan && <div className="alert" role="alert">{pesan}</div>}
      {form && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={simpan}>
          <div className="row3">
            <label>Nama<input required placeholder="Instagram" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></label>
            <label>Tautan<input required placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
            <label>Urutan<input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: e.target.value })} /></label>
          </div>
          <div className="actions"><button className="btn">Simpan</button><button type="button" className="btn ghost" onClick={() => { setForm(null); setPesan(""); }}>Batal</button></div>
        </form>
      )}
      {!data ? <div className="spin" role="status" aria-label="Memuat" /> : (
        <div className="card tabel"><table>
          <thead><tr><th>Nama</th><th>Tautan</th><th>Urutan</th><th>Aksi</th></tr></thead>
          <tbody>{data.map((x) => (
            <tr key={x.id}><td>{x.nama}</td><td className="potong">{x.url}</td><td>{x.urutan}</td>
              <td><div className="actions"><button className="btn sm ghost" onClick={() => { setPesan(""); setForm(x); }}><Ico n="edit" size={15} />Ubah</button><button className="btn sm del" onClick={() => hapus(x)} aria-label={"Hapus " + x.nama}><Ico n="trash" size={15} /></button></div></td></tr>))}
            {!data.length && <tr><td colSpan="4" className="muted">Belum ada tautan. Tambahkan akun media sosial resmi program.</td></tr>}</tbody>
        </table></div>
      )}
    </>
  );
}
