// Testes das regras de proteção da cápsula, no Emulator (nunca no banco real).
// Rodar: npm run test:regras
// Os dados abaixo são fictícios e imitam o formato das cápsulas de 2025.
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
    initializeTestEnvironment, assertSucceeds, assertFails
} from '@firebase/rules-unit-testing';
import { ref, get, set, update, remove } from 'firebase/database';
import { ref as sref, uploadString, deleteObject } from 'firebase/storage';

const ABERTURA = '2026-12-25T15:00:00.000Z';
let env;

before(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-capsula',
        database: { rules: readFileSync('database.rules.json', 'utf8'), host: '127.0.0.1', port: 9000 },
        storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 }
    });
});
after(async () => { await env.cleanup(); });

beforeEach(async () => {
    await env.clearDatabase();
    await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.database();
        await set(ref(db), {
            eventos: {
                evt_natal: { nome: 'Natal 2025 Veloso', dataAbertura: ABERTURA, dataCriacao: '2025-12-24T00:00:00.000Z', arquivado: true },
                evt_aberto: { nome: 'Evento aberto', dataAbertura: ABERTURA, dataCriacao: '2026-10-01T00:00:00.000Z', arquivado: false }
            },
            capsulas: {
                cap_1: {
                    eventoId: 'evt_natal', nome: 'Fulano', sobrenome: 'Veloso',
                    foto: 'https://exemplo/foto.jpg', desejos: ['Saúde'], pessoas: ['Família'],
                    perguntas: { conquista: 'x', momento: 'y', palavra: 'z', previsao: 'w', felicidade: 8 },
                    mensagemPessoal: 'Carta lacrada', dataCriacao: '2025-12-24T20:00:00.000Z',
                    dataAbertura: ABERTURA, liberada: false, aberta: false
                },
                // cápsula antiga sem os campos liberada/aberta
                cap_antiga: { eventoId: 'evt_natal', nome: 'Antiga', mensagemPessoal: 'oi', dataAbertura: ABERTURA }
            }
        });
    });
});

const db = () => env.unauthenticatedContext().database();
const novaCapsula = (extra = {}) => ({
    eventoId: 'evt_aberto', nome: 'Nova', sobrenome: '', desejos: ['Paz'],
    mensagemPessoal: 'Oi futuro', dataCriacao: new Date().toISOString(),
    dataAbertura: ABERTURA, liberada: false, aberta: false, ...extra
});

// ---------- o que os sites atuais fazem e precisa continuar funcionando

test('qualquer um lê eventos e cápsulas (painel e link pessoal)', async () => {
    await assertSucceeds(get(ref(db(), 'eventos')));
    await assertSucceeds(get(ref(db(), 'capsulas')));
    await assertSucceeds(get(ref(db(), 'capsulas/cap_1')));
});
test('cria evento novo', async () => {
    await assertSucceeds(set(ref(db(), 'eventos/evt_novo'), { nome: 'Novo', dataAbertura: ABERTURA, dataCriacao: new Date().toISOString(), arquivado: false }));
});
test('arquiva (lacra) evento', async () => {
    await assertSucceeds(set(ref(db(), 'eventos/evt_aberto/arquivado'), true));
});
test('cria cápsula em evento aberto', async () => {
    await assertSucceeds(set(ref(db(), 'capsulas/cap_nova'), novaCapsula()));
});
test('cria cápsula com áudio e foto em base64', async () => {
    await assertSucceeds(set(ref(db(), 'capsulas/cap_midia'), novaCapsula({ audioBase64: 'data:audio/webm;base64,AAAA', fotoLocal: 'data:image/jpeg;base64,AAAA' })));
});
test('guardião libera a cápsula', async () => {
    await assertSucceeds(set(ref(db(), 'capsulas/cap_1/liberada'), true));
});
test('abrir marca aberta + dataVisualizacao (update do capsula.html)', async () => {
    await assertSucceeds(update(ref(db(), 'capsulas/cap_1'), { aberta: true, dataVisualizacao: new Date().toISOString() }));
});
test('abrir funciona em cápsula antiga sem o campo aberta', async () => {
    await assertSucceeds(update(ref(db(), 'capsulas/cap_antiga'), { aberta: true, dataVisualizacao: new Date().toISOString() }));
});
test('abrir de novo em outro aparelho não falha', async () => {
    await assertSucceeds(update(ref(db(), 'capsulas/cap_1'), { aberta: true, dataVisualizacao: 'a' }));
    await assertSucceeds(update(ref(db(), 'capsulas/cap_1'), { aberta: true, dataVisualizacao: 'b' }));
});
test('grava a reflexão depois de abrir', async () => {
    await assertSucceeds(set(ref(db(), 'capsulas/cap_1/reflexao'), 'Um ano depois...'));
});

// ---------- o que um estranho com a URL do banco não pode mais fazer

test('não apaga o banco inteiro', async () => {
    await assertFails(remove(ref(db())));
    await assertFails(set(ref(db()), { x: 1 }));
});
test('não apaga a lista de cápsulas nem de eventos', async () => {
    await assertFails(remove(ref(db(), 'capsulas')));
    await assertFails(remove(ref(db(), 'eventos')));
});
test('não apaga uma cápsula', async () => {
    await assertFails(remove(ref(db(), 'capsulas/cap_1')));
});
test('não sobrescreve uma cápsula inteira', async () => {
    await assertFails(set(ref(db(), 'capsulas/cap_1'), novaCapsula()));
});
test('não troca a carta, a foto, o áudio nem as perguntas', async () => {
    await assertFails(set(ref(db(), 'capsulas/cap_1/mensagemPessoal'), 'troquei'));
    await assertFails(set(ref(db(), 'capsulas/cap_1/foto'), 'https://outra'));
    await assertFails(set(ref(db(), 'capsulas/cap_1/audioBase64'), 'x'));
    await assertFails(set(ref(db(), 'capsulas/cap_1/perguntas/palavra'), 'x'));
    await assertFails(remove(ref(db(), 'capsulas/cap_1/mensagemPessoal')));
});
test('não muda a data de abertura da cápsula nem do evento', async () => {
    await assertFails(set(ref(db(), 'capsulas/cap_1/dataAbertura'), '2026-11-01T15:00:00.000Z'));
    await assertFails(set(ref(db(), 'eventos/evt_natal/dataAbertura'), '2026-11-01T15:00:00.000Z'));
});
test('não desfaz liberada, aberta nem o lacre do evento', async () => {
    await assertFails(set(ref(db(), 'capsulas/cap_1/liberada'), false));
    await assertFails(set(ref(db(), 'capsulas/cap_1/aberta'), false));
    await assertFails(set(ref(db(), 'eventos/evt_natal/arquivado'), false));
});
test('não apaga nem renomeia evento', async () => {
    await assertFails(remove(ref(db(), 'eventos/evt_natal')));
    await assertFails(set(ref(db(), 'eventos/evt_natal/nome'), 'outro'));
});
test('não cria cápsula em evento lacrado ou inexistente', async () => {
    await assertFails(set(ref(db(), 'capsulas/cap_x'), novaCapsula({ eventoId: 'evt_natal' })));
    await assertFails(set(ref(db(), 'capsulas/cap_y'), novaCapsula({ eventoId: 'evt_nao_existe' })));
});
test('não cria cápsula com data diferente da do evento, já liberada ou já aberta', async () => {
    await assertFails(set(ref(db(), 'capsulas/cap_d'), novaCapsula({ dataAbertura: '2026-01-01T00:00:00.000Z' })));
    await assertFails(set(ref(db(), 'capsulas/cap_l'), novaCapsula({ liberada: true })));
    await assertFails(set(ref(db(), 'capsulas/cap_a'), novaCapsula({ aberta: true })));
});
test('não cria cápsula sem nome ou com carta gigante', async () => {
    await assertFails(set(ref(db(), 'capsulas/cap_s'), novaCapsula({ nome: '' })));
    await assertFails(set(ref(db(), 'capsulas/cap_g'), novaCapsula({ mensagemPessoal: 'x'.repeat(10001) })));
});
test('não grava em outros lugares do banco', async () => {
    await assertFails(set(ref(db(), 'lixo/1'), 'x'));
});
test('reflexão em cápsula que não existe é recusada', async () => {
    await assertFails(set(ref(db(), 'capsulas/nao_existe/reflexao'), 'x'));
});

// ---------- Storage

test('Storage: envia foto nova uma vez, mas não troca nem apaga', async () => {
    const st = env.unauthenticatedContext().storage();
    const foto = sref(st, 'capsulas/cap_nova/foto.jpg');
    await assertSucceeds(uploadString(foto, 'AAAA', 'base64', { contentType: 'image/jpeg' }));
    await assertFails(uploadString(foto, 'BBBB', 'base64', { contentType: 'image/jpeg' }));
    await assertFails(deleteObject(foto));
});
test('Storage: recusa arquivo que não é imagem nem áudio, e fora da pasta', async () => {
    const st = env.unauthenticatedContext().storage();
    await assertFails(uploadString(sref(st, 'capsulas/cap_nova/x.html'), 'PGh0bWw+', 'base64', { contentType: 'text/html' }));
    await assertFails(uploadString(sref(st, 'outra/foto.jpg'), 'AAAA', 'base64', { contentType: 'image/jpeg' }));
});
