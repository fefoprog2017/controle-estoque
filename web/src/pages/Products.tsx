import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, AlertTriangle, Layers, Trash2 } from 'lucide-react'
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
import { ProductForm } from '@/components/products/ProductForm'
import { ProductGridModal } from '@/components/products/ProductGridModal'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string | null
  description?: string | null
  color?: string | null
  size?: string | null
  currentStock: number
  minStock: number
  purchasePrice: number
  sellingPrice: number
  averageCost: number
  unitOfMeasure: string
  category: {
    name: string
  }
}

interface GroupedProduct {
  name: string
  totalStock: number
  minStock: number
  avgCost: number
  avgPurchasePrice: number
  sellingPrice: number
  categoryName: string
  unitOfMeasure: string
  variations: Product[]
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedGroup, setSelectedGroup] = useState<GroupedProduct | null>(null)
  const [gridOpen, setGridOpen] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setOpen(true)
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('action')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams])

  async function loadProducts() {
    try {
      const response = await api.get('/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Erro ao carregar produtos', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteModel(name: string, count: number) {
    if (!confirm(`ATENÇÃO: Você está prestes a excluir o modelo "${name}" e TODAS as suas ${count} variações!\n\nEsta ação removerá o produto por completo da base de dados e é irreversível.\n\nDeseja continuar?`)) {
      return
    }

    try {
      await api.delete(`/products/model/${encodeURIComponent(name)}`)
      alert('Modelo e variações removidos com sucesso!')
      loadProducts()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir modelo. Verifique se existem movimentações vinculadas.')
    }
  }

  // Lógica de Agrupamento
  const groupedProducts: GroupedProduct[] = Object.values(
    products.reduce((acc, curr) => {
      const key = curr.name
      if (!acc[key]) {
        acc[key] = {
          name: curr.name,
          totalStock: 0,
          minStock: 0,
          avgCost: 0,
          avgPurchasePrice: 0,
          sellingPrice: curr.sellingPrice,
          categoryName: curr.category?.name || 'S/Cat',
          unitOfMeasure: curr.unitOfMeasure,
          variations: []
        }
      }
      acc[key].totalStock += curr.currentStock ?? 0
      acc[key].minStock += curr.minStock ?? 0
      // Média simples do custo médio e compra entre variações
      const currentVariations = acc[key].variations.length
      acc[key].avgCost = ((acc[key].avgCost * currentVariations) + (curr.averageCost ?? 0)) / (currentVariations + 1)
      acc[key].avgPurchasePrice = ((acc[key].avgPurchasePrice * currentVariations) + (curr.purchasePrice ?? 0)) / (currentVariations + 1)
      acc[key].variations.push(curr)
      return acc
    }, {} as Record<string, GroupedProduct>)
  )

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu inventário com controle de custos e venda.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={20} /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Produto</DialogTitle>
              <DialogDescription>
                Cadastre um novo modelo de produto. A grade será gerada a partir deste cadastro.
              </DialogDescription>
            </DialogHeader>
            <ProductForm onSuccess={() => {
              setOpen(false)
              loadProducts()
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listagem Agrupada</CardTitle>
            <div className="flex items-center gap-2 border rounded-md px-3 py-1 bg-muted/20">
              <Search size={18} className="text-muted-foreground" />
              <input 
                placeholder="Buscar modelo..." 
                className="bg-transparent border-none outline-none text-sm w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo / Produto</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Variações</TableHead>
                <TableHead className="text-indigo-600">Última Compra</TableHead>
                <TableHead className="text-amber-600">Custo Médio</TableHead>
                <TableHead className="text-emerald-600">Preço Venda</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">Carregando...</TableCell>
                </TableRow>
              ) : groupedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">Nenhum produto cadastrado.</TableCell>
                </TableRow>
              ) : (
                groupedProducts.map((group) => {
                  // Se o custo médio for 0, usamos o preço de compra para o cálculo inicial
                  const baseCost = group.avgCost > 0 ? group.avgCost : group.avgPurchasePrice;
                  const margin = group.sellingPrice > 0 
                    ? ((group.sellingPrice - baseCost) / group.sellingPrice) * 100 
                    : 0;

                  return (
                    <TableRow 
                      key={group.name} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedGroup(group)
                        setGridOpen(true)
                      }}
                    >
                      <TableCell>
                        <div className="font-bold text-primary">{group.name}</div>
                        <div className="text-xs text-muted-foreground">{group.categoryName} • {group.unitOfMeasure}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={group.totalStock <= group.minStock ? 'text-destructive font-bold' : ''}>
                            {group.totalStock}
                          </span>
                          {group.totalStock <= group.minStock && (
                            <AlertTriangle size={14} className="text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full w-fit">
                          <Layers size={12} />
                          {group.variations.length}
                        </div>
                      </TableCell>
                      <TableCell className="text-indigo-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(group.avgPurchasePrice || 0)}
                      </TableCell>
                      <TableCell className="text-amber-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(group.avgCost || 0)}
                      </TableCell>
                      <TableCell className="text-emerald-600 font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(group.sellingPrice || 0)}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-xs font-bold px-2 py-1 rounded",
                          margin > 30 ? "bg-emerald-100 text-emerald-700" : 
                          margin > 0 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                        )}>
                          {margin.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">Editar</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Editar Produto</DialogTitle>
                              </DialogHeader>
                              <ProductForm 
                                product={group.variations[0]} 
                                allVariations={group.variations}
                                onSuccess={() => {
                                  loadProducts()
                                }} 
                              />
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteModel(group.name, group.variations.length)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Grade */}
      <Dialog open={gridOpen} onOpenChange={setGridOpen}>
        {selectedGroup && (
          <ProductGridModal 
            productName={selectedGroup.name} 
            variations={selectedGroup.variations} 
          />
        )}
      </Dialog>
    </div>
  )
}
