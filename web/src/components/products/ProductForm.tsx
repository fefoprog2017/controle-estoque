import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  aisle: z.string().optional(),
  shelf: z.string().optional(),
  batch: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  onSuccess: () => void
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
    aisle?: string | null
    shelf?: string | null
    batch?: string | null
  }
}

export function ProductForm({ onSuccess, product }: ProductFormProps) {
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
      aisle: product?.aisle || '',
      shelf: product?.shelf || '',
      batch: product?.batch || '',
    }
  })

  async function onSubmit(data: ProductFormValues) {
    try {
      if (product) {
        await api.put(`/products/${product.id}`, data)
        alert('Produto atualizado com sucesso!')
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
      alert(error.response?.data?.message || 'Erro ao salvar produto')
    }
  }

  async function handleDelete() {
    if (!product) return
    
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      await api.delete(`/products/${product.id}`)
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir produto. Verifique se ele possui movimentações.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 overflow-y-auto max-h-[70vh] px-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Modelo/Produto</Label>
          <Input id="name" {...register('name')} placeholder="Ex: Camisa Social Slim" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU / Referência</Label>
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
          <p className="text-[10px] text-muted-foreground">Valor pago no fornecedor (ex: PDF)</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellingPrice" className="text-emerald-700 font-bold">Preço de Venda (R$)</Label>
          <Input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} className="border-emerald-200" />
          <p className="text-[10px] text-muted-foreground">Valor cobrado do seu cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="averageCost">Custo Médio Calculado (R$)</Label>
          <Input id="averageCost" type="number" step="0.01" {...register('averageCost')} readOnly className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Estoque Mínimo (Alerta)</Label>
          <Input id="minStock" type="number" {...register('minStock')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="aisle">Corredor</Label>
          <Input id="aisle" {...register('aisle')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shelf">Prateleira</Label>
          <Input id="shelf" {...register('shelf')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="batch">Lote</Label>
          <Input id="batch" {...register('batch')} />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        {product && (
          <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete}>
            Remover Produto
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : product ? 'Salvar Alterações' : 'Cadastrar Produto'}
        </Button>
      </div>
    </form>
  )
}
