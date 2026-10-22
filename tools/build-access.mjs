import fs from 'node:fs/promises';
import path from 'node:path';
import { createCipheriv, createDecipheriv, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const SITE = 'https://espacio-esencial.github.io';
export const SKOOL = 'https://www.skool.com/espacio-esencial-1173/classroom/6132d75c';

// Compatible with StatiCrypt 3: never change these rounds for existing pages.
export function hashPassword(password, salt) {
  let hash = pbkdf2Sync(password, salt, 1000, 32, 'sha1').toString('hex');
  hash = pbkdf2Sync(hash, salt, 14000, 32, 'sha256').toString('hex');
  return pbkdf2Sync(hash, salt, 585000, 32, 'sha256').toString('hex');
}

export function encode(html, hashedPassword) {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(hashedPassword, 'hex'), iv);
  const encrypted = iv.toString('hex') + Buffer.concat([cipher.update(html, 'utf8'), cipher.final()]).toString('hex');
  return createHmac('sha256', Buffer.from(hashedPassword, 'hex')).update(encrypted).digest('hex') + encrypted;
}

export function decode(payload, hashedPassword) {
  if (!/^[a-f0-9]+$/.test(payload) || payload.length < 128) throw new Error('Invalid encrypted content');
  const encrypted = payload.slice(64);
  const signature = createHmac('sha256', Buffer.from(hashedPassword, 'hex')).update(encrypted).digest();
  if (!timingSafeEqual(signature, Buffer.from(payload.slice(0, 64), 'hex'))) throw new Error('Incorrect access key');
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(hashedPassword, 'hex'), Buffer.from(encrypted.slice(0, 32), 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted.slice(32), 'hex')), decipher.final()]).toString('utf8');
}

export function readConfig(html) {
  const match = html.match(/<script id="ee-access-config" type="application\/json">([\s\S]*?)<\/script>/);
  return match ? JSON.parse(match[1]) : null;
}

const escapeHTML = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function prepareContent(source) {
  if (source.includes('id="ee-course-navigation"')) return source;
  return source.replace(/<\/head>/i, '<meta name="referrer" content="no-referrer">\n</head>')
    .replace(/<\/body>/i, `<nav id="ee-course-navigation" aria-label="Acceso al grupo" style="max-width:960px;margin:24px auto;padding:16px;text-align:center;font:14px Arial,sans-serif;line-height:1.8"><a href="${SKOOL}" style="color:inherit">Volver a Espacio Esencial en Skool</a> · <a href="?staticrypt_logout=1" style="color:inherit">Cerrar el acceso en este dispositivo</a></nav>\n</body>`);
}

export function wrapper(source, config, hashedPassword) {
  const title = escapeHTML(source.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'Un Curso de Milagros');
  const data = {
    version: 1,
    period: config.period,
    staticryptSaltUniqueVariableName: config.salt,
    staticryptEncryptedMsgUniqueVariableName: encode(prepareContent(source), hashedPassword),
    isRememberEnabled: true,
    rememberDurationInDays: 31
  };
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta http-equiv="cache-control" content="no-cache"><title>${title} · Acceso al grupo</title>
<style>
:root{color-scheme:light;font-family:Arial,sans-serif;color:#3c332d;background:#f5f1eb}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:28px 18px}.card{width:min(100%,460px);padding:36px;background:#fffdf9;border:1px solid #e7ded4;border-radius:18px;box-shadow:0 12px 36px #4832200b}.brand{letter-spacing:.13em;text-transform:uppercase;color:#855438;font-size:12px;margin:0 0 28px}h1{font-family:Georgia,serif;font-weight:400;font-size:30px;line-height:1.2;margin:0 0 14px}p{font-size:15px;line-height:1.6;margin:0 0 22px}.field-label{display:block;font-size:14px;margin-bottom:8px}.password-row{display:flex;border:1px solid #d6c7b7;border-radius:9px;overflow:hidden;background:#fff}.password-row:focus-within{outline:2px solid #855438;outline-offset:2px}#password{flex:1;min-width:0;border:0;outline:0;font-size:16px;padding:14px;background:transparent}#toggle{border:0;background:transparent;padding:10px 14px;color:#6d4a31;font-size:13px;cursor:pointer}.remember{display:flex;align-items:center;gap:10px;font-size:14px;margin:20px 0}.remember input{width:19px;height:19px;accent-color:#855438}.submit{border:0;border-radius:9px;width:100%;padding:15px;font-size:16px;font-weight:600;color:#fff;background:#855438;cursor:pointer}.submit:disabled{opacity:.65;cursor:wait}.help{font-size:13px;line-height:1.6;margin:22px 0 0;color:#76695c}a{color:#744a2f;text-underline-offset:3px}#error{color:#9b3029;font-size:14px;line-height:1.5;margin:14px 0 0}#loading{padding:20px 0;color:#76695c}[hidden]{display:none!important}@media(max-width:400px){.card{padding:26px 22px}h1{font-size:27px}}
</style><script src="assets/ucdm-access.js?v=1" defer></script></head>
<body><main class="card"><p class="brand">Espacio Esencial</p><h1>Una lección al día</h1><p>Introduce la clave del mes que encontrarás en el aula de Un Curso de Milagros en Skool.</p><p id="loading" role="status">Comprobando tu acceso…</p><form id="access-form" hidden><label class="field-label" for="password">Clave del mes</label><div class="password-row"><input id="password" name="course-key" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" required><button id="toggle" type="button" aria-label="Mostrar clave">Mostrar</button></div><label class="remember"><input id="remember" type="checkbox" checked>Recordar en este dispositivo</label><button class="submit" id="submit" type="submit">Entrar a la lección</button><p id="error" role="alert" hidden></p></form><p class="help">La misma clave abre todas las lecciones. Cuando la renovemos, podrás encontrar la nueva en Skool.<br><a href="${SKOOL}">Ver la clave del mes en Skool</a></p><noscript><p>Activa JavaScript para abrir las lecciones protegidas.</p></noscript></main>
<script id="ee-access-config" type="application/json">${JSON.stringify(data)}</script></body></html>\n`;
}

export async function build({input, output, period, salt, password, previousPassword}) {
  if (!password || password.length < 16) throw new Error('Provide a unique access key of at least 16 characters');
  if (!/^\d{4}-\d{2}$/.test(period)) throw new Error('The period must use YYYY-MM');
  let current;
  try { current = JSON.parse(await fs.readFile(path.join(input,'ucdm-access.json'),'utf8')); } catch {}
  if (current?.period === period) { salt ||= current.salt; previousPassword ||= password; }
  salt ||= randomBytes(16).toString('hex');
  if (!/^[a-f0-9]{32}$/.test(salt)) throw new Error('The salt must contain 32 lowercase hexadecimal characters');
  const hashedPassword = hashPassword(password, salt);
  const names = (await fs.readdir(input)).filter(name => /^(leccion-\d+|cuarto-repaso)\.html$/.test(name)).sort();
  if (!names.length) throw new Error('No lesson pages found');
  await fs.mkdir(path.join(output, 'assets'), {recursive:true});
  const previousHashes = new Map();
  for (const name of names) {
    let source = await fs.readFile(path.join(input, name), 'utf8');
    const previous = readConfig(source);
    if (previous) {
      if (!previousPassword) throw new Error('Set EE_PREVIOUS_PASSWORD to rotate protected pages');
      const oldSalt = previous.staticryptSaltUniqueVariableName;
      if (!previousHashes.has(oldSalt)) previousHashes.set(oldSalt, hashPassword(previousPassword, oldSalt));
      source = decode(previous.staticryptEncryptedMsgUniqueVariableName, previousHashes.get(oldSalt));
    }
    await fs.writeFile(path.join(output, name), wrapper(source, {period,salt}, hashedPassword));
  }
  const indexSource = await fs.readFile(path.join(input, 'index.html'), 'utf8');
  const notice = `<p id="ee-access-note" style="font:14px Arial,sans-serif;line-height:1.6;text-align:center;padding:12px 18px;background:#f5f1eb;color:#5c4837">Las lecciones son para el grupo de estudio. <a href="${SKOOL}" style="color:inherit">Encuentra la clave del mes en Skool</a>.</p>`;
  const index = indexSource.includes('id="ee-access-note"') ? indexSource : indexSource.replace(/<body([^>]*)>/i, `<body$1>\n${notice}`);
  await fs.writeFile(path.join(output, 'index.html'), index);
  await fs.writeFile(path.join(output, 'acceso.html'), wrapper(indexSource,{period,salt},hashedPassword));
  await fs.writeFile(path.join(output, 'prueba-acceso-167.html'), '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=leccion-167.html"><title>Acceso a la lección 167</title><p><a href="leccion-167.html">Abrir la lección 167</a></p></html>\n');
  await fs.writeFile(path.join(output, 'ucdm-access.json'), JSON.stringify({version:1,period,salt,rememberDays:31,lessons:names},null,2)+'\n');
  return {period,salt,files:names.length,sharedHash:hashedPassword};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i+1] : undefined; };
  const result = await build({input:path.resolve(option('--input')||path.join(ROOT,'originals')),output:path.resolve(option('--output')||path.join(ROOT,'public')),period:option('--period')||new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit'}).format(new Date()),salt:process.env.EE_ACCESS_SALT,password:process.env.EE_ACCESS_PASSWORD,previousPassword:process.env.EE_PREVIOUS_PASSWORD});
  if (option('--share-file')) {
    await fs.writeFile(path.resolve(option('--share-file')),SITE+'/acceso.html#staticrypt_pwd='+result.sharedHash+'&remember_me\n',{mode:0o600});
  }
  console.log(JSON.stringify({period:result.period,files:result.files,salt:result.salt}));
}
