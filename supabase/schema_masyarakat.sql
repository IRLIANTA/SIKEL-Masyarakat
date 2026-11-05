-- SIKEL Masyarakat: tabel konten edukasi dan alur konseling
-- Jalankan di Supabase > SQL Editor > New query > Run (aman dijalankan ulang)

create table if not exists public.kie_konten (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  kategori text not null,
  jenis text not null check (jenis in ('artikel','infografis','video')),
  ringkasan text not null default '',
  isi text not null default '',
  media_url text not null default '',
  terbit boolean not null default true,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.alur_node (
  kode text primary key check (kode ~ '^[a-z0-9_-]+$'),
  tipe text not null check (tipe in ('tanya','hasil')),
  judul text not null,
  isi text not null default '',
  tingkat text not null default '' check (tingkat in ('','internal','eksternal')),
  created_at timestamptz not null default now()
);

create table if not exists public.alur_opsi (
  id uuid primary key default gen_random_uuid(),
  dari text not null references public.alur_node(kode) on update cascade on delete cascade,
  teks text not null,
  ke text not null references public.alur_node(kode) on update cascade on delete restrict,
  urutan int not null default 0
);

create table if not exists public.tautan_sosial (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  url text not null check (url ~* '^https?://'),
  urutan int not null default 0
);

create index if not exists kie_urutan on public.kie_konten (urutan, created_at);
create index if not exists opsi_dari on public.alur_opsi (dari, urutan);

alter table public.kie_konten enable row level security;
alter table public.alur_node enable row level security;
alter table public.alur_opsi enable row level security;
alter table public.tautan_sosial enable row level security;

-- Pengunjung (tanpa login) hanya boleh membaca; konten KIE hanya yang terbit
drop policy if exists "publik baca konten" on public.kie_konten;
create policy "publik baca konten" on public.kie_konten for select to anon using (terbit);
drop policy if exists "publik baca node" on public.alur_node;
create policy "publik baca node" on public.alur_node for select to anon using (true);
drop policy if exists "publik baca opsi" on public.alur_opsi;
create policy "publik baca opsi" on public.alur_opsi for select to anon using (true);
drop policy if exists "publik baca sosial" on public.tautan_sosial;
create policy "publik baca sosial" on public.tautan_sosial for select to anon using (true);

-- Admin (sudah login) boleh membaca dan mengubah semuanya
do $$
declare t text;
begin
  foreach t in array array['kie_konten','alur_node','alur_opsi','tautan_sosial'] loop
    execute format('drop policy if exists "admin penuh" on public.%I', t);
    execute format('create policy "admin penuh" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Penyimpanan gambar infografis
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kie', 'kie', true, 3145728, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists "kie publik baca" on storage.objects;
create policy "kie publik baca" on storage.objects for select to public using (bucket_id = 'kie');
drop policy if exists "kie admin unggah" on storage.objects;
create policy "kie admin unggah" on storage.objects for insert to authenticated with check (bucket_id = 'kie');
drop policy if exists "kie admin ubah" on storage.objects;
create policy "kie admin ubah" on storage.objects for update to authenticated using (bucket_id = 'kie');
drop policy if exists "kie admin hapus" on storage.objects;
create policy "kie admin hapus" on storage.objects for delete to authenticated using (bucket_id = 'kie');
