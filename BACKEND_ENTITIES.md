# Entidades do Backend — AjuLabs Shopping

Mapeamento completo baseado nas funcionalidades dos apps **Consumidor**, **Entregador** e **Lojista**.

---

## 1. Autenticação & Identidade

### `Usuario` (Consumidor)
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| nome | string | Cadastro |
| cpf | string (único) | Cadastro |
| telefone | string | Cadastro |
| email | string | Cadastro |
| senha_hash | string | Cadastro |
| avatar_url | string? | Perfil |
| telefone_verificado | boolean | Verificação por código |
| criado_em | timestamp | |

### `Entregador`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| nome | string | Onboarding |
| cpf | string (único) | Onboarding |
| telefone | string | Onboarding |
| email | string | Onboarding |
| senha_hash | string | |
| foto_url | string? | Onboarding step 1 |
| tipo_transporte | `bike \| moto \| carro` | Onboarding step 3 |
| status_conta | `pendente \| ativo \| suspenso` | Verificação de docs |
| criado_em | timestamp | |

### `Lojista`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| cnpj | string (único) | Cadastro |
| nome_responsavel | string | |
| email | string | Cadastro |
| senha_hash | string | Cadastro |
| telefone | string | Cadastro |
| criado_em | timestamp | |

---

## 2. Documentação do Entregador

### `DocumentoEntregador`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| entregador_id | FK → Entregador | |
| frente_url | string | Onboarding step 2 |
| verso_url | string | Onboarding step 2 |
| status | `pendente \| aprovado \| rejeitado` | Análise manual (até 24h) |
| revisado_em | timestamp? | |

### `VeiculoEntregador`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| entregador_id | FK → Entregador | |
| placa | string | Onboarding step 4 |
| modelo | string | Onboarding step 4 |
| cor | string | Onboarding step 4 |
| ano | number | Onboarding step 4 |

### `DadosBancariosEntregador`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| entregador_id | FK → Entregador | |
| tipo | `pix \| conta` | Onboarding step 5 |
| chave_pix | string? | Pix: CPF / email / telefone |
| banco | string? | Conta bancária |
| agencia | string? | |
| conta | string? | |

---

## 3. Loja

### `Loja`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| lojista_id | FK → Lojista | |
| nome | string | Cadastro / Perfil |
| descricao | string | Perfil |
| categoria | string | Perfil |
| logo_url | string? | Perfil |
| banner_url | string? | Perfil |
| telefone | string | Perfil |
| whatsapp | string? | Perfil |
| avaliacao | decimal | Calculado |
| total_avaliacoes | integer | Calculado |
| tempo_entrega_min | integer | minutos |
| tempo_entrega_max | integer | minutos |
| taxa_entrega | decimal | |
| aberta | boolean | Calculado via horários |
| aceita_agendamento | boolean | Perfil |
| antecedencia_minima | integer? | minutos |

### `EnderecoLoja`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| loja_id | FK → Loja | |
| rua | string | |
| numero | string | |
| bairro | string | |
| cep | string | |
| cidade | string | |
| complemento | string? | |

### `HorarioFuncionamento`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| loja_id | FK → Loja | |
| dia_semana | `0–6` (dom–sab) | Perfil loja |
| ativo | boolean | |
| abertura | time `HH:MM` | |
| fechamento | time `HH:MM` | |

---

## 4. Catálogo

### `Categoria`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| nome | string | |
| emoji | string | Tela de vitrines |

### `Produto`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| loja_id | FK → Loja | |
| nome | string | NovoProduto |
| descricao | string | NovoProduto (IA) |
| preco | decimal | NovoProduto |
| estoque | integer | NovoProduto |
| imagem_url | string | NovoProduto (foto) |
| categoria | string | NovoProduto (IA) |
| tags | string[] | NovoProduto (IA) |
| disponivel | boolean | |
| destaque | boolean | |

### `VariacaoProduto`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| produto_id | FK → Produto | |
| nome | string | ex: "M", "G", "38" |
| estoque | integer | |

---

## 5. Endereços do Consumidor

### `EnderecoUsuario`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| usuario_id | FK → Usuario | |
| apelido | string | "Casa", "Trabalho" |
| rua | string | Checkout |
| numero | string | |
| bairro | string | |
| cep | string | |
| cidade | string | |
| complemento | string? | |
| padrao | boolean | |

---

## 6. Pedidos

### `Pedido`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| consumidor_id | FK → Usuario | |
| loja_id | FK → Loja | |
| entregador_id | FK → Entregador? | Atribuído após preparo |
| endereco_entrega_id | FK → EnderecoUsuario | Checkout |
| status | `aguardando \| confirmado \| preparando \| saiu_entrega \| entregue \| cancelado` | |
| metodo_pagamento | `pix \| cartao` | Checkout |
| subtotal | decimal | |
| taxa_entrega | decimal | |
| desconto | decimal | 5% no Pix |
| total | decimal | |
| obs | string? | Observações do cliente |
| estimativa_entrega | timestamp? | |
| criado_em | timestamp | |
| atualizado_em | timestamp | |

### `ItemPedido`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| pedido_id | FK → Pedido | |
| produto_id | FK → Produto | |
| nome_snapshot | string | Cópia no momento do pedido |
| preco_unitario | decimal | Cópia no momento do pedido |
| quantidade | integer | |

### `HistoricoStatusPedido`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| pedido_id | FK → Pedido | |
| status | StatusPedido | |
| criado_em | timestamp | Timeline de tracking |

---

## 7. Chat / IA (Aju)

### `ConversaChat`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| usuario_id | FK → Usuario | |
| criada_em | timestamp | |

### `MensagemChat`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| conversa_id | FK → ConversaChat | |
| remetente | `usuario \| aju` | |
| conteudo | string | |
| criada_em | timestamp | |

### `SugestaoProdutoChat`
> Produtos retornados pela IA em uma mensagem.

| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| mensagem_id | FK → MensagemChat | |
| produto_id | FK → Produto | |

---

## 8. Ganhos do Entregador

### `EntregaRealizada`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| entregador_id | FK → Entregador | |
| pedido_id | FK → Pedido | |
| valor_recebido | decimal | Taxa por tipo de transporte |
| bonus | decimal? | ex: bônus R$100 novos entregadores |
| criado_em | timestamp | Tela de ganhos |

---

## 9. Avaliações

### `AvaliacaoLoja`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| loja_id | FK → Loja | |
| usuario_id | FK → Usuario | |
| pedido_id | FK → Pedido | |
| nota | integer (1–5) | |
| comentario | string? | |
| criado_em | timestamp | |

---

## 10. Pagamentos

### `Pagamento`
| Campo | Tipo | Origem |
|-------|------|--------|
| id | UUID | |
| pedido_id | FK → Pedido | |
| metodo | `pix \| cartao` | Checkout |
| status | `pendente \| aprovado \| falhou \| estornado` | |
| valor | decimal | |
| gateway_id | string? | ID externo (Stripe / Pagar.me) |
| criado_em | timestamp | |

---

## Resumo Geral

| # | Entidade | App(s) |
|---|----------|--------|
| 1 | Usuario | Consumidor |
| 2 | Entregador | Entregador |
| 3 | Lojista | Lojista |
| 4 | DocumentoEntregador | Entregador |
| 5 | VeiculoEntregador | Entregador |
| 6 | DadosBancariosEntregador | Entregador |
| 7 | Loja | Lojista / Consumidor |
| 8 | EnderecoLoja | Lojista |
| 9 | HorarioFuncionamento | Lojista |
| 10 | Categoria | Consumidor / Lojista |
| 11 | Produto | Lojista / Consumidor |
| 12 | VariacaoProduto | Lojista / Consumidor |
| 13 | EnderecoUsuario | Consumidor |
| 14 | Pedido | Consumidor / Lojista / Entregador |
| 15 | ItemPedido | Consumidor / Lojista |
| 16 | HistoricoStatusPedido | Consumidor / Lojista / Entregador |
| 17 | ConversaChat | Consumidor |
| 18 | MensagemChat | Consumidor |
| 19 | SugestaoProdutoChat | Consumidor |
| 20 | EntregaRealizada | Entregador |
| 21 | AvaliacaoLoja | Consumidor |
| 22 | Pagamento | Consumidor |

**Total: 22 entidades**

---

## Pontos de integração em tempo real (WebSocket/SSE)

| Evento | Quem envia | Quem recebe |
|--------|-----------|-------------|
| Status do pedido atualizado | Lojista / Entregador | Consumidor |
| Novo pedido recebido | Consumidor | Lojista |
| Entregador disponível / localização | Entregador | Lojista / Consumidor |
| Documento aprovado/rejeitado | Admin | Entregador |
