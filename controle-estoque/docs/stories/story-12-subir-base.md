# Story #12: Subir Base (Extração IA)

**Status:** InProgress
**Ator:** @dev (Dex)
**Data:** 10/04/2026

## Descrição
Implementar aba "Subir Base" para upload de PDFs/Imagens com extração automática de produtos via LLM.

## Critérios de Aceite
- [ ] Interface Drag & Drop funcional.
- [ ] Preview dos dados extraídos em tabela editável.
- [ ] Prompt de IA configurado para normalização SKU, Cor, Tam, Qtd, Preço.
- [ ] Botão de confirmação para salvar no banco de dados (Prisma).

## Especificação Técnica
- **Frontend:** React + Tailwind + Lucide + React-Dropzone.
- **Backend:** Node.js + Express + Integração LLM (Gemini/OpenAI).
- **Schema:** `{ sku, nome, cor, tam, qtd, preco }`.
