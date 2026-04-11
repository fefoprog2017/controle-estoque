import puppeteer from 'puppeteer'
import { marked } from 'marked'
import fs from 'node:fs'
import path from 'node:path'

async function generateDocsPDF() {
  try {
    console.log('📖 Lendo README.md...')
    const markdownPath = path.join(__dirname, '../../../README.md')
    const outputPath = path.join(__dirname, '../../../DOCUMENTACAO_SISTEMA.pdf')
    
    if (!fs.existsSync(markdownPath)) {
      throw new Error('README.md não encontrado na raiz do projeto.')
    }

    const markdownContent = fs.readFileSync(markdownPath, 'utf-8')
    const htmlContent = await marked(markdownContent)

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
        <style>
          body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
          }
          @media (max-width: 767px) {
            .markdown-body {
              padding: 15px;
            }
          }
          .markdown-body h1 { border-bottom: 2px solid #eaecef; padding-bottom: 0.3em; }
          .markdown-body h2 { margin-top: 24px; border-bottom: 1px solid #eaecef; }
        </style>
      </head>
      <body class="markdown-body">
        ${htmlContent}
      </body>
      </html>
    `

    console.log('🚀 Iniciando Puppeteer para geração do PDF...')
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' })
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size: 10px; width: 100%; text-align: center; color: #aaa;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
    })

    await browser.close()
    console.log(`✅ Sucesso! PDF gerado em: ${outputPath}`)
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error)
  }
}

generateDocsPDF()
