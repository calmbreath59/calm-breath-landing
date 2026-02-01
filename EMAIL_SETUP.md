# Configuração de Email

Para que os emails sejam enviados, configure as seguintes variáveis de ambiente:

## Na Vercel (para a API route `/api/send-email`):

1. Aceder ao dashboard da Vercel: https://vercel.com/dashboard
2. Selecionar o projeto `calm-breath-landing`
3. Ir a "Settings" → "Environment Variables"
4. Adicionar:
   - `SMTP_USER`: Seu email Gmail (ex: `seuemail@gmail.com`)
   - `SMTP_PASS`: App Password do Gmail (ex: `fvri kbpp sawu ohrn`)
   - `SMTP_FROM`: Email de remetente (opcional, usa SMTP_USER por padrão)

## Como criar App Password do Gmail:

1. Aceder a https://myaccount.google.com/
2. Ir a "Security" → "2-Step Verification" (precisa estar ativado)
3. Ir a "App passwords"
4. Criar nova App Password para "Mail"
5. Copiar a senha gerada (16 caracteres, sem espaços)
6. Usar essa senha como `SMTP_PASS`

## Na Supabase (para a Edge Function):

1. Aceder ao dashboard do Supabase: https://supabase.com/dashboard
2. Selecionar o projeto
3. Ir a "Settings" → "Edge Functions" → "Secrets"
4. Adicionar:
   - `VERCEL_URL`: URL do seu projeto Vercel (ex: `https://calm-breath-landing.vercel.app`)

## Testar:

Após configurar, fazer deploy e testar o envio de email de verificação.
