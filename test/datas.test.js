const assert = require('assert');
const C = require('../comum.js');

const NATAL = '2026-12-25T15:00:00.000Z';
const UM_SEGUNDO_ANTES = Date.parse('2026-12-25T14:59:59.000Z');
const NO_INSTANTE = Date.parse('2026-12-25T15:00:00.000Z');

assert.strictEqual(C.formatarData(NATAL), '25/12/2026');
assert.strictEqual(C.formatarDataHora(NATAL), '25/12/2026 às 12:00');
assert.strictEqual(C.jaChegou(NATAL, UM_SEGUNDO_ANTES), false);
assert.strictEqual(C.jaChegou(NATAL, NO_INSTANTE), true);
assert.strictEqual(C.jaChegou('', NO_INSTANTE), false);
assert.strictEqual(C.jaChegou('data-invalida', NO_INSTANTE), false);
assert.strictEqual(C.meioDiaBrasilia('2026-12-25'), NATAL);
assert.strictEqual(C.meioDiaBrasilia('25/12/2026'), null);
assert.strictEqual(C.textoContagem(NATAL, UM_SEGUNDO_ANTES), 'Faltam 0d 00h 00m 01s');
assert.strictEqual(C.textoContagem(NATAL, NO_INSTANTE), 'A data chegou. Já pode abrir.');
assert.strictEqual(C.escaparHtml(`<b>"Olá" & 'oi'`), '&lt;b&gt;&quot;Olá&quot; &amp; &#39;oi&#39;');

const partes = C.partesContagem(NATAL, Date.parse('2026-12-24T15:00:00.000Z'));
assert.deepStrictEqual(
    { dias: partes.dias, horas: partes.horas, minutos: partes.minutos, segundos: partes.segundos, encerrada: partes.encerrada },
    { dias: 1, horas: 0, minutos: 0, segundos: 0, encerrada: false }
);

console.log('datas.test.js ok');
