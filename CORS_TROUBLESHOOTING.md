# Troubleshooting CORS no Supabase

Se o erro de CORS continua após fazer deploy, pode ser necessário configurar CORS no dashboard do Supabase:

## Passos Adicionais:

1. **Aceder ao Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Selecionar o projeto

2. **Verificar configurações de API:**
   - Ir a "Settings" → "API"
   - Verificar se há configurações de CORS

3. **Verificar Edge Functions:**
   - Ir a "Edge Functions"
   - Clicar na função `send-verification-email`
   - Verificar se há configurações de CORS específicas

4. **Alternativa: Usar configuração via Supabase CLI:**
   ```bash
   # Verificar se há arquivo de configuração
   cat supabase/config.toml
   
   # Adicionar configuração de CORS se necessário
   ```

## Se ainda não funcionar:

O Supabase pode estar fazendo proxy das requisições e adicionando headers antes da função. Nesse caso:

1. Verificar logs da função no dashboard para ver exatamente quais headers estão sendo enviados
2. Contactar suporte do Supabase se o problema persistir
3. Considerar usar uma abordagem alternativa (ex: API route no frontend que chama a função)

## Verificação Rápida:

Após fazer deploy, verificar se a função está a retornar os headers corretos:
```bash
curl -X OPTIONS https://pjwxszsaopdoijmbaetf.supabase.co/functions/v1/send-verification-email \
  -H "Origin: https://calm-breath-landing.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: x-supabase-client-platform" \
  -v
```

Deve retornar `Access-Control-Allow-Headers` com `x-supabase-client-platform` incluído.
