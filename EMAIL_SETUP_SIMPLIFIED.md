# Configuração Simplificada de Email

## Usando Resend (Recomendado - Mais Simples)

1. **Criar conta no Resend:**
   - Aceder a https://resend.com
   - Criar conta gratuita
   - Ir a "API Keys" e criar uma nova key

2. **Configurar no Supabase:**
   - Aceder ao dashboard: https://supabase.com/dashboard
   - Selecionar o projeto
   - Ir a "Settings" → "Edge Functions" → "Secrets"
   - Adicionar:
     - `RESEND_API_KEY`: Sua API key do Resend

3. **Fazer deploy da função:**
   - Fazer deploy da função `send-verification-email` atualizada

## Verificar se está funcionando:

Após configurar, verificar os logs da função no Supabase para ver se o email foi enviado ou se há erros.

## Nota:

Se não configurar `RESEND_API_KEY`, o código de verificação será mostrado nos logs da função (útil para desenvolvimento).
