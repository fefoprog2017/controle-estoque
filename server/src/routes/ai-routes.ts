import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { prisma } from '../lib/prisma'
import 'dotenv/config'

// Inicializa a API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Função de diagnóstico para ver o que sua chave permite
async function listAvailableModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
    const data = await response.json()
    console.log('--- MODELOS DISPONÍVEIS PARA SUA CHAVE ---')
    if (data.models) {
      data.models.forEach((m: any) => console.log(`- ${m.name}`))
    } else {
      console.log('Não foi possível listar os modelos:', data)
    }
    console.log('------------------------------------------')
  } catch (e) {
    console.error('Erro ao listar modelos:', e)
  }
}

listAvailableModels()

const SYSTEM_PROMPT = `
Você é um extrator de dados especializado em logística e notas fiscais de moda/varejo.
OBJETIVO: Extrair produtos de arquivos PDF/Imagens e converter em JSON padronizado.

REGRAS DE MAPEAMENTO:
- SKU/Código: Identificar códigos alfanuméricos únicos do produto.
- Descrição: Nome do item, ignorando códigos redundantes.
- Atributos: Separar explicitamente Cor e Tamanho (P, M, G, GG, 36-54, etc).
- Quantidade: Converter para número puro (ex: 10 ou 10.5).
- Preço: Valor unitário como número puro, SEM símbolo de moeda e usando PONTO como decimal (ex: 29.90).

REGRAS DE LIMPEZA:
- IGNORE: Dados do emissor, dados do destinatário, logotipos, totais da nota, impostos (ICMS/IPI) e rodapés.
- MAPEAMENTO SEMÂNTICO: Se a coluna for "Referência" ou "Cód", trate como "sku". Se for "Item" ou "Descrição", trate como "nome".

FORMATO DE SAÍDA:
Apenas um array JSON puro (sem markdown, sem explicações):
[
  { "sku": "ABC", "nome": "Camiseta", "cor": "Azul", "tam": "M", "qtd": 10, "purchasePrice": 29.90 }
]
`

export async function aiRoutes(app: FastifyInstance) {
  const appTyped = app.withTypeProvider<ZodTypeProvider>()

  appTyped.post('/ai/extract-products', async (request, reply) => {
    console.log('--- NOVA REQUISIÇÃO DE EXTRAÇÃO ---')
    
    if (!request.isMultipart()) {
      console.error('ERRO: Requisição não é multipart')
      return reply.status(400).send({ message: 'A requisição deve ser multipart/form-data' })
    }

    const parts = request.parts()
    let fileBuffer: Buffer | null = null
    let mimeType = ''
    let filename = ''

    try {
      console.log('--- INICIANDO CONSUMO DE PARTS ---')
      for await (const part of parts) {
        console.log('Parte detectada:', part.fieldname, 'Tipo:', part.type)
        if (part.type === 'file') {
          console.log('Arquivo detectado:', part.filename, 'Mime:', part.mimetype)
          fileBuffer = await part.toBuffer()
          mimeType = part.mimetype
          filename = part.filename
        } else {
          console.log('Campo detectado:', part.fieldname, 'Valor:', part.value)
        }
      }
      console.log('--- FIM DO CONSUMO DE PARTS ---')
    } catch (err: any) {
      console.error('ERRO ao ler partes multipart:', err.message)
      return reply.status(500).send({ message: 'Erro ao processar o stream do arquivo' })
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      console.error('ERRO: Nenhum arquivo encontrado ou buffer vazio')
      return reply.status(400).send({ message: 'Arquivo não enviado ou está vazio' })
    }

    console.log('Arquivo carregado com sucesso:', filename, 'Mime:', mimeType, 'Tamanho:', fileBuffer.length)

    try {
      console.log('Iniciando extração via OpenRouter (Modelo Free)...')
      
      const responseFetch = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`, // Usaremos o mesmo campo do .env para a nova chave
          "Content-Type": "application/json"
		  // Opcional, mas recomendado pelo OpenRouter para rankings:
			"HTTP-Referer": "http://167.234.239.90/", 
			"X-Title": "Controle-Estoque"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-001",
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": SYSTEM_PROMPT
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": `data:${mimeType};base64,${fileBuffer.toString('base64')}`
                  }
                }
              ]
            }
          ],
          "response_format": { "type": "json_object" }
        })
      })

      const data = await responseFetch.json()
      
      if (!responseFetch.ok) {
        console.error('ERRO OPENROUTER DETALHADO:', JSON.stringify(data, null, 2))
        const errMsg = data.error?.message || 'Erro desconhecido na IA'
        return reply.status(responseFetch.status).send({ message: `Erro na IA: ${errMsg}` })
      }

      // OpenRouter retorna no padrão OpenAI
      let text = data.choices[0].message.content
      console.log('Resposta recebida do OpenRouter.')
      
      // EXTRAÇÃO ROBUSTA: Busca apenas o conteúdo dentro de colchetes []
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      const cleanJson = jsonMatch ? jsonMatch[0] : text
      
      try {
        let products = JSON.parse(cleanJson)
        
        // SANITIZAÇÃO: Garante que os números sejam números e limpa strings
        products = products.map((p: any) => {
          // Tenta pegar o preço de qualquer campo provável que a IA envie
          const rawPrice = p.purchasePrice || p.sellingPrice || p.preco || p.valor || 0;
          const rawQtd = p.qtd || p.quantidade || 0;

          // Converter quantidade para número
          let cleanQtd = String(rawQtd).replace(/[^\d,.]/g, '').replace(',', '.')
          let qtd = parseFloat(cleanQtd)
          if (isNaN(qtd)) qtd = 0

          // Converter preço para número (removendo R$, $, espaços, etc)
          let cleanPrice = String(rawPrice).replace(/[^\d,.]/g, '').replace(',', '.')
          let purchasePrice = parseFloat(cleanPrice)
          if (isNaN(purchasePrice)) purchasePrice = 0

          return {
            sku: String(p.sku || p.referencia || ''),
            nome: String(p.nome || p.descricao || ''),
            cor: String(p.cor || ''),
            tam: String(p.tam || p.tamanho || ''),
            qtd: qtd,
            purchasePrice: purchasePrice
          }
        })

        console.log(`Sucesso: ${products.length} produtos extraídos e sanitizados.`)
        return { products }
      } catch (e) {
        console.error('ERRO DE PARSE JSON. Resposta limpa:', cleanJson)
        return reply.status(500).send({ message: 'A IA gerou um formato inválido. Tente novamente.' })
      }

    } catch (error: any) {
      console.error('ERRO NA API DO GEMINI:', error.message || error)
      return reply.status(500).send({ message: `Erro na IA: ${error.message || 'Falha na comunicação'}` })
    }
  })
}
