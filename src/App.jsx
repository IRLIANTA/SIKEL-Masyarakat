import { useEffect, useState } from "react";
import Publik from "./Publik.jsx";
import Admin from "./Admin.jsx";
import { supabase } from "./supabase.js";

function Setup() {
  return (
    <div className="tengah"><div className="card" style={{ maxWidth: 520 }}>
      <h2>Konfigurasi belum lengkap</h2>
      <p className="muted">File <b>.env</b> belum berisi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY. Isi keduanya (lihat .env.example), lalu jalankan ulang <b>npm run dev</b>. Di Vercel, isi di Settings, Environment Variables, lalu Redeploy.</p>
    </div></div>
  );
}

export default function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const f = () => { setHash(location.hash); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  if (!supabase) return <Setup />;
  return hash.startsWith("#admin") ? <Admin /> : <Publik />;
}
