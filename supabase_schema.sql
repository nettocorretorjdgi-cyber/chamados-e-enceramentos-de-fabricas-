-- ==============================================================
-- SCRIPT COMPLETO SUPABASE: TABELAS, STORAGE E POLÍTICAS RLS
-- Cole e execute no SQL Editor do seu projeto no Supabase
-- ==============================================================

-- 1. CRIAÇÃO DA TABELA DE CHAMADOS
create table if not exists public.chamados (
  id text primary key,
  numero text not null,
  titulo text not null,
  equipamento text not null,
  tag_equipamento text,
  setor text not null,
  prioridade text not null check (prioridade in ('baixa', 'media', 'alta', 'urgente')),
  tipo_falha text not null,
  parou_producao boolean default false,
  descricao_problema text not null,
  foto_url text,
  status text not null default 'aberto' check (status in ('aberto', 'em_andamento', 'concluido', 'cancelado')),
  
  -- Dados do Operador (Abertura)
  criado_por text not null,
  nome_operador text not null,
  data_abertura timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Dados do Atendimento Técnico (Mecânico)
  assumido_por text,
  nome_mecanico text,
  data_inicio_atendimento timestamp with time zone,
  
  -- Dados de Encerramento (Mecânico)
  descricao_servico text,
  causa_raiz text,
  pecas_utilizadas jsonb default '[]'::jsonb,
  tempo_gasto_minutos integer,
  condicao_final text,
  data_encerramento timestamp with time zone
);

-- Índices de performance para consultas e filtros operacionais
create index if not exists idx_chamados_status on public.chamados(status);
create index if not exists idx_chamados_prioridade on public.chamados(prioridade);
create index if not exists idx_chamados_parou_prod on public.chamados(parou_producao);
create index if not exists idx_chamados_data_abertura on public.chamados(data_abertura desc);
create index if not exists idx_chamados_equipamento on public.chamados(equipamento);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) NA TABELA
alter table public.chamados enable row level security;

-- Políticas de Armazenamento/Acesso da Tabela de Chamados
drop policy if exists "Permitir leitura de chamados por todos" on public.chamados;
create policy "Permitir leitura de chamados por todos"
  on public.chamados
  for select
  using (true);

drop policy if exists "Permitir operadores e sistema criarem chamados" on public.chamados;
create policy "Permitir operadores e sistema criarem chamados"
  on public.chamados
  for insert
  with check (true);

drop policy if exists "Permitir mecanicos e operadores atualizarem chamados" on public.chamados;
create policy "Permitir mecanicos e operadores atualizarem chamados"
  on public.chamados
  for update
  using (true)
  with check (true);

drop policy if exists "Permitir exclusao de chamados" on public.chamados;
create policy "Permitir exclusao de chamados"
  on public.chamados
  for delete
  using (true);


-- ==============================================================
-- 3. SUPABASE STORAGE (BUCKET PARA FOTOS E EVIDÊNCIAS DE FALHAS)
-- ==============================================================

-- Criar o bucket 'chamados-anexos' público caso não exista
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chamados-anexos',
  'chamados-anexos',
  true,
  10485760, -- 10MB máximo por foto
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 4. POLÍTICAS DE ACESSO AO STORAGE (storage.objects)
-- Permitir visualização e download público das imagens das ocorrências
drop policy if exists "Visualizacao publica de anexos de chamados" on storage.objects;
create policy "Visualizacao publica de anexos de chamados"
  on storage.objects
  for select
  using (bucket_id = 'chamados-anexos');

-- Permitir envio (upload) de fotos de ocorrências
drop policy if exists "Upload de imagens nos chamados" on storage.objects;
create policy "Upload de imagens nos chamados"
  on storage.objects
  for insert
  with check (bucket_id = 'chamados-anexos');

-- Permitir atualização de imagens no bucket
drop policy if exists "Atualizacao de imagens de chamados" on storage.objects;
create policy "Atualizacao de imagens de chamados"
  on storage.objects
  for update
  using (bucket_id = 'chamados-anexos')
  with check (bucket_id = 'chamados-anexos');

-- Permitir exclusão de fotos se necessário
drop policy if exists "Exclusao de imagens de chamados" on storage.objects;
create policy "Exclusao de imagens de chamados"
  on storage.objects
  for delete
  using (bucket_id = 'chamados-anexos');
