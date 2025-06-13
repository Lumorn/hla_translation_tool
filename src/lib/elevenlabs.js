const API_KEY = import.meta.env?.ELEVEN_API_KEY;

export async function renderLanguage(id, lang='de', key=API_KEY) {
  const res = await fetch(`/v1/dubbing/resource/${id}/render/${lang}`, {
    method: 'POST',
    headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
    body: JSON.stringify({ render_type: 'wav' })
  });
  if (res.status === 401 || res.status === 403) throw new Error('BETA_LOCKED');
  if (!res.ok) throw new Error(await res.text());
}

export async function pollRender(id, lang='de', key=API_KEY) {
  while (true) {
    const info = await fetch(`/v1/dubbing/resource/${id}`, { headers: {'xi-api-key': key} }).then(r => r.json());
    const r = info.renders?.[lang];
    if (r?.status === 'complete') return r.url;
    await new Promise(r => setTimeout(r, 5000));
  }
}
