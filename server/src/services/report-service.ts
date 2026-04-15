import puppeteer from 'puppeteer'
import { prisma } from '../lib/prisma'

export class ReportService {
  static async generateStockPositionPDF() {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    })

    const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.averageCost), 0)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { margin: 2cm; }
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">SISTEMA DE ESTOQUE</h1>
            <p className="text-sm text-gray-500">Relatório de Posição de Estoque</p>
          </div>

          <div class="text-right text-xs text-gray-400">
            Gerado em: ${new Date().toLocaleString('pt-BR')}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="bg-gray-50 p-4 rounded-lg border">
            <p class="text-xs text-gray-500 uppercase font-bold">Valor Total Investido</p>
            <p class="text-xl font-bold text-blue-600">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg border">
            <p class="text-xs text-gray-500 uppercase font-bold">Total de Itens Cadastrados</p>
            <p class="text-xl font-bold text-gray-800">${products.length}</p>
          </div>
        </div>

        <table class="w-full text-left text-sm">
          <thead>
            <tr class="bg-gray-100 border-b">
              <th class="p-2">SKU</th>
              <th class="p-2">Produto</th>
              <th class="p-2">Estoque</th>
              <th class="p-2">Custo Méd.</th>
              <th class="p-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr class="border-b">
                <td class="p-2 font-mono text-xs">${p.sku}</td>
                <td class="p-2">
                  <p class="font-bold">${p.name}</p>
                  <p class="text-xs text-gray-500">${p.category?.name || 'S/Cat'}</p>
                </td>
                <td class="p-2 ${p.currentStock <= p.minStock ? 'text-red-600 font-bold' : ''}">
                  ${p.currentStock} ${p.unitOfMeasure}
                </td>
                <td class="p-2">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.averageCost)}</td>
                <td class="p-2 text-right font-semibold">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.currentStock * p.averageCost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    })
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    return pdfBuffer
  }
}
