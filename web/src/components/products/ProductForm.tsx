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
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  minStock: z.coerce.number().min(0),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
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
    color?: string | null
    size?: string | null
    brand?: string | null
    minStock: number
    purchasePrice: number
    sellingPrice: number
    description?: string | null
    currentStock: number
  }
}

export function ProductForm({ onSuccess, product, allVariations }: ProductFormProps) {
  const [variationStocks, setVariationStocks] = useState<VariationStock[]>([])

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      unitOfMeasure: product?.unitOfMeasure || 'UN',
      color: product?.color || '',
      size: product?.size || '',
      brand: product?.brand || '',
      minStock: product?.minStock || 0,
      purchasePrice: product?.purchasePrice || 0,
      sellingPrice: product?.sellingPrice || 0,
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
    } else if (product) {
      setVariationStocks([{
        id: product.id,
        sku: product.sku,
        color: product.color || '',
        size: product.size || '',
        currentStock: product.currentStock
      }])
    }
  }, [allVariations, product])

  const handleVariationChange = (id: string, field: keyof VariationStock, value: string | number) => {
    setVariationStocks(prev => prev.map(v => {
      if (v.id === id) {
        const updated = { ...v, [field]: field === 'currentStock' ? Number(value) : value }
        // Se for o produto principal sendo editado na lista, sincroniza com o form
        if (id === product?.id) {
          if (field === 'color') setValue('color', String(value))
          if (field === 'size') setValue('size', String(value))
          if (field === 'currentStock') setValue('currentStock', Number(value))
        }
        return updated
      }
      return v
    }))
  }

  async function onSubmit(data: ProductFormValues) {
    try {
      if (product && product.id) {


        // 1. Atualiza o produto principal (ou a variação selecionada como principal)
        await api.put(`/products/${product.id}`, data)
        
        // 2. Se houver múltiplas variações, atualiza todas em lote
        if (variationStocks.length > 1) {
          await api.put('/products/bulk-update', {
            products: variationStocks.map(v => ({
              id: v.id,
              currentStock: v.currentStock,
              color: v.color,
              size: v.size
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
      alert(error.response?.data?.message || 'Erro ao salvar produto.')
    }
  }

  async function handleDelete() {
    if (!product || !product.id) return
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      await api.delete(`/products/${product.id}`)
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir produto.')
    }
  }

  // Se houver mais de uma variação, mostramos a lista. 
  // Se houver apenas uma, mas ela já tiver cor ou tamanho, também mostramos a lista para manter a consistência de edição.
  const showVariationsList = variationStocks.length > 1 || (variationStocks.length === 1 && (variationStocks[0].color || variationStocks[0].size))

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

      {!showVariationsList && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <Input id="color" {...register('color')} placeholder="Ex: Azul, Branco, Única..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Tamanho</Label>
            <Input id="size" {...register('size')} placeholder="Ex: P, M, G, 42..." />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="brand">Marca</Label>
        <Input id="brand" {...register('brand')} placeholder="Ex: Adidas, Nike, Hering..." />
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

      <div className="space-y-2">
        <Label htmlFor="minStock">Estoque Mínimo (Alerta)</Label>
        <Input id="minStock" type="number" {...register('minStock')} />
      </div>

      <div className="border p-4 rounded-lg bg-blue-50/30 border-blue-100">
        <Label className="text-blue-800 font-bold block mb-4">Gestão de Estoque e Variações</Label>
        
        {showVariationsList ? (
          <div className="space-y-3">
            <p className="text-xs text-blue-600 mb-2 font-medium italic">
              {variationStocks.length > 1 ? `Este produto possui ${variationStocks.length} variações. ` : 'Ajuste os detalhes da variação abaixo: '}
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-blue-800 uppercase">
                <div className="col-span-3">SKU</div>
                <div className="col-span-3">Cor</div>
                <div className="col-span-3">Tamanho</div>
                <div className="col-span-3 text-right">Estoque</div>
              </div>
              {variationStocks.map((variation) => (
                <div key={variation.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-blue-100 shadow-sm">
                  <div className="col-span-3">
                    <p className="text-[10px] font-bold text-gray-700 truncate" title={variation.sku}>{variation.sku}</p>
                  </div>
                  <div className="col-span-3">
                    <Input 
                      value={variation.color || ''}
                      onChange={(e) => handleVariationChange(variation.id, 'color', e.target.value)}
                      placeholder="Cor"
                      className="h-7 text-[10px] border-blue-100 focus:border-blue-300"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input 
                      value={variation.size || ''}
                      onChange={(e) => handleVariationChange(variation.id, 'size', e.target.value)}
                      placeholder="Tam"
                      className="h-7 text-[10px] border-blue-100 focus:border-blue-300"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input 
                      type="number" 
                      value={variation.currentStock}
                      onChange={(e) => handleVariationChange(variation.id, 'currentStock', e.target.value)}
                      className="h-7 text-right font-bold text-blue-700 border-blue-200 text-xs"
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
