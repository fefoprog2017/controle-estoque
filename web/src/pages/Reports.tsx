import { FileText, Download, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from '@/services/api'
import { useState } from 'react'

export function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null)

  async function downloadReport(endpoint: string, filename: string) {
    try {
      setDownloading(endpoint)
      const response = await api.get(endpoint, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Erro ao baixar relatório', error)
      alert('Erro ao gerar o relatório. Verifique o servidor.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios Gerenciais</h1>
        <p className="text-muted-foreground">Exporte dados críticos do seu estoque em formato PDF profissional.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Relatório 1 */}
        <Card className="hover:border-blue-200 transition-colors">
          <CardHeader>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <FileText className="text-blue-600 w-6 h-6" />
            </div>
            <CardTitle>Posição de Estoque</CardTitle>
            <CardDescription>
              Lista completa de produtos, quantidades atuais, custo médio e valor total investido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full gap-2" 
              onClick={() => downloadReport('/reports/stock-position', 'posicao-estoque.pdf')}
              disabled={downloading === '/reports/stock-position'}
            >
              {downloading === '/reports/stock-position' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Gerar PDF
            </Button>
          </CardContent>
        </Card>

        {/* Relatório 2 (Exemplo de Extrato) */}
        <Card className="hover:border-emerald-200 transition-colors">
          <CardHeader>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
              <FileText className="text-emerald-600 w-6 h-6" />
            </div>
            <CardTitle>Extrato de Movimentação</CardTitle>
            <CardDescription>
              Histórico detalhado de todas as entradas e saídas por período (Kardex).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" disabled>
              Em breve
            </Button>
          </CardContent>
        </Card>

        {/* Relatório 3 (Exemplo de Alertas) */}
        <Card className="hover:border-rose-200 transition-colors">
          <CardHeader>
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-2">
              <FileText className="text-rose-600 w-6 h-6" />
            </div>
            <CardTitle>Produtos Abaixo do Mínimo</CardTitle>
            <CardDescription>
              Relatório focado apenas em itens que precisam de reposição imediata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" disabled>
              Em breve
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
