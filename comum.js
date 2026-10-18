/**
 * Funções compartilhadas da Cápsula do Tempo.
 * Não lê nem grava dados: só datas, texto e relógio.
 * O horário de Brasília é UTC−3 o ano inteiro (sem horário de verão desde 2019).
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.CapsulaTempo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const FUSO = 'America/Sao_Paulo';
    const OFFSET_BRASILIA = '-03:00';

    function escaparHtml(valor) {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function instante(iso) {
        if (!iso) return NaN;
        const ms = Date.parse(iso);
        return Number.isFinite(ms) ? ms : NaN;
    }

    function formatarData(iso) {
        const ms = instante(iso);
        if (!Number.isFinite(ms)) return '—';
        return new Intl.DateTimeFormat('pt-BR', {
            timeZone: FUSO,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(ms));
    }

    function formatarHora(iso) {
        const ms = instante(iso);
        if (!Number.isFinite(ms)) return '';
        return new Intl.DateTimeFormat('pt-BR', {
            timeZone: FUSO,
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(ms));
    }

    function formatarDataHora(iso) {
        const data = formatarData(iso);
        const hora = formatarHora(iso);
        if (!hora) return data;
        return `${data} às ${hora}`;
    }

    function jaChegou(iso, agoraMs) {
        const alvo = instante(iso);
        if (!Number.isFinite(alvo)) return false;
        const agora = Number.isFinite(agoraMs) ? agoraMs : Date.now();
        return agora >= alvo;
    }

    function meioDiaBrasilia(yyyyMmDd) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd || '')) return null;
        const ms = Date.parse(`${yyyyMmDd}T12:00:00${OFFSET_BRASILIA}`);
        if (!Number.isFinite(ms)) return null;
        return new Date(ms).toISOString();
    }

    function dataInputBrasilia(data) {
        const base = data instanceof Date ? data : new Date();
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: FUSO,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(base);
    }

    function textoContagem(iso, agoraMs) {
        const alvo = instante(iso);
        if (!Number.isFinite(alvo)) return 'Data de abertura inválida';
        const agora = Number.isFinite(agoraMs) ? agoraMs : Date.now();
        const diff = alvo - agora;
        if (diff <= 0) return 'A data chegou. Já pode abrir.';
        const dias = Math.floor(diff / 86400000);
        const horas = Math.floor((diff % 86400000) / 3600000);
        const min = Math.floor((diff % 3600000) / 60000);
        const seg = Math.floor((diff % 60000) / 1000);
        return `Faltam ${dias}d ${String(horas).padStart(2, '0')}h ${String(min).padStart(2, '0')}m ${String(seg).padStart(2, '0')}s`;
    }

    function partesContagem(iso, agoraMs) {
        const alvo = instante(iso);
        const agora = Number.isFinite(agoraMs) ? agoraMs : Date.now();
        const diff = Number.isFinite(alvo) ? Math.max(0, alvo - agora) : 0;
        return {
            dias: Math.floor(diff / 86400000),
            horas: Math.floor((diff % 86400000) / 3600000),
            minutos: Math.floor((diff % 3600000) / 60000),
            segundos: Math.floor((diff % 60000) / 1000),
            encerrada: Number.isFinite(alvo) && agora >= alvo
        };
    }

    return {
        FUSO,
        escaparHtml,
        formatarData,
        formatarHora,
        formatarDataHora,
        jaChegou,
        meioDiaBrasilia,
        dataInputBrasilia,
        textoContagem,
        partesContagem
    };
});
