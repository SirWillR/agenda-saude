# Agenda de Saúde

Agenda dos exames e consultas de rotina da família: o que está em dia, o que está vencendo e os resultados de exames de sangue com valores de referência.

Angular + Firebase (Firestore e login Google), publicado no GitHub Pages.

## Rodar localmente

```bash
nvm use 24
npm install
npm start        # http://localhost:4200
npm test
```

Enquanto `src/app/firebase.config.ts` estiver vazio, o app roda em **modo local**: sem login, com os dados guardados só no navegador.

## Ligar ao Firebase

1. No [Console do Firebase](https://console.firebase.google.com), crie um projeto e ative **Firestore** e **Authentication → Google**.
2. Em Configurações do projeto → Seus apps, crie um app web e copie o `firebaseConfig` para `src/app/firebase.config.ts`.
3. Em Firestore → Regras, cole o conteúdo de `firestore.rules` trocando os e-mails de exemplo pelas contas Google da família. Não faça commit dos e-mails reais.
4. Em Authentication → Configurações → Domínios autorizados, adicione `SEU-USUARIO.github.io`.

O `firebaseConfig` pode ficar no repositório público: quem protege os dados são as regras do Firestore.

## Publicar

No GitHub, em Settings → Pages, escolha **GitHub Actions** como fonte. Cada push na `main` roda os testes, gera o build e publica (`.github/workflows/deploy.yml`).

## Como funciona

- **Painel**: por pessoa, o que está atrasado, vence em 30 ou 90 dias, nunca foi registrado ou está em dia.
- **Próxima data**: o agendamento em aberto, se houver; senão, o último exame realizado mais a periodicidade.
- **Resultados**: cada registro guarda a própria faixa de referência, então mudar o catálogo não altera o histórico.
- **Catálogo**: periodicidades, quem faz cada exame, itens medidos e exames extras (recorrentes ou avulsos).

As periodicidades e faixas de referência iniciais (`src/app/seed.ts`) são sugestões gerais. Ajuste conforme a orientação dos médicos e o laudo de cada laboratório.
