import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, AlertTriangle } from 'lucide-react'
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

interface Product {
  id: string
  name: string
  sku: string
  currentStock: number
  minStock: number
  sellingPrice: number
  averageCost: number
  unitOfMeasure: string
  category: {
    name: string
  }
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setOpen(true)
      // Limpa o parâmetro para não reabrir ao dar refresh
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu inventário e limites de estoque.</p>
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
                Preencha os dados básicos para adicionar o item ao seu catálogo.
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
            <CardTitle>Listagem de Itens</CardTitle>
            <div className="flex items-center gap-2 border rounded-md px-3 py-1 bg-muted/20">
              <Search size={18} className="text-muted-foreground" />
              <input 
                placeholder="Buscar SKU ou nome..." 
                className="bg-transparent border-none outline-none text-sm w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Estoque Mín.</TableHead>
                <TableHead>Custo Médio</TableHead>
                <TableHead>Preço Venda</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">Carregando...</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">Nenhum produto cadastrado.</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono font-medium text-xs">{product.sku}</TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.unitOfMeasure}</div>
                    </TableCell>
                    <TableCell>{product.category?.name || 'S/Cat'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={product.currentStock <= product.minStock ? 'text-destructive font-bold' : ''}>
                          {product.currentStock}
                        </span>
                        {product.currentStock <= product.minStock && (
                          <AlertTriangle size={14} className="text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.minStock}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.averageCost)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">Editar</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Produto</DialogTitle>
                            <DialogDescription>
                              Atualize as informações do produto ou remova-o do catálogo.
                            </DialogDescription>
                          </DialogHeader>
                          <ProductForm 
                            product={product} 
                            onSuccess={() => {
                              loadProducts()
                            }} 
                          />
                        </DialogContent>
                      </Dialog>
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
