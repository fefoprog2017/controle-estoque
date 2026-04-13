import { useEffect, useState } from 'react'
import { BrainCircuit, AlertTriangle, TrendingDown, Calendar, CheckCircle2, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ForecastResult {
  productId: string
  sku: string
  name: string
  currentStock: number
  avgDailyConsumption: number
  daysRemaining: number | null
  predictedStockoutDate: string | null
  status: 'STABLE' | 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK'
}

export function ForecastingPage() {
  const [forecasts, setForecasts] = useState<ForecastResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadForecasts()
  }, [])

  async function loadForecasts() {
    try {
      const response = await api.get('/forecasting/stats')
      setForecasts(response.data)
    } catch (error) {
      console.error('Erro ao carregar previsões', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: ForecastResult['status']) => {
    switch (status) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle size={12} /> Crítico</Badge>
      case 'WARNING':
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1"><AlertTriangle size={12} /> Atenção</Badge>
      case 'OUT_OF_STOCK':
        return <Badge variant="secondary" className="bg-slate-900 text-white gap-1">Esgotado</Badge>
      default:
        return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1"><CheckCircle2 size={12} /> Estável</Badge>
    }
  }

  const getDaysColor = (days: number | null) => {
    if (days === null) return 'text-muted-foreground'
    if (days <= 7) return 'text-destructive font-bold'
    if (days <= 15) return 'text-amber-600 font-bold'
    return 'text-emerald-600'
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BrainCircuit className="text-primary" size={32} />
            Previsão de Demanda IA
          </h1>
          <p className="text-muted-foreground">
            Análise baseada na média móvel de consumo dos últimos 30 dias.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-rose-50 border-rose-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-900">Itens Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">
              {forecasts.filter(f => f.status === 'CRITICAL' || f.status === 'OUT_OF_STOCK').length}
            </div>
            <p className="text-xs text-rose-600">Esgotam em menos de 7 dias</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Em Alerta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {forecasts.filter(f => f.status === 'WARNING').length}
            </div>
            <p className="text-xs text-amber-600">Esgotam em até 15 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Saúde do Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {forecasts.length > 0 ? Math.round((forecasts.filter(f => f.status === 'STABLE').length / forecasts.length) * 100) : 0}%
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all" 
                style={{ width: `${forecasts.length > 0 ? (forecasts.filter(f => f.status === 'STABLE').length / forecasts.length) * 100 : 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Projeção</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Consumo Diário (Médio)</TableHead>
                <TableHead>Dias Restantes</TableHead>
                <TableHead>Previsão de Esgotamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-primary" />
                      Calculando projeções baseadas no histórico...
                    </div>
                  </TableCell>
                </TableRow>
              ) : forecasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Sem dados de movimentação suficientes para previsão.
                  </TableCell>
                </TableRow>
              ) : (
                forecasts.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                    </TableCell>
                    <TableCell className="font-medium">{item.currentStock} un</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingDown size={14} className="text-muted-foreground" />
                        {item.avgDailyConsumption.toFixed(2)} / dia
                      </div>
                    </TableCell>
                    <TableCell className={getDaysColor(item.daysRemaining)}>
                      {item.daysRemaining !== null ? `${item.daysRemaining} dias` : '∞'}
                    </TableCell>
                    <TableCell>
                      {item.predictedStockoutDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar size={14} className="text-muted-foreground" />
                          {new Date(item.predictedStockoutDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem previsão</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
