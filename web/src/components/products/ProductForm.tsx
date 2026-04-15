import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  barcode: z.string().optional(),
  unitOfMeasure: z.string().min(1, 'Unidade é obrigatória'),
  minStock: z.coerce.number().min(0),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  averageCost: z.coerce.number().min(0),
  description: z.string().optional(),
  currentStock: z.coerce.number().default(0),
})

type ProductFormValues = z.infer<typeof productSchema>

interface VariationStock {
  id: string
  sku: string
  color?: string | null
  size?: string | null
  currentStock: number
}

interface ProductFormProps {
  onSuccess: () => void
  allVariations?: any[]
  product?: {
    id: string
    name: string
    sku: string
    barcode?: string | null
    unitOfMeasure: string
    minStock: number
    purchasePrice: number
    sellingPrice: number
    averageCost: number
    description?: string | null
    currentStock: number
  }
}

export function ProductForm({ onSuccess, product, allVariations }: ProductFormProps) {
  const [variationStocks, setVariationStocks] = useState<VariationStock[]>([])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      unitOfMeasure: product?.unitOfMeasure || 'UN',
      minStock: product?.minStock || 0,
      purchasePrice: product?.purchasePrice || 0,
      sellingPrice: product?.sellingPrice || 0,
      averageCost: product?.averageCost || 0,
      description: product?.description || '',
      currentStock: product?.currentStock || 0,
    }
  })

  useEffect(() => {
    if (allVariations && allVariations.length > 0) {
      setVariationStocks(allVariations.map(v => ({
        id: v.id,
        sku: v.sku,
        color: v.color,
        size: v.size,
        currentStock: v.currentStock
      })))
    }
  }, [allVariations])

  const handleStockChange = (id: string, value: string) => {
    setVariationStocks(prev => prev.map(v => 
      v.id === id ? { ...v, currentStock: Number(value) } : v
    ))
  }

  async function onSubmit(data: ProductFormValues) {
    console.log('--- SUBMITTING PRODUCT FORM ---')
    console.log('Target Product ID:', product?.id)
    console.log('Payload Data:', data)

    try {
      if (product && product.id) {
        // Validação extra do UUID no frontend
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(product.id)) {
          alert('Erro de sistema: O ID do produto é inválido (não é um UUID).')
          return
        }

        // Primeiro atualiza os dados básicos do produto principal (ou modelo)
        await api.put(`/products/${product.id}`, data)
        
        // Se houver variações, atualiza o estoque de todas em lote
        if (variationStocks.length > 0) {
          console.log('Updating variations in bulk:', variationStocks.length)
          await api.put('/products/bulk-update', {
            products: variationStocks.map(v => ({
              id: v.id,
              currentStock: v.currentStock
            }))
          })
        }
        
        alert('Produto e variações atualizados com sucesso!')
      } else {
        let categoryId;
        try {
          const categories = await api.get('/categories')
          if (categories.data.length > 0) {
            categoryId = categories.data[0].id
          }
        } catch (e) {}

        const payload = {
          ...data,
          categoryId: categoryId || "00000000-0000-0000-0000-000000000000" 
        }
        await api.post('/products', payload)
        alert('Produto cadastrado com sucesso!')
      }
      onSuccess()
    } catch (error: any) {
      console.error('SERVER ERROR:', error.response?.data)
      alert(error.response?.data?.message || 'Erro ao salvar produto. Verifique os logs do console.')
    }
  }

  async function handleDelete() {
    if (!product || !product.id) return
    
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      await api.delete(`/products/${product.id}`)
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir produto. Verifique se ele possui movimentações.')
    }
  }

  const hasVariations = variationStocks.length > 1

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 overflow-y-auto max-h-[80vh] px-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Modelo/Produto</Label>
          <Input id="name" {...register('name')} placeholder="Ex: Camisa Social Slim" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU / Referência Base</Label>
          <Input id="sku" {...register('sku')} placeholder="Ex: MOD-123" />
          {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitOfMeasure">Unidade de Medida</Label>
          <Input id="unitOfMeasure" {...register('unitOfMeasure')} placeholder="UN, PC, PAR..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Código de Barras (EAN)</Label>
          <Input id="barcode" {...register('barcode')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
        <div className="space-y-2">
          <Label htmlFor="purchasePrice" className="text-indigo-700 font-bold">Preço de Compra (R$)</Label>
          <Input id="purchasePrice" type="number" step="0.01" {...register('purchasePrice')} className="border-indigo-200" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellingPrice" className="text-emerald-700 font-bold">Preço de Venda (R$)</Label>
          <Input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} className="border-emerald-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="averageCost">Custo Médio (R$)</Label>
          <Input id="averageCost" type="number" step="0.01" {...register('averageCost')} readOnly className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Estoque Mínimo (Alerta)</Label>
          <Input id="minStock" type="number" {...register('minStock')} />
        </div>
      </div>

      <div className="border p-4 rounded-lg bg-blue-50/30 border-blue-100">
        <Label className="text-blue-800 font-bold block mb-4">Gestão de Estoque</Label>
        
        {hasVariations ? (
          <div className="space-y-3">
            <p className="text-xs text-blue-600 mb-2 font-medium italic">
              Este produto possui {variationStocks.length} variações. Ajuste o estoque de cada uma individualmente abaixo:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {variationStocks.map((variation) => (
                <div key={variation.id} className="flex items-center gap-4 bg-white p-2 rounded border border-blue-100 shadow-sm">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-700">{variation.sku}</p>
                    <p className="text-[10px] text-gray-500">
                      {variation.color || 'Sem Cor'} • {variation.size || 'Sem Tamanho'}
                    </p>
                  </div>
                  <div className="w-32">
                    <Input 
                      type="number" 
                      value={variation.currentStock}
                      onChange={(e) => handleStockChange(variation.id, e.target.value)}
                      className="h-8 text-right font-bold text-blue-700 border-blue-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="currentStock">Quantidade em Estoque</Label>
            <Input id="currentStock" type="number" {...register('currentStock')} className="border-blue-200" />
            <p className="text-[10px] text-muted-foreground">Saldo atual físico disponível para venda.</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        {product && (
          <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete}>
            Remover Produto
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : product ? 'Salvar Tudo' : 'Cadastrar Produto'}
        </Button>
      </div>
    </form>
  )
}
