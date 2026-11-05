import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { Ico } from "./Icons.jsx";
import { pesanLogin } from "./util.jsx";
import AdminKie from "./AdminKie.jsx";
import AdminAlur from "./AdminAlur.jsx";
import AdminTautan from "./AdminTautan.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [err, setErr] = useState("");
  const [proses, setProses] = useState(false);
  const kirim = async (e) => {
    e.preventDefault(); setProses(true); setErr("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: sandi });
      if (error) setErr(pesanLogin(error));
    } catch (x) { setErr(pesanLogin(x)); }
    setProses(false);
  };
  return (
    <div className="tengah">
      <form className="card login-card" onSubmit={kirim}>
        <h1>Admin konten</h1>
        <p className="muted">Masuk untuk mengelola edukasi, alur konseling, dan tautan media sosial.</p>
        <label>Email<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Kata sandi
          <span className="pw">
            <input type={lihat ? "text" : "password"} required autoComplete="current-password" value={sandi} onChange={(e) => setSandi(e.target.value)} />
            <button type="button" className="pw-btn" onClick={() => setLihat(!lihat)} aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}><Ico n={lihat ? "eyeoff" : "eye"} size={18} /></button>
          </span>
        </label>
        {err && <div className="alert" role="alert">{err}</div>}
        <button className="btn block" disabled={proses}>{proses ? "Memproses..." : "Masuk"}</button>
        <p className="muted small" style={{ marginTop: 16 }}><a href="#">Kembali ke website</a></p>
      </form>
    </div>
  );
}

const TAB = [["kie", "Konten edukasi"], ["alur", "Alur konseling"], ["tautan", "Media sosial"]];

export default function Admin() {
  const [sesi, setSesi] = useState(null);
  const [siap, setSiap] = useState(false);
  const [tab, setTab] = useState("kie");
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSesi(data.session); setSiap(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesi(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!siap) return <div className="tengah"><div className="spin" role="status" aria-label="Memuat" /></div>;
  if (!sesi) return <Login />;
  return (
    <div className="adm">
      <header className="adm-top">
        <div className="wadah adm-bar">
          <div className="adm-judul"><span className="logo-mark">S</span><div><b>SIKEL Admin Konten</b><div className="muted small">{sesi.user.email}</div></div></div>
          <div className="actions">
            <a className="btn ghost sm" href="#">Lihat website</a>
            <button className="btn ghost sm" onClick={() => supabase.auth.signOut()}><Ico n="logout" size={16} />Keluar</button>
          </div>
        </div>
      </header>
      <main className="wadah adm-main">
        <div className="tabs" role="group" aria-label="Bagian">{TAB.map(([k, n]) => <button key={k} className="tab" aria-pressed={tab === k} onClick={() => setTab(k)}>{n}</button>)}</div>
        {tab === "kie" ? <AdminKie /> : tab === "alur" ? <AdminAlur /> : <AdminTautan />}
      </main>
    </div>
  );
}
