
# Prescrição Pro — Offline (sem terminal)

Este pacote gera o PDF localmente no navegador e permite o *handoff* para assinatura com certificado em nuvem **VIDaaS**.

## Uso
1. Dê duplo clique em `index.html`. Não é necessário abrir terminal.
2. Preencha os campos e clique **Gerar PDF** para baixar `prescricao.pdf`.
3. Para assinar com **VIDaaS**, clique **Assinar com VIDaaS**. O sistema gera `prescricao-para-assinar.pdf` e abre `assinar-com.vidaas.com.br`, onde você faz login e conclui a assinatura com seu certificado em nuvem.

> Para integração direta via API do provedor (sem subir manualmente no portal), é preciso cadastrar sua aplicação no **PSC Valid** e usar a API de assinatura (OAuth + endpoints), conforme documentação pública do provedor. Isso exige chaves de desenvolvedor e ambiente com HTTPS.

## Referências
- VIDaaS — certificado em nuvem Valid e fluxo de uso: páginas públicas e o portal de assinatura. 
- Integração via API (PSC Valid): manual de integração e cadastro de aplicação.
