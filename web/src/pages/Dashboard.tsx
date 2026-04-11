import { useEffect, useState } from 'react'
import { DollarSign, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardStats {
  totalValue: number
  totalItems: number
  lowStockItems: number
  recentMovements: any[]
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => {
        setStats(res.data)
      })
      .catch(err => {
        console.error('Erro ao carregar dashboard', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading || !stats) return <div className="p-8">Carregando painel...</div>

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
        <p className="text-muted-foreground">Visão geral da sua operação de estoque hoje.</p>
      </div>

      {/* Grid de Cards Superiores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total em Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">Soma de custo médio * saldo atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total de unidades em inventário</p>
          </CardContent>
        </Card>

        <Card className={stats.lowStockItems > 0 ? "border-rose-200 bg-rose-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Reposição</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.lowStockItems > 0 ? "text-rose-600" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.lowStockItems > 0 ? "text-rose-600" : ""}`}>
              {stats.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Produtos abaixo do estoque mínimo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Gráfico Placeholder (Implementaremos futuramente com Recharts) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Movimentação Mensal</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
             <p className="text-muted-foreground">Gráfico de desempenho será exibido aqui.</p>
          </CardContent>
        </Card>

        {/* Feed de Movimentações Recentes */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> 
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.recentMovements.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-10">Nenhuma atividade registrada.</p>
              ) : (
                stats.recentMovements.map((mov) => (
                  <div key={mov.id} className="flex items-center gap-4">
                    {mov.type === 'IN' ? (
                      <div className="p-2 bg-emerald-100 rounded-full">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-rose-100 rounded-full">
                        <ArrowDownRight className="w-4 h-4 text-rose-600" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {mov.type === 'IN' ? 'Entrada' : 'Saída'} - {mov.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mov.quantity} unidades • {new Date(mov.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
