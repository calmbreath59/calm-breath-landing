# Instruções para Deploy das Funções Supabase

As funções Edge foram atualizadas com headers CORS corretos. Para aplicar as mudanças:

## Opção 1: Via Supabase CLI

1. Instalar/autenticar:
```bash
npx supabase login
```

2. Fazer deploy das funções:
```bash
npx supabase functions deploy send-verification-email
npx supabase functions deploy verify-email-code
npx supabase functions deploy delete-user
npx supabase functions deploy send-moderation-email
```

## Opção 2: Via Supabase Dashboard

1. Aceder ao dashboard: https://supabase.com/dashboard
2. Selecionar o projeto
3. Ir a "Edge Functions"
4. Para cada função (`send-verification-email`, `verify-email-code`, etc.):
   - Clicar na função
   - Clicar em "Deploy" ou "Update"
   - Colar o código atualizado do ficheiro correspondente em `supabase/functions/[nome-da-funcao]/index.ts`

## Verificar após deploy

Após o deploy, testar novamente o login. O erro de CORS deve desaparecer.
