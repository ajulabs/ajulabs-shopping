TAREFA: Análise completa e implementação de Spec Kit para AjuLabs

CONTEXTO:
- Projeto: AjuLabs Shopping (marketplace Aracaju)
- Apps: consumer, lojista, entregador
- Backend: Node.js + Express + TypeScript + Prisma
- Agent IA: Claude (gpt-4o-mini) rodando no backend
- Features: variações, WebSocket realtime, checkout, RAG

O QUE FAZER:

1. ANALISAR PROJETO COMPLETO
   Analise:
   - backend/src/routes/*.routes.ts (todos os endpoints)
   - backend/src/utils/socket.ts (todos os WebSocket events)
   - backend/src/services/*.service.ts (lógica de negócio)
   - schema.prisma (tipos de dados)
   - packages/types/src/index.ts (tipos compartilhados)
   
   Identifique:
   - Todos os endpoints (GET, POST, PUT, DELETE, PATCH)
   - Todos os WebSocket events (emit + on)
   - Todas as validações complexas
   - Todos os fluxos críticos (checkout, variações, estoque)

2. CRIAR SPECS PARA TOOLS (3)
   As 3 tools que o agent IA usa:
   - buscar_produtos (RAG)
   - listar_pedidos (autenticado)
   - criar_ticket (escalation)
   
   Localização: backend/specs/tools/*.spec.ts

3. CRIAR SPECS PARA ENDPOINTS (Identifique todos!)
   Endpoints principais (NÃO é uma lista fixa, ANALISE):
   
   Exemplo (complete com o que encontrar):
   - POST /pedidos (criar pedido com validação de variações)
   - GET /pedidos/:id (pedido específico)
   - PUT /produtos/:id (editar produto com variações)
   - POST /produtos (criar produto)
   - GET /produtos (listar com filtro)
   - PATCH /lojista/pedidos/:id/status (mudar status)
   - POST /tickets (criar ticket)
   - POST /tickets/:id/mensagens (enviar mensagem)
   - ... (adicione todos que encontrar)
   
   Localização: backend/specs/endpoints/*.spec.ts

4. CRIAR SPECS PARA WEBSOCKET EVENTS (Identifique todos!)
   Todos os eventos em socket.ts (Server → Client):
   
   Exemplo (complete com o que encontrar):
   - pedido:novo (novo pedido criado)
   - pedido:atualizado (status mudou)
   - variacao:atualizada (estoque mudou)
   - ticket:mensagem (nova mensagem)
   - ticket:status (status mudou)
   - ticket:novo (novo ticket)
   - corrida:oferta (oferta pra entregador)
   - localizacao:update (GPS do entregador)
   - ... (adicione todos que encontrar)
   
   Localização: backend/specs/websocket/*.spec.ts

5. CRIAR SPECS PARA VALIDAÇÕES CRÍTICAS
   Identificar:
   - Validação de checkout (estoque, variações, preço)
   - Validação de produto (specs, variações)
   - Validação de autenticação (JWT, roles)
   - Validação de estoque (por variação)
   - Validação de endereço (format, CEP)
   
   Localização: backend/specs/validations/*.spec.ts

REQUISITOS PARA CADA SPEC:

- name: identificador único
- description: descrição clara em português
- input: schema completo com tipos, validações (min, max, enum, required)
- output: schema completo com tipos de retorno
- examples: 2-3 exemplos REAIS do AjuLabs
- errors: TODOS os possíveis erros (404, 400, 401, 422, etc)
- preconditions: o que precisa estar certo antes (autenticado? produto existe?)
- sideEffects: o que muda no banco/sistema

EXEMPLO DE SPEC COMPLETA:

export const criarPedidoSpec = {
  name: "criar_pedido",
  description: "Cria novo pedido com validação de estoque por variação",
  
  preconditions: ["usuário autenticado", "carrinho não vazio"],
  
  input: {
    items: [{
      produtoId: "uuid (obrigatório)",
      variacaoId: "uuid (opcional, obrigatório se produto tem variações)",
      quantidade: "number (min 1, max 50)"
    }],
    endereco: "string (min 10, max 200)",
    telefone: "string (format +55 XX 9XXXX-XXXX)"
  },
  
  output: {
    pedidoId: "uuid",
    status: "enum: 'pendente'|'confirmado'|'cancelado'",
    total: "number (R$)",
    itens: [{
      produtoId: "uuid",
      variacaoNome: "string (ex: 'M · Azul')",
      quantidade: "number",
      precoUnitario: "number"
    }],
    criadoEm: "ISO datetime"
  },
  
  examples: [
    {
      description: "Cria pedido com 2 produtos (1 com variação)",
      input: {
        items: [
          { produtoId: "prod_123", variacaoId: "var_456", quantidade: 1 },
          { produtoId: "prod_789", quantidade: 2 }
        ],
        endereco: "Rua das Flores, 100, Aracaju, SE",
        telefone: "+55 79 99999-8888"
      },
      output: {
        pedidoId: "ped_abc123",
        status: "confirmado",
        total: 150.50,
        itens: [
          {
            produtoId: "prod_123",
            variacaoNome: "M · Azul",
            quantidade: 1,
            precoUnitario: 39.90
          },
          {
            produtoId: "prod_789",
            variacaoNome: undefined,
            quantidade: 2,
            precoUnitario: 55.30
          }
        ],
        criadoEm: "2025-05-27T14:30:00Z"
      }
    }
  ],
  
  errors: [
    { code: "UNAUTHORIZED", statusCode: 401, message: "Usuário não autenticado" },
    { code: "VARIACAO_REQUIRED", statusCode: 422, message: "Produto tem variações, variacaoId é obrigatório" },
    { code: "INSUFFICIENT_STOCK", statusCode: 422, message: "Estoque insuficiente para variação M · Azul" },
    { code: "INVALID_ADDRESS", statusCode: 400, message: "Endereço deve ter pelo menos 10 caracteres" },
    { code: "PEDIDO_LIMIT_EXCEEDED", statusCode: 429, message: "Limite de 50 pedidos por hora atingido" }
  ],
  
  sideEffects: [
    "Decrementa VariacaoProduto.estoque para cada item",
    "Atualiza Produto.estoque como soma das variações",
    "Cria registros em Pedido + ItemPedido",
    "Emite WebSocket pedido:novo para lojista",
    "Se estoque zera, marca produto como unavailable"
  ]
}

ESTRUTURA DE PASTAS:

backend/specs/
├─ tools/
│  ├─ buscar_produtos.spec.ts
│  ├─ listar_pedidos.spec.ts
│  ├─ criar_ticket.spec.ts
│  └─ index.ts (exporta TOOL_SPECS)
│
├─ endpoints/
│  ├─ POST_pedidos.spec.ts
│  ├─ GET_pedidos_id.spec.ts
│  ├─ PUT_produtos_id.spec.ts
│  ├─ POST_produtos.spec.ts
│  ├─ GET_produtos.spec.ts
│  ├─ PATCH_lojista_pedidos_id_status.spec.ts
│  ├─ POST_tickets.spec.ts
│  ├─ POST_tickets_id_mensagens.spec.ts
│  └─ index.ts (exporta ENDPOINT_SPECS)
│
├─ websocket/
│  ├─ pedido_novo.spec.ts
│  ├─ pedido_atualizado.spec.ts
│  ├─ variacao_atualizada.spec.ts
│  ├─ ticket_mensagem.spec.ts
│  ├─ ticket_status.spec.ts
│  ├─ ticket_novo.spec.ts
│  ├─ corrida_oferta.spec.ts
│  ├─ localizacao_update.spec.ts
│  └─ index.ts (exporta WEBSOCKET_SPECS)
│
├─ validations/
│  ├─ checkout_validation.spec.ts
│  ├─ produto_validation.spec.ts
│  ├─ autenticacao_validation.spec.ts
│  ├─ estoque_validation.spec.ts
│  └─ index.ts (exporta VALIDATION_SPECS)
│
└─ types.ts (tipos compartilhados)

CHECKLIST FINAL:

✓ Analisou TODOS os endpoints
✓ Analisou TODOS os WebSocket events
✓ Criou specs completas (não incompletas)
✓ Cada spec tem: name, input, output, examples, errors
✓ Exemplos são realistas (valores do AjuLabs)
✓ Preconditions e sideEffects documentados
✓ TypeScript strict sem erros
✓ Exportação centralizada em index.ts de cada pasta
✓ Pronto para usar em: validação, geração de testes, documentação, agent

ENTREGAS:

- Todos os .spec.ts criados
- Cada pasta com seu index.ts
- backend/specs/types.ts com tipos compartilhados
- backend/specs/index.ts raiz exportando tudo
- Pronto para integrar com validador e agent