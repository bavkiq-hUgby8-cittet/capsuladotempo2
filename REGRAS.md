# Regras de proteção da cápsula

Hoje o banco `capsuladotempo-f86bf` aceita qualquer escrita. Estas regras mantêm tudo o que os sites fazem e bloqueiam o resto.

**Continua funcionando:** ler eventos e cápsulas, criar evento, lacrar evento, criar cápsula em evento aberto, liberar, abrir, gravar `dataVisualizacao` e a reflexão.

**Passa a ser recusado:** apagar ou sobrescrever cápsulas e eventos, trocar carta, foto, áudio, perguntas ou data de abertura, desfazer liberada/aberta/lacre, criar cápsula em evento lacrado, gravar fora de `eventos/` e `capsulas/`. No Storage, uma foto ou áudio enviado não pode ser trocado nem apagado.

**Não muda:** a leitura continua aberta. Fechar a leitura exige login nos sites, o que fica para janeiro de 2027.

## Testes

`test/regras.test.mjs` roda no Emulator com dados fictícios (`npm run test:regras`, precisa de Node e Java). O GitHub Actions roda o mesmo teste a cada push fora da `main`.

## Como publicar (Ramon, depois dos testes verdes e do export do banco)

1. Exporte o banco: [https://console.firebase.google.com/project/capsuladotempo-f86bf/database](https://console.firebase.google.com/project/capsuladotempo-f86bf/database) → menu ⋮ → Exportar JSON.
2. Na aba **Regras** do mesmo banco, copie as regras atuais para um arquivo (é o rollback), cole o conteúdo de `database.rules.json` e clique em **Publicar**.
3. Abra uma cápsula pelo link pessoal e o painel do guardião e confira que carregam.
4. Storage (depois de reativar o billing): [https://console.firebase.google.com/project/capsuladotempo-f86bf/storage/rules](https://console.firebase.google.com/project/capsuladotempo-f86bf/storage/rules) → cole `storage.rules` → Publicar.

**Rollback:** colar de volta as regras salvas no passo 2 e publicar. Leva segundos e não mexe nos dados.

**Prazo:** publicar até 30/11/2026. Depois disso a cápsula está congelada até 10/01/2027.
