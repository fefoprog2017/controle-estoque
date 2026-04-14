import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpCircle, ArrowDownCircle, Search, FileUp, Plus, Trash2 } from 'lucide-react'
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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MovementForm } from '@/components/movements/MovementForm'

interface Movement {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  unitValue: number
  totalValue: number
  createdAt: string
  product: {
    name: string
    sku: string
  }
  user: {
    name: string
  }
  invoiceNumber?: string
  attachment?: {
    url: string
  }
}

export function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    loadMovements()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setOpen(true)
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('action')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams])

  async function loadMovements() {
    try {
      const response = await api.get('/movements')
      setMovements(response.data)
    } catch (error) {
      console.error('Erro ao carregar movimentações', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta movimentação? O saldo do produto será revertido.')) {
      return
    }

    try {
      await api.delete(`/movements/${id}`)
      loadMovements()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir movimentação')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimentações</h1>
          <p className="text-muted-foreground">Histórico completo de entradas e saídas de estoque.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={20} /> Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Movimentação</DialogTitle>
              <DialogDescription>
                Adicione uma entrada ou saída para atualizar o saldo do produto.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
               <MovementForm onSuccess={() => {
                 setOpen(false)
                 loadMovements()
               }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico Recente</CardTitle>
            <div className="flex items-center gap-2 border rounded-md px-3 py-1 bg-muted/20">
              <Search size={18} className="text-muted-foreground" />
              <input 
                placeholder="Filtrar por SKU ou NFe..." 
                className="bg-transparent border-none outline-none text-sm w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data / Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Vlr Unit.</TableHead>
                <TableHead>Vlr Total</TableHead>
                <TableHead>Doc / Ref</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">Carregando...</TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">Nenhuma movimentação registrada.</TableCell>
                </TableRow>
              ) : (
                movements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="text-xs">
                      {new Date(mov.createdAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {mov.type === 'IN' ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                          <ArrowUpCircle size={16} /> Entrada
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-600 font-bold">
                          <ArrowDownCircle size={16} /> Saída
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{mov.product.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{mov.product.sku}</div>
                    </TableCell>
                    <TableCell className="font-bold">{mov.quantity}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mov.unitValue)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mov.totalValue)}
                    </TableCell>
                    <TableCell className="text-xs italic text-muted-foreground">
                      {mov.invoiceNumber || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs">{mov.user?.name || 'Sistema'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {mov.attachment && (
                          <Button variant="ghost" size="icon" onClick={() => window.open(`http://localhost:3333${mov.attachment?.url}`)}>
                            <FileUp size={16} className="text-blue-500" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDelete(mov.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
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
