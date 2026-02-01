# Como verificar seu domínio no resend.com

1. Faça login em resend.com e acesse “Domains”.
2. Clique em “Add Domain”.
3. Digite o domínio, selecione “Transactional Only”, clique em “Add”.
4. Siga as instruções de DNS. Você vai precisar adicionar registros TXT, CNAME e possivelmente MX no painel DNS do seu domínio (Cloudflare, GoDaddy, etc).
5. Após propagar os DNS (pode demorar até 1h), volte ao resend.com, clique em "Check Now". Só precisa estar “Verified”.
6. Use o domínio no campo "from" dos emails: ex: `Calm Breath <noreply@teudominio.com>`

**Nota:** Não use para marketing/massa se escolheu “Transactional Only”.

Referência: https://resend.com/docs/custom-domains
